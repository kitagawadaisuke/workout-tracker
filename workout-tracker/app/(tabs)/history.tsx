import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, Card, Chip, Button, IconButton, Snackbar } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme, calendarTheme } from '@/constants/theme';
import { getExerciseColorForType, getExerciseIconForType } from '@/utils/exerciseStyle';
import { DailyWorkout, EXERCISE_NAMES, isDurationBasedExercise } from '@/types/workout';

type MarkedDates = {
  [key: string]: {
    dots?: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
  };
};

export default function HistoryScreen() {
  const {
    getAllWorkouts,
    getWorkoutByDate,
    setSelectedDate: setStoreSelectedDate,
    copyLastWorkoutToSelectedDate,
    removeExercise,
    removeExercisesByIds,
    clearRestIntervalSeconds,
    clearWorkoutDurationSeconds,
    clearMetronomeBpm,
  } = useWorkoutStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [lastAddedExerciseIds, setLastAddedExerciseIds] = useState<string[]>([]);
  const [clearSnackbarVisible, setClearSnackbarVisible] = useState(false);
  const [clearSnackbarMessage, setClearSnackbarMessage] = useState('');
  const [isSummaryEditing, setIsSummaryEditing] = useState(false);

  const workouts = getAllWorkouts();
  const maxDots = 6;

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};

    workouts.forEach((workout) => {
      const colorSet = new Set<string>();
      workout.exercises.forEach((exercise) => {
        colorSet.add(getExerciseColorForType(exercise.type));
      });
      const colors = Array.from(colorSet);
      const dots = colors.slice(0, maxDots).map((color, index) => ({ key: `c-${index}`, color }));
      const moreCount = Math.max(0, colors.length - maxDots);

      marks[workout.date] = {
        dots,
        moreCount: moreCount > 0 ? moreCount : undefined,
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: darkTheme.colors.surfaceVariant,
      };
    }

    return marks;
  }, [workouts, selectedDate]);

  const selectedWorkout = selectedDate ? getWorkoutByDate(selectedDate) : null;

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}時間${mins}分${secs > 0 ? ` ${secs}秒` : ''}`;
    }
    return `${mins}分${secs > 0 ? ` ${secs}秒` : ''}`;
  };

  const formatMinSec = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalReps = (workout: DailyWorkout, type: string) => {
    return workout.exercises
      .filter((e) => e.type === type)
      .reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.entries.reduce((es, entry) => es + entry.reps, 0), 0), 0);
  };

  const getTotalSets = (workout: DailyWorkout, type: string) => {
    return workout.exercises
      .filter((e) => e.type === type)
      .reduce((sum, e) => sum + e.sets.length, 0);
  };

  return (
    <View style={styles.container}>
      <Calendar
        theme={calendarTheme}
        markingType="multi-dot"
        markedDates={markedDates}

        dayComponent={({ date, state, marking }) => {
          const dots = marking?.dots ?? [];
          const moreCount = marking?.moreCount ?? 0;
          const isSelected = !!marking?.selected;
          const dateKey = date?.dateString ?? '';
          return (
            <Pressable
              style={styles.dayCell}
              onPress={() => {
                if (!dateKey) return;
                console.log('pressed', dateKey);
                setSelectedDate(dateKey);
                setStoreSelectedDate(dateKey);
                console.log('selectedDate', dateKey);
              }}
            >
              <View
                style={[
                  styles.dayNumberContainer,
                  isSelected && { backgroundColor: marking?.selectedColor || darkTheme.colors.surfaceVariant },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    state === 'disabled' && { color: darkTheme.colors.onSurfaceVariant },
                    isSelected && { color: darkTheme.colors.onSurface },
                  ]}
                >
                  {date?.day}
                </Text>
              </View>
              <View style={styles.dotRow} pointerEvents="none">
                {dots.map((dot) => (
                  <View key={dot.key} style={[styles.dot, { backgroundColor: dot.color }]} />
                ))}
                {moreCount > 0 && (
                  <Text style={styles.moreBadge}>+{moreCount}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
        onDayPress={(day: DateData) => {
          setSelectedDate(day.dateString);
          setStoreSelectedDate(day.dateString);
        }}
        enableSwipeMonths
        style={styles.calendar}
      />

      <ScrollView style={styles.detailsContainer}>
        {selectedDate && (
          <>
            <Text style={styles.selectedDateText}>
              {new Date(selectedDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                const addedIds = copyLastWorkoutToSelectedDate('append');
                if (addedIds && addedIds.length > 0) {
                  setLastAddedExerciseIds(addedIds);
                  setSnackbarVisible(true);
                } else {
                  Alert.alert('追加できません', '追加元のトレーニングが見つかりません。');
                }
              }}
              style={styles.copyButton}
              compact
            >
              前回と同じ内容を記録
            </Button>
          </>
        )}

        {selectedWorkout ? (
          <>
            {selectedWorkout.exercises.map((exercise) => (
              <Card
                key={exercise.id}
                style={[styles.exerciseCard, { borderLeftColor: getExerciseColorForType(exercise.type) }]}
              >
                <Card.Content>
                  <View style={styles.exerciseHeader}>
                    <MaterialCommunityIcons
                      name={getExerciseIconForType(exercise.type) as any}
                      size={20}
                      color={getExerciseColorForType(exercise.type)}
                    />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <IconButton
                      icon="trash-can-outline"
                      size={18}
                      onPress={() => {
                        Alert.alert(
                          'このトレーニングを削除しますか？',
                          '',
                          [
                            { text: 'キャンセル', style: 'cancel' },
                            { text: '削除', style: 'destructive', onPress: () => removeExercise(exercise.id) },
                          ]
                        );
                      }}
                      iconColor={darkTheme.colors.onSurfaceVariant}
                      style={styles.exerciseDeleteButton}
                    />
                  </View>

                  {(isDurationBasedExercise(exercise.type) || exercise.duration !== undefined) ? (
                    <Text style={styles.statText}>
                      {formatDuration(exercise.duration || 0)}
                    </Text>
                  ) : (
                    <View style={styles.statsRow}>
                      <Chip style={styles.statChip} textStyle={styles.statChipText}>
                        {exercise.sets.length} セット
                      </Chip>
                      <Chip style={styles.statChip} textStyle={styles.statChipText}>
                        合計 {exercise.sets.reduce((sum, s) => sum + s.entries.reduce((es, entry) => es + entry.reps, 0), 0)} 回
                      </Chip>
                    </View>
                  )}

                  {!isDurationBasedExercise(exercise.type) && exercise.sets.length > 0 && (
                    <View style={styles.setsDetail}>
                      {exercise.sets.map((set, index) => (
                        <View key={index} style={{ marginBottom: 4 }}>
                          <Text style={styles.setDetailText}>
                            {index + 1}セット {set.completed ? '完了' : ''}
                          </Text>
                          {set.entries.map((entry, ei) => (
                            <Text key={ei} style={[styles.setDetailText, { marginLeft: 12 }]}
                            >
                              {entry.reps}回{entry.variation ? ` ${entry.variation}` : ''}{entry.tempo ? ` (${entry.tempo})` : ''}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            <Card style={styles.summaryCard}>
              <Card.Content>
                <View style={styles.summaryHeaderRow}>
                  <Text style={styles.summaryTitle}>今日の統計</Text>
                  <Button
                    mode="text"
                    onPress={() => setIsSummaryEditing((value) => !value)}
                    compact
                    textColor={darkTheme.colors.onSurfaceVariant}
                  >
                    {isSummaryEditing ? '完了' : '編集'}
                  </Button>
                </View>
                {['pushup', 'squat', 'pullup'].map((type) => {
                  const totalReps = getTotalReps(selectedWorkout, type);
                  const totalSets = getTotalSets(selectedWorkout, type);
                  if (totalReps === 0) return null;
                  return (
                    <View key={type} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        {EXERCISE_NAMES[type as keyof typeof EXERCISE_NAMES]}
                      </Text>
                      <Text style={styles.summaryValue}>
                        {totalSets}セット / {totalReps}回
                      </Text>
                    </View>
                  );
                })}
                {selectedWorkout.exercises
                  .filter((e) => isDurationBasedExercise(e.type) || e.duration !== undefined)
                  .map((e) => (
                    <View key={e.id} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{e.name}</Text>
                      <Text style={styles.summaryValue}>
                        {formatDuration(e.duration || 0)}
                      </Text>
                    </View>
                  ))}
                {selectedWorkout.durationSeconds !== undefined && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>筋トレ時間</Text>
                    <View style={styles.summaryValueContainer}>
                      <Text style={styles.summaryValue}>
                        {formatDuration(selectedWorkout.durationSeconds)}
                      </Text>
                      {isSummaryEditing && (
                        <IconButton
                          icon="close"
                          size={18}
                          onPress={() => {
                            if (!selectedDate) return;
                            Alert.alert('筋トレ時間をクリアしますか？', '', [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: 'クリア',
                                style: 'destructive',
                                onPress: () => {
                                  clearWorkoutDurationSeconds(selectedDate);
                                  setClearSnackbarMessage('クリアしました');
                                  setClearSnackbarVisible(true);
                                },
                              },
                            ]);
                          }}
                          iconColor={darkTheme.colors.onSurfaceVariant}
                          style={styles.summaryClearIcon}
                        />
                      )}
                    </View>
                  </View>
                )}
                {selectedWorkout.restIntervalSeconds !== undefined && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>セット間休憩</Text>
                    <View style={styles.summaryValueContainer}>
                      <Text style={styles.summaryValue}>
                        {formatMinSec(selectedWorkout.restIntervalSeconds)}
                      </Text>
                      {isSummaryEditing && (
                        <IconButton
                          icon="close"
                          size={18}
                          onPress={() => {
                            if (!selectedDate) return;
                            Alert.alert('セット間休憩をクリアしますか？', '', [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: 'クリア',
                                style: 'destructive',
                                onPress: () => {
                                  clearRestIntervalSeconds(selectedDate);
                                  setClearSnackbarMessage('クリアしました');
                                  setClearSnackbarVisible(true);
                                },
                              },
                            ]);
                          }}
                          iconColor={darkTheme.colors.onSurfaceVariant}
                          style={styles.summaryClearIcon}
                        />
                      )}
                    </View>
                  </View>
                )}
                {selectedWorkout.metronomeBpm !== undefined && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>BPM</Text>
                    <View style={styles.summaryValueContainer}>
                      <Text style={styles.summaryValue}>
                        {selectedWorkout.metronomeBpm}
                        {selectedWorkout.metronomeBeatsPerBar
                          ? `（${selectedWorkout.metronomeBeatsPerBar}拍子）`
                          : ''}
                      </Text>
                      {isSummaryEditing && (
                        <IconButton
                          icon="close"
                          size={18}
                          onPress={() => {
                            if (!selectedDate) return;
                            Alert.alert('BPMをクリアしますか？', '', [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: 'クリア',
                                style: 'destructive',
                                onPress: () => {
                                  clearMetronomeBpm(selectedDate);
                                  setClearSnackbarMessage('クリアしました');
                                  setClearSnackbarVisible(true);
                                },
                              },
                            ]);
                          }}
                          iconColor={darkTheme.colors.onSurfaceVariant}
                          style={styles.summaryClearIcon}
                        />
                      )}
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          </>
        ) : selectedDate ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color={darkTheme.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>この日の記録はありません</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="gesture-tap"
                size={48}
                color={darkTheme.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>日付をタップして詳細を表示</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    <Snackbar
      visible={snackbarVisible}
      onDismiss={() => {
        setSnackbarVisible(false);
        setLastAddedExerciseIds([]);
      }}
      duration={30000}
      action={{
        label: '元に戻す',
        onPress: () => {
          if (selectedDate && lastAddedExerciseIds.length > 0) {
            removeExercisesByIds(selectedDate, lastAddedExerciseIds);
            setLastAddedExerciseIds([]);
            setSnackbarVisible(false);
          }
        },
      }}
    >
      前回のトレーニングを反映しました
    </Snackbar>
    <Snackbar
      visible={clearSnackbarVisible}
      onDismiss={() => setClearSnackbarVisible(false)}
      duration={3000}
    >
      {clearSnackbarMessage}
    </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.outline,
  },

  dayCell: {
    alignItems: 'center',
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    color: darkTheme.colors.onSurface,
    fontSize: 13,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    minHeight: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreBadge: {
    fontSize: 8,
    color: darkTheme.colors.onSurfaceVariant,
    marginLeft: 2,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.colors.onSurface,
    marginBottom: 16,
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: darkTheme.colors.surface,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exerciseDeleteButton: {
    marginLeft: 'auto',
    margin: 0,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  statChipText: {
    color: darkTheme.colors.onSurface,
  },
  statText: {
    fontSize: 18,
    color: darkTheme.colors.onSurface,
    fontWeight: '600',
  },
  setsDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.outline,
  },
  setDetailText: {
    fontSize: 14,
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: darkTheme.colors.surfaceVariant,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.colors.onSurface,
    marginBottom: 12,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    flex: 1,
    color: darkTheme.colors.textSecondary,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  summaryValue: {
    color: darkTheme.colors.textPrimary,
    fontWeight: '500',
  },
  summaryClearIcon: {
    width: 32,
    height: 32,
    margin: 0,
  },
  emptyCard: {
    backgroundColor: darkTheme.colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    color: darkTheme.colors.onSurfaceVariant,
    fontSize: 16,
  },
});

