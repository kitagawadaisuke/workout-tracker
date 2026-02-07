import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    primaryContainer: '#1d4ed8',
    secondary: '#60a5fa',
    secondaryContainer: '#1e40af',
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
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    accent: '#3b82f6',
    secondaryAccent: '#60a5fa',
    mutedText: '#94a3b8',
    danger: '#ef4444',
  },
};

export const colors = {
  pushup: '#22c55e',    // green
  squat: '#16a34a',     // green dark
  pullup: '#15803d',    // green deeper
  cardio: '#0ea5e9',    // blue
  bodypump: '#0ea5e9',  // blue
  bodycombat: '#0ea5e9', // blue
  leapfight: '#0ea5e9', // blue
  duration: '#0ea5e9',  // blue
  strength: '#22c55e',  // green
  both: '#14b8a6',      // teal
};

export const exercisePalette = [
  '#4ADE80', // green
  '#60A5FA', // blue
  '#F472B6', // pink
  '#FACC15', // yellow
  '#A78BFA', // purple
  '#FB923C', // orange
  '#2DD4BF', // teal
  '#E879F9', // fuchsia
  '#34D399', // emerald
  '#38BDF8', // sky
  '#F59E0B', // amber
  '#C084FC', // violet
];

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    primaryContainer: '#dbeafe',
    secondary: '#3b82f6',
    secondaryContainer: '#bfdbfe',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#0f172a',
    onBackground: '#0f172a',
    onSurface: '#0f172a',
    onSurfaceVariant: '#475569',
    outline: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    accent: '#2563eb',
    secondaryAccent: '#3b82f6',
    mutedText: '#475569',
    danger: '#ef4444',
  },
};

export const calendarTheme = {
  backgroundColor: '#0f0f23',
  calendarBackground: '#1a1a2e',
  textSectionTitleColor: '#94a3b8',
  selectedDayBackgroundColor: '#1e293b',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#38bdf8',
  dayTextColor: '#e2e8f0',
  textDisabledColor: '#475569',
  dotColor: '#94a3b8',
  selectedDotColor: '#ffffff',
  arrowColor: '#94a3b8',
  monthTextColor: '#e2e8f0',
  indicatorColor: '#94a3b8',
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '600' as const,
  textDayHeaderFontWeight: '500' as const,
};
