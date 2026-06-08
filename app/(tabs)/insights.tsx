import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession, DriveEvent } from '../../store/driveStore';

const EVENT_LABELS: Record<DriveEvent['type'], string> = {
  harshBrake: 'Harsh Brake',
  harshAccel: 'Harsh Accel',
  sharpTurn: 'Sharp Turn',
  aggressiveSteering: 'Aggressive Steer',
  phoneHandling: 'Phone Handling',
};

const EVENT_COLORS: Record<DriveEvent['type'], string> = {
  harshBrake: Colors.danger,
  harshAccel: Colors.warning,
  sharpTurn: Colors.warning,
  aggressiveSteering: Colors.warning,
  phoneHandling: Colors.error,
};

function getScoreColor(s: number) {
  return s >= 80 ? Colors.success : s >= 60 ? Colors.warning : Colors.danger;
}

function buildBreakdown(sessions: DriveSession[]) {
  const counts: Partial<Record<DriveEvent['type'], number>> = {};
  sessions.forEach((s) => s.events.forEach((e) => {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }));
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (Object.keys(counts) as DriveEvent['type'][]).map((type) => ({
    type,
    label: EVENT_LABELS[type],
    color: EVENT_COLORS[type],
    count: counts[type]!,
    pct: Math.round((counts[type]! / total) * 100),
  })).sort((a, b) => b.count - a.count);
}

function getWeeklyScores(sessions: DriveSession[]): { day: string; score: number | null }[] {
  const days: { day: string; score: number | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
    const dayStr = d.toDateString();
    const daySessions = sessions.filter((s) => new Date(s.startedAt).toDateString() === dayStr);
    if (daySessions.length === 0) {
      days.push({ day: label, score: null });
    } else {
      const avg = Math.round(daySessions.reduce((sum, s) => sum + s.score, 0) / daySessions.length);
      days.push({ day: label, score: avg });
    }
  }
  return days;
}

export default function InsightsScreen() {
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());

  useEffect(() => {
    const unsub = driveStore.subscribe(() => setSessions(driveStore.getSessions()));
    return unsub;
  }, []);

  const stats = driveStore.getStats();
  const breakdown = buildBreakdown(sessions);
  const weekly = getWeeklyScores(sessions);
  const validWeekly = weekly.filter((d) => d.score !== null);
  const bestDay = validWeekly.length ? validWeekly.reduce((a, b) => (a.score! > b.score! ? a : b)) : null;
  const worstDay = validWeekly.length ? validWeekly.reduce((a, b) => (a.score! < b.score! ? a : b)) : null;
  const maxBarScore = Math.max(...validWeekly.map((d) => d.score!), 1);

  const avg = stats.avgScore || 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (avg / 100) * circ;
  const avgColor = getScoreColor(avg);

  const tips: string[] = [];
  if (breakdown.find((b) => b.type === 'harshBrake' && b.pct > 20)) tips.push('Increase following distance to avoid sudden braking.');
  if (breakdown.find((b) => b.type === 'sharpTurn' && b.pct > 15)) tips.push('Slow down before turns and corners.');
  if (breakdown.find((b) => b.type === 'phoneHandling' && b.count > 0)) tips.push('Put the phone away before driving — even a glance costs 10 pts.');
  if (tips.length === 0 && sessions.length > 0) tips.push('Great driving! Keep it up and maintain your score.');
  if (sessions.length === 0) tips.push('Complete your first drive to get personalized tips.');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Insights</Text>

        {/* Average ring */}
        <View style={styles.card}>
          <View style={styles.avgRow}>
            <View style={styles.ringWrap}>
              <Svg width={100} height={100} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={50} cy={50} r={r} stroke={Colors.outlineVariant + '30'} strokeWidth={7} fill="transparent" />
                <Circle cx={50} cy={50} r={r} stroke={avgColor} strokeWidth={7} fill="transparent"
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.avgNum, { color: avgColor }]}>{avg || '—'}</Text>
              </View>
            </View>
            <View style={styles.avgInfo}>
              <Text style={styles.cardTitle}>ALL-TIME AVERAGE</Text>
              <View style={styles.avgStat}><Text style={styles.avgStatLabel}>Total drives</Text><Text style={styles.avgStatVal}>{sessions.length}</Text></View>
              {bestDay && <View style={styles.avgStat}><Text style={styles.avgStatLabel}>Best day</Text><Text style={[styles.avgStatVal, { color: Colors.success }]}>{bestDay.score} ({bestDay.day})</Text></View>}
              {worstDay && worstDay !== bestDay && <View style={styles.avgStat}><Text style={styles.avgStatLabel}>Worst day</Text><Text style={[styles.avgStatVal, { color: Colors.warning }]}>{worstDay.score} ({worstDay.day})</Text></View>}
            </View>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LAST 7 DAYS</Text>
          <View style={styles.chart}>
            {weekly.map((d, i) => {
              const hasScore = d.score !== null;
              const fillPct = hasScore ? (d.score! / 100) * 100 : 0;
              const barColor = hasScore ? getScoreColor(d.score!) : Colors.outlineVariant + '30';
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    {hasScore && (
                      <View style={[styles.barFill, { height: `${fillPct}%` as any, backgroundColor: barColor }]} />
                    )}
                  </View>
                  <Text style={styles.barDay}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Event breakdown */}
        {breakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>EVENT BREAKDOWN</Text>
            {breakdown.map((b) => (
              <View key={b.type} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.dot, { backgroundColor: b.color }]} />
                  <Text style={styles.breakdownLabel}>{b.label}</Text>
                </View>
                <Text style={styles.breakdownCount}>×{b.count}</Text>
                <Text style={[styles.breakdownPct, { color: b.color }]}>{b.pct}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipCard}>
          <MaterialIcons name="lightbulb-outline" size={20} color={Colors.primary} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tip</Text>
            <Text style={styles.tipText}>{tips[0]}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.md },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.sm },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  cardTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  ringWrap: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  avgNum: { fontSize: 26, fontWeight: '700', letterSpacing: -1 },
  avgInfo: { flex: 1, gap: Spacing.sm },
  avgStat: { flexDirection: 'row', justifyContent: 'space-between' },
  avgStatLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  avgStatVal: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '600' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 90, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 5 },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.outlineVariant + '15', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  breakdownLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  breakdownCount: { ...Typography.bodySm, color: Colors.onSurfaceVariant, width: 30, textAlign: 'right' },
  breakdownPct: { ...Typography.bodySm, fontWeight: '700', width: 36, textAlign: 'right' },
  tipCard: { backgroundColor: Colors.primaryContainer + '40', borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '20' },
  tipContent: { flex: 1, gap: 4 },
  tipTitle: { ...Typography.bodySm, color: Colors.primary, fontWeight: '600' },
  tipText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 20 },
});
