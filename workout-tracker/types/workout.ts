export type ExerciseType = 'pushup' | 'squat' | 'pullup' | 'cardio' | 'bodypump' | 'bodycombat' | 'leapfight';

export interface WorkoutSet {
  reps: number;
  completed: boolean;
  variation?: string; // バリエーション名（例: ナロー, ワイド, ブルガリアン右など）
  tempo?: string; // テンポ表記（例: "2-1-2"）
  metronome?: boolean; // このセットでメトロノームを使うか
  assistance?: boolean; // 懸垂の補助あり/なし
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  name: string;
  sets: WorkoutSet[];
  duration?: number; // seconds (for cardio)
  durationMinutes?: number; // 分（有酸素やBODYPUMP用、30/45/60など）
  createdAt: string;
}

export interface DailyWorkout {
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
}

export interface TimerSettings {
  intervalSeconds: number;
  metronomeBpm: number;
  metronomeBeats: 3 | 4 | 8;
}

export const EXERCISE_NAMES: Record<ExerciseType, string> = {
  pushup: '腕立て伏せ',
  squat: 'スクワット',
  pullup: '懸垂',
  cardio: '有酸素運動',
  bodypump: 'BODYPUMP',
  bodycombat: 'BODYCOMBAT',
  leapfight: 'LEAP FIGHT',
};

export const EXERCISE_ICONS: Record<ExerciseType, string> = {
  pushup: 'arm-flex',
  squat: 'human',
  pullup: 'human-handsup',
  cardio: 'run',
  bodypump: 'dumbbell',
  bodycombat: 'boxing-glove',
  leapfight: 'karate',
};

// 時間ベースの種目かどうか
export const isDurationBasedExercise = (type: ExerciseType): boolean => {
  return ['cardio', 'bodypump', 'bodycombat', 'leapfight'].includes(type);
};

// プリセット時間オプション（分）
export const DURATION_PRESETS = [30, 45, 60];
