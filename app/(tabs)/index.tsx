import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getScoreColor(s: number) {
  return s >= 80 ? Colors.primary : s >= 60 ? Colors.warning : Colors.danger;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  const [stats, setStats] = useState(() => driveStore.getStats());

  // Keep in sync when new sessions are saved
  useEffect(() => {
    const unsub = driveStore.subscribe(() => {
      setSessions(driveStore.getSessions());
      setStats(driveStore.getStats());
    });
    return unsub;
  }, []);

  const lastScore = sessions[0]?.score ?? null;
  const displayScore = lastScore ?? (stats.avgScore || 100);
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayScore / 100) * circ;
  const scoreColor = getScoreColor(displayScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.appName}>Kinetiq</Text>
          </View>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={20} color={Colors.primary} />
          </View>
        </View>

        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRing}>
            <Svg width={132} height={132} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={66} cy={66} r={r} stroke={Colors.outlineVariant + '25'} strokeWidth={8} fill="transparent" />
              <Circle
                cx={66} cy={66} r={r}
                stroke={scoreColor}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </Svg>
            <View style={styles.scoreCenter}>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{displayScore}</Text>
            </View>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>SAFETY SCORE</Text>
            <Text style={[styles.scoreRating, { color: scoreColor }]}>
              {displayScore >= 90 ? 'Excellent' : displayScore >= 80 ? 'Good' : displayScore >= 65 ? 'Fair' : 'Poor'}
            </Text>
            <Text style={styles.scoreDesc}>
              {sessions.length === 0 ? 'Start your first drive' : `Based on ${sessions.length} drive${sessions.length > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Start Drive */}
        <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/drive')} activeOpacity={0.85}>
          <MaterialIcons name="play-arrow" size={24} color={Colors.background} />
          <Text style={styles.startBtnText}>Start Drive</Text>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDrives}</Text>
            <Text style={styles.statLabel}>Drives</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgScore || '—'}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {sessions.reduce((sum, s) => sum + s.events.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>

        {/* Recent drives */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Drives</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {sessions.slice(0, 3).map((s) => {
              const c = getScoreColor(s.score);
              const date = new Date(s.startedAt);
              const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <View key={s.id} style={styles.driveItem}>
                  <View style={[styles.driveIconWrap, { backgroundColor: c + '18' }]}>
                    <MaterialIcons name="directions-car" size={18} color={c} />
                  </View>
                  <View style={styles.driveInfo}>
                    <Text style={styles.driveName}>{label} drive</Text>
                    <Text style={styles.driveMeta}>
                      {formatDuration(s.durationSec)} · {s.events.length} event{s.events.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: c + '18' }]}>
                    <Text style={[styles.scoreBadgeText, { color: c }]}>{s.score}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="directions-car" size={32} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No drives yet. Hit Start Drive to begin.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  greeting: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  appName: { ...Typography.headlineLg, color: Colors.onSurface },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  scoreCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  scoreRing: { width: 132, height: 132, justifyContent: 'center', alignItems: 'center' },
  scoreCenter: { position: 'absolute', alignItems: 'center' },
  scoreNum: { fontSize: 40, fontWeight: '700', letterSpacing: -1 },
  scoreInfo: { flex: 1, gap: Spacing.xs },
  scoreLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  scoreRating: { ...Typography.headlineLgMobile },
  scoreDesc: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  startBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 18 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: Colors.background },
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
  driveIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  driveInfo: { flex: 1, gap: 2 },
  driveName: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '500' },
  driveMeta: { ...Typography.caption, color: Colors.onSurfaceVariant },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  scoreBadgeText: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
