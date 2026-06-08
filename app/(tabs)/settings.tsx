import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { settingsStore, Sensitivity } from '../../store/settingsStore';
import { driveStore } from '../../store/driveStore';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeColors } from '../../constants/Colors';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ icon, label, right, onPress, destructive, last, T }: {
  icon: MIName; label: string; right?: React.ReactNode;
  onPress?: () => void; destructive?: boolean; last?: boolean; T: ThemeColors;
}) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.6}
      style={[r.wrap, !last && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
      <View style={r.left}>
        <View style={[r.ico, { backgroundColor: destructive ? T.badSoft : T.accentSoft }]}>
          <MaterialIcons name={icon} size={16} color={destructive ? T.bad : T.accent} />
        </View>
        <Text style={[r.lbl, { color: destructive ? T.bad : T.text }]}>{label}</Text>
      </View>
      {right ?? <MaterialIcons name="chevron-right" size={16} color={T.textMuted} />}
    </Wrap>
  );
}
const r = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  ico:   { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  lbl:   { fontSize: 15, fontWeight: '500' },
});

// ─── Bottom sheet ─────────────────────────────────────────────────────────────
function Sheet({ visible, onClose, T, children }: {
  visible: boolean; onClose: () => void; T: ThemeColors; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000060' }} activeOpacity={1} onPress={onClose} />
      <View style={[sh.sheet, { backgroundColor: T.overlay }]}>{children}</View>
    </Modal>
  );
}
const sh = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 36, gap: 12 },
});

