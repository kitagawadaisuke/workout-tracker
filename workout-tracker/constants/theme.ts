import { MD3DarkTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6366f1',
    primaryContainer: '#4338ca',
    secondary: '#22d3ee',
    secondaryContainer: '#0891b2',
    background: '#0f0f23',
    surface: '#1a1a2e',
    surfaceVariant: '#16213e',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onBackground: '#e2e8f0',
    onSurface: '#e2e8f0',
    onSurfaceVariant: '#94a3b8',
    outline: '#475569',
  },
};

export const colors = {
  pushup: '#3b82f6',    // blue
  squat: '#22c55e',     // green
  pullup: '#f59e0b',    // amber
  cardio: '#ec4899',    // pink
  bodypump: '#a855f7',  // purple
  bodycombat: '#ef4444', // red
  leapfight: '#14b8a6', // teal
  strength: '#6366f1',  // indigo (combined strength)
  both: '#a855f7',      // purple (both types)
};

export const calendarTheme = {
  backgroundColor: '#0f0f23',
  calendarBackground: '#1a1a2e',
  textSectionTitleColor: '#94a3b8',
  selectedDayBackgroundColor: '#6366f1',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#22d3ee',
  dayTextColor: '#e2e8f0',
  textDisabledColor: '#475569',
  dotColor: '#6366f1',
  selectedDotColor: '#ffffff',
  arrowColor: '#6366f1',
  monthTextColor: '#e2e8f0',
  indicatorColor: '#6366f1',
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '600' as const,
  textDayHeaderFontWeight: '500' as const,
};
