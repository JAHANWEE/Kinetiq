import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession, DriveEvent } from '../../store/driveStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/Colors';

const CHART_H = 108;

function scoreCol(s: number, T: ThemeColors) {
  return s >= 80 ? T.accent : s >= 65 ? T.warn : T.bad;
}

const EVT_META: Record<DriveEvent['type'], string> = {
  harshBrake: 'Harsh Brake', harshAccel: 'Harsh Accel',
  sharpTurn: 'Sharp Turn', aggressiveSteering: 'Aggressive Steer',
  phoneHandling: 'Phone Handling',
};
function evtColor(type: DriveEvent['type'], T: ThemeColors) {
  return type === 'phoneHandling' || type === 'harshBrake' ? T.bad : T.warn;
}

function buildBreakdown(sessions: DriveSession[], T: ThemeColors) {
  const counts: Partial<Record<DriveEvent['type'], number>> = {};
  sessions.forEach(s => s.events.forEach(e => { counts[e.type] = (counts[e.type] ?? 0) + 1; }));
  const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
  return (Object.keys(counts) as DriveEvent['type'][]).map(type => ({
    type, label: EVT_META[type], color: evtColor(type, T),
    count: counts[type]!, pct: Math.round((counts[type]! / total) * 100),
  })).sort((a, b) => b.count - a.count);
}

function getLast7(sessions: DriveSession[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const day = d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
    const hits = sessions.filter(s => new Date(s.startedAt).toDateString() === key);
    const score = hits.length ? Math.round(hits.reduce((sum, s) => sum + s.score, 0) / hits.length) : null;
    return { day, score };
  });
}

