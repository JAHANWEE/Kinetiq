import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { useDriveSession, SensorReadings } from '../../hooks/useDriveSession';
import { DriveEvent } from '../../store/driveStore';

const { width: W } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n: number) { return n.toString().padStart(2, '0'); }
function fmt(sec: number) {
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
}
function fmtAgo(ms: number) {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function scoreColor(s: number) {
  if (s >= 85) return Colors.primary;
  if (s >= 65) return Colors.warning;
  return Colors.danger;
}
function scoreLabel(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 80) return 'Good';
  if (s >= 65) return 'Fair';
  return 'Poor';
}

const EVT_COLOR: Record<DriveEvent['type'], string> = {
  harshBrake:         Colors.danger,
  harshAccel:         Colors.warning,
  sharpTurn:          Colors.warning,
  aggressiveSteering: Colors.warning,
  phoneHandling:      Colors.error,
};
const EVT_ICON: Record<DriveEvent['type'], React.ComponentProps<typeof MaterialIcons>['name']> = {
  harshBrake:         'warning',
  harshAccel:         'speed',
  sharpTurn:          'turn-right',
  aggressiveSteering: 'directions',
  phoneHandling:      'smartphone',
};

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 68, sz = (r + 14) * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamp(score, 0, 100) / 100) * circ;
  const color = scoreColor(score);
  return (
    <View style={{ width: sz, height: sz, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={sz} height={sz} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={sz/2} cy={sz/2} r={r} stroke={Colors.border} strokeWidth={11} fill="none" />
        <Circle cx={sz/2} cy={sz/2} r={r} stroke={color} strokeWidth={11} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={[ring.num, { color }]}>{score}</Text>
        <Text style={ring.lbl}>{scoreLabel(score)}</Text>
      </View>
    </View>
  );
}
const ring = StyleSheet.create({
  num: { fontSize: 48, fontWeight: '800', letterSpacing: -2.5, lineHeight: 52 },
  lbl: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, marginTop: 1 },
});

