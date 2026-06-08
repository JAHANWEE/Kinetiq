import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreHero({ score, sessionCount }: { score: number; sessionCount: number }) {
  const r = 72;
  const size = (r + 12) * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <View style={hero.wrapper}>
      {/* Ring */}
      <View style={hero.ring}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={Colors.border}
            strokeWidth={10}
            fill="none"
          />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={hero.ringInner}>
          <Text style={[hero.scoreNum, { color }]}>{score}</Text>
          <Text style={hero.scoreUnit}>/ 100</Text>
        </View>
      </View>

      {/* Text block */}
      <View style={hero.meta}>
        <Text style={hero.ratingLabel}>{scoreLabel(score)}</Text>
        <Text style={hero.subtitle}>
          {sessionCount === 0
            ? 'Start your first drive'
            : `Based on ${sessionCount} drive${sessionCount > 1 ? 's' : ''}`}
        </Text>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  ring: { width: 168, height: 168, justifyContent: 'center', alignItems: 'center' },
  ringInner: { position: 'absolute', alignItems: 'center', gap: 0 },
  meta: { alignItems: 'center', gap: 4 },
  scoreNum: { fontSize: 52, fontWeight: '800', letterSpacing: -3, lineHeight: 58 },
  scoreUnit: { ...Typography.caption, color: Colors.onSurfaceSecondary, marginTop: -2 },
  ratingLabel: { ...Typography.headlineMd, color: Colors.onSurface, textAlign: 'center' },
  subtitle: { ...Typography.bodySm, color: Colors.onSurfaceSecondary, textAlign: 'center' },
});

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={pill.wrap}>
      <Text style={[pill.value, color ? { color } : {}]}>{value}</Text>
      <Text style={pill.label}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 3 },
  value: { ...Typography.metricMd, color: Colors.onSurface },
  label: { ...Typography.labelSm, color: Colors.onSurfaceSecondary },
});

// ─── Drive row ────────────────────────────────────────────────────────────────
function DriveRow({ session }: { session: DriveSession }) {
  const c = scoreColor(session.score);
  const d = new Date(session.startedAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const dateStr = isToday
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View style={driveRow.wrap}>
      <View style={[driveRow.badge, { backgroundColor: c + '18' }]}>
        <Text style={[driveRow.badgeText, { color: c }]}>{session.score}</Text>
      </View>
      <View style={driveRow.info}>
        <Text style={driveRow.date}>{isToday ? 'Today' : dateStr}</Text>
        <Text style={driveRow.meta}>
          {formatDuration(session.durationSec)}  ·  {session.events.length} event{session.events.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={[driveRow.rating, { color: c }]}>{scoreLabel(session.score)}</Text>
    </View>
  );
}

const driveRow = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 12 },
  badge: { width: 44, height: 44, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  date: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  meta: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  rating: { ...Typography.labelSm, fontWeight: '600' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  const [stats, setStats] = useState(() => driveStore.getStats());

  useEffect(() => {
    return driveStore.subscribe(() => {
      setSessions(driveStore.getSessions());
      setStats(driveStore.getStats());
    });
  }, []);

  const displayScore = sessions[0]?.score ?? (stats.avgScore || 100);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.appName}>Kinetiq</Text>
          </View>
          <View style={s.avatar}>
            <MaterialIcons name="person" size={18} color={Colors.primary} />
          </View>
        </View>

        {/* Hero score */}
        <ScoreHero score={displayScore} sessionCount={sessions.length} />

        {/* CTA */}
        <TouchableOpacity
          style={s.cta}
          onPress={() => router.push('/(tabs)/drive')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="play-arrow" size={22} color={Colors.onPrimary} />
          <Text style={s.ctaText}>Start Drive</Text>
        </TouchableOpacity>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <StatPill value={stats.totalDrives} label="Drives" />
          <View style={s.stripDiv} />
          <StatPill
            value={stats.avgScore || '—'}
            label="Avg Score"
            color={stats.avgScore ? scoreColor(stats.avgScore) : undefined}
          />
          <View style={s.stripDiv} />
          <StatPill
            value={sessions.reduce((n, ss) => n + ss.events.length, 0)}
            label="Events"
          />
        </View>

        {/* Recent drives */}
        {sessions.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent drives</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {sessions.slice(0, 4).map((ss, i) => (
                <View key={ss.id}>
                  {i > 0 && <View style={s.divider} />}
                  <DriveRow session={ss} />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.empty}>
            <MaterialIcons name="directions-car" size={28} color={Colors.onSurfaceMuted} />
            <Text style={s.emptyText}>No drives yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 110, gap: Spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: Spacing.md,
  },
  greeting: { ...Typography.bodySm, color: Colors.onSurfaceSecondary },
  appName: { ...Typography.headlineLg, color: Colors.onSurface },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  cta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 17,
    marginTop: -Spacing.sm,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: Colors.onPrimary, letterSpacing: -0.2 },
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  stripDiv: { width: 1, height: 28, backgroundColor: Colors.borderStrong },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.metricSm, color: Colors.onSurface },
  seeAll: { ...Typography.bodySm, color: Colors.primary },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.border },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceMuted },
});
