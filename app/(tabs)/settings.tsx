import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Modal, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { settingsStore, Sensitivity } from '../../store/settingsStore';
import { driveStore } from '../../store/driveStore';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({
  icon, label, last = false, right, onPress, destructive = false,
}: {
  icon: MIName; label: string; last?: boolean;
  right?: React.ReactNode; onPress?: () => void; destructive?: boolean;
}) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.6} style={[row.wrap, !last && row.border]}>
      <View style={row.left}>
        <View style={[row.iconBox, { backgroundColor: destructive ? Colors.dangerDim : Colors.primaryDim }]}>
          <MaterialIcons name={icon} size={17} color={destructive ? Colors.danger : Colors.primary} />
        </View>
        <Text style={[row.label, destructive && { color: Colors.danger }]}>{label}</Text>
      </View>
      {right ?? <MaterialIcons name="chevron-right" size={17} color={Colors.onSurfaceMuted} />}
    </Wrap>
  );
}
const row = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label: { ...Typography.bodyMd, color: Colors.onSurface },
});

// ─── Sheet backdrop ───────────────────────────────────────────────────────────
function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sh.back} activeOpacity={1} onPress={onClose} />
      <View style={sh.sheet}>{children}</View>
    </Modal>
  );
}
const sh = StyleSheet.create({
  back: { flex: 1, backgroundColor: '#00000070' },
  sheet: { backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm },
});

