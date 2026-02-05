export type ExerciseType = 'pushup' | 'squat' | 'pullup' | 'cardio';

export interface WorkoutSet {
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  name: string;
  sets: WorkoutSet[];
  duration?: number; // seconds (for cardio)
  createdAt: string;
}

export interface DailyWorkout {
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
}

export interface TimerSettings {
  intervalSeconds: number;
  metronomeBpm: number;
  metronomeBeats: 3 | 4;
}

export const EXERCISE_NAMES: Record<ExerciseType, string> = {
  pushup: '腕立て伏せ',
  squat: 'スクワット',
  pullup: '懸垂',
  cardio: '有酸素運動',
};

export const EXERCISE_ICONS: Record<ExerciseType, string> = {
  pushup: 'arm-flex',
  squat: 'human',
  pullup: 'human-handsup',
  cardio: 'run',
};
