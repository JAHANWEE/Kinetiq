import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Spacing';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function SettingsScreen() {
  const [toggles, setToggles] = useState({ alerts: true, haptic: true, sync: true, dark: true });
  const toggle = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));

  const sections: { title: string; items: { icon: IconName; label: string; toggle?: keyof typeof toggles; value?: string }[] }[] = [
    {
      title: 'DRIVING',
      items: [
        { icon: 'speed', label: 'Speed Sensitivity', value: 'Medium' },
        { icon: 'notifications-active', label: 'Real-time Alerts', toggle: 'alerts' },
        { icon: 'vibration', label: 'Haptic Feedback', toggle: 'haptic' },
        { icon: 'gps-fixed', label: 'GPS Accuracy', value: 'High' },
      ],
    },
    {
      title: 'DATA',
      items: [
        { icon: 'cloud-upload', label: 'Auto Sync', toggle: 'sync' },
        { icon: 'storage', label: 'Local Storage', value: '2.4 GB' },
        { icon: 'delete-outline', label: 'Clear Data' },
      ],
    },
    {
      title: 'APP',
      items: [
        { icon: 'dark-mode', label: 'Dark Mode', toggle: 'dark' },
        { icon: 'person-outline', label: 'Profile' },
        { icon: 'help-outline', label: 'Help & Support' },
        { icon: 'info-outline', label: 'About' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {sections.map((sec, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.sectionCard}>
              {sec.items.map((item, ii) => (
                <View key={ii} style={[styles.row, ii < sec.items.length - 1 && styles.rowBorder]}>
                  <View style={styles.rowLeft}>
                    <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
                    <Text style={styles.rowLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={toggles[item.toggle]}
                      onValueChange={() => toggle(item.toggle!)}
                      trackColor={{ false: Colors.outlineVariant, true: Colors.primary + '60' }}
                      thumbColor={toggles[item.toggle] ? Colors.primary : Colors.outline}
                    />
                  ) : item.value ? (
                    <Text style={styles.rowValue}>{item.value}</Text>
                  ) : (
                    <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>DriveSense v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.containerMargin, paddingBottom: 100, gap: Spacing.lg },
  title: { ...Typography.headlineLg, color: Colors.onSurface, paddingTop: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, paddingLeft: 4 },
  sectionCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.outlineVariant + '20', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '15' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowLabel: { ...Typography.bodyMd, color: Colors.onSurface },
  rowValue: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
  version: { ...Typography.caption, color: Colors.outline, textAlign: 'center', marginTop: Spacing.md },
});
