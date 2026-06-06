import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

const drives = [
  { route: 'Home → Office', score: 92, time: '42 min', dist: '18.4 km', date: 'Today, 8:30 AM' },
  { route: 'Office → Gym', score: 88, time: '15 min', dist: '6.2 km', date: 'Today, 5:45 PM' },
  { route: 'Home → Mall', score: 95, time: '28 min', dist: '12.1 km', date: 'Yesterday' },
  { route: 'Mall → Home', score: 79, time: '35 min', dist: '13.8 km', date: 'Yesterday' },
  { route: 'Morning Commute', score: 91, time: '55 min', dist: '42.3 km', date: 'Oct 28' },
  { route: 'Evening Drive', score: 87, time: '38 min', dist: '15.6 km', date: 'Oct 27' },
];

const getScoreColor = (s: number) => s >= 90 ? Colors.success : s >= 80 ? Colors.primary : Colors.warning;

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>History</Text>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>89</Text>
            <Text style={styles.summaryLabel}>Avg Score</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>284</Text>
            <Text style={styles.summaryLabel}>Km Total</Text>
          </View>
        </View>

        {/* Drive List */}
        <View style={styles.list}>
          {drives.map((d, i) => (
            <TouchableOpacity key={i} style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardLeft}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(d.score) + '18' }]}>
                  <Text style={[styles.scoreBadgeText, { color: getScoreColor(d.score) }]}>{d.score}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardRoute}>{d.route}</Text>
                  <Text style={styles.cardMeta}>{d.date}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardDist}>{d.dist}</Text>
                <Text style={styles.cardTime}>{d.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.sm },
  summaryCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { ...Typography.metricMd, color: Colors.onSurface },
  summaryLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.outlineVariant + '40' },
  list: { gap: Spacing.gutter },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.default, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.outlineVariant + '15' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  scoreBadge: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scoreBadgeText: { fontSize: 15, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 2 },
  cardRoute: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '500' },
  cardMeta: { ...Typography.caption, color: Colors.onSurfaceVariant },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardDist: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '600' },
  cardTime: { ...Typography.caption, color: Colors.onSurfaceVariant },
});
