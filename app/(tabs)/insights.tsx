import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

const weeklyScores = [82, 85, 79, 91, 88, 94, 92];
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const maxScore = 100;

const breakdown = [
  { label: 'Smooth Driving', pct: 72, color: Colors.success },
  { label: 'Sharp Turns', pct: 15, color: Colors.warning },
  { label: 'Hard Braking', pct: 8, color: Colors.danger },
  { label: 'Phone Use', pct: 5, color: Colors.error },
];

export default function InsightsScreen() {
  const avg = Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length);
  const circ = 2 * Math.PI * 44;
  const offset = circ - (avg / 100) * circ;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Insights</Text>

        {/* Weekly Avg */}
        <View style={styles.card}>
          <View style={styles.avgRow}>
            <View style={styles.avgRing}>
              <Svg width={100} height={100} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={50} cy={50} r={44} stroke={Colors.outlineVariant + '30'} strokeWidth={7} fill="transparent" />
                <Circle cx={50} cy={50} r={44} stroke={Colors.primary} strokeWidth={7} fill="transparent" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
              </Svg>
              <View style={styles.avgCenter}>
                <Text style={styles.avgNum}>{avg}</Text>
              </View>
            </View>
            <View style={styles.avgInfo}>
              <Text style={styles.avgLabel}>WEEKLY AVERAGE</Text>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatLabel}>Best</Text>
                <Text style={styles.avgStatVal}>94 (Sat)</Text>
              </View>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatLabel}>Worst</Text>
                <Text style={[styles.avgStatVal, { color: Colors.warning }]}>79 (Wed)</Text>
              </View>
              <View style={styles.avgStat}>
                <Text style={styles.avgStatLabel}>Drives</Text>
                <Text style={styles.avgStatVal}>14</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DAILY SCORES</Text>
          <View style={styles.chart}>
            {weeklyScores.map((s, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${s}%`, backgroundColor: s >= 90 ? Colors.success : s >= 80 ? Colors.primary : Colors.warning }]} />
                </View>
                <Text style={styles.barDay}>{days[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BEHAVIOR</Text>
          {breakdown.map((b, i) => (
            <View key={i} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownDot, { backgroundColor: b.color }]} />
                <Text style={styles.breakdownLabel}>{b.label}</Text>
              </View>
              <Text style={[styles.breakdownPct, { color: b.color }]}>{b.pct}%</Text>
            </View>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <MaterialIcons name="lightbulb-outline" size={20} color={Colors.primary} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tip</Text>
            <Text style={styles.tipText}>Reduce speed before turns on your Wednesday commute — that's where most sharp turns happen.</Text>
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
  avgRing: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  avgCenter: { position: 'absolute', alignItems: 'center' },
  avgNum: { fontSize: 26, fontWeight: '700', color: Colors.onSurface },
  avgInfo: { flex: 1, gap: Spacing.sm },
  avgLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  avgStat: { flexDirection: 'row', justifyContent: 'space-between' },
  avgStatLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  avgStatVal: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '600' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 100, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.outlineVariant + '15', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  breakdownPct: { ...Typography.bodySm, fontWeight: '700' },
  tipCard: { backgroundColor: Colors.primaryContainer + '40', borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '20' },
  tipContent: { flex: 1, gap: 4 },
  tipTitle: { ...Typography.bodySm, color: Colors.primary, fontWeight: '600' },
  tipText: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
});
