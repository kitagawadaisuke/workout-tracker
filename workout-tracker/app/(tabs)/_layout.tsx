import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, darkTheme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: darkTheme.colors.surface,
        },
        headerTintColor: darkTheme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: darkTheme.colors.surface,
          borderTopColor: darkTheme.colors.outline,
        },
        tabBarActiveTintColor: darkTheme.colors.textPrimary,
        tabBarInactiveTintColor: darkTheme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'トレーニング',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="dumbbell"
              size={size}
              color={focused ? colors.strength : darkTheme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'タイマー',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="timer-outline"
              size={size}
              color={focused ? darkTheme.colors.accent : darkTheme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="calendar-month"
              size={size}
              color={focused ? darkTheme.colors.onSurfaceVariant : darkTheme.colors.textSecondary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={size}
              color={focused ? darkTheme.colors.onSurfaceVariant : darkTheme.colors.textSecondary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
