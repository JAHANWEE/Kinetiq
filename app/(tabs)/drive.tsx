import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

export default function DriveScreen() {
  const [seconds, setSeconds] = useState(765);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const events = [
    { type: 'danger', icon: 'error' as const, title: 'Harsh Brake', time: '2 min ago', pts: -5 },
    { type: 'warning', icon: 'warning' as const, title: 'Sharp Turn', time: '8 min ago', pts: -3 },
    { type: 'success', icon: 'check-circle' as const, title: 'Smooth Driving', time: '12 min ago', pts: 2 },
  ];

  const getColor = (t: string) => t === 'danger' ? Colors.danger : t === 'warning' ? Colors.warning : Colors.success;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>

        {/* Score + Timer */}
        <View style={styles.heroCard}>
          <Text style={styles.heroScore}>94</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '94%' }]} />
          </View>
          <View style={styles.heroDivider} />
          <Text style={styles.timerLabel}>DURATION</Text>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
        </View>

        {/* Sensors */}
        <View style={styles.sensorRow}>
          {['ACCEL', 'GYRO', 'GPS', 'MOTION'].map((s) => (
            <View key={s} style={styles.sensorChip}>
              <View style={styles.sensorDot} />
              <Text style={styles.sensorText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Events */}
        <Text style={styles.sectionTitle}>Events</Text>
        {events.map((e, i) => (
          <View key={i} style={[styles.eventCard, i === 2 && { opacity: 0.5 }]}>
            <View style={[styles.eventDot, { backgroundColor: getColor(e.type) }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <Text style={styles.eventTime}>{e.time}</Text>
            </View>
            <Text style={[styles.eventPts, { color: getColor(e.type) }]}>
              {e.pts > 0 ? '+' : ''}{e.pts}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* End Drive */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.endBtn} activeOpacity={0.85} onPress={() => setIsActive(false)}>
          <MaterialIcons name="stop" size={20} color="#fff" />
          <Text style={styles.endBtnText}>End Drive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 120, gap: Spacing.md },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.success + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { ...Typography.labelCaps, color: Colors.success, fontSize: 10 },
  heroCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  heroScore: { fontSize: 72, fontWeight: '700', color: Colors.primary, letterSpacing: -2 },
  progressTrack: { width: '60%', height: 4, backgroundColor: Colors.outlineVariant + '30', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  heroDivider: { width: '100%', height: 1, backgroundColor: Colors.outlineVariant + '20', marginVertical: Spacing.sm },
  timerLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  timer: { fontSize: 32, fontWeight: '600', color: Colors.onSurface, letterSpacing: 1, fontVariant: ['tabular-nums'] },
  sensorRow: { flexDirection: 'row', gap: Spacing.sm },
  sensorChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.surfaceCard, paddingVertical: 10, borderRadius: BorderRadius.default, borderWidth: 1, borderColor: Colors.outlineVariant + '15' },
  sensorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  sensorText: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 0.5 },
  sectionTitle: { ...Typography.metricMd, color: Colors.onSurface, marginTop: Spacing.sm },
  eventCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.default, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant + '15' },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventContent: { flex: 1, gap: 2 },
  eventTitle: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '500' },
  eventTime: { ...Typography.caption, color: Colors.onSurfaceVariant },
  eventPts: { ...Typography.metricMd },
  bottomBar: { position: 'absolute', bottom: 90, left: Spacing.containerMargin, right: Spacing.containerMargin },
  endBtn: { backgroundColor: Colors.danger, borderRadius: BorderRadius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  endBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
