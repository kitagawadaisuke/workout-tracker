import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyWorkout, Exercise, ExerciseType, TimerSettings, isDurationBasedExercise, EXERCISE_NAMES } from '@/types/workout';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

interface WorkoutState {
  workouts: DailyWorkout[];
  timerSettings: TimerSettings;

  // Actions
  addExercise: (type: ExerciseType) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSetReps: (exerciseId: string, setIndex: number, reps: number) => void;
  updateSetVariation: (exerciseId: string, setIndex: number, variation: string) => void;
  updateSetTempo: (exerciseId: string, setIndex: number, tempo: string) => void;
  toggleSetAssistance: (exerciseId: string, setIndex: number) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  updateCardioDuration: (exerciseId: string, duration: number) => void;
  updateDurationMinutes: (exerciseId: string, minutes: number) => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  getTodayWorkout: () => DailyWorkout | undefined;
  getWorkoutByDate: (date: string) => DailyWorkout | undefined;
  getAllWorkouts: () => DailyWorkout[];
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: [],
      timerSettings: {
        intervalSeconds: 60,
        metronomeBpm: 60,
        metronomeBeats: 4,
      },

      addExercise: (type: ExerciseType) => {
        const today = getTodayDate();

        const newExercise: Exercise = {
          id: generateId(),
          type,
          name: EXERCISE_NAMES[type],
          sets: isDurationBasedExercise(type) ? [] : [{ reps: 0, completed: false }],
          duration: isDurationBasedExercise(type) ? 0 : undefined,
          durationMinutes: undefined,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const existingWorkout = state.workouts.find((w) => w.date === today);

          if (existingWorkout) {
            return {
              workouts: state.workouts.map((w) =>
                w.date === today
                  ? { ...w, exercises: [...w.exercises, newExercise] }
                  : w
              ),
            };
          } else {
            return {
              workouts: [
                ...state.workouts,
                { date: today, exercises: [newExercise] },
              ],
            };
          }
        });
      },

      removeExercise: (exerciseId: string) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
              : w
          ).filter((w) => w.exercises.length > 0),
        }));
      },

      addSet: (exerciseId: string) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? { ...e, sets: [...e.sets, { reps: 0, completed: false }] }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      removeSet: (exerciseId: string, setIndex: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateSetReps: (exerciseId: string, setIndex: number, reps: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s, i) =>
                            i === setIndex ? { ...s, reps } : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateSetVariation: (exerciseId: string, setIndex: number, variation: string) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s, i) =>
                            i === setIndex ? { ...s, variation } : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateSetTempo: (exerciseId: string, setIndex: number, tempo: string) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s, i) =>
                            i === setIndex ? { ...s, tempo } : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      toggleSetAssistance: (exerciseId: string, setIndex: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s, i) =>
                            i === setIndex ? { ...s, assistance: !s.assistance } : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      toggleSetCompleted: (exerciseId: string, setIndex: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s, i) =>
                            i === setIndex ? { ...s, completed: !s.completed } : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateCardioDuration: (exerciseId: string, duration: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          duration,
                          durationMinutes: duration % 60 === 0 ? duration / 60 : e.durationMinutes,
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateDurationMinutes: (exerciseId: string, minutes: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          durationMinutes: minutes,
                          duration: minutes * 60,
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateTimerSettings: (settings: Partial<TimerSettings>) => {
        set((state) => ({
          timerSettings: { ...state.timerSettings, ...settings },
        }));
      },

      getTodayWorkout: () => {
        const today = getTodayDate();
        return get().workouts.find((w) => w.date === today);
      },

      getWorkoutByDate: (date: string) => {
        return get().workouts.find((w) => w.date === date);
      },

      getAllWorkouts: () => {
        return get().workouts;
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