export default function InsightsScreen() {
  const T = useTheme();
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  useEffect(() => driveStore.subscribe(() => setSessions(driveStore.getSessions())), []);

  const stats = driveStore.getStats();
  const breakdown = buildBreakdown(sessions, T);
  const weekly = getLast7(sessions);
  const valid = weekly.filter(d => d.score !== null);
  const best  = valid.length ? valid.reduce((a, b) => a.score! > b.score! ? a : b) : null;
  const worst = valid.length ? valid.reduce((a, b) => a.score! < b.score! ? a : b) : null;

  const avg = stats.avgScore || 0;
  const avgC = scoreCol(avg || 100, T);
  const R = 46, circ = 2 * Math.PI * R;
  const off = circ - (avg / 100) * circ;

  const tips: string[] = [];
  if (breakdown.find(b => b.type === 'phoneHandling' && b.count > 0))
    tips.push('Phone handling costs 10 pts each time — put it away before driving.');
  if (breakdown.find(b => b.type === 'harshBrake' && b.pct > 20))
    tips.push('Increase following distance to reduce hard braking incidents.');
  if (breakdown.find(b => b.type === 'sharpTurn' && b.pct > 15))
    tips.push('Slow down before turns — that is where most sharp-turn events happen.');
  if (!tips.length && sessions.length > 0) tips.push('Solid driving. Keep up the clean habits.');
  if (!sessions.length) tips.push('Complete your first drive to unlock personalised tips.');

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: T.text }]}>Insights</Text>

        {/* Overview */}
        <View style={[s.card, { backgroundColor: T.card }]}>
          <View style={s.avgRow}>
            <View style={s.ringWrap}>
              <Svg width={104} height={104} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={52} cy={52} r={R} stroke={T.sep} strokeWidth={8} fill="none" />
                <Circle cx={52} cy={52} r={R} stroke={avgC} strokeWidth={8} fill="none"
                  strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
              </Svg>
              <View style={s.ringCenter}>
                <Text style={[s.avgNum, { color: avgC }]}>{avg || '—'}</Text>
              </View>
            </View>
            <View style={s.avgStats}>
              <Text style={[s.lbl, { color: T.textMuted }]}>ALL-TIME AVG</Text>
              <Row l="Drives"    v={`${sessions.length}`} T={T} />
              {best  && <Row l="Best"  v={`${best.score} (${best.day})`}   vc={T.ok}   T={T} />}
              {worst && worst.score !== best?.score &&
                        <Row l="Worst" v={`${worst.score} (${worst.day})`} vc={T.warn} T={T} />}
            </View>
          </View>
        </View>

        {/* 7-day chart */}
        <View style={[s.card, { backgroundColor: T.card }]}>
          <Text style={[s.lbl, { color: T.textMuted }]}>LAST 7 DAYS</Text>
          <View style={ch.wrap}>
            {weekly.map((d, i) => {
              const h = d.score ? Math.max(6, (d.score / 100) * CHART_H) : 0;
              const c = d.score ? scoreCol(d.score, T) : T.sep;
              const isToday = i === 6;
              return (
                <View key={i} style={ch.col}>
                  <View style={[ch.track, { backgroundColor: T.sep }]}>
                    {d.score !== null && <View style={[ch.bar, { height: h, backgroundColor: c }]} />}
                  </View>
                  <Text style={[ch.day, { color: isToday ? T.accent : T.textMuted }]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <View style={[s.card, { backgroundColor: T.card }]}>
            <Text style={[s.lbl, { color: T.textMuted }]}>EVENT BREAKDOWN</Text>
            {breakdown.map((b, i) => (
              <View key={b.type}>
                {i > 0 && <View style={[s.hr, { backgroundColor: T.sep }]} />}
                <View style={bk.row}>
                  <View style={[bk.dot, { backgroundColor: b.color }]} />
                  <Text style={[bk.label, { color: T.text }]}>{b.label}</Text>
                  <View style={[bk.barWrap, { backgroundColor: T.sep }]}>
                    <View style={[bk.bar, { width: `${b.pct}%` as any, backgroundColor: b.color + '60' }]} />
                  </View>
                  <Text style={[bk.pct, { color: b.color }]}>{b.pct}%</Text>
                  <Text style={[bk.cnt, { color: T.textMuted }]}>×{b.count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        <View style={[s.tip, { backgroundColor: T.accentSoft, borderColor: T.accent + '30' }]}>
          <View style={[s.tipIcon, { backgroundColor: T.accentSoft }]}>
            <MaterialIcons name="lightbulb" size={17} color={T.accent} />
          </View>
          <View style={s.tipBody}>
            <Text style={[s.tipTitle, { color: T.accent }]}>Tip</Text>
            <Text style={[s.tipTxt, { color: T.textSub }]}>{tips[0]}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ l, v, vc, T }: { l: string; v: string; vc?: string; T: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 12, color: T.textMuted }}>{l}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: vc ?? T.text }}>{v}</Text>
    </View>
  );
}

const ch = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingTop: 8 },
  col:   { flex: 1, alignItems: 'center', gap: 5 },
  track: { width: '100%', height: CHART_H, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar:   { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  day:   { fontSize: 10, fontWeight: '600' },
});

const bk = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  dot:    { width: 7, height: 7, borderRadius: 4 },
  label:  { width: 104, fontSize: 13 },
  barWrap:{ flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  bar:    { height: '100%', borderRadius: 3 },
  pct:    { width: 30, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  cnt:    { width: 24, fontSize: 11, textAlign: 'right' },
});

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { padding: Spacing.containerMargin, paddingBottom: 110, gap: 14 },
  title:     { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, paddingTop: 4 },
  card:      { borderRadius: BorderRadius.md, padding: Spacing.md, gap: 10 },
  lbl:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },
  hr:        { height: 1, marginVertical: 2 },
  avgRow:    { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringWrap:  { width: 104, height: 104, justifyContent: 'center', alignItems: 'center' },
  ringCenter:{ position: 'absolute', alignItems: 'center' },
  avgNum:    { fontSize: 26, fontWeight: '800', letterSpacing: -1.5 },
  avgStats:  { flex: 1, gap: 7 },
  tip:       { borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', gap: 12, borderWidth: 1 },
  tipIcon:   { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tipBody:   { flex: 1, gap: 3 },
  tipTitle:  { fontSize: 13, fontWeight: '700' },
  tipTxt:    { fontSize: 13, lineHeight: 19 },
});
