import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { driveStore, DriveSession } from '../../store/driveStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/Colors';

const W = Dimensions.get('window').width;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
function scoreGrade(s: number) {
  if (s >= 90) return 'Excellent';
  if (s >= 80) return 'Good';
  if (s >= 65) return 'Fair';
  return 'Poor';
}
function scoreCol(s: number, T: ThemeColors) {
  if (s >= 80) return T.accent;
  if (s >= 65) return T.warn;
  return T.bad;
}

// ─── Arc gauge ────────────────────────────────────────────────────────────────
const AW = W - Spacing.containerMargin * 2;
const AH = AW * 0.54;
const CX = AW / 2, CY = AH * 0.94;
const AR = AW * 0.41;
const A0 = -Math.PI * 0.82, A1 = Math.PI * 0.82;

function px(r: number, a: number) { return CX + r * Math.cos(a); }
function py(r: number, a: number) { return CY + r * Math.sin(a); }
function arc(a1: number, a2: number) {
  const lg = a2 - a1 > Math.PI ? 1 : 0;
  return `M${px(AR,a1)} ${py(AR,a1)} A${AR} ${AR} 0 ${lg} 1 ${px(AR,a2)} ${py(AR,a2)}`;
}

function Gauge({ score, T }: { score: number; T: ThemeColors }) {
  const fill = A0 + (A1 - A0) * (score / 100);
  const c = scoreCol(score, T);
  return (
    <View style={{ width: AW, height: AH }}>
      <Svg width={AW} height={AH}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c} stopOpacity="0.25" />
            <Stop offset="1" stopColor={c} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path d={arc(A0, A1)} stroke={T.sep} strokeWidth={11} strokeLinecap="round" fill="none" />
        <Path d={arc(A0, fill)} stroke="url(#g)" strokeWidth={11} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={[ga.center, { bottom: AH - CY - 10 }]}>
        <Text style={[ga.num, { color: c }]}>{score}</Text>
        <Text style={[ga.grade, { color: T.textSub }]}>{scoreGrade(score)}</Text>
      </View>
    </View>
  );
}
const ga = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  num:    { fontSize: 62, fontWeight: '800', letterSpacing: -4, lineHeight: 66 },
  grade:  { fontSize: 14, fontWeight: '600', marginTop: 1, letterSpacing: 0.1 },
});

// ─── Drive row ────────────────────────────────────────────────────────────────
function DriveRow({ s, T, last }: { s: DriveSession; T: ThemeColors; last: boolean }) {
  const c = scoreCol(s.score, T);
  const d = new Date(s.startedAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const dateStr = isToday
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <View style={[dr.row, !last && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
      <View style={[dr.badge, { backgroundColor: c + '18' }]}>
        <Text style={[dr.badgeNum, { color: c }]}>{s.score}</Text>
      </View>
      <View style={dr.info}>
        <Text style={[dr.date, { color: T.text }]}>{isToday ? `Today · ${dateStr}` : dateStr}</Text>
        <Text style={[dr.meta, { color: T.textMuted }]}>
          {fmtDur(s.durationSec)}  ·  {s.events.length} event{s.events.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={[dr.grade, { color: c }]}>{scoreGrade(s.score)}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  badge:    { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeNum: { fontSize: 16, fontWeight: '800' },
  info:     { flex: 1 },
  date:     { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  meta:     { fontSize: 12, marginTop: 2 },
  grade:    { fontSize: 12, fontWeight: '700' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const T = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<DriveSession[]>(() => driveStore.getSessions());
  const [stats, setStats] = useState(() => driveStore.getStats());

  useEffect(() => driveStore.subscribe(() => {
    setSessions(driveStore.getSessions());
    setStats(driveStore.getStats());
  }), []);

  const score = sessions[0]?.score ?? 100;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greet, { color: T.textSub }]}>{greeting()}</Text>
            <Text style={[s.brand, { color: T.text }]}>Kinetiq</Text>
          </View>
          <View style={[s.avatar, { backgroundColor: T.accentSoft }]}>
            <MaterialIcons name="person" size={17} color={T.accent} />
          </View>
        </View>

        {/* Score card */}
        <View style={[s.scoreCard, { backgroundColor: T.card }]}>
          <Gauge score={score} T={T} />
          <Text style={[s.scoreSub, { color: T.textMuted }]}>
            {sessions.length === 0
              ? 'Start your first drive'
              : `Based on ${sessions.length} drive${sessions.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, { backgroundColor: T.accent }]}
          onPress={() => router.push('/(tabs)/drive')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="play-arrow" size={22} color={T.accentText} />
          <Text style={[s.ctaLbl, { color: T.accentText }]}>Start Drive</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[s.statsRow, { backgroundColor: T.card }]}>
          {[
            { v: `${stats.totalDrives}`,     l: 'Drives' },
            { v: stats.avgScore ? `${stats.avgScore}` : '—', l: 'Avg score',
              c: stats.avgScore ? scoreCol(stats.avgScore, T) : T.textSub },
            { v: `${sessions.reduce((n, ss) => n + ss.events.length, 0)}`, l: 'Events' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <View style={s.statItem}>
                <Text style={[s.statV, { color: (item as any).c ?? T.text }]}>{item.v}</Text>
                <Text style={[s.statL, { color: T.textMuted }]}>{item.l}</Text>
              </View>
              {i < arr.length - 1 && <View style={[s.div, { backgroundColor: T.sep }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Recent */}
        {sessions.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <Text style={[s.sectionTitle, { color: T.text }]}>Recent drives</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={[s.seeAll, { color: T.accent }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.listCard, { backgroundColor: T.card }]}>
              {sessions.slice(0, 4).map((ss, i) => (
                <DriveRow key={ss.id} s={ss} T={T} last={i >= Math.min(3, sessions.length - 1)} />
              ))}
            </View>
          </View>
        ) : (
          <View style={s.empty}>
            <MaterialIcons name="directions-car" size={26} color={T.textMuted} />
            <Text style={[s.emptyTxt, { color: T.textMuted }]}>No drives recorded yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { padding: Spacing.containerMargin, paddingBottom: 110, gap: 16 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  greet:      { fontSize: 12, fontWeight: '500' },
  brand:      { fontSize: 27, fontWeight: '800', letterSpacing: -1, marginTop: 1 },
  avatar:     { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scoreCard:  { borderRadius: BorderRadius.xl, paddingTop: 20, paddingBottom: 16, alignItems: 'center', gap: 6 },
  scoreSub:   { fontSize: 12, fontWeight: '500' },
  cta:        { borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  ctaLbl:     { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  statsRow:   { borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  statItem:   { flex: 1, alignItems: 'center', gap: 3 },
  statV:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  statL:      { fontSize: 11, fontWeight: '500' },
  div:        { width: 1, height: 26 },
  section:    { gap: 8 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:{ fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  seeAll:     { fontSize: 13, fontWeight: '600' },
  listCard:   { borderRadius: BorderRadius.md, paddingHorizontal: 16 },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptyTxt:   { fontSize: 14, fontWeight: '500' },
});
