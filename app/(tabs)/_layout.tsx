import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, useColorScheme } from 'react-native';
import { Dark, Light } from '../../constants/Colors';

export default function TabLayout() {
  const T = useColorScheme() === 'light' ? Light : Dark;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.tabBg,
          borderTopColor: T.tabLine,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: ({ color }) => <MaterialIcons name="home"      size={22} color={color} /> }} />
      <Tabs.Screen name="drive"    options={{ title: 'Drive',    tabBarIcon: ({ color }) => <MaterialIcons name="speed"     size={22} color={color} /> }} />
      <Tabs.Screen name="history"  options={{ title: 'History',  tabBarIcon: ({ color }) => <MaterialIcons name="history"   size={22} color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <MaterialIcons name="tune"      size={22} color={color} /> }} />
    </Tabs>
  );
}
