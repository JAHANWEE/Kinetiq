import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { useDriveSession, SensorReadings } from '../../hooks/useDriveSession';
import { DriveEvent } from '../../store/driveStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/Colors';

const W = Dimensions.get('window').width;

// GIF: 400 × 143 px — used as a mood card, not a banner
const GIF_W = W - Spacing.containerMargin * 2;
const GIF_H = Math.round(GIF_W / (400 / 143)); // preserves aspect ratio

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number) => n.toString().padStart(2, '0');
const fmt = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
const clp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const agoStr = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
};

function grade(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 80) return 'Good';
  if (s >= 65) return 'Fair';
  return 'Poor';
}
function scoreCol(s: number, T: ThemeColors) {
  if (s >= 80) return T.accent;
  if (s >= 65) return T.warn;
  return T.bad;
}

const EVT_COL = (t: DriveEvent['type'], T: ThemeColors) =>
  t === 'phoneHandling' || t === 'harshBrake' ? T.bad : T.warn;

const EVT_ICO: Record<DriveEvent['type'], React.ComponentProps<typeof MaterialIcons>['name']> = {
  harshBrake: 'warning', harshAccel: 'speed', sharpTurn: 'turn-right',
  aggressiveSteering: 'directions', phoneHandling: 'smartphone',
};

// ─── Compact score number (no ring on drive screen) ───────────────────────────
function ScoreDisplay({ score, T }: { score: number; T: ThemeColors }) {
  const c = scoreCol(score, T);
  return (
    <View style={sd.wrap}>
      <Text style={[sd.num, { color: c }]}>{score}</Text>
      <View style={sd.right}>
        <Text style={[sd.grade, { color: c }]}>{grade(score)}</Text>
        <Text style={[sd.label, { color: T.textMuted }]}>SAFETY SCORE</Text>
      </View>
    </View>
  );
}
const sd = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num:   { fontSize: 44, fontWeight: '800', letterSpacing: -3, lineHeight: 48 },
  right: { gap: 2 },
  grade: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
});

