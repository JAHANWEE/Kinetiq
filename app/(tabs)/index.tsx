import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const score = 92;
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Alex</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        {/* Score Hero */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreTop}>
            <View style={styles.scoreRing}>
              <Svg width={132} height={132} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={66} cy={66} r={58} stroke={Colors.outlineVariant} strokeWidth={8} fill="transparent" />
                <Circle
                  cx={66} cy={66} r={58}
                  stroke={Colors.primary}
                  strokeWidth={8}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.scoreCenter}>
                <Text style={styles.scoreNum}>{score}</Text>
              </View>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>SAFETY SCORE</Text>
              <Text style={styles.scoreRating}>Excellent</Text>
              <Text style={styles.scoreDesc}>Top 16% of drivers this week</Text>
              <View style={styles.trendRow}>
                <MaterialIcons name="trending-up" size={16} color={Colors.success} />
                <Text style={styles.trendText}>+4 from last week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start Drive */}
        <TouchableOpacity style={styles.startBtn} activeOpacity={0.85}>
          <View style={styles.startBtnInner}>
            <MaterialIcons name="play-arrow" size={26} color={Colors.background} />
            <Text style={styles.startBtnText}>Start Drive</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>124</Text>
            <Text style={styles.statLabel}>Drives</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>88</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1.4k</Text>
            <Text style={styles.statLabel}>Km</Text>
          </View>
        </View>

        {/* Recent Drives */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Drives</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {[
            { route: 'Home → Office', score: 87, time: '42 min', date: 'Today' },
            { route: 'Grocery Run', score: 91, time: '15 min', date: 'Yesterday' },
          ].map((drive, i) => (
            <TouchableOpacity key={i} style={styles.driveItem} activeOpacity={0.7}>
              <View style={styles.driveIcon}>
                <MaterialIcons name="directions-car" size={20} color={Colors.primary} />
              </View>
              <View style={styles.driveContent}>
                <Text style={styles.driveRoute}>{drive.route}</Text>
                <Text style={styles.driveMeta}>{drive.date} · {drive.time}</Text>
              </View>
              <View style={styles.driveScore}>
                <Text style={styles.driveScoreText}>{drive.score}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  greeting: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  name: { ...Typography.headlineLg, color: Colors.onSurface },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...Typography.metricMd, color: Colors.primary },
  scoreCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  scoreTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  scoreRing: { width: 132, height: 132, justifyContent: 'center', alignItems: 'center' },
  scoreCenter: { position: 'absolute', alignItems: 'center' },
  scoreNum: { fontSize: 40, fontWeight: '700', color: Colors.onSurface, letterSpacing: -1 },
  scoreInfo: { flex: 1, gap: Spacing.xs },
  scoreLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  scoreRating: { ...Typography.headlineLgMobile, color: Colors.primary },
  scoreDesc: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  trendText: { ...Typography.caption, color: Colors.success },
  startBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  startBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 18 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: Colors.background, letterSpacing: -0.2 },
  statsRow: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...Typography.metricMd, color: Colors.onSurface },
  statLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.outlineVariant + '40' },
  section: { gap: Spacing.gutter },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.metricMd, color: Colors.onSurface },
  seeAll: { ...Typography.bodySm, color: Colors.primary },
  driveItem: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.default, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant + '15' },
  driveIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  driveContent: { flex: 1, gap: 2 },
  driveRoute: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '500' },
  driveMeta: { ...Typography.caption, color: Colors.onSurfaceVariant },
  driveScore: { backgroundColor: Colors.primaryContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  driveScoreText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
