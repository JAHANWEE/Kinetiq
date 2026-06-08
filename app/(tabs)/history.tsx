import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today · ${time}`;
  if (isYest) return `Yesterday · ${time}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`;
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());

  useEffect(() => {
    return driveStore.subscribe(() => setSessions(driveStore.getSessions()));
  }, []);

  const stats = driveStore.getStats();

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>History</Text>

        {/* Summary strip */}
        <View style={s.strip}>
          <View style={s.stripItem}>
            <Text style={s.stripVal}>{sessions.length}</Text>
            <Text style={s.stripLabel}>Total</Text>
          </View>
          <View style={s.stripDiv} />
          <View style={s.stripItem}>
            <Text style={[s.stripVal, { color: stats.avgScore ? scoreColor(stats.avgScore) : Colors.onSurface }]}>
              {stats.avgScore || '—'}
            </Text>
            <Text style={s.stripLabel}>Avg score</Text>
          </View>
          <View style={s.stripDiv} />
          <View style={s.stripItem}>
            <Text style={s.stripVal}>
              {sessions.reduce((n, ss) => n + ss.events.length, 0)}
            </Text>
            <Text style={s.stripLabel}>Events</Text>
          </View>
        </View>

        {/* List */}
        {sessions.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="history" size={32} color={Colors.onSurfaceMuted} />
            <Text style={s.emptyText}>No drives recorded yet</Text>
          </View>
        ) : (
          <View style={s.card}>
            {sessions.map((ss, i) => {
              const c = scoreColor(ss.score);
              return (
                <View key={ss.id}>
                  {i > 0 && <View style={s.sep} />}
                  <View style={s.row}>
                    {/* Score badge */}
                    <View style={[s.badge, { backgroundColor: c + '18' }]}>
                      <Text style={[s.badgeNum, { color: c }]}>{ss.score}</Text>
                    </View>
                    {/* Info */}
                    <View style={s.info}>
                      <Text style={s.date}>{fmtDate(ss.startedAt)}</Text>
                      <Text style={s.meta}>
                        {ss.events.length} event{ss.events.length !== 1 ? 's' : ''}  ·  {fmtDur(ss.durationSec)}
                      </Text>
                    </View>
                    {/* Right */}
                    <Text style={[s.rating, { color: c }]}>{scoreLabel(ss.score)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 110, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.md },

  strip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  stripItem: { flex: 1, alignItems: 'center', gap: 3 },
  stripVal: { ...Typography.metricMd, color: Colors.onSurface },
  stripLabel: { ...Typography.labelSm, color: Colors.onSurfaceSecondary },
  stripDiv: { width: 1, height: 28, backgroundColor: Colors.borderStrong },

  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  sep: { height: 1, backgroundColor: Colors.border },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14 },
  badge: { width: 46, height: 46, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  badgeNum: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1, gap: 2 },
  date: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  meta: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  rating: { ...Typography.labelSm, fontWeight: '600' },

  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceMuted },
});
