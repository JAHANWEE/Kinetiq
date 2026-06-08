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

// GIF original: 400 × 143  → aspect ≈ 2.797
const GIF_ASPECT = 400 / 143;
const GIF_W      = W;
const GIF_H      = Math.round(GIF_W / GIF_ASPECT); // ~143 on 400-wide, scales up on bigger screens

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const pad  = (n: number) => n.toString().padStart(2, '0');
const fmt  = (s: number) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
const clp  = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ago  = (ms: number) => { const s = Math.floor(ms / 1000); return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`; };

function grade(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 80) return 'Good';
  if (s >= 65) return 'Fair';
  return 'Poor';
}
function col(s: number, T: ThemeColors) {
  if (s >= 80) return T.accent;
  if (s >= 65) return T.warn;
  return T.bad;
}

const EVT_COL: Record<DriveEvent['type'], (T: ThemeColors) => string> = {
  harshBrake:         T => T.bad,
  harshAccel:         T => T.warn,
  sharpTurn:          T => T.warn,
  aggressiveSteering: T => T.warn,
  phoneHandling:      T => T.bad,
};
const EVT_ICO: Record<DriveEvent['type'], React.ComponentProps<typeof MaterialIcons>['name']> = {
  harshBrake: 'warning', harshAccel: 'speed', sharpTurn: 'turn-right',
  aggressiveSteering: 'directions', phoneHandling: 'smartphone',
};

// ─── Score ring ───────────────────────────────────────────────────────────────
const RS = W * 0.48;
const RR = RS * 0.41;

function Ring({ score, T }: { score: number; T: ThemeColors }) {
  const circ = 2 * Math.PI * RR;
  const off  = circ - (score / 100) * circ;
  const c    = col(score, T);
  const mid  = RS / 2;
  return (
    <View style={{ width: RS, height: RS, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={RS} height={RS} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c} stopOpacity="0.35" />
            <Stop offset="1" stopColor={c} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Circle cx={mid} cy={mid} r={RR} stroke={T.sep} strokeWidth={9} fill="none" />
        <Circle cx={mid} cy={mid} r={RR} stroke="url(#rg)" strokeWidth={9} fill="none"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, fontWeight: '800', color: c, letterSpacing: -3, lineHeight: 52 }}>{score}</Text>
        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>{grade(score)}</Text>
      </View>
    </View>
  );
}

// ─── Sensor bar ───────────────────────────────────────────────────────────────
function SBar({ ax, v, max, T }: { ax: string; v: number; max: number; T: ThemeColors }) {
  const pct = clp(Math.abs(v) / max, 0, 1);
  const hot = pct > 0.72;
  const bc  = hot ? T.warn : T.accent;
  return (
    <View style={sb.row}>
      <Text style={[sb.ax, { color: T.textMuted }]}>{ax}</Text>
      <View style={[sb.track, { backgroundColor: T.sep }]}>
        <View style={[sb.fill, { width: `${pct * 100}%` as any, backgroundColor: bc }]} />
      </View>
      <Text style={[sb.val, { color: hot ? T.warn : T.textSub }]}>{v.toFixed(2)}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ax:   { width: 14, fontSize: 11, fontWeight: '700' },
  track:{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val:  { width: 44, fontSize: 11, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

// ─── Event row ────────────────────────────────────────────────────────────────
function EvtRow({ e, elapsed, T, last }: { e: DriveEvent; elapsed: number; T: ThemeColors; last: boolean }) {
  const c = EVT_COL[e.type](T);
  return (
    <View style={[er.row, !last && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
      <View style={[er.ico, { backgroundColor: c + '18' }]}>
        <MaterialIcons name={EVT_ICO[e.type]} size={14} color={c} />
      </View>
      <View style={er.inf}>
        <Text style={[er.lbl, { color: T.text }]}>{e.label}</Text>
        <Text style={[er.tm, { color: T.textMuted }]}>{ago(elapsed - e.timestamp)}</Text>
      </View>
      <Text style={[er.pts, { color: c }]}>{e.pts}</Text>
    </View>
  );
}
const er = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  ico: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  inf: { flex: 1 },
  lbl: { fontSize: 13, fontWeight: '500' },
  tm:  { fontSize: 11, marginTop: 1 },
  pts: { fontSize: 15, fontWeight: '800' },
});

// ─── IDLE ─────────────────────────────────────────────────────────────────────
function Idle({ onStart }: { onStart: () => void }) {
  const T = useTheme();
  return (
    <SafeAreaView style={[g.root, { backgroundColor: T.bg }]}>
      <View style={idle.wrap}>
        {/* Icon */}
        <View style={[idle.icon, { backgroundColor: T.accentSoft }]}>
          <MaterialIcons name="speed" size={38} color={T.accent} />
        </View>

        <View style={idle.copy}>
          <Text style={[idle.title, { color: T.text }]}>Ready to drive?</Text>
          <Text style={[idle.sub, { color: T.textSub }]}>
            Sensors track acceleration, turns and phone handling in real time.
          </Text>
        </View>

        {/* Start button */}
        <TouchableOpacity style={[idle.btn, { backgroundColor: T.accent }]} onPress={onStart} activeOpacity={0.85}>
          <MaterialIcons name="play-arrow" size={22} color={T.accentText} />
          <Text style={[idle.btnTxt, { color: T.accentText }]}>Start Drive</Text>
        </TouchableOpacity>

        {/* Scoring table */}
        <View style={[idle.table, { backgroundColor: T.card }]}>
          <Text style={[idle.tableHead, { color: T.textMuted }]}>SCORING EVENTS</Text>
          {([
            ['warning',    'Harsh brake / accel', T.bad,  '-5 pts'],
            ['turn-right', 'Sharp turn',           T.warn, '-3 pts'],
            ['directions', 'Aggressive steering',  T.warn, '-3 pts'],
            ['smartphone', 'Phone handling',       T.bad,  '-10 pts'],
          ] as const).map(([icon, label, c, pts], i, arr) => (
            <View key={label}
              style={[idle.tr, { borderBottomColor: T.sep, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}
            >
              <MaterialIcons name={icon as any} size={15} color={c} />
              <Text style={[idle.trLabel, { color: T.text }]}>{label}</Text>
              <Text style={[idle.trPts, { color: c }]}>{pts}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
const idle = StyleSheet.create({
  wrap:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.containerMargin, gap: 20 },
  icon:      { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  copy:      { alignItems: 'center', gap: 6 },
  title:     { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  sub:       { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 8 },
  btn:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: BorderRadius.lg, paddingVertical: 16, paddingHorizontal: 40 },
  btnTxt:    { fontSize: 16, fontWeight: '700' },
  table:     { width: '100%', borderRadius: BorderRadius.md, overflow: 'hidden', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  tableHead: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingVertical: 8 },
  tr:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  trLabel:   { flex: 1, fontSize: 14 },
  trPts:     { fontSize: 13, fontWeight: '700' },
});

// ─── ACTIVE ───────────────────────────────────────────────────────────────────
function Active({ score, durationSec, events, sensors, onEnd }: {
  score: number; durationSec: number;
  events: DriveEvent[]; sensors: SensorReadings; onEnd: () => void;
}) {
  const T = useTheme();
  const elapsed = durationSec * 1000;

  return (
    <SafeAreaView style={[g.root, { backgroundColor: T.bg }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={g.scroll} showsVerticalScrollIndicator={false}>

        {/* ── GIF banner (full-bleed, top of scroll) ────────────────────────── */}
        <View style={[banner.wrap, { backgroundColor: T.card }]}>
          <Image
            source={require('../../assets/city_car.gif')}
            style={banner.gif}
            contentFit="cover"
            autoplay
            cachePolicy="none"
          />
          {/* Live pill overlaid on the gif */}
          <View style={[banner.livePill, { backgroundColor: T.accent }]}>
            <View style={banner.liveDot} />
            <Text style={banner.liveText}>LIVE</Text>
          </View>
        </View>

        {/* ── Score ring + stats ─────────────────────────────────────────────── */}
        <View style={[act.hero, { backgroundColor: T.card }]}>
          <Ring score={score} T={T} />
          <View style={act.stats}>
            <View style={act.statItem}>
              <Text style={[act.statV, { color: T.text, fontVariant: ['tabular-nums'] }]}>{fmt(durationSec)}</Text>
              <Text style={[act.statL, { color: T.textMuted }]}>Duration</Text>
            </View>
            <View style={[act.sep, { backgroundColor: T.sep }]} />
            <View style={act.statItem}>
              <Text style={[act.statV, { color: T.bad }]}>{100 - score}</Text>
              <Text style={[act.statL, { color: T.textMuted }]}>Pts lost</Text>
            </View>
            <View style={[act.sep, { backgroundColor: T.sep }]} />
            <View style={act.statItem}>
              <Text style={[act.statV, { color: T.text }]}>{events.length}</Text>
              <Text style={[act.statL, { color: T.textMuted }]}>Events</Text>
            </View>
          </View>
        </View>

        {/* ── Sensor readings ───────────────────────────────────────────────── */}
        <View style={[g.card, { backgroundColor: T.card }]}>
          <Text style={[g.cardLbl, { color: T.textMuted }]}>ACCELEROMETER  (g)</Text>
          <SBar ax="X" v={sensors.accel.x} max={3} T={T} />
          <SBar ax="Y" v={sensors.accel.y} max={3} T={T} />
          <SBar ax="Z" v={sensors.accel.z} max={3} T={T} />
          <View style={[g.hr, { backgroundColor: T.sep }]} />
          <Text style={[g.cardLbl, { color: T.textMuted }]}>GYROSCOPE  (rad/s)</Text>
          <SBar ax="X" v={sensors.gyro.x} max={4} T={T} />
          <SBar ax="Y" v={sensors.gyro.y} max={4} T={T} />
          <SBar ax="Z" v={sensors.gyro.z} max={4} T={T} />
        </View>

        {/* ── Event feed ────────────────────────────────────────────────────── */}
        {events.length > 0 && (
          <View style={[g.card, { backgroundColor: T.card }]}>
            <Text style={[g.cardLbl, { color: T.textMuted }]}>EVENTS</Text>
            {events.slice(0, 8).map((e, i) => (
              <EvtRow key={e.id} e={e} elapsed={elapsed} T={T}
                last={i === Math.min(7, events.length - 1)} />
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* End drive button */}
      <View style={act.endWrap}>
        <TouchableOpacity style={[act.endBtn, { backgroundColor: T.bad }]} onPress={onEnd} activeOpacity={0.85}>
          <MaterialIcons name="stop" size={20} color="#fff" />
          <Text style={act.endTxt}>End Drive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const banner = StyleSheet.create({
  wrap:     { width: '100%', borderRadius: BorderRadius.md, overflow: 'hidden', position: 'relative' },
  gif:      { width: GIF_W - Spacing.containerMargin * 2, height: GIF_H },
  livePill: { position: 'absolute', top: 10, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
});
const act = StyleSheet.create({
  hero:     { borderRadius: BorderRadius.md, paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.lg },
  stats:    { flexDirection: 'row', width: '100%', paddingHorizontal: Spacing.lg },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statV:    { fontSize: 19, fontWeight: '800', letterSpacing: -0.8 },
  statL:    { fontSize: 11, fontWeight: '500' },
  sep:      { width: 1, height: 28, alignSelf: 'center' },
  endWrap:  { position: 'absolute', bottom: 90, left: Spacing.containerMargin, right: Spacing.containerMargin },
  endBtn:   { borderRadius: BorderRadius.lg, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  endTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
function Summary({ session, onDone }: {
  session: { score: number; rating: string; durationSec: number; events: DriveEvent[] };
  onDone: () => void;
}) {
  const T = useTheme();
  const c = col(session.score, T);
  const counts = session.events.reduce((acc, e) => {
    acc[e.label] = (acc[e.label] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={[g.root, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={[g.scroll, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>

        <Text style={[sum.hdg, { color: T.text }]}>Drive complete</Text>

        <View style={[sum.ringCard, { backgroundColor: T.card }]}>
          <Ring score={session.score} T={T} />
          <Text style={[sum.rating, { color: c }]}>{session.rating}</Text>
        </View>

        <View style={[sum.statsRow, { backgroundColor: T.card }]}>
          {[
            { v: fmt(session.durationSec), l: 'Duration' },
            { v: `${session.events.length}`, l: 'Events' },
            { v: `${100 - session.score}`, l: 'Pts lost', c: T.bad },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <View style={sum.stat}>
                <Text style={[sum.statV, { color: (item as any).c ?? T.text }]}>{item.v}</Text>
                <Text style={[sum.statL, { color: T.textMuted }]}>{item.l}</Text>
              </View>
              {i < arr.length - 1 && <View style={[sum.div, { backgroundColor: T.sep }]} />}
            </React.Fragment>
          ))}
        </View>

        {Object.keys(counts).length > 0 && (
          <View style={[g.card, { backgroundColor: T.card, width: '100%' }]}>
            <Text style={[g.cardLbl, { color: T.textMuted }]}>EVENT BREAKDOWN</Text>
            {Object.entries(counts).map(([label, count], i, arr) => (
              <View key={label}
                style={[sum.bRow, i < arr.length - 1 && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
                <Text style={[sum.bLbl, { color: T.text }]}>{label}</Text>
                <Text style={[sum.bCnt, { color: T.accent }]}>×{count}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[sum.done, { backgroundColor: T.accent }]} onPress={onDone} activeOpacity={0.85}>
          <Text style={[sum.doneTxt, { color: T.accentText }]}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const sum = StyleSheet.create({
  hdg:      { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: Spacing.sm },
  ringCard: { borderRadius: BorderRadius.xl, paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm, width: '100%', marginBottom: Spacing.md },
  rating:   { fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', width: '100%', borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  stat:     { flex: 1, alignItems: 'center', gap: 3 },
  statV:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statL:    { fontSize: 11, fontWeight: '500' },
  div:      { width: 1, height: 28, alignSelf: 'center' },
  bRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  bLbl:     { fontSize: 14 },
  bCnt:     { fontSize: 15, fontWeight: '800' },
  done:     { width: '100%', borderRadius: BorderRadius.lg, paddingVertical: 17, alignItems: 'center', marginTop: Spacing.md },
  doneTxt:  { fontSize: 16, fontWeight: '700' },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DriveScreen() {
  const { state, startDrive, endDrive, resetToIdle } = useDriveSession();
  if (state.status === 'idle')     return <Idle onStart={startDrive} />;
  if (state.status === 'finished') return <Summary session={state.session} onDone={resetToIdle} />;
  return <Active score={state.score} durationSec={state.durationSec}
    events={state.events} sensors={state.sensors} onEnd={endDrive} />;
}

const g = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { padding: Spacing.containerMargin, gap: Spacing.md },
  card:    { borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
  cardLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  hr:      { height: 1, marginVertical: 4 },
});
