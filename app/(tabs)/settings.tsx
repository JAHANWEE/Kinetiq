import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';
import { settingsStore, Sensitivity } from '../../store/settingsStore';
import { driveStore } from '../../store/driveStore';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// ─── Small reusable row ───────────────────────────────────────────────────────
function Row({
  icon, label, last = false,
  right,
  onPress,
  destructive = false,
}: {
  icon: IconName;
  label: string;
  last?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      onPress={onPress}
      activeOpacity={0.65}
      style={[styles.row, !last && styles.rowBorder]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, destructive && { backgroundColor: Colors.danger + '18' }]}>
          <MaterialIcons name={icon} size={18} color={destructive ? Colors.danger : Colors.primary} />
        </View>
        <Text style={[styles.rowLabel, destructive && { color: Colors.danger }]}>{label}</Text>
      </View>
      {right ?? <MaterialIcons name="chevron-right" size={18} color={Colors.onSurfaceVariant} />}
    </Wrap>
  );
}

// ─── Sensitivity picker modal ─────────────────────────────────────────────────
function SensitivityModal({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: Sensitivity;
  onSelect: (v: Sensitivity) => void;
  onClose: () => void;
}) {
  const options: { value: Sensitivity; label: string; desc: string }[] = [
    { value: 'low', label: 'Low', desc: 'More forgiving — fewer events flagged' },
    { value: 'medium', label: 'Medium', desc: 'Balanced detection (default)' },
    { value: 'high', label: 'High', desc: 'Strict — flags smaller manoeuvres' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modal.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={modal.sheet}>
          <Text style={modal.title}>Detection Sensitivity</Text>
          <Text style={modal.sub}>
            Controls how aggressively the sensors detect driving events.
          </Text>
          {options.map((o, i) => (
            <TouchableOpacity
              key={o.value}
              style={[modal.option, i < options.length - 1 && modal.optionBorder]}
              onPress={() => { onSelect(o.value); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={modal.optionLeft}>
                <Text style={modal.optionLabel}>{o.label}</Text>
                <Text style={modal.optionDesc}>{o.desc}</Text>
              </View>
              {current === o.value && (
                <MaterialIcons name="check" size={18} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={modal.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceContainerHigh, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 36, gap: Spacing.sm },
  title: { ...Typography.metricMd, color: Colors.onSurface },
  sub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  option: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '20' },
  optionLeft: { gap: 2 },
  optionLabel: { ...Typography.bodyMd, color: Colors.onSurface, fontWeight: '600' },
  optionDesc: { ...Typography.caption, color: Colors.onSurfaceVariant },
  cancelBtn: { marginTop: Spacing.sm, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, borderRadius: BorderRadius.default },
  cancelText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});

// ─── About modal ──────────────────────────────────────────────────────────────
function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const thresholds = [
    ['Harsh Brake / Accel', '> 1.8 g  ×  sensitivity', '−5 pts'],
    ['Sharp Turn (gyro Z)', '> 1.2 rad/s  ×  mult', '−3 pts'],
    ['Aggressive Steering', '> 2.0 rad/s  ×  mult', '−3 pts'],
    ['Phone Handling', 'accel > 2.5  +  gyro > 1.5', '−10 pts'],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={modal.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[modal.sheet, { gap: Spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={about.iconWrap}>
              <MaterialIcons name="directions-car" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={modal.title}>Kinetiq</Text>
              <Text style={modal.sub}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </View>
          </View>

          <Text style={about.sectionLabel}>DETECTION THRESHOLDS</Text>
          {thresholds.map(([name, trigger, pts]) => (
            <View key={name} style={about.row}>
              <View style={{ flex: 1 }}>
                <Text style={about.name}>{name}</Text>
                <Text style={about.trigger}>{trigger}</Text>
              </View>
              <Text style={about.pts}>{pts}</Text>
            </View>
          ))}

          <Text style={about.note}>
            Sensitivity multipliers: Low ×1.4 · Medium ×1.0 · High ×0.7.
            A 2-second cooldown per event type prevents double-counting.
          </Text>

          <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={modal.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const about = StyleSheet.create({
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { ...Typography.labelCaps, color: Colors.onSurfaceVariant },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '15' },
  name: { ...Typography.bodySm, color: Colors.onSurface, fontWeight: '500' },
  trigger: { ...Typography.caption, color: Colors.onSurfaceVariant },
  pts: { ...Typography.bodySm, color: Colors.danger, fontWeight: '700', paddingLeft: 8 },
  note: { ...Typography.caption, color: Colors.onSurfaceVariant, lineHeight: 18 },
});

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatsCard() {
  const [stats, setStats] = useState(() => driveStore.getStats());

  useEffect(() => {
    const unsub = driveStore.subscribe(() => setStats(driveStore.getStats()));
    return unsub;
  }, []);

  return (
    <View style={statsCard.wrapper}>
      <View style={statsCard.item}>
        <Text style={statsCard.val}>{stats.totalDrives}</Text>
        <Text style={statsCard.label}>Drives recorded</Text>
      </View>
      <View style={statsCard.div} />
      <View style={statsCard.item}>
        <Text style={[statsCard.val, { color: stats.avgScore >= 80 ? Colors.success : stats.avgScore >= 60 ? Colors.warning : Colors.danger }]}>
          {stats.avgScore || '—'}
        </Text>
        <Text style={statsCard.label}>Avg score</Text>
      </View>
    </View>
  );
}

const statsCard = StyleSheet.create({
  wrapper: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant + '20' },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  val: { ...Typography.metricMd, color: Colors.onSurface },
  label: { ...Typography.caption, color: Colors.onSurfaceVariant },
  div: { width: 1, height: 28, backgroundColor: Colors.outlineVariant + '40' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [settings, setSettings] = useState(() => settingsStore.get());
  const [sensitivityModal, setSensitivityModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);

  // Sync whenever another part of the app changes settings
  useEffect(() => {
    const unsub = settingsStore.subscribe(() => setSettings(settingsStore.get()));
    return unsub;
  }, []);

  const setSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    settingsStore.set(key, value);
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear all data',
      'This will permanently delete all recorded drives and reset your stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            driveStore.clearAll();
            Alert.alert('Done', 'All drive data has been cleared.');
          },
        },
      ]
    );
  }, []);

  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Reset settings',
      'Restore all settings to their defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            settingsStore.reset();
          },
        },
      ]
    );
  }, []);

  const handleSupport = useCallback(() => {
    Linking.openURL('mailto:support@kinetiq.app?subject=Kinetiq%20Support').catch(() => {
      Alert.alert('Support', 'Reach us at support@kinetiq.app');
    });
  }, []);

  const sensitivityLabel: Record<Sensitivity, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Quick stats */}
        <StatsCard />

        {/* Driving section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRIVING</Text>
          <View style={styles.sectionCard}>
            <Row
              icon="tune"
              label="Detection Sensitivity"
              onPress={() => setSensitivityModal(true)}
              right={
                <View style={styles.valueWrap}>
                  <Text style={styles.valueText}>{sensitivityLabel[settings.sensitivity]}</Text>
                  <MaterialIcons name="chevron-right" size={16} color={Colors.onSurfaceVariant} />
                </View>
              }
            />
            <Row
              icon="notifications-active"
              label="Real-time Alerts"
              right={
                <Switch
                  value={settings.realtimeAlerts}
                  onValueChange={(v) => setSetting('realtimeAlerts', v)}
                  trackColor={{ false: Colors.outlineVariant, true: Colors.primary + '70' }}
                  thumbColor={settings.realtimeAlerts ? Colors.primary : Colors.outline}
                  ios_backgroundColor={Colors.outlineVariant}
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
                  onValueChange={(v) => setSetting('hapticFeedback', v)}
                  trackColor={{ false: Colors.outlineVariant, true: Colors.primary + '70' }}
                  thumbColor={settings.hapticFeedback ? Colors.primary : Colors.outline}
                  ios_backgroundColor={Colors.outlineVariant}
                />
              }
            />
          </View>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.sectionCard}>
            <Row
              icon="delete-forever"
              label="Clear All Drive Data"
              destructive
              onPress={handleClearData}
              right={<MaterialIcons name="chevron-right" size={18} color={Colors.danger} />}
            />
            <Row
              icon="settings-backup-restore"
              label="Reset Settings to Default"
              last
              onPress={handleResetSettings}
            />
          </View>
        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          <View style={styles.sectionCard}>
            <Row
              icon="help-outline"
              label="Help & Support"
              onPress={handleSupport}
            />
            <Row
              icon="info-outline"
              label="About & Thresholds"
              last
              onPress={() => setAboutModal(true)}
            />
          </View>
        </View>

        <Text style={styles.version}>Kinetiq v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>

      <SensitivityModal
        visible={sensitivityModal}
        current={settings.sensitivity}
        onSelect={(v) => setSetting('sensitivity', v)}
        onClose={() => setSensitivityModal(false)}
      />
      <AboutModal visible={aboutModal} onClose={() => setAboutModal(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, paddingLeft: 4 },
  sectionCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '15' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: Colors.primaryContainer + '50', justifyContent: 'center', alignItems: 'center' },
  rowLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  valueText: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  version: { ...Typography.caption, color: Colors.outline, textAlign: 'center', marginTop: Spacing.sm },
});
