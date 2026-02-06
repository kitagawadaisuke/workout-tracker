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
  selectedDate: string;
  workoutTimerRunning: boolean;
  workoutTimerStartedAt: number | null;
  workoutTimerTargetDate: string | null;
  workoutTimerDraftSeconds: number;
  workoutTimerDraftTargetDate: string | null;

  // Actions
  setSelectedDate: (date: string) => void;
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
  startWorkoutTimer: () => void;
  pauseWorkoutTimer: () => void;
  recordWorkoutTimer: () => void;
  stopWorkoutTimer: () => void;
  resetWorkoutTimer: () => void;
  copyLastWorkoutToSelectedDate: (mode?: 'replace' | 'append') => boolean;
  getTodayWorkout: () => DailyWorkout | undefined;
  getWorkoutByDate: (date: string) => DailyWorkout | undefined;
  getSelectedWorkoutDurationSeconds: () => number;
  getAllWorkouts: () => DailyWorkout[];
}

// ヘルパー: 今日のエクササイズのセットのエントリを更新
const updateEntryByDate = (
  state: { workouts: DailyWorkout[] },
  date: string,
  exerciseId: string,
  setIndex: number,
  entryIndex: number,
  updater: (entry: SetEntry) => SetEntry
) => {
  return {
    workouts: state.workouts.map((w) =>
      w.date === date
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
      selectedDate: getTodayDate(),
      workoutTimerRunning: false,
      workoutTimerStartedAt: null,
      workoutTimerTargetDate: null,
      workoutTimerDraftSeconds: 0,
      workoutTimerDraftTargetDate: null,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      addExercise: (type: ExerciseType) => {
        const selectedDate = get().selectedDate;

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
          const existingWorkout = state.workouts.find((w) => w.date === selectedDate);

          if (existingWorkout) {
            return {
              workouts: state.workouts.map((w) =>
                w.date === selectedDate
                  ? { ...w, exercises: [...w.exercises, newExercise] }
                  : w
              ),
            };
          } else {
            return {
              workouts: [
                ...state.workouts,
                { date: selectedDate, exercises: [newExercise], durationSeconds: 0 },
              ],
            };
          }
        });
      },

      removeExercise: (exerciseId: string) => {
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
              ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
              : w
          ).filter((w) => w.exercises.length > 0 || (w.durationSeconds || 0) > 0),
        }));
      },

      addSet: (exerciseId: string) => {
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => updateEntryByDate(state, selectedDate, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, reps })));
      },

      updateEntryWeight: (exerciseId: string, setIndex: number, entryIndex: number, weight: number) => {
        const selectedDate = get().selectedDate;
        set((state) => updateEntryByDate(state, selectedDate, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, weight })));
      },

      updateEntryVariation: (exerciseId: string, setIndex: number, entryIndex: number, variation: string) => {
        const selectedDate = get().selectedDate;
        set((state) => updateEntryByDate(state, selectedDate, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, variation })));
      },

      updateEntryTempo: (exerciseId: string, setIndex: number, entryIndex: number, tempo: string) => {
        const selectedDate = get().selectedDate;
        set((state) => updateEntryByDate(state, selectedDate, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, tempo })));
      },

      toggleEntryAssistance: (exerciseId: string, setIndex: number, entryIndex: number) => {
        const selectedDate = get().selectedDate;
        set((state) => updateEntryByDate(state, selectedDate, exerciseId, setIndex, entryIndex, (entry) => ({ ...entry, assistance: !entry.assistance })));
      },

      toggleSetCompleted: (exerciseId: string, setIndex: number) => {
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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
        const selectedDate = get().selectedDate;
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.date === selectedDate
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

      startWorkoutTimer: () => {
        if (get().workoutTimerRunning) return;
        const { selectedDate, workoutTimerDraftTargetDate } = get();
        set({
          workoutTimerRunning: true,
          workoutTimerStartedAt: Date.now(),
          workoutTimerTargetDate: selectedDate,
          workoutTimerDraftTargetDate: workoutTimerDraftTargetDate && workoutTimerDraftTargetDate !== selectedDate ? selectedDate : (workoutTimerDraftTargetDate ?? selectedDate),
          workoutTimerDraftSeconds: workoutTimerDraftTargetDate && workoutTimerDraftTargetDate !== selectedDate ? 0 : get().workoutTimerDraftSeconds,
        });
      },

      pauseWorkoutTimer: () => {
        const { workoutTimerRunning, workoutTimerStartedAt, workoutTimerTargetDate, workoutTimerDraftTargetDate, workoutTimerDraftSeconds } = get();
        if (!workoutTimerRunning || !workoutTimerStartedAt || !workoutTimerTargetDate) {
          set({ workoutTimerRunning: false, workoutTimerStartedAt: null, workoutTimerTargetDate: null });
          return;
        }

        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - workoutTimerStartedAt) / 1000));
        if (elapsedSeconds <= 0) {
          set({ workoutTimerRunning: false, workoutTimerStartedAt: null, workoutTimerTargetDate: null });
          return;
        }

        const nextDraftSeconds =
          workoutTimerDraftTargetDate && workoutTimerDraftTargetDate !== workoutTimerTargetDate
            ? elapsedSeconds
            : workoutTimerDraftSeconds + elapsedSeconds;

        set({
          workoutTimerRunning: false,
          workoutTimerStartedAt: null,
          workoutTimerTargetDate: null,
          workoutTimerDraftTargetDate: workoutTimerTargetDate,
          workoutTimerDraftSeconds: nextDraftSeconds,
        });
      },

      recordWorkoutTimer: () => {
        const {
          workoutTimerRunning,
          workoutTimerStartedAt,
          workoutTimerTargetDate,
          workoutTimerDraftTargetDate,
          workoutTimerDraftSeconds,
          selectedDate,
        } = get();

        const targetDate = workoutTimerTargetDate ?? workoutTimerDraftTargetDate ?? selectedDate;
        const runningSeconds =
          workoutTimerRunning && workoutTimerStartedAt && workoutTimerTargetDate === targetDate
            ? Math.max(0, Math.floor((Date.now() - workoutTimerStartedAt) / 1000))
            : 0;
        const draftSeconds = workoutTimerDraftTargetDate === targetDate ? workoutTimerDraftSeconds : 0;
        const totalSeconds = draftSeconds + runningSeconds;

        set((state) => {
          if (totalSeconds <= 0) {
            return {
              workoutTimerRunning: false,
              workoutTimerStartedAt: null,
              workoutTimerTargetDate: null,
              workoutTimerDraftSeconds: 0,
              workoutTimerDraftTargetDate: null,
            };
          }

          const existingWorkout = state.workouts.find((w) => w.date === targetDate);
          const updatedWorkouts = existingWorkout
            ? state.workouts.map((w) =>
                w.date === targetDate
                  ? { ...w, durationSeconds: (w.durationSeconds || 0) + totalSeconds }
                  : w
              )
            : [
                ...state.workouts,
                { date: targetDate, exercises: [], durationSeconds: totalSeconds },
              ];

          return {
            workoutTimerRunning: false,
            workoutTimerStartedAt: null,
            workoutTimerTargetDate: null,
            workoutTimerDraftSeconds: 0,
            workoutTimerDraftTargetDate: null,
            workouts: updatedWorkouts,
          };
        });
      },

      stopWorkoutTimer: () => {
        get().recordWorkoutTimer();
      },

      resetWorkoutTimer: () => {
        set((state) => {
          const targetDate = state.workoutTimerTargetDate ?? state.workoutTimerDraftTargetDate ?? state.selectedDate;
          const updatedWorkouts = state.workouts
            .map((w) =>
              w.date === targetDate
                ? { ...w, durationSeconds: 0 }
                : w
            )
            .filter((w) => w.exercises.length > 0 || (w.durationSeconds || 0) > 0);

          return {
            workoutTimerRunning: false,
            workoutTimerStartedAt: null,
            workoutTimerTargetDate: null,
            workoutTimerDraftSeconds: 0,
            workoutTimerDraftTargetDate: null,
            workouts: updatedWorkouts,
          };
        });
      },

      copyLastWorkoutToSelectedDate: (mode: 'replace' | 'append' = 'append') => {
        const { workouts, selectedDate } = get();
        const previousWorkouts = workouts
          .filter((w) => w.date < selectedDate)
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        const sourceWorkout = previousWorkouts[0];
        if (!sourceWorkout) return false;

        const now = new Date().toISOString();
        const copiedExercises: Exercise[] = sourceWorkout.exercises.map((exercise) => ({
          ...exercise,
          id: generateId(),
          createdAt: now,
          sets: exercise.sets.map((set) => ({
            ...set,
            completed: false,
            entries: set.entries.map((entry) => ({ ...entry })),
          })),
        }));

        set((state) => {
          const existingWorkout = state.workouts.find((w) => w.date === selectedDate);

          if (existingWorkout) {
            const nextExercises =
              mode === 'replace' ? copiedExercises : [...existingWorkout.exercises, ...copiedExercises];
            const nextDurationSeconds = mode === 'replace' ? 0 : (existingWorkout.durationSeconds || 0);
            return {
              workouts: state.workouts.map((w) =>
                w.date === selectedDate
                  ? { ...w, exercises: nextExercises, durationSeconds: nextDurationSeconds }
                  : w
              ),
            };
          }

          return {
            workouts: [
              ...state.workouts,
              { date: selectedDate, exercises: copiedExercises, durationSeconds: 0 },
            ],
          };
        });

        return true;
      },

      getTodayWorkout: () => {
        const today = getTodayDate();
        return get().workouts.find((w) => w.date === today);
      },

      getWorkoutByDate: (date: string) => {
        return get().workouts.find((w) => w.date === date);
      },

      getSelectedWorkoutDurationSeconds: () => {
        const {
          selectedDate,
          workoutTimerRunning,
          workoutTimerStartedAt,
          workoutTimerTargetDate,
          workoutTimerDraftSeconds,
          workoutTimerDraftTargetDate,
        } = get();
        const existingWorkout = get().workouts.find((w) => w.date === selectedDate);
        const baseSeconds = existingWorkout?.durationSeconds || 0;
        const draftSeconds = workoutTimerDraftTargetDate === selectedDate ? workoutTimerDraftSeconds : 0;
        const runningSeconds =
          workoutTimerRunning && workoutTimerStartedAt && workoutTimerTargetDate === selectedDate
            ? Math.max(0, Math.floor((Date.now() - workoutTimerStartedAt) / 1000))
            : 0;
        return baseSeconds + draftSeconds + runningSeconds;
      },

      getAllWorkouts: () => {
        return get().workouts;
      },
    }),
    {
      name: 'workout-storage',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || !version) {
          // v0 → v1: セットの旧フォーマットを新フォーマットに移行
          if (persistedState && persistedState.workouts) {
            persistedState.workouts = migrateWorkouts(persistedState.workouts);
          }
        }
        if (persistedState) {
          if (!persistedState.selectedDate) {
            persistedState.selectedDate = getTodayDate();
          }
          persistedState.workoutTimerRunning = false;
          persistedState.workoutTimerStartedAt = null;
          persistedState.workoutTimerTargetDate = null;
          persistedState.workoutTimerDraftSeconds = 0;
          persistedState.workoutTimerDraftTargetDate = null;
        }
        return persistedState as WorkoutState;
      },
    }
  )
);
