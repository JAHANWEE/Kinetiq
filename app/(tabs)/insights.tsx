import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession, DriveEvent } from '../../store/driveStore';

const { width: W } = Dimensions.get('window');
const CHART_H = 110;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 85) return Colors.primary;
  if (s >= 65) return Colors.warning;
  return Colors.danger;
}

const EVT_META: Record<DriveEvent['type'], { label: string; color: string }> = {
  harshBrake:         { label: 'Harsh Brake',        color: Colors.danger  },
  harshAccel:         { label: 'Harsh Accel',         color: Colors.warning },
  sharpTurn:          { label: 'Sharp Turn',          color: Colors.warning },
  aggressiveSteering: { label: 'Aggressive Steer',    color: Colors.warning },
  phoneHandling:      { label: 'Phone Handling',      color: Colors.error   },
};

function buildBreakdown(sessions: DriveSession[]) {
  const counts: Partial<Record<DriveEvent['type'], number>> = {};
  sessions.forEach((s) => s.events.forEach((e) => {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }));
  const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
  return (Object.keys(counts) as DriveEvent['type'][])
    .map((type) => ({
      type,
      ...EVT_META[type],
      count: counts[type]!,
      pct: Math.round((counts[type]! / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function getLast7(sessions: DriveSession[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const day = d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
    const hits = sessions.filter((s) => new Date(s.startedAt).toDateString() === key);
    const score = hits.length
      ? Math.round(hits.reduce((sum, s) => sum + s.score, 0) / hits.length)
      : null;
    return { day, score };
  });
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function WeekChart({ data }: { data: { day: string; score: number | null }[] }) {
  const max = Math.max(...data.map((d) => d.score ?? 0), 1);
  return (
    <View style={chart.wrap}>
      {data.map((d, i) => {
        const hasScore = d.score !== null;
        const h = hasScore ? Math.max(6, (d.score! / 100) * CHART_H) : 0;
        const color = hasScore ? scoreColor(d.score!) : Colors.border;
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={chart.col}>
            <View style={chart.track}>
              {hasScore && (
                <View style={[chart.bar, { height: h, backgroundColor: color }]}>
                  {isLast && (
                    <View style={chart.barGlow} />
                  )}
                </View>
              )}
            </View>
            {hasScore && (
              <Text style={[chart.score, { color }]}>{d.score}</Text>
            )}
            <Text style={[chart.day, isLast && { color: Colors.primary }]}>{d.day}</Text>
          </View>
        );
      })}
    </View>
  );
}
const chart = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  track: { width: '100%', height: CHART_H, justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, overflow: 'hidden' },
  barGlow: { ...StyleSheet.absoluteFill, backgroundColor: '#ffffff10' },
  score: { fontSize: 9, fontWeight: '700' },
  day: { ...Typography.caption, color: Colors.onSurfaceMuted, fontWeight: '600' },
});

// ─── Breakdown row ────────────────────────────────────────────────────────────
function BRow({ item }: { item: ReturnType<typeof buildBreakdown>[0] }) {
  return (
    <View style={br.wrap}>
      <View style={[br.dot, { backgroundColor: item.color }]} />
      <Text style={br.label}>{item.label}</Text>
      <View style={br.barWrap}>
        <View style={[br.bar, { width: `${item.pct}%` as any, backgroundColor: item.color + '50' }]} />
      </View>
      <Text style={[br.pct, { color: item.color }]}>{item.pct}%</Text>
      <Text style={br.count}>×{item.count}</Text>
    </View>
  );
}
const br = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { width: 108, ...Typography.bodySm, color: Colors.onSurface },
  barWrap: { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  pct: { width: 32, ...Typography.labelSm, textAlign: 'right', fontWeight: '700' },
  count: { width: 24, ...Typography.caption, color: Colors.onSurfaceSecondary, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  useEffect(() => driveStore.subscribe(() => setSessions(driveStore.getSessions())), []);

  const stats = driveStore.getStats();
  const breakdown = buildBreakdown(sessions);
  const weekly = getLast7(sessions);
  const validWeekly = weekly.filter((d) => d.score !== null);
  const best = validWeekly.length ? validWeekly.reduce((a, b) => (a.score! > b.score! ? a : b)) : null;
  const worst = validWeekly.length ? validWeekly.reduce((a, b) => (a.score! < b.score! ? a : b)) : null;

  const avg = stats.avgScore || 0;
  const avgColor = scoreColor(avg || 100);
  const r = 48, circ = 2 * Math.PI * r;
  const offset = circ - (avg / 100) * circ;

  // Tips
  const tips: string[] = [];
  if (breakdown.find((b) => b.type === 'phoneHandling' && b.count > 0))
    tips.push('Put your phone away — phone handling costs 10 pts each time.');
  if (breakdown.find((b) => b.type === 'harshBrake' && b.pct > 20))
    tips.push('Increase following distance to reduce sudden braking.');
  if (breakdown.find((b) => b.type === 'sharpTurn' && b.pct > 15))
    tips.push('Ease off before corners to avoid sharp turn flags.');
  if (!tips.length && sessions.length > 0) tips.push('Great driving! Keep your current habits.');
  if (!sessions.length) tips.push('Complete your first drive to get personalised tips here.');

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Insights</Text>

        {/* Average ring card */}
        <View style={s.card}>
          <View style={s.avgRow}>
            {/* Ring */}
            <View style={s.ringWrap}>
              <Svg width={112} height={112} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={56} cy={56} r={r} stroke={Colors.border} strokeWidth={9} fill="none" />
                <Circle cx={56} cy={56} r={r} stroke={avgColor} strokeWidth={9} fill="none"
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
              </Svg>
              <View style={s.ringCenter}>
                <Text style={[s.avgNum, { color: avgColor }]}>{avg || '—'}</Text>
              </View>
            </View>
            {/* Stats */}
            <View style={s.avgStats}>
              <Text style={s.cardLabel}>OVERVIEW</Text>
              <View style={s.statRow}>
                <Text style={s.statLabel}>Total drives</Text>
                <Text style={s.statVal}>{sessions.length}</Text>
              </View>
              {best && (
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Best</Text>
                  <Text style={[s.statVal, { color: Colors.success }]}>{best.score} ({best.day})</Text>
                </View>
              )}
              {worst && worst.score !== best?.score && (
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Worst</Text>
                  <Text style={[s.statVal, { color: Colors.warning }]}>{worst.score} ({worst.day})</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={s.card}>
          <Text style={s.cardLabel}>LAST 7 DAYS</Text>
          <WeekChart data={weekly} />
        </View>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>EVENT BREAKDOWN</Text>
            {breakdown.map((b, i) => (
              <View key={b.type}>
                {i > 0 && <View style={s.sep} />}
                <BRow item={b} />
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        <View style={s.tipCard}>
          <View style={s.tipIcon}>
            <MaterialIcons name="lightbulb" size={18} color={Colors.primary} />
          </View>
          <View style={s.tipBody}>
            <Text style={s.tipTitle}>Tip</Text>
            <Text style={s.tipText}>{tips[0]}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 110, gap: Spacing.md },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.md },

  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  cardLabel: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, marginBottom: 2 },
  sep: { height: 1, backgroundColor: Colors.border },

  avgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  ringWrap: { width: 112, height: 112, justifyContent: 'center', alignItems: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  avgNum: { fontSize: 28, fontWeight: '800', letterSpacing: -1.5 },
  avgStats: { flex: 1, gap: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  statVal: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '600' },

  tipCard: { backgroundColor: Colors.primaryDim, borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '25' },
  tipIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  tipBody: { flex: 1, gap: 3 },
  tipTitle: { ...Typography.bodySm, color: Colors.primary, fontWeight: '700' },
  tipText: { ...Typography.bodySm, color: Colors.onSurfaceSecondary, lineHeight: 20 },
});