// ─── Sensitivity sheet ────────────────────────────────────────────────────────
function SensSheet({ visible, current, onSelect, onClose, T }: {
  visible: boolean; current: Sensitivity; onSelect: (v: Sensitivity) => void; onClose: () => void; T: ThemeColors;
}) {
  const opts: { value: Sensitivity; label: string; desc: string }[] = [
    { value: 'low',    label: 'Low',    desc: 'More forgiving — fewer events flagged' },
    { value: 'medium', label: 'Medium', desc: 'Balanced detection (default)' },
    { value: 'high',   label: 'High',   desc: 'Strict — flags smaller manoeuvres' },
  ];
  return (
    <Sheet visible={visible} onClose={onClose} T={T}>
      <Text style={[sns.title, { color: T.text }]}>Detection Sensitivity</Text>
      <Text style={[sns.sub, { color: T.textSub }]}>Controls how aggressively sensors flag driving events.</Text>
      {opts.map((o, i) => (
        <TouchableOpacity key={o.value}
          style={[sns.opt, i < opts.length - 1 && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}
          onPress={() => { onSelect(o.value); onClose(); }} activeOpacity={0.65}>
          <View>
            <Text style={[sns.optL, { color: T.text }]}>{o.label}</Text>
            <Text style={[sns.optD, { color: T.textMuted }]}>{o.desc}</Text>
          </View>
          {current === o.value
            ? <View style={[sns.check, { backgroundColor: T.accent }]}><MaterialIcons name="check" size={14} color={T.accentText} /></View>
            : <View style={[sns.checkEmpty, { borderColor: T.sepStrong }]} />}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[sns.cancel, { backgroundColor: T.cardAlt }]} onPress={onClose} activeOpacity={0.6}>
        <Text style={[sns.cancelTxt, { color: T.textSub }]}>Cancel</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
const sns = StyleSheet.create({
  title:      { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub:        { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  opt:        { paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optL:       { fontSize: 15, fontWeight: '600' },
  optD:       { fontSize: 12, marginTop: 1 },
  check:      { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  checkEmpty: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  cancel:     { paddingVertical: 14, alignItems: 'center', borderRadius: BorderRadius.default, marginTop: 4 },
  cancelTxt:  { fontSize: 15, fontWeight: '600' },
});

// ─── About sheet ──────────────────────────────────────────────────────────────
function AboutSheet({ visible, onClose, T }: { visible: boolean; onClose: () => void; T: ThemeColors }) {
  const rows = [
    { name: 'Harsh Brake / Accel', trigger: '> 1.8 g × sensitivity',     pts: '−5' },
    { name: 'Sharp Turn (gyro Z)', trigger: '> 1.2 rad/s × multiplier',   pts: '−3' },
    { name: 'Aggressive Steering', trigger: '> 2.0 rad/s × multiplier',   pts: '−3' },
    { name: 'Phone Handling',      trigger: 'accel > 2.5 + gyro > 1.5',   pts: '−10' },
  ];
  return (
    <Sheet visible={visible} onClose={onClose} T={T}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[ab.icon, { backgroundColor: T.accentSoft }]}>
          <MaterialIcons name="speed" size={20} color={T.accent} />
        </View>
        <View>
          <Text style={[ab.name, { color: T.text }]}>Kinetiq</Text>
          <Text style={[ab.ver, { color: T.textMuted }]}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>
      <Text style={[ab.sec, { color: T.textMuted }]}>DETECTION THRESHOLDS</Text>
      {rows.map((row, i) => (
        <View key={row.name}
          style={[ab.tr, i < rows.length - 1 && { borderBottomColor: T.sep, borderBottomWidth: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ab.trName, { color: T.text }]}>{row.name}</Text>
            <Text style={[ab.trTrig, { color: T.textMuted }]}>{row.trigger}</Text>
          </View>
          <Text style={[ab.trPts, { color: T.bad }]}>{row.pts}</Text>
        </View>
      ))}
      <Text style={[ab.note, { color: T.textMuted }]}>
        Sensitivity: Low ×1.4 · Medium ×1.0 · High ×0.7{'\n'}2 s cooldown per event type.
      </Text>
      <TouchableOpacity style={[sns.cancel, { backgroundColor: T.cardAlt }]} onPress={onClose} activeOpacity={0.6}>
        <Text style={[sns.cancelTxt, { color: T.textSub }]}>Close</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
const ab = StyleSheet.create({
  icon:   { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  name:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  ver:    { fontSize: 12 },
  sec:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  tr:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 8 },
  trName: { fontSize: 13, fontWeight: '500' },
  trTrig: { fontSize: 11, marginTop: 1 },
  trPts:  { fontSize: 15, fontWeight: '800', paddingLeft: 8 },
  note:   { fontSize: 12, lineHeight: 18 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const T = useTheme();
  const [settings, setSettings] = useState(() => settingsStore.get());
  const [stats, setStats] = useState(() => driveStore.getStats());
  const [showSens, setShowSens] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const a = settingsStore.subscribe(() => setSettings(settingsStore.get()));
    const b = driveStore.subscribe(() => setStats(driveStore.getStats()));
    return () => { a(); b(); };
  }, []);

  const set = useCallback(<K extends keyof typeof settings>(k: K, v: typeof settings[K]) => {
    settingsStore.set(k, v);
  }, []);

  const confirmClear = () => Alert.alert('Clear all data',
    'Permanently delete all recorded drives? This cannot be undone.',
    [{ text: 'Cancel', style: 'cancel' },
     { text: 'Clear', style: 'destructive', onPress: () => driveStore.clearAll() }]);

  const confirmReset = () => Alert.alert('Reset settings', 'Restore all settings to defaults?',
    [{ text: 'Cancel', style: 'cancel' },
     { text: 'Reset', style: 'destructive', onPress: () => settingsStore.reset() }]);

  const openSupport = () =>
    Linking.openURL('mailto:support@kinetiq.app?subject=Kinetiq%20Support')
      .catch(() => Alert.alert('Support', 'support@kinetiq.app'));

  const sensLabel: Record<Sensitivity, string> = { low: 'Low', medium: 'Medium', high: 'High' };
  const avgC = stats.avgScore >= 80 ? T.ok : stats.avgScore >= 65 ? T.warn : T.bad;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: T.text }]}>Settings</Text>

        {/* Stats */}
        <View style={[s.stats, { backgroundColor: T.card }]}>
          {[
            { v: `${stats.totalDrives}`, l: 'Drives' },
            { v: stats.avgScore ? `${stats.avgScore}` : '—', l: 'Avg score', c: stats.avgScore ? avgC : T.textSub },
            { v: `${driveStore.getSessions().reduce((n, ss) => n + ss.events.length, 0)}`, l: 'Events' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.l}>
              <View style={s.statsItem}>
                <Text style={[s.statsV, { color: (item as any).c ?? T.text }]}>{item.v}</Text>
                <Text style={[s.statsL, { color: T.textMuted }]}>{item.l}</Text>
              </View>
              {i < arr.length - 1 && <View style={[s.div, { backgroundColor: T.sep }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Driving */}
        <View style={s.group}>
          <Text style={[s.groupLbl, { color: T.textMuted }]}>DRIVING</Text>
          <View style={[s.card, { backgroundColor: T.card }]}>
            <Row icon="tune" label="Detection Sensitivity" T={T} onPress={() => setShowSens(true)}
              right={<View style={s.valRow}><Text style={[s.val, { color: T.textSub }]}>{sensLabel[settings.sensitivity]}</Text><MaterialIcons name="chevron-right" size={14} color={T.textMuted} /></View>}
            />
            <Row icon="notifications-active" label="Real-time Alerts" T={T}
              right={<Switch value={settings.realtimeAlerts} onValueChange={v => set('realtimeAlerts', v)}
                trackColor={{ false: T.sep, true: T.accent + '70' }}
                thumbColor={settings.realtimeAlerts ? T.accent : T.textMuted}
                ios_backgroundColor={T.sep} />}
            />
            <Row icon="vibration" label="Haptic Feedback" last T={T}
              right={<Switch value={settings.hapticFeedback} onValueChange={v => set('hapticFeedback', v)}
                trackColor={{ false: T.sep, true: T.accent + '70' }}
                thumbColor={settings.hapticFeedback ? T.accent : T.textMuted}
                ios_backgroundColor={T.sep} />}
            />
          </View>
        </View>

        {/* Data */}
        <View style={s.group}>
          <Text style={[s.groupLbl, { color: T.textMuted }]}>DATA</Text>
          <View style={[s.card, { backgroundColor: T.card }]}>
            <Row icon="delete-forever" label="Clear All Drive Data" destructive T={T} onPress={confirmClear}
              right={<MaterialIcons name="chevron-right" size={16} color={T.bad} />}
            />
            <Row icon="settings-backup-restore" label="Reset to Defaults" last T={T} onPress={confirmReset} />
          </View>
        </View>

        {/* App */}
        <View style={s.group}>
          <Text style={[s.groupLbl, { color: T.textMuted }]}>APP</Text>
          <View style={[s.card, { backgroundColor: T.card }]}>
            <Row icon="help-outline" label="Help & Support" T={T} onPress={openSupport} />
            <Row icon="info-outline" label="About & Thresholds" last T={T} onPress={() => setShowAbout(true)} />
          </View>
        </View>

        <Text style={[s.ver, { color: T.textMuted }]}>
          Kinetiq v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <SensSheet visible={showSens} current={settings.sensitivity}
        onSelect={v => set('sensitivity', v)} onClose={() => setShowSens(false)} T={T} />
      <AboutSheet visible={showAbout} onClose={() => setShowAbout(false)} T={T} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { padding: Spacing.containerMargin, paddingBottom: 110, gap: 16 },
  title:     { fontSize: 27, fontWeight: '800', letterSpacing: -0.8, paddingTop: 4 },
  stats:     { borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  statsItem: { flex: 1, alignItems: 'center', gap: 3 },
  statsV:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  statsL:    { fontSize: 11, fontWeight: '500' },
  div:       { width: 1, height: 26 },
  group:     { gap: 6 },
  groupLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingLeft: 4 },
  card:      { borderRadius: BorderRadius.md, overflow: 'hidden' },
  valRow:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  val:       { fontSize: 13, fontWeight: '500' },
  ver:       { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
