export type BuiltinExerciseType = 'pushup' | 'squat' | 'pullup' | 'cardio' | 'bodypump' | 'bodycombat' | 'leapfight';
export type ExerciseType = BuiltinExerciseType | string;

export interface SetEntry {
  reps: number;
  weight?: number;
  variation?: string;
  tempo?: string;
  assistance?: boolean;
}

export interface MetronomeSettings {
  enabled: boolean;
  bpm: number;
  beatsPerBar: number;
}

export interface WorkoutSet {
  entries: SetEntry[];
  completed: boolean;
  variation?: string;
  tempo?: string;
  assistance?: boolean;
  durationMinutes?: number;
  metronome?: boolean | MetronomeSettings;
}

export interface WorkoutColorSummary {
  primary: string;
  dots?: string[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  kind: 'strength' | 'cardio' | 'machine' | 'freeweight';
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  name: string;
  colorKey?: string;
  sets: WorkoutSet[];
  duration?: number; // seconds (for cardio)
  durationMinutes?: number;
  createdAt: string;
}

export interface DailyWorkout {
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
  durationSeconds?: number;
  restBetweenSetsSeconds?: number;
  restIntervalSeconds?: number;
  metronomeBpm?: number;
  metronomeBeatsPerBar?: 4 | 8;
  colorSummary?: WorkoutColorSummary;
}

export interface CustomExerciseType {
  id: string;
  name: string;
  icon: string;
  color: string;
  hasWeight: boolean;
  isDuration: boolean;
}

export type FeedbackMode = 'vibration' | 'sound' | 'both';

export interface TimerSettings {
  intervalSeconds: number;
  metronomeBpm: number;
  metronomeBeats: 4 | 8;
  feedbackMode: FeedbackMode;
}

export const BUILTIN_EXERCISE_NAMES: Record<BuiltinExerciseType, string> = {
  pushup: 'プッシュアップ',
  squat: 'スクワット',
  pullup: '懸垂',
  cardio: '有酸素',
  bodypump: 'ボディパンプ',
  bodycombat: 'ボディコンバット',
  leapfight: 'リープファイト',
};

export const EXERCISE_NAMES = BUILTIN_EXERCISE_NAMES as Record<string, string>;

export const BUILTIN_EXERCISE_ICONS: Record<BuiltinExerciseType, string> = {
  pushup: 'arm-flex',
  squat: 'human',
  pullup: 'human-handsup',
  cardio: 'run',
  bodypump: 'dumbbell',
  bodycombat: 'boxing-glove',
  leapfight: 'karate',
};

export const EXERCISE_ICONS = BUILTIN_EXERCISE_ICONS as Record<string, string>;

export const isDurationBasedExercise = (type: ExerciseType): boolean => {
  return ['cardio', 'bodypump', 'bodycombat', 'leapfight'].includes(type);
};

export const DURATION_PRESETS = [30, 45, 60];

export const AVAILABLE_ICONS = [
  'dumbbell', 'arm-flex', 'human', 'human-handsup', 'run', 'boxing-glove',
  'karate', 'weight-lifter', 'yoga', 'bike', 'swim', 'walk',
  'jump-rope', 'bench', 'kettlebell', 'rowing', 'meditation',
  'heart-pulse', 'fire', 'lightning-bolt', 'target', 'trophy',
];

export const AVAILABLE_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#f472b6', '#a855f7',
  '#ef4444', '#14b8a6', '#6366f1', '#ec4899', '#06b6d4',
  '#f97316', '#84cc16', '#8b5cf6', '#e11d48', '#0ea5e9',
];