// ─── Sensitivity sheet ────────────────────────────────────────────────────────
function SensitivitySheet({ visible, current, onSelect, onClose }: {
  visible: boolean; current: Sensitivity;
  onSelect: (v: Sensitivity) => void; onClose: () => void;
}) {
  const opts: { value: Sensitivity; label: string; desc: string }[] = [
    { value: 'low',    label: 'Low',    desc: 'More forgiving — fewer events flagged' },
    { value: 'medium', label: 'Medium', desc: 'Balanced detection (default)' },
    { value: 'high',   label: 'High',   desc: 'Strict — flags smaller manoeuvres' },
  ];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={ss.title}>Detection Sensitivity</Text>
      <Text style={ss.sub}>Controls how aggressively sensors flag driving events.</Text>
      {opts.map((o, i) => (
        <TouchableOpacity
          key={o.value}
          style={[ss.opt, i < opts.length - 1 && ss.optBorder]}
          onPress={() => { onSelect(o.value); onClose(); }}
          activeOpacity={0.65}
        >
          <View style={ss.optLeft}>
            <Text style={ss.optLabel}>{o.label}</Text>
            <Text style={ss.optDesc}>{o.desc}</Text>
          </View>
          {current === o.value
            ? <View style={ss.check}><MaterialIcons name="check" size={15} color={Colors.onPrimary} /></View>
            : <View style={ss.checkEmpty} />}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={ss.cancel} onPress={onClose} activeOpacity={0.6}>
        <Text style={ss.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
const ss = StyleSheet.create({
  title: { ...Typography.headlineMd, color: Colors.onSurface },
  sub: { ...Typography.bodySm, color: Colors.onSurfaceSecondary, marginBottom: Spacing.sm },
  opt: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  optLeft: { gap: 2 },
  optLabel: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  optDesc: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkEmpty: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.borderStrong },
  cancel: { marginTop: Spacing.sm, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.default },
  cancelText: { ...Typography.bodyMd, color: Colors.onSurfaceSecondary },
});

// ─── About sheet ──────────────────────────────────────────────────────────────
function AboutSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const rows = [
    { name: 'Harsh Brake / Accel', trigger: '> 1.8 g × sensitivity', pts: '−5' },
    { name: 'Sharp Turn (Z axis)', trigger: '> 1.2 rad/s × mult',     pts: '−3' },
    { name: 'Aggressive Steering', trigger: '> 2.0 rad/s × mult',     pts: '−3' },
    { name: 'Phone Handling',      trigger: 'accel > 2.5 + gyro > 1.5', pts: '−10' },
  ];
  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* App identity */}
      <View style={ab.head}>
        <View style={ab.icon}><MaterialIcons name="speed" size={22} color={Colors.primary} /></View>
        <View>
          <Text style={ab.appName}>Kinetiq</Text>
          <Text style={ab.version}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>
      {/* Thresholds */}
      <Text style={ab.sectionLabel}>DETECTION THRESHOLDS</Text>
      {rows.map((r, i) => (
        <View key={r.name} style={[ab.thRow, i < rows.length - 1 && ab.thBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={ab.thName}>{r.name}</Text>
            <Text style={ab.thTrigger}>{r.trigger}</Text>
          </View>
          <Text style={ab.thPts}>{r.pts}</Text>
        </View>
      ))}
      <Text style={ab.note}>
        Sensitivity: Low ×1.4 · Medium ×1.0 · High ×0.7{'\n'}
        2-second cooldown per event type prevents double counting.
      </Text>
      <TouchableOpacity style={ss.cancel} onPress={onClose} activeOpacity={0.6}>
        <Text style={ss.cancelText}>Close</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
const ab = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primaryDim, justifyContent: 'center', alignItems: 'center' },
  appName: { ...Typography.headlineMd, color: Colors.onSurface },
  version: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, marginBottom: 4 },
  thRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 8 },
  thBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  thName: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '500' },
  thTrigger: { ...Typography.caption, color: Colors.onSurfaceSecondary },
  thPts: { ...Typography.metricSm, color: Colors.danger },
  note: { ...Typography.caption, color: Colors.onSurfaceMuted, lineHeight: 18 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [settings, setSettings] = useState(() => settingsStore.get());
  const [stats, setStats] = useState(() => driveStore.getStats());
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const a = settingsStore.subscribe(() => setSettings(settingsStore.get()));
    const b = driveStore.subscribe(() => setStats(driveStore.getStats()));
    return () => { a(); b(); };
  }, []);

  const set = useCallback(<K extends keyof typeof settings>(k: K, v: typeof settings[K]) => {
    settingsStore.set(k, v);
  }, []);

  const confirmClear = () =>
    Alert.alert(
      'Clear all data',
      'Permanently delete all recorded drives? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => driveStore.clearAll() },
      ]
    );

  const confirmReset = () =>
    Alert.alert(
      'Reset settings',
      'Restore all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => settingsStore.reset() },
      ]
    );

  const openSupport = () =>
    Linking.openURL('mailto:support@kinetiq.app?subject=Kinetiq%20Support').catch(() =>
      Alert.alert('Support', 'support@kinetiq.app')
    );

  const senLabel: Record<Sensitivity, string> = { low: 'Low', medium: 'Medium', high: 'High' };
  const scoreColor = stats.avgScore >= 80 ? Colors.success : stats.avgScore >= 60 ? Colors.warning : Colors.danger;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        {/* Stats card */}
        <View style={s.statsCard}>
          <View style={s.statsItem}>
            <Text style={s.statsVal}>{stats.totalDrives}</Text>
            <Text style={s.statsLabel}>Drives</Text>
          </View>
          <View style={s.statsSep} />
          <View style={s.statsItem}>
            <Text style={[s.statsVal, { color: stats.avgScore ? scoreColor : Colors.onSurface }]}>
              {stats.avgScore || '—'}
            </Text>
            <Text style={s.statsLabel}>Avg score</Text>
          </View>
          <View style={s.statsSep} />
          <View style={s.statsItem}>
            <Text style={s.statsVal}>
              {driveStore.getSessions().reduce((n, ss) => n + ss.events.length, 0)}
            </Text>
            <Text style={s.statsLabel}>Events</Text>
          </View>
        </View>

        {/* Driving */}
        <View style={s.group}>
          <Text style={s.groupLabel}>DRIVING</Text>
          <View style={s.card}>
            <Row
              icon="tune"
              label="Detection Sensitivity"
              onPress={() => setShowSensitivity(true)}
              right={
                <View style={s.valueRow}>
                  <Text style={s.valueText}>{senLabel[settings.sensitivity]}</Text>
                  <MaterialIcons name="chevron-right" size={15} color={Colors.onSurfaceMuted} />
                </View>
              }
            />
            <Row
              icon="notifications-active"
              label="Real-time Alerts"
              right={
                <Switch
                  value={settings.realtimeAlerts}
                  onValueChange={(v) => set('realtimeAlerts', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={settings.realtimeAlerts ? Colors.primary : Colors.onSurfaceMuted}
                  ios_backgroundColor={Colors.border}
                />
              }
            />
            <Row
              icon="vibration"
              label="Haptic Feedback"
              last
              right={
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={(v) => set('hapticFeedback', v)}
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={settings.hapticFeedback ? Colors.primary : Colors.onSurfaceMuted}
                  ios_backgroundColor={Colors.border}
                />
              }
            />
          </View>
        </View>

        {/* Data */}
        <View style={s.group}>
          <Text style={s.groupLabel}>DATA</Text>
          <View style={s.card}>
            <Row icon="delete-forever" label="Clear All Drive Data" destructive onPress={confirmClear}
              right={<MaterialIcons name="chevron-right" size={17} color={Colors.danger} />}
            />
            <Row icon="settings-backup-restore" label="Reset to Defaults" last onPress={confirmReset} />
          </View>
        </View>

        {/* App */}
        <View style={s.group}>
          <Text style={s.groupLabel}>APP</Text>
          <View style={s.card}>
            <Row icon="help-outline" label="Help & Support" onPress={openSupport} />
            <Row icon="info-outline" label="About & Thresholds" last onPress={() => setShowAbout(true)} />
          </View>
        </View>

        <Text style={s.version}>Kinetiq v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>

      <SensitivitySheet
        visible={showSensitivity}
        current={settings.sensitivity}
        onSelect={(v) => set('sensitivity', v)}
        onClose={() => setShowSensitivity(false)}
      />
      <AboutSheet visible={showAbout} onClose={() => setShowAbout(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.containerMargin, paddingBottom: 110, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.md },

  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  statsItem: { flex: 1, alignItems: 'center', gap: 3 },
  statsVal: { ...Typography.metricMd, color: Colors.onSurface },
  statsLabel: { ...Typography.labelSm, color: Colors.onSurfaceSecondary },
  statsSep: { width: 1, height: 28, backgroundColor: Colors.borderStrong },

  group: { gap: Spacing.xs },
  groupLabel: { ...Typography.labelCaps, color: Colors.onSurfaceSecondary, paddingLeft: 4 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  valueText: { ...Typography.bodySm, color: Colors.onSurfaceSecondary },
  version: { ...Typography.caption, color: Colors.onSurfaceMuted, textAlign: 'center', marginTop: Spacing.sm },
});