// ─── Compact dual sensor bar (magnitude only) ─────────────────────────────────
function SensorMini({ label, value, max, T }: { label: string; value: number; max: number; T: ThemeColors }) {
  const pct = clp(value / max, 0, 1);
  const hot = pct > 0.72;
  return (
    <View style={sm.row}>
      <Text style={[sm.label, { color: T.textMuted }]}>{label}</Text>
      <View style={[sm.track, { backgroundColor: T.sep }]}>
        <View style={[sm.fill, { width: `${pct * 100}%` as any, backgroundColor: hot ? T.warn : T.accent }]} />
      </View>
      <Text style={[sm.val, { color: hot ? T.warn : T.textSub }]}>{value.toFixed(1)}</Text>
    </View>
  );
}
const sm = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 44, fontSize: 11, fontWeight: '600' },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
  val:   { width: 36, fontSize: 11, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

function mag(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

// ─── Event row ────────────────────────────────────────────────────────────────
function EvtRow({ e, elapsed, T, last }: {
  e: DriveEvent; elapsed: number; T: ThemeColors; last: boolean;
}) {
  const c = EVT_COL(e.type, T);
  return (
    <View style={[er.row, !last && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
      <View style={[er.ico, { backgroundColor: c + '18' }]}>
        <MaterialIcons name={EVT_ICO[e.type]} size={13} color={c} />
      </View>
      <Text style={[er.lbl, { color: T.text }]}>{e.label}</Text>
      <Text style={[er.time, { color: T.textMuted }]}>{agoStr(elapsed - e.timestamp)}</Text>
      <Text style={[er.pts, { color: c }]}>{e.pts}</Text>
    </View>
  );
}
const er = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  ico:  { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  lbl:  { flex: 1, fontSize: 13, fontWeight: '500' },
  time: { fontSize: 11 },
  pts:  { fontSize: 14, fontWeight: '800', minWidth: 28, textAlign: 'right' },
});

// ─── IDLE ─────────────────────────────────────────────────────────────────────
function Idle({ onStart }: { onStart: () => void }) {
  const T = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: T.bg }]}>
      <View style={idl.root}>
        {/* City night GIF sets the mood — top of the idle screen */}
        <View style={[idl.gifCard, { backgroundColor: T.card }]}>
          <Image
            source={require('../../assets/city_car.gif')}
            style={idl.gif}
            contentFit="cover"
            autoplay
            cachePolicy="none"
          />
          {/* Subtle overlay gradient feel via text */}
          <View style={idl.gifOverlay}>
            <Text style={idl.gifLabel}>CITY DRIVE</Text>
          </View>
        </View>

        {/* Copy */}
        <View style={idl.copy}>
          <Text style={[idl.title, { color: T.text }]}>Ready to drive?</Text>
          <Text style={[idl.sub, { color: T.textSub }]}>
            Real-time sensor monitoring for acceleration, turns and phone handling.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[idl.btn, { backgroundColor: T.accent }]}
          onPress={onStart}
          activeOpacity={0.85}
        >
          <MaterialIcons name="play-arrow" size={22} color={T.accentText} />
          <Text style={[idl.btnTxt, { color: T.accentText }]}>Start Drive</Text>
        </TouchableOpacity>

        {/* Scoring hint — one compact line */}
        <Text style={[idl.hint, { color: T.textMuted }]}>
          Harsh braking −5 · Sharp turns −3 · Phone handling −10
        </Text>
      </View>
    </SafeAreaView>
  );
}
const idl = StyleSheet.create({
  root:       { flex: 1, padding: Spacing.containerMargin, gap: 20, justifyContent: 'center' },
  gifCard:    { borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  gif:        { width: GIF_W, height: GIF_H },
  gifOverlay: { position: 'absolute', bottom: 10, left: 14 },
  gifLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' },
  copy:       { gap: 6 },
  title:      { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  sub:        { fontSize: 14, lineHeight: 21 },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.lg, paddingVertical: 17 },
  btnTxt:     { fontSize: 16, fontWeight: '700' },
  hint:       { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

// ─── ACTIVE ───────────────────────────────────────────────────────────────────
function Active({ score, durationSec, events, sensors, onEnd }: {
  score: number; durationSec: number;
  events: DriveEvent[]; sensors: SensorReadings; onEnd: () => void;
}) {
  const T = useTheme();
  const elapsed = durationSec * 1000;
  const accelMag = mag(sensors.accel.x, sensors.accel.y, sensors.accel.z);
  const gyroMag  = mag(sensors.gyro.x,  sensors.gyro.y,  sensors.gyro.z);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: T.bg }]}>
      {/* Fixed top section — never scrolls */}
      <View style={ac.topSection}>
        {/* Header */}
        <View style={[ac.header, { paddingHorizontal: Spacing.containerMargin }]}>
          <View style={[ac.livePill, { backgroundColor: T.ok + '20' }]}>
            <View style={[ac.liveDot, { backgroundColor: T.ok }]} />
            <Text style={[ac.liveText, { color: T.ok }]}>LIVE</Text>
          </View>
          <Text style={[ac.headerTitle, { color: T.textMuted }]}>Kinetiq Drive</Text>
        </View>

        {/* City GIF */}
        <View style={[ac.gifCard, { marginHorizontal: Spacing.containerMargin, backgroundColor: T.card }]}>
          <Image
            source={require('../../assets/city_car.gif')}
            style={ac.gif}
            contentFit="cover"
            autoplay
            cachePolicy="none"
          />
          <View style={ac.gifOverlay} />
        </View>

        {/* Score card */}
        <View style={[ac.scoreCard, { marginHorizontal: Spacing.containerMargin, backgroundColor: T.card }]}>
          <ScoreDisplay score={score} T={T} />
          <View style={[ac.scoreDivider, { backgroundColor: T.sep }]} />
          <View style={ac.statsRow}>
            {[
              { v: fmt(durationSec), l: 'Duration', mono: true },
              { v: `${100 - score}`, l: 'Pts lost',  c: T.bad },
              { v: `${events.length}`, l: 'Events' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.l}>
                <View style={ac.statItem}>
                  <Text style={[
                    ac.statV,
                    { color: (item as any).c ?? T.text },
                    (item as any).mono && { fontVariant: ['tabular-nums'] },
                  ]}>{item.v}</Text>
                  <Text style={[ac.statL, { color: T.textMuted }]}>{item.l}</Text>
                </View>
                {i < arr.length - 1 && <View style={[ac.statDiv, { backgroundColor: T.sep }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Sensors */}
        <View style={[ac.sensorCard, { marginHorizontal: Spacing.containerMargin, backgroundColor: T.card }]}>
          <Text style={[ac.cardLabel, { color: T.textMuted }]}>SENSORS</Text>
          <SensorMini label="Accel" value={accelMag} max={3} T={T} />
          <SensorMini label="Gyro"  value={gyroMag}  max={4} T={T} />
        </View>
      </View>

      {/* Events — flex: 1, scrollable when content overflows */}
      <ScrollView
        style={ac.evtScroll}
        contentContainerStyle={[
          ac.evtContent,
          { paddingHorizontal: Spacing.containerMargin },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {events.length > 0 ? (
          <View style={[ac.evtCard, { backgroundColor: T.card }]}>
            <Text style={[ac.cardLabel, { color: T.textMuted }]}>EVENTS</Text>
            {events.map((e, i) => (
              <EvtRow key={e.id} e={e} elapsed={elapsed} T={T}
                last={i === events.length - 1} />
            ))}
          </View>
        ) : (
          <Text style={[ac.evtEmpty, { color: T.textMuted }]}>No events yet</Text>
        )}
      </ScrollView>

      {/* End Drive — always visible at bottom */}
      <View style={[ac.endWrap, { paddingHorizontal: Spacing.containerMargin, backgroundColor: T.bg }]}>
        <TouchableOpacity
          style={[ac.endBtn, { backgroundColor: T.bad + '18', borderColor: T.bad + '40' }]}
          onPress={onEnd}
          activeOpacity={0.8}
        >
          <MaterialIcons name="stop-circle" size={20} color={T.bad} />
          <Text style={[ac.endTxt, { color: T.bad }]}>End Drive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ac = StyleSheet.create({
  // Fixed top block
  topSection:  { gap: 10, paddingTop: Spacing.sm },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  liveDot:     { width: 6, height: 6, borderRadius: 3 },
  liveText:    { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 13, fontWeight: '600' },

  gifCard:     { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  gif:         { width: GIF_W, height: GIF_H },
  gifOverlay:  { position: 'absolute', inset: 0, backgroundColor: '#00000018' } as any,

  scoreCard:   { borderRadius: BorderRadius.lg, padding: 14, gap: 10 },
  scoreDivider:{ height: 1 },
  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statV:       { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statL:       { fontSize: 10, fontWeight: '500' },
  statDiv:     { width: 1, height: 22 },

  sensorCard:  { borderRadius: BorderRadius.md, padding: Spacing.md, gap: 10 },
  cardLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },

  // Scrollable events section
  evtScroll:   { flex: 1, marginTop: 10 },
  evtContent:  { paddingBottom: 8 },
  evtCard:     { borderRadius: BorderRadius.md, padding: Spacing.md },
  evtEmpty:    { fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  // Pinned End Drive button
  endWrap:     { paddingVertical: 12 },
  endBtn:      { borderRadius: BorderRadius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  endTxt:      { fontSize: 15, fontWeight: '700' },
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
function Summary({ session, onDone }: {
  session: { score: number; rating: string; durationSec: number; events: DriveEvent[] };
  onDone: () => void;
}) {
  const T = useTheme();
  const c = scoreCol(session.score, T);
  const counts = session.events.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  // Build compact ring for summary only
  const RS = W * 0.44, RR = RS * 0.42;
  const circ = 2 * Math.PI * RR, off = circ - (session.score / 100) * circ;
  const mid = RS / 2;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: T.bg }]}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.containerMargin, gap: 14, paddingBottom: 60, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[su.heading, { color: T.text }]}>Drive complete</Text>

        {/* Ring — only on summary, makes sense here as a result visualization */}
        <View style={[su.ringCard, { backgroundColor: T.card }]}>
          <View style={{ width: RS, height: RS, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={RS} height={RS} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Defs>
                <LinearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={c} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={c} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Circle cx={mid} cy={mid} r={RR} stroke={T.sep} strokeWidth={8} fill="none" />
              <Circle cx={mid} cy={mid} r={RR} stroke="url(#sg)" strokeWidth={8} fill="none"
                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text style={{ fontSize: 42, fontWeight: '800', color: c, letterSpacing: -2.5 }}>{session.score}</Text>
              <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>{session.rating}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={[su.statsRow, { backgroundColor: T.card }]}>
          {[
            { v: fmt(session.durationSec), l: 'Duration' },
            { v: `${session.events.length}`, l: 'Events' },
            { v: `${100 - session.score}`, l: 'Pts lost', c: T.bad },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <View style={su.stat}>
                <Text style={[su.statV, { color: (item as any).c ?? T.text }]}>{item.v}</Text>
                <Text style={[su.statL, { color: T.textMuted }]}>{item.l}</Text>
              </View>
              {i < arr.length - 1 && <View style={[su.div, { backgroundColor: T.sep }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Breakdown */}
        {Object.keys(counts).length > 0 && (
          <View style={[su.card, { backgroundColor: T.card, width: '100%' }]}>
            <Text style={[su.cardLbl, { color: T.textMuted }]}>EVENT BREAKDOWN</Text>
            {Object.entries(counts).map(([label, count], i, arr) => (
              <View key={label}
                style={[su.bRow, i < arr.length - 1 && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
                <Text style={[su.bLbl, { color: T.text }]}>{label}</Text>
                <Text style={[su.bCnt, { color: T.accent }]}>×{count}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[su.done, { backgroundColor: T.accent }]} onPress={onDone} activeOpacity={0.85}>
          <Text style={[su.doneTxt, { color: T.accentText }]}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const su = StyleSheet.create({
  heading:  { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  ringCard: { borderRadius: BorderRadius.xl, paddingVertical: Spacing.xl, alignItems: 'center', width: '100%' },
  statsRow: { flexDirection: 'row', width: '100%', borderRadius: BorderRadius.md, paddingVertical: 20, paddingHorizontal: 16 },
  stat:     { flex: 1, alignItems: 'center', gap: 3 },
  statV:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statL:    { fontSize: 11, fontWeight: '500' },
  div:      { width: 1, height: 26, alignSelf: 'center' },
  card:     { borderRadius: BorderRadius.md, padding: Spacing.md, gap: 0 },
  cardLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  bRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  bLbl:     { fontSize: 14 },
  bCnt:     { fontSize: 15, fontWeight: '800' },
  done:     { width: '100%', borderRadius: BorderRadius.lg, paddingVertical: 17, alignItems: 'center' },
  doneTxt:  { fontSize: 16, fontWeight: '700' },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DriveScreen() {
  const { state, startDrive, endDrive, resetToIdle } = useDriveSession();
  if (state.status === 'idle')     return <Idle onStart={startDrive} />;
  if (state.status === 'finished') return <Summary session={state.session} onDone={resetToIdle} />;
  return (
    <Active
      score={state.score}
      durationSec={state.durationSec}
      events={state.events}
      sensors={state.sensors}
      onEnd={endDrive}
    />
  );
}
