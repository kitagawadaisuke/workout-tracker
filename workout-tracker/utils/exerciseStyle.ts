import { EXERCISE_ICONS, EXERCISE_NAMES, ExerciseType } from '@/types/workout';
import { getExerciseColor } from '@/utils/exerciseColor';

export const getExerciseColorForType = (type: ExerciseType | string): string => {
  const name = EXERCISE_NAMES[type as string] || String(type);
  return getExerciseColor(name);
};

export const getExerciseIconForType = (type: ExerciseType | string): string => {
  return EXERCISE_ICONS[type as string] || 'dumbbell';
};