// ─── Sensor bar ───────────────────────────────────────────────────────────────
function SBar({ axis, value, max }: { axis: string; value: number; max: number }) {
  const pct = clamp(Math.abs(value) / max, 0, 1);
  const hot = pct > 0.7;
  const color = hot ? Colors.warning : Colors.primary;
  return (
    <View style={sb.row}>
      <Text style={sb.axis}>{axis}</Text>
      <View style={sb.track}>
        <View style={[sb.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[sb.val, hot && { color: Colors.warning }]}>{value.toFixed(2)}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  axis: { width: 14, ...Typography.labelSm, color: Colors.onSurfaceMuted },
  track: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { width: 44, ...Typography.caption, color: Colors.onSurfaceSecondary, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

// ─── Event pill ───────────────────────────────────────────────────────────────
function EvtRow({ event, elapsedMs }: { event: DriveEvent; elapsedMs: number }) {
  const color = EVT_COLOR[event.type];
  const ago = fmtAgo(elapsedMs - event.timestamp);
  return (
    <View style={er.wrap}>
      <View style={[er.icon, { backgroundColor: color + '1A' }]}>
        <MaterialIcons name={EVT_ICON[event.type]} size={15} color={color} />
      </View>
      <View style={er.info}>
        <Text style={er.label}>{event.label}</Text>
        <Text style={er.time}>{ago}</Text>
      </View>
      <Text style={[er.pts, { color }]}>{event.pts}</Text>
    </View>
  );
}
const er = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  icon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  label: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '500' },
  time: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  pts: { ...Typography.metricSm, fontWeight: '700' },
});

// ─── IDLE ─────────────────────────────────────────────────────────────────────
function Idle({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={g.root}>
      <View style={idle.wrap}>
        {/* Icon */}
        <View style={idle.iconRing}>
          <MaterialIcons name="speed" size={36} color={Colors.primary} />
        </View>

        <Text style={idle.title}>Ready to drive?</Text>
        <Text style={idle.sub}>
          Accelerometer, gyroscope and phone-motion sensors will monitor your driving in real time.
        </Text>

        <TouchableOpacity style={idle.btn} onPress={onStart} activeOpacity={0.8}>
          <MaterialIcons name="play-arrow" size={22} color={Colors.onPrimary} />
          <Text style={idle.btnText}>Start Drive</Text>
        </TouchableOpacity>

        {/* What gets detected */}
        <View style={idle.infoCard}>
          <Text style={idle.infoTitle}>Detects</Text>
          {[
            { icon: 'warning' as const,    label: 'Harsh braking', color: Colors.danger,  pts: '−5' },
            { icon: 'speed' as const,      label: 'Harsh acceleration', color: Colors.warning, pts: '−5' },
            { icon: 'turn-right' as const, label: 'Sharp turns', color: Colors.warning,   pts: '−3' },
            { icon: 'smartphone' as const, label: 'Phone handling', color: Colors.error,  pts: '−10' },
          ].map((item) => (
            <View key={item.label} style={idle.infoRow}>
              <MaterialIcons name={item.icon} size={16} color={item.color} />
              <Text style={idle.infoLabel}>{item.label}</Text>
              <Text style={[idle.infoPts, { color: item.color }]}>{item.pts}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
const idle = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.containerMargin, gap: Spacing.lg },
  iconRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryDim, justifyContent: 'center', alignItems: 'center' },
  title: { ...Typography.headlineLg, color: Colors.onSurface },
  sub: { ...Typography.bodyMd, color: Colors.onSurfaceSecondary, textAlign: 'center', lineHeight: 22 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16, paddingHorizontal: 36, marginTop: Spacing.sm },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },
  infoCard: { width: '100%', backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  infoTitle: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  infoPts: { ...Typography.metricSm },
});

// ─── ACTIVE ───────────────────────────────────────────────────────────────────
function Active({ score, rating, durationSec, events, sensors, startedAt, onEnd }: {
  score: number; rating: string; durationSec: number;
  events: DriveEvent[]; sensors: SensorReadings; startedAt: number; onEnd: () => void;
}) {
  const elapsedMs = durationSec * 1000;
  return (
    <SafeAreaView style={g.root}>
      <ScrollView contentContainerStyle={g.scroll} showsVerticalScrollIndicator={false}>

        {/* Live pill */}
        <View style={act.livePill}>
          <View style={act.liveDot} />
          <Text style={act.liveText}>LIVE</Text>
        </View>

        {/* Hero */}
        <View style={act.hero}>
          <ScoreRing score={score} />
          <View style={act.heroRight}>
            <View style={act.timerBlock}>
              <Text style={act.timerLabel}>DURATION</Text>
              <Text style={act.timer}>{fmt(durationSec)}</Text>
            </View>
            <View style={act.miniRow}>
              <View style={act.mini}>
                <Text style={act.miniVal}>{events.length}</Text>
                <Text style={act.miniLabel}>Events</Text>
              </View>
              <View style={act.miniDiv} />
              <View style={act.mini}>
                <Text style={[act.miniVal, { color: Colors.danger }]}>{100 - score}</Text>
                <Text style={act.miniLabel}>Pts lost</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sensors */}
        <View style={g.card}>
          <Text style={g.cardLabel}>ACCELEROMETER  (g)</Text>
          <SBar axis="X" value={sensors.accel.x} max={3} />
          <SBar axis="Y" value={sensors.accel.y} max={3} />
          <SBar axis="Z" value={sensors.accel.z} max={3} />
          <View style={g.sep} />
          <Text style={g.cardLabel}>GYROSCOPE  (rad/s)</Text>
          <SBar axis="X" value={sensors.gyro.x} max={4} />
          <SBar axis="Y" value={sensors.gyro.y} max={4} />
          <SBar axis="Z" value={sensors.gyro.z} max={4} />
        </View>

        {/* Events */}
        {events.length > 0 && (
          <View style={g.card}>
            <Text style={g.cardLabel}>EVENTS</Text>
            {events.slice(0, 8).map((e, i) => (
              <View key={e.id}>
                {i > 0 && <View style={g.sep} />}
                <EvtRow event={e} elapsedMs={elapsedMs} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* End button */}
      <View style={act.endWrap}>
        <TouchableOpacity style={act.endBtn} onPress={onEnd} activeOpacity={0.85}>
          <MaterialIcons name="stop" size={20} color="#fff" />
          <Text style={act.endText}>End Drive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const act = StyleSheet.create({
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.successDim, paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { ...Typography.labelCaps, color: Colors.success, fontSize: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  heroRight: { flex: 1, gap: Spacing.md },
  timerBlock: { gap: 2 },
  timerLabel: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, fontSize: 9 },
  timer: { fontSize: 26, fontWeight: '700', color: Colors.onSurface, letterSpacing: 0.5, fontVariant: ['tabular-nums'] },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  mini: { flex: 1, alignItems: 'center', gap: 2 },
  miniVal: { ...Typography.metricMd, color: Colors.onSurface },
  miniLabel: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  miniDiv: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 4 },
  endWrap: { position: 'absolute', bottom: 90, left: Spacing.containerMargin, right: Spacing.containerMargin },
  endBtn: { backgroundColor: Colors.danger, borderRadius: BorderRadius.lg, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  endText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
function Summary({ session, onDone }: {
  session: { score: number; rating: string; durationSec: number; events: DriveEvent[] };
  onDone: () => void;
}) {
  const color = scoreColor(session.score);
  const counts = session.events.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={g.root}>
      <ScrollView contentContainerStyle={[g.scroll, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={sum.heading}>Drive Complete</Text>

        <ScoreRing score={session.score} />
        <Text style={[sum.rating, { color }]}>{session.rating}</Text>

        {/* Stats */}
        <View style={sum.statsRow}>
          <View style={sum.stat}>
            <Text style={sum.statVal}>{fmt(session.durationSec)}</Text>
            <Text style={sum.statLabel}>Duration</Text>
          </View>
          <View style={sum.statDiv} />
          <View style={sum.stat}>
            <Text style={sum.statVal}>{session.events.length}</Text>
            <Text style={sum.statLabel}>Events</Text>
          </View>
          <View style={sum.statDiv} />
          <View style={sum.stat}>
            <Text style={[sum.statVal, { color: Colors.danger }]}>{100 - session.score}</Text>
            <Text style={sum.statLabel}>Pts lost</Text>
          </View>
        </View>

        {/* Breakdown */}
        {Object.keys(counts).length > 0 && (
          <View style={[g.card, { width: '100%' }]}>
            <Text style={g.cardLabel}>EVENT BREAKDOWN</Text>
            {Object.entries(counts).map(([label, count], i, arr) => (
              <View key={label}>
                {i > 0 && <View style={g.sep} />}
                <View style={sum.bRow}>
                  <Text style={sum.bLabel}>{label}</Text>
                  <Text style={sum.bCount}>×{count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={sum.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={sum.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const sum = StyleSheet.create({
  heading: { ...Typography.headlineLg, color: Colors.onSurface, marginBottom: Spacing.sm },
  rating: { ...Typography.headlineMd, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, width: '100%', marginBottom: Spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { ...Typography.metricMd, color: Colors.onSurface },
  statLabel: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  statDiv: { width: 1, height: 28, backgroundColor: Colors.border },
  bRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  bLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  bCount: { ...Typography.metricSm, color: Colors.primary },
  doneBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 17, alignItems: 'center', marginTop: Spacing.md },
  doneText: { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DriveScreen() {
  const { state, startDrive, endDrive, resetToIdle } = useDriveSession();

  if (state.status === 'idle') return <Idle onStart={startDrive} />;
  if (state.status === 'finished') return <Summary session={state.session} onDone={resetToIdle} />;

  return (
    <Active
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
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.containerMargin, gap: Spacing.md },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardLabel: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, marginBottom: 4 },
  sep: { height: 1, backgroundColor: Colors.border },
});
