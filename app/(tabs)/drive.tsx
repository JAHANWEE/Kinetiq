import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { useDriveSession, SensorReadings } from '../../hooks/useDriveSession';
import { DriveEvent } from '../../store/driveStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatTimestamp(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s ago` : `${s}s ago`;
}

const EVENT_COLORS: Record<DriveEvent['type'], string> = {
  harshBrake: Colors.danger,
  harshAccel: Colors.warning,
  sharpTurn: Colors.warning,
  aggressiveSteering: Colors.warning,
  phoneHandling: Colors.error,
};

const EVENT_ICONS: Record<DriveEvent['type'], React.ComponentProps<typeof MaterialIcons>['name']> = {
  harshBrake: 'emergency',
  harshAccel: 'speed',
  sharpTurn: 'turn-right',
  aggressiveSteering: 'directions',
  phoneHandling: 'phone-android',
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamp(score, 0, 100) / 100) * circ;
  const color = score >= 80 ? Colors.primary : score >= 60 ? Colors.warning : Colors.danger;

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={160} height={160} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={80} cy={80} r={r} stroke={Colors.outlineVariant + '25'} strokeWidth={9} fill="transparent" />
        <Circle
          cx={80} cy={80} r={r}
          stroke={color}
          strokeWidth={9}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={[ringStyles.score, { color }]}>{score}</Text>
        <Text style={ringStyles.label}>SCORE</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: 44, fontWeight: '700', letterSpacing: -2 },
  label: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 9, marginTop: -2 },
});

function SensorBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = clamp(Math.abs(value) / max, 0, 1);
  const isHigh = pct > 0.75;
  const color = isHigh ? Colors.warning : Colors.primary;
  return (
    <View style={sensorStyles.row}>
      <Text style={sensorStyles.label}>{label}</Text>
      <View style={sensorStyles.track}>
        <View style={[sensorStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[sensorStyles.val, isHigh && { color: Colors.warning }]}>{value.toFixed(2)}</Text>
    </View>
  );
}

const sensorStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...Typography.caption, color: Colors.onSurfaceVariant, width: 18 },
  track: { flex: 1, height: 4, backgroundColor: Colors.outlineVariant + '25', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  val: { ...Typography.caption, color: Colors.onSurfaceVariant, width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

function EventItem({ event, elapsedMs }: { event: DriveEvent; elapsedMs: number }) {
  const color = EVENT_COLORS[event.type];
  const ago = elapsedMs - event.timestamp;
  return (
    <View style={evtStyles.card}>
      <View style={[evtStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialIcons name={EVENT_ICONS[event.type]} size={16} color={color} />
      </View>
      <View style={evtStyles.info}>
        <Text style={evtStyles.title}>{event.label}</Text>
        <Text style={evtStyles.time}>{formatTimestamp(ago)}</Text>
      </View>
      <Text style={[evtStyles.pts, { color }]}>{event.pts}</Text>
    </View>
  );
}

const evtStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '500' },
  time: { ...Typography.caption, color: Colors.onSurfaceVariant },
  pts: { ...Typography.bodySm, fontWeight: '700' },
});

// ─── Summary screen ───────────────────────────────────────────────────────────
function SummaryScreen({ session, onDone }: {
  session: { score: number; rating: string; durationSec: number; events: DriveEvent[] };
  onDone: () => void;
}) {
  const color = session.score >= 80 ? Colors.primary : session.score >= 60 ? Colors.warning : Colors.danger;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamp(session.score, 0, 100) / 100) * circ;

  const counts = session.events.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={summaryStyles.heading}>Drive Complete</Text>

        {/* Ring */}
        <View style={summaryStyles.ringWrap}>
          <Svg width={160} height={160} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={80} cy={80} r={r} stroke={Colors.outlineVariant + '25'} strokeWidth={9} fill="transparent" />
            <Circle cx={80} cy={80} r={r} stroke={color} strokeWidth={9} fill="transparent"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={[ringStyles.score, { color }]}>{session.score}</Text>
            <Text style={ringStyles.label}>SCORE</Text>
          </View>
        </View>

        <Text style={[summaryStyles.rating, { color }]}>{session.rating}</Text>

        {/* Stats */}
        <View style={summaryStyles.statsRow}>
          <View style={summaryStyles.stat}>
            <Text style={summaryStyles.statVal}>{formatDuration(session.durationSec)}</Text>
            <Text style={summaryStyles.statLabel}>Duration</Text>
          </View>
          <View style={summaryStyles.statDiv} />
          <View style={summaryStyles.stat}>
            <Text style={summaryStyles.statVal}>{session.events.length}</Text>
            <Text style={summaryStyles.statLabel}>Events</Text>
          </View>
          <View style={summaryStyles.statDiv} />
          <View style={summaryStyles.stat}>
            <Text style={summaryStyles.statVal}>{100 - session.score}</Text>
            <Text style={summaryStyles.statLabel}>Pts Lost</Text>
          </View>
        </View>

        {/* Breakdown */}
        {Object.keys(counts).length > 0 && (
          <View style={summaryStyles.breakdownCard}>
            <Text style={summaryStyles.breakdownTitle}>EVENT BREAKDOWN</Text>
            {Object.entries(counts).map(([label, count]) => (
              <View key={label} style={summaryStyles.breakdownRow}>
                <Text style={summaryStyles.breakdownLabel}>{label}</Text>
                <Text style={summaryStyles.breakdownCount}>×{count}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={summaryStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={summaryStyles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const summaryStyles = StyleSheet.create({
  heading: { ...Typography.headlineLg, color: Colors.onSurface, marginBottom: Spacing.lg },
  ringWrap: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  rating: { ...Typography.headlineLgMobile, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20', width: '100%', marginBottom: Spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { ...Typography.metricMd, color: Colors.onSurface },
  statLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  statDiv: { width: 1, height: 28, backgroundColor: Colors.outlineVariant + '40' },
  breakdownCard: { width: '100%', backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.outlineVariant + '20', marginBottom: Spacing.md },
  breakdownTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  breakdownCount: { ...Typography.bodyMd, color: Colors.primary, fontWeight: '700' },
  doneBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 18, alignItems: 'center', marginTop: Spacing.sm },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: Colors.background },
});

// ─── Idle screen ──────────────────────────────────────────────────────────────
function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={idleStyles.wrapper}>
        <View style={idleStyles.iconWrap}>
          <MaterialIcons name="directions-car" size={40} color={Colors.primary} />
        </View>
        <Text style={idleStyles.title}>Ready to Drive?</Text>
        <Text style={idleStyles.sub}>
          Sensors will monitor acceleration, turns, and phone handling in real time.
        </Text>
        <TouchableOpacity style={idleStyles.btn} onPress={onStart} activeOpacity={0.85}>
          <MaterialIcons name="play-arrow" size={22} color={Colors.background} />
          <Text style={idleStyles.btnText}>Start Drive</Text>
        </TouchableOpacity>

        {/* Thresholds legend */}
        <View style={idleStyles.legend}>
          <Text style={idleStyles.legendTitle}>DETECTION THRESHOLDS</Text>
          {[
            ['Harsh Brake / Accel', '> 1.8 g', Colors.danger],
            ['Sharp Turn', '> 1.2 rad/s', Colors.warning],
            ['Aggressive Steering', '> 2.0 rad/s', Colors.warning],
            ['Phone Handling', 'accel > 2.5 + gyro > 1.5', Colors.error],
          ].map(([label, val, color]) => (
            <View key={label as string} style={idleStyles.legendRow}>
              <View style={[idleStyles.dot, { backgroundColor: color as string }]} />
              <Text style={idleStyles.legendLabel}>{label as string}</Text>
              <Text style={idleStyles.legendVal}>{val as string}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const idleStyles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.containerMargin, gap: Spacing.md },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  title: { ...Typography.headlineLg, color: Colors.onSurface, textAlign: 'center' },
  sub: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16, paddingHorizontal: 32, marginTop: Spacing.sm },
  btnText: { fontSize: 17, fontWeight: '700', color: Colors.background },
  legend: { width: '100%', backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.outlineVariant + '20', marginTop: Spacing.md },
  legendTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { flex: 1, ...Typography.bodySm, color: Colors.onSurface },
  legendVal: { ...Typography.caption, color: Colors.onSurfaceVariant },
});

// ─── Active Drive screen ───────────────────────────────────────────────────────
function ActiveDriveScreen({
  score, rating, durationSec, events, sensors, startedAt, onEnd,
}: {
  score: number; rating: string; durationSec: number; events: DriveEvent[];
  sensors: SensorReadings; startedAt: number; onEnd: () => void;
}) {
  const elapsedMs = durationSec * 1000;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Live badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Score + Duration */}
        <View style={styles.heroCard}>
          <ScoreRing score={score} />
          <View style={styles.heroRight}>
            <Text style={styles.ratingText}>{rating}</Text>
            <View style={styles.durationWrap}>
              <Text style={styles.durationLabel}>DURATION</Text>
              <Text style={styles.durationValue}>{formatDuration(durationSec)}</Text>
            </View>
            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>{events.length}</Text>
                <Text style={styles.miniStatLabel}>Events</Text>
              </View>
              <View style={styles.miniStatDiv} />
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatVal, { color: Colors.danger }]}>{100 - score}</Text>
                <Text style={styles.miniStatLabel}>Pts Lost</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sensor readings */}
        <View style={styles.sensorCard}>
          <Text style={styles.sectionLabel}>ACCELEROMETER  (g)</Text>
          <SensorBar label="X" value={sensors.accel.x} max={3} />
          <SensorBar label="Y" value={sensors.accel.y} max={3} />
          <SensorBar label="Z" value={sensors.accel.z} max={3} />

          <View style={styles.sensorDivider} />

          <Text style={styles.sectionLabel}>GYROSCOPE  (rad/s)</Text>
          <SensorBar label="X" value={sensors.gyro.x} max={4} />
          <SensorBar label="Y" value={sensors.gyro.y} max={4} />
          <SensorBar label="Z" value={sensors.gyro.z} max={4} />
        </View>

        {/* Event feed */}
        {events.length > 0 && (
          <View style={styles.eventsCard}>
            <Text style={styles.sectionLabel}>EVENTS</Text>
            <View style={styles.eventList}>
              {events.slice(0, 8).map((e) => (
                <EventItem key={e.id} event={e} elapsedMs={elapsedMs} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* End Drive FAB */}
      <View style={styles.fabWrap}>
        <TouchableOpacity style={styles.endBtn} onPress={onEnd} activeOpacity={0.85}>
          <MaterialIcons name="stop" size={20} color="#fff" />
          <Text style={styles.endBtnText}>End Drive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────
export default function DriveScreen() {
  const { state, startDrive, endDrive, resetToIdle } = useDriveSession();

  if (state.status === 'idle') {
    return <IdleScreen onStart={startDrive} />;
  }

  if (state.status === 'finished') {
    return <SummaryScreen session={state.session} onDone={resetToIdle} />;
  }

  return (
    <ActiveDriveScreen
      score={state.score}
      rating={state.rating}
      durationSec={state.durationSec}
      events={state.events}
      sensors={state.sensors}
      startedAt={state.startedAt}
      onEnd={endDrive}
    />
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, gap: Spacing.md },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.success + '15', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { ...Typography.labelCaps, color: Colors.success, fontSize: 10 },

  heroCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  heroRight: { flex: 1, gap: Spacing.sm },
  ratingText: { ...Typography.headlineLgMobile, color: Colors.primary },
  durationWrap: { gap: 2 },
  durationLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 9 },
  durationValue: { fontSize: 24, fontWeight: '600', color: Colors.onSurface, letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  miniStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  miniStat: { alignItems: 'center', gap: 1 },
  miniStatVal: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  miniStatLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  miniStatDiv: { width: 1, height: 20, backgroundColor: Colors.outlineVariant + '40' },

  sensorCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: 10, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 9, marginBottom: 2 },
  sensorDivider: { height: 1, backgroundColor: Colors.outlineVariant + '20', marginVertical: 4 },

  eventsCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  eventList: {},

  fabWrap: { position: 'absolute', bottom: 90, left: Spacing.containerMargin, right: Spacing.containerMargin },
  endBtn: { backgroundColor: Colors.danger, borderRadius: BorderRadius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  endBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
