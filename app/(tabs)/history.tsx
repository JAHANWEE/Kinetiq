import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + time;
}

function getScoreColor(s: number) {
  return s >= 80 ? Colors.primary : s >= 60 ? Colors.warning : Colors.danger;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());

  useEffect(() => {
    const unsub = driveStore.subscribe(() => setSessions(driveStore.getSessions()));
    return unsub;
  }, []);

  const stats = driveStore.getStats();
  const totalKmApprox = sessions.reduce((sum, s) => sum + Math.round(s.durationSec / 60 * 0.6), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>History</Text>

        {/* Summary strip */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{sessions.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: getScoreColor(stats.avgScore) }]}>
              {stats.avgScore || '—'}
            </Text>
            <Text style={styles.summaryLabel}>Avg Score</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{totalKmApprox}</Text>
            <Text style={styles.summaryLabel}>~km</Text>
          </View>
        </View>

        {/* List */}
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="history" size={36} color={Colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No drives yet. Go to Drive to record your first session.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sessions.map((s) => {
              const c = getScoreColor(s.score);
              return (
                <View key={s.id} style={styles.card}>
                  <View style={[styles.scoreBadge, { backgroundColor: c + '18' }]}>
                    <Text style={[styles.scoreBadgeText, { color: c }]}>{s.score}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardDate}>{formatDate(s.startedAt)}</Text>
                    <Text style={styles.cardMeta}>
                      {s.events.length} event{s.events.length !== 1 ? 's' : ''} · {s.rating}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardDuration}>{formatDuration(s.durationSec)}</Text>
                    <Text style={styles.cardSub}>duration</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.sm },
  summaryCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryVal: { ...Typography.metricMd, color: Colors.onSurface },
  summaryLabel: { ...Typography.caption, color: Colors.onSurfaceVariant },
  summaryDiv: { width: 1, height: 28, backgroundColor: Colors.outlineVariant + '40' },
  list: { gap: Spacing.gutter },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.default, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant + '15' },
  scoreBadge: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scoreBadgeText: { fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 2 },
  cardDate: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '500' },
  cardMeta: { ...Typography.caption, color: Colors.onSurfaceVariant },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardDuration: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '600' },
  cardSub: { ...Typography.caption, color: Colors.onSurfaceVariant },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
