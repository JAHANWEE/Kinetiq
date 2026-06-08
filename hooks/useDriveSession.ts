/**
 * useDriveSession.ts
 * Core driving session hook.
 *
 * Sensors used
 * ─────────────────────────────────────────────────────────────────────────────
 * Accelerometer  — measures total force on the device (gravity + motion) in g.
 *                  Used to detect harsh braking and harsh acceleration via
 *                  magnitude delta between consecutive readings.
 *
 * Gyroscope      — measures rotation rate on each axis in rad/s.
 *                  Used to detect sharp turns (Z-axis) and aggressive steering
 *                  (total magnitude). Cross-checked with accelerometer for
 *                  phone-handling detection.
 *
 * DeviceMotion   — provides gravity-compensated linear acceleration and
 *                  rotation rate fused by the OS motion processor.
 *                  Used as an independent, higher-fidelity check for phone
 *                  handling events: if linear accel magnitude AND rotation
 *                  rate magnitude both exceed their thresholds simultaneously,
 *                  the device is almost certainly being picked up mid-drive.
 *
 * All three sensors run at 100 ms intervals (10 Hz) — sufficient for event
 * detection while minimising battery drain. A 2-second per-type cooldown
 * prevents a single physical incident from firing multiple events.
 *
 * ─── Thresholds (medium sensitivity multiplier = 1.0) ───────────────────────
 * Harsh Brake            accel Δ > 1.8 g,  negative Y   →  −5 pts
 * Harsh Acceleration     accel Δ > 1.8 g,  positive      →  −5 pts
 * Sharp Turn             gyro |Z| > 1.2 rad/s             →  −3 pts
 * Aggressive Steering    gyro total mag > 2.0 rad/s        →  −3 pts
 * Phone Handling         (gyro+accel cross-check) OR
 *                        (DeviceMotion linear > 2.5 m/s²
 *                         AND rotation > 1.5 rad/s)        → −10 pts
 *
 * Sensitivity multipliers: Low ×1.4 · Medium ×1.0 · High ×0.7
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Accelerometer,
  Gyroscope,
  DeviceMotion,
  type AccelerometerMeasurement,
  type GyroscopeMeasurement,
  type DeviceMotionMeasurement,
} from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { driveStore, DriveEvent, DriveSession } from '../store/driveStore';
import { settingsStore } from '../store/settingsStore';

// ─── Thresholds (base / medium sensitivity) ───────────────────────────────────
const BASE_HARSH_THRESHOLD    = 1.8;   // g   — accel magnitude delta
const BASE_SHARP_TURN         = 1.2;   // rad/s — gyro Z axis
const BASE_AGGRESSIVE_STEER   = 2.0;   // rad/s — gyro total magnitude
const BASE_PHONE_ACCEL        = 2.5;   // m/s²  — accelerometer magnitude (cross-check)
const BASE_PHONE_GYRO         = 1.5;   // rad/s — gyro magnitude (cross-check)
// DeviceMotion-specific thresholds (linear acceleration, no gravity component)
const DM_LINEAR_THRESHOLD     = 2.5;   // m/s²  — DeviceMotion linear accel magnitude
const DM_ROTATION_THRESHOLD   = 1.5;   // rad/s — DeviceMotion rotation rate magnitude
const COOLDOWN_MS             = 2000;  // ms    — minimum gap between same-type events

// ─── Scoring ──────────────────────────────────────────────────────────────────
const DEDUCTIONS: Record<DriveEvent['type'], number> = {
  harshBrake:         5,
  harshAccel:         5,
  sharpTurn:          3,
  aggressiveSteering: 3,
  phoneHandling:      10,
};

const EVENT_LABELS: Record<DriveEvent['type'], string> = {
  harshBrake:         'Harsh Brake',
  harshAccel:         'Harsh Acceleration',
  sharpTurn:          'Sharp Turn',
  aggressiveSteering: 'Aggressive Steering',
  phoneHandling:      'Phone Handling',
};

function mag3(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

function getRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 65) return 'Fair';
  return 'Poor';
}

// ─── Public types ─────────────────────────────────────────────────────────────
export type SensorReadings = {
  accel: { x: number; y: number; z: number; magnitude: number };
  gyro:  { x: number; y: number; z: number; magnitude: number };
};

export type SessionState =
  | { status: 'idle' }
  | {
      status: 'active';
      startedAt: number;
      durationSec: number;
      score: number;
      rating: string;
      events: DriveEvent[];
      sensors: SensorReadings;
    }
  | { status: 'finished'; session: DriveSession };

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDriveSession() {
  const [state, setState] = useState<SessionState>({ status: 'idle' });

  // ── Mutable refs (hot path — avoid re-renders on every sensor tick) ────────
  const isActive       = useRef(false);
  const startedAt      = useRef(0);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef    = useRef(0);
  const scoreRef       = useRef(100);
  const eventsRef      = useRef<DriveEvent[]>([]);
  const lastEventTime  = useRef<Partial<Record<DriveEvent['type'], number>>>({});
  const accelRef       = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef        = useRef({ x: 0, y: 0, z: 0 });
  const prevAccelMag   = useRef(0);

  // ── Sensor subscription refs ───────────────────────────────────────────────
  const accelSubRef  = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const gyroSubRef   = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);
  const motionSubRef = useRef<ReturnType<typeof DeviceMotion.addListener> | null>(null);

  // ─── Event detection ────────────────────────────────────────────────────────
  const detectEvent = useCallback((type: DriveEvent['type']) => {
    if (!isActive.current) return;

    const now  = Date.now();
    const last = lastEventTime.current[type] ?? 0;
    if (now - last < COOLDOWN_MS) return; // cooldown active — skip

    lastEventTime.current[type] = now;

    const pts = DEDUCTIONS[type];
    scoreRef.current = Math.max(0, scoreRef.current - pts);

    const event: DriveEvent = {
      id:        `${type}-${now}`,
      type,
      label:     EVENT_LABELS[type],
      pts:       -pts,
      timestamp: now - startedAt.current, // ms since session start
    };

    eventsRef.current = [event, ...eventsRef.current];

    // Haptic — only when enabled in settings
    if (settingsStore.get().hapticFeedback) {
      Haptics.notificationAsync(
        type === 'phoneHandling'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    }

    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return {
        ...prev,
        score:  scoreRef.current,
        rating: getRating(scoreRef.current),
        events: eventsRef.current,
      };
    });
  }, []);

  // ─── Accelerometer handler ──────────────────────────────────────────────────
  const handleAccelerometer = useCallback((data: AccelerometerMeasurement) => {
    if (!isActive.current) return;
    const { x, y, z } = data;
    accelRef.current = { x, y, z };

    const magnitude = mag3(x, y, z);
    const delta     = Math.abs(magnitude - prevAccelMag.current);
    prevAccelMag.current = magnitude;

    const mult        = settingsStore.getThresholdMultiplier();
    const harshThresh = BASE_HARSH_THRESHOLD * mult;

    if (delta > harshThresh) {
      // Negative Y on a flat phone ≈ deceleration (braking)
      if (y < -harshThresh * 0.6) {
        detectEvent('harshBrake');
      } else {
        detectEvent('harshAccel');
      }
    }

    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return { ...prev, sensors: { ...prev.sensors, accel: { x, y, z, magnitude } } };
    });
  }, [detectEvent]);

  // ─── Gyroscope handler ──────────────────────────────────────────────────────
  const handleGyroscope = useCallback((data: GyroscopeMeasurement) => {
    if (!isActive.current) return;
    const { x, y, z } = data;
    gyroRef.current = { x, y, z };

    const totalMag = mag3(x, y, z);
    const mult     = settingsStore.getThresholdMultiplier();

    if (Math.abs(z) > BASE_SHARP_TURN * mult) {
      detectEvent('sharpTurn');
    } else if (totalMag > BASE_AGGRESSIVE_STEER * mult) {
      detectEvent('aggressiveSteering');
    }

    // Cross-check with last known accelerometer value for phone handling
    const accelMag = mag3(accelRef.current.x, accelRef.current.y, accelRef.current.z);
    if (accelMag > BASE_PHONE_ACCEL * mult && totalMag > BASE_PHONE_GYRO * mult) {
      detectEvent('phoneHandling');
    }

    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return { ...prev, sensors: { ...prev.sensors, gyro: { x, y, z, magnitude: totalMag } } };
    });
  }, [detectEvent]);

  // ─── DeviceMotion handler ───────────────────────────────────────────────────
  /**
   * DeviceMotion provides OS-fused, gravity-compensated linear acceleration
   * and rotation rate. We use it as an independent, higher-fidelity check for
   * phone handling. Unlike raw accelerometer readings, linear acceleration
   * strips out gravity so 0 g truly means "device at rest".
   *
   * Thresholds (base):
   *   Linear accel magnitude > 2.5 m/s²  (DM_LINEAR_THRESHOLD)
   *   Rotation rate magnitude > 1.5 rad/s (DM_ROTATION_THRESHOLD)
   */
  const handleDeviceMotion = useCallback((data: DeviceMotionMeasurement) => {
    if (!isActive.current) return;

    const la = data.acceleration;         // linear (gravity removed)
    const rr = data.rotationRate;         // rotation rate

    if (!la || !rr) return;               // not all platforms populate both

    const mult        = settingsStore.getThresholdMultiplier();
    const linearMag   = mag3(la.x ?? 0, la.y ?? 0, la.z ?? 0);
    const rotationMag = mag3(rr.alpha ?? 0, rr.beta ?? 0, rr.gamma ?? 0);

    if (
      linearMag   > DM_LINEAR_THRESHOLD   * mult &&
      rotationMag > DM_ROTATION_THRESHOLD * mult
    ) {
      detectEvent('phoneHandling');
    }
  }, [detectEvent]);

  // ─── Start ──────────────────────────────────────────────────────────────────
  const startDrive = useCallback(() => {
    isActive.current     = true;
    startedAt.current    = Date.now();
    durationRef.current  = 0;
    scoreRef.current     = 100;
    eventsRef.current    = [];
    lastEventTime.current = {};
    prevAccelMag.current = 0;
    accelRef.current     = { x: 0, y: 0, z: 0 };
    gyroRef.current      = { x: 0, y: 0, z: 0 };

    // 10 Hz — adequate for event detection, battery-friendly
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    DeviceMotion.setUpdateInterval(100);

    accelSubRef.current  = Accelerometer.addListener(handleAccelerometer);
    gyroSubRef.current   = Gyroscope.addListener(handleGyroscope);
    motionSubRef.current = DeviceMotion.addListener(handleDeviceMotion);

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setState((prev) => {
        if (prev.status !== 'active') return prev;
        return { ...prev, durationSec: durationRef.current };
      });
    }, 1000);

    setState({
      status:     'active',
      startedAt:  startedAt.current,
      durationSec: 0,
      score:      100,
      rating:     'Excellent',
      events:     [],
      sensors: {
        accel: { x: 0, y: 0, z: 0, magnitude: 0 },
        gyro:  { x: 0, y: 0, z: 0, magnitude: 0 },
      },
    });
  }, [handleAccelerometer, handleGyroscope, handleDeviceMotion]);

  // ─── End ────────────────────────────────────────────────────────────────────
  const endDrive = useCallback(() => {
    if (!isActive.current) return;
    isActive.current = false;

    // Remove all three sensor subscriptions
    accelSubRef.current?.remove();
    gyroSubRef.current?.remove();
    motionSubRef.current?.remove();
    accelSubRef.current  = null;
    gyroSubRef.current   = null;
    motionSubRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session: DriveSession = {
      id:          `session-${startedAt.current}`,
      startedAt:   startedAt.current,
      durationSec: durationRef.current,
      score:       scoreRef.current,
      rating:      getRating(scoreRef.current),
      events:      eventsRef.current,
    };

    driveStore.addSession(session);
    setState({ status: 'finished', session });
  }, []);

  const resetToIdle = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isActive.current) {
        isActive.current = false;
        accelSubRef.current?.remove();
        gyroSubRef.current?.remove();
        motionSubRef.current?.remove();
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
  }, []);

  return { state, startDrive, endDrive, resetToIdle };
}
