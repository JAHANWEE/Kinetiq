import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/Colors';

function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
function fmtDate(ts: number) {
  const d = new Date(ts), now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString())  return `Today · ${time}`;
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`;
}
function scoreGrade(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 80) return 'Good';
  if (s >= 65) return 'Fair';
  return 'Poor';
}
function scoreCol(s: number, T: ThemeColors) {
  return s >= 80 ? T.accent : s >= 65 ? T.warn : T.bad;
}

export default function HistoryScreen() {
  const T = useTheme();
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  useEffect(() => driveStore.subscribe(() => setSessions(driveStore.getSessions())), []);
  const stats = driveStore.getStats();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[s.title, { color: T.text }]}>History</Text>

        {/* Stats strip */}
        <View style={[s.strip, { backgroundColor: T.card }]}>
          {[
            { v: `${sessions.length}`,    l: 'Total' },
            { v: stats.avgScore ? `${stats.avgScore}` : '—', l: 'Avg score',
              c: stats.avgScore ? scoreCol(stats.avgScore, T) : T.textSub },
            { v: `${sessions.reduce((n, ss) => n + ss.events.length, 0)}`, l: 'Events' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <View style={s.stripItem}>
                <Text style={[s.stripV, { color: (item as any).c ?? T.text }]}>{item.v}</Text>
                <Text style={[s.stripL, { color: T.textMuted }]}>{item.l}</Text>
              </View>
              {i < arr.length - 1 && <View style={[s.div, { backgroundColor: T.sep }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* List */}
        {sessions.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="history" size={30} color={T.textMuted} />
            <Text style={[s.emptyTxt, { color: T.textMuted }]}>No drives recorded yet</Text>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: T.card }]}>
            {sessions.map((ss, i) => {
              const c = scoreCol(ss.score, T);
              return (
                <View key={ss.id}
                  style={[s.row, i < sessions.length - 1 && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
                  <View style={[s.badge, { backgroundColor: c + '18' }]}>
                    <Text style={[s.badgeNum, { color: c }]}>{ss.score}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={[s.date, { color: T.text }]}>{fmtDate(ss.startedAt)}</Text>
                    <Text style={[s.meta, { color: T.textMuted }]}>
                      {fmtDur(ss.durationSec)}  ·  {ss.events.length} event{ss.events.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={[s.grade, { color: c }]}>{scoreGrade(ss.score)}</Text>
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
  root:      { flex: 1 },
  scroll:    { padding: Spacing.containerMargin, paddingBottom: 110, gap: 16 },
  title:     { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, paddingTop: 4 },
  strip:     { borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  stripItem: { flex: 1, alignItems: 'center', gap: 3 },
  stripV:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  stripL:    { fontSize: 11, fontWeight: '500' },
  div:       { width: 1, height: 26 },
  card:      { borderRadius: BorderRadius.md, paddingHorizontal: 16 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  badge:     { width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeNum:  { fontSize: 16, fontWeight: '800' },
  info:      { flex: 1 },
  date:      { fontSize: 14, fontWeight: '600' },
  meta:      { fontSize: 12, marginTop: 2 },
  grade:     { fontSize: 12, fontWeight: '700' },
  empty:     { alignItems: 'center', gap: 8, paddingVertical: 56 },
  emptyTxt:  { fontSize: 14, fontWeight: '500' },
});
