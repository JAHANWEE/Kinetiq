/**
 * useDriveSession.ts
 * Core driving session hook.
 *
 * Sensor update intervals are set to 100ms (10 Hz) — enough for event detection
 * while being battery-friendly. High-precision 200Hz sampling is not needed here.
 *
 * --- THRESHOLDS ---
 * Harsh Brake:         accel magnitude change > 1.8 g (sudden deceleration spike)
 * Harsh Acceleration:  accel magnitude change > 1.8 g (sudden forward spike)
 * Sharp Turn:          gyro Z rotation rate > 1.2 rad/s
 * Aggressive Steering: gyro total rotation rate > 2.0 rad/s
 * Phone Handling:      DeviceMotion total linear accel magnitude > 2.5 m/s² AND
 *                      gyro magnitude > 1.5 rad/s simultaneously (phone being picked up)
 *
 * A 2-second cooldown per event type prevents repeated firing from the same incident.
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

// ─── Base thresholds (medium sensitivity) ────────────────────────────────────
const BASE_HARSH_THRESHOLD = 1.8;        // g  (accelerometer magnitude delta)
const BASE_SHARP_TURN = 1.2;             // rad/s (gyro Z)
const BASE_AGGRESSIVE_STEER = 2.0;       // rad/s (gyro total magnitude)
const BASE_PHONE_ACCEL = 2.5;            // m/s²
const BASE_PHONE_GYRO = 1.5;             // rad/s
const COOLDOWN_MS = 2000;                // ms between same-type events

// ─── Scoring ─────────────────────────────────────────────────────────────────
const DEDUCTIONS: Record<DriveEvent['type'], number> = {
  harshBrake: 5,
  harshAccel: 5,
  sharpTurn: 3,
  aggressiveSteering: 3,
  phoneHandling: 10,
};

const EVENT_LABELS: Record<DriveEvent['type'], string> = {
  harshBrake: 'Harsh Brake',
  harshAccel: 'Harsh Acceleration',
  sharpTurn: 'Sharp Turn',
  aggressiveSteering: 'Aggressive Steering',
  phoneHandling: 'Phone Handling',
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
  gyro: { x: number; y: number; z: number; magnitude: number };
};

export type SessionState =
  | { status: 'idle' }
  | { status: 'active'; startedAt: number; durationSec: number; score: number; rating: string; events: DriveEvent[]; sensors: SensorReadings }
  | { status: 'finished'; session: DriveSession };

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDriveSession() {
  const [state, setState] = useState<SessionState>({ status: 'idle' });

  // Mutable refs — updated every sensor tick without triggering re-renders
  const isActive = useRef(false);
  const startedAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const scoreRef = useRef(100);
  const eventsRef = useRef<DriveEvent[]>([]);
  const lastEventTime = useRef<Partial<Record<DriveEvent['type'], number>>>({});

  // Latest sensor values shared between accelerometer & DeviceMotion
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });
  const prevAccelMag = useRef(0);

  // ─── Event detection ───────────────────────────────────────────────────────
  const detectEvent = useCallback((type: DriveEvent['type']) => {
    if (!isActive.current) return;
    const now = Date.now();
    const last = lastEventTime.current[type] ?? 0;
    if (now - last < COOLDOWN_MS) return;

    lastEventTime.current[type] = now;
    const pts = DEDUCTIONS[type];
    scoreRef.current = Math.max(0, scoreRef.current - pts);

    const event: DriveEvent = {
      id: `${type}-${now}`,
      type,
      label: EVENT_LABELS[type],
      pts: -pts,
      timestamp: now - startedAt.current,
    };

    eventsRef.current = [event, ...eventsRef.current];

    // Haptic feedback — only if enabled in settings
    if (settingsStore.get().hapticFeedback) {
      Haptics.notificationAsync(
        type === 'phoneHandling'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    }

    // Flush to React state
    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return {
        ...prev,
        score: scoreRef.current,
        rating: getRating(scoreRef.current),
        events: eventsRef.current,
      };
    });
  }, []);

  // ─── Sensor handlers ───────────────────────────────────────────────────────
  const handleAccelerometer = useCallback((data: AccelerometerMeasurement) => {
    if (!isActive.current) return;
    const { x, y, z } = data;
    accelRef.current = { x, y, z };

    const mag = mag3(x, y, z);
    const delta = Math.abs(mag - prevAccelMag.current);
    prevAccelMag.current = mag;

    // Apply sensitivity multiplier — higher sensitivity = lower effective threshold
    const mult = settingsStore.getThresholdMultiplier();
    const harshThresh = BASE_HARSH_THRESHOLD * mult;

    if (delta > harshThresh) {
      if (y < -harshThresh * 0.6) {
        detectEvent('harshBrake');
      } else {
        detectEvent('harshAccel');
      }
    }

    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return {
        ...prev,
        sensors: {
          ...prev.sensors,
          accel: { x, y, z, magnitude: mag },
        },
      };
    });
  }, [detectEvent]);

  const handleGyroscope = useCallback((data: GyroscopeMeasurement) => {
    if (!isActive.current) return;
    const { x, y, z } = data;
    gyroRef.current = { x, y, z };

    const totalMag = mag3(x, y, z);
    const mult = settingsStore.getThresholdMultiplier();

    if (Math.abs(z) > BASE_SHARP_TURN * mult) {
      detectEvent('sharpTurn');
    } else if (totalMag > BASE_AGGRESSIVE_STEER * mult) {
      detectEvent('aggressiveSteering');
    }

    // Check phone handling (needs both sensors active)
    const accelMag = mag3(accelRef.current.x, accelRef.current.y, accelRef.current.z);
    if (accelMag > BASE_PHONE_ACCEL * mult && totalMag > BASE_PHONE_GYRO * mult) {
      detectEvent('phoneHandling');
    }

    setState((prev) => {
      if (prev.status !== 'active') return prev;
      return {
        ...prev,
        sensors: {
          ...prev.sensors,
          gyro: { x, y, z, magnitude: totalMag },
        },
      };
    });
  }, [detectEvent]);

  // ─── Start / End ───────────────────────────────────────────────────────────
  const startDrive = useCallback(() => {
    isActive.current = true;
    startedAt.current = Date.now();
    durationRef.current = 0;
    scoreRef.current = 100;
    eventsRef.current = [];
    lastEventTime.current = {};
    prevAccelMag.current = 0;
    accelRef.current = { x: 0, y: 0, z: 0 };
    gyroRef.current = { x: 0, y: 0, z: 0 };

    // Set sensor update intervals (100ms = 10Hz)
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    const accelSub = Accelerometer.addListener(handleAccelerometer);
    const gyroSub = Gyroscope.addListener(handleGyroscope);

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setState((prev) => {
        if (prev.status !== 'active') return prev;
        return { ...prev, durationSec: durationRef.current };
      });
    }, 1000);

    setState({
      status: 'active',
      startedAt: startedAt.current,
      durationSec: 0,
      score: 100,
      rating: 'Excellent',
      events: [],
      sensors: {
        accel: { x: 0, y: 0, z: 0, magnitude: 0 },
        gyro: { x: 0, y: 0, z: 0, magnitude: 0 },
      },
    });

    // Store subs so we can clean up
    (startDrive as any)._accelSub = accelSub;
    (startDrive as any)._gyroSub = gyroSub;
  }, [handleAccelerometer, handleGyroscope]);

  // Keep subs accessible via ref
  const accelSubRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const gyroSubRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  const startDriveFinal = useCallback(() => {
    isActive.current = true;
    startedAt.current = Date.now();
    durationRef.current = 0;
    scoreRef.current = 100;
    eventsRef.current = [];
    lastEventTime.current = {};
    prevAccelMag.current = 0;
    accelRef.current = { x: 0, y: 0, z: 0 };
    gyroRef.current = { x: 0, y: 0, z: 0 };

    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    accelSubRef.current = Accelerometer.addListener(handleAccelerometer);
    gyroSubRef.current = Gyroscope.addListener(handleGyroscope);

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setState((prev) => {
        if (prev.status !== 'active') return prev;
        return { ...prev, durationSec: durationRef.current };
      });
    }, 1000);

    setState({
      status: 'active',
      startedAt: startedAt.current,
      durationSec: 0,
      score: 100,
      rating: 'Excellent',
      events: [],
      sensors: {
        accel: { x: 0, y: 0, z: 0, magnitude: 0 },
        gyro: { x: 0, y: 0, z: 0, magnitude: 0 },
      },
    });
  }, [handleAccelerometer, handleGyroscope]);

  const endDrive = useCallback(() => {
    if (!isActive.current) return;
    isActive.current = false;

    accelSubRef.current?.remove();
    gyroSubRef.current?.remove();
    accelSubRef.current = null;
    gyroSubRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session: DriveSession = {
      id: `session-${startedAt.current}`,
      startedAt: startedAt.current,
      durationSec: durationRef.current,
      score: scoreRef.current,
      rating: getRating(scoreRef.current),
      events: eventsRef.current,
    };

    driveStore.addSession(session);

    setState({ status: 'finished', session });
  }, []);

  const resetToIdle = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive.current) {
        isActive.current = false;
        accelSubRef.current?.remove();
        gyroSubRef.current?.remove();
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
  }, []);

  return { state, startDrive: startDriveFinal, endDrive, resetToIdle };
}
