import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyWorkout, Exercise, ExerciseType, TimerSettings, SetEntry, FeedbackMode, isDurationBasedExercise, EXERCISE_NAMES } from '@/types/workout';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const createEmptyEntry = (): SetEntry => ({ reps: 0 });

interface WorkoutState {
  workouts: DailyWorkout[];
  timerSettings: TimerSettings;

  // Actions
  addExercise: (type: ExerciseType) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  copySet: (exerciseId: string, setIndex: number) => void;
  addSetEntry: (exerciseId: string, setIndex: number) => void;
  removeSetEntry: (exerciseId: string, setIndex: number, entryIndex: number) => void;
  updateEntryReps: (exerciseId: string, setIndex: number, entryIndex: number, reps: number) => void;
  updateEntryWeight: (exerciseId: string, setIndex: number, entryIndex: number, weight: number) => void;
  updateEntryVariation: (exerciseId: string, setIndex: number, entryIndex: number, variation: string) => void;
  updateEntryTempo: (exerciseId: string, setIndex: number, entryIndex: number, tempo: string) => void;
  toggleEntryAssistance: (exerciseId: string, setIndex: number, entryIndex: number) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  updateCardioDuration: (exerciseId: string, duration: number) => void;
  updateDurationMinutes: (exerciseId: string, minutes: number) => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  getTodayWorkout: () => DailyWorkout | undefined;
  getWorkoutByDate: (date: string) => DailyWorkout | undefined;
  getAllWorkouts: () => DailyWorkout[];
}

// ヘルパー: 今日のエクササイズのセットのエントリを更新
const updateTodayEntry = (
  state: { workouts: DailyWorkout[] },
  exerciseId: string,
  setIndex: number,
  entryIndex: number,
  updater: (entry: SetEntry) => SetEntry
) => {
  const today = getTodayDate();
  return {
    workouts: state.workouts.map((w) =>
      w.date === today
        ? {
            ...w,
            exercises: w.exercises.map((e) =>
              e.id === exerciseId
                ? {
                    ...e,
                    sets: e.sets.map((s, si) =>
                      si === setIndex
                        ? {
                            ...s,
                            entries: s.entries.map((entry, ei) =>
                              ei === entryIndex ? updater(entry) : entry
                            ),
                          }
                        : s
                    ),
                  }
                : e
            ),
          }
        : w
    ),
  };
};

// 旧フォーマットからの移行
const migrateWorkouts = (workouts: any[]): DailyWorkout[] => {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise: any) => ({
      ...exercise,
      sets: exercise.sets.map((set: any) => {
        // 新フォーマット（entries配列あり）ならそのまま
        if (set.entries) return set;
        // 旧フォーマット → 新フォーマットに変換
        const entry: SetEntry = {
          reps: set.reps || 0,
          variation: set.variation,
          tempo: set.tempo,
          assistance: set.assistance,
        };
        return {
          entries: [entry],
          completed: set.completed || false,
          metronome: set.metronome,
        };
      }),
    })),
  }));
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workouts: [],
      timerSettings: {
        intervalSeconds: 60,
        metronomeBpm: 60,
        metronomeBeats: 4,
        feedbackMode: 'both',
      },

      addExercise: (type: ExerciseType) => {
        const today = getTodayDate();

        const newExercise: Exercise = {
          id: generateId(),
          type,
          name: EXERCISE_NAMES[type],
          sets: isDurationBasedExercise(type) ? [] : [{ entries: [createEmptyEntry()], completed: false }],
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
                      ? { ...e, sets: [...e.sets, { entries: [createEmptyEntry()], completed: false }] }
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

      copySet: (exerciseId: string, setIndex: number) => {
        const today = getTodayDate();
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === today
              ? {
                  ...w,
                  exercises: w.exercises.map((e) => {
                    if (e.id !== exerciseId) return e;
                    const sourceSet = e.sets[setIndex];
                    if (!sourceSet) return e;
                    const copiedSet = {
                      entries: sourceSet.entries.map((entry) => ({ ...entry })),
                      completed: false,
                      metronome: sourceSet.metronome,
                    };
                    const newSets = [...e.sets];
                    newSets.splice(setIndex + 1, 0, copiedSet);
                    return { ...e, sets: newSets };
                  }),
                }
              : w
          ),
        }));
      },

      addSetEntry: (exerciseId: string, setIndex: number) => {
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
                          sets: e.sets.map((s, si) =>
                            si === setIndex
                              ? { ...s, entries: [...s.entries, createEmptyEntry()] }
                              : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      removeSetEntry: (exerciseId: string, setIndex: number, entryIndex: number) => {
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
                          sets: e.sets.map((s, si) =>
                            si === setIndex
                              ? { ...s, entries: s.entries.filter((_, ei) => ei !== entryIndex) }
                              : s
                          ),
                        }
                      : e
                  ),
                }
              : w
          ),
        }));
      },

      updateEntryReps: (exerciseId: string, setIndex: number, entryIndex: number, reps: number) => {
        set((state) => updateTodayEntry(state, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, reps })));
      },

      updateEntryWeight: (exerciseId: string, setIndex: number, entryIndex: number, weight: number) => {
        set((state) => updateTodayEntry(state, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, weight })));
      },

      updateEntryVariation: (exerciseId: string, setIndex: number, entryIndex: number, variation: string) => {
        set((state) => updateTodayEntry(state, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, variation })));
      },

      updateEntryTempo: (exerciseId: string, setIndex: number, entryIndex: number, tempo: string) => {
        set((state) => updateTodayEntry(state, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, tempo })));
      },

      toggleEntryAssistance: (exerciseId: string, setIndex: number, entryIndex: number) => {
        set((state) => updateTodayEntry(state, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, assistance: !entry.assistance })));
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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || !version) {
          // v0 → v1: セットの旧フォーマットを新フォーマットに移行
          if (persistedState && persistedState.workouts) {
            persistedState.workouts = migrateWorkouts(persistedState.workouts);
          }
        }
        return persistedState as WorkoutState;
      },
    }
  )
);
