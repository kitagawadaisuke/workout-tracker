import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, TextInput, Chip, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme, colors, calendarTheme } from '@/constants/theme';
import { ExerciseType, EXERCISE_NAMES, EXERCISE_ICONS, isDurationBasedExercise, DURATION_PRESETS } from '@/types/workout';

export default function HomeScreen() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [, setTimerTick] = useState(0);
  const {
    selectedDate,
    setSelectedDate,
    workoutTimerRunning,
    getWorkoutByDate,
    getSelectedWorkoutDurationSeconds,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    copySet,
    addSetEntry,
    removeSetEntry,
    updateEntryReps,
    updateEntryWeight,
    updateEntryVariation,
    updateEntryTempo,
    toggleEntryAssistance,
    toggleSetCompleted,
    updateDurationMinutes,
  } = useWorkoutStore();

  const selectedWorkout = getWorkoutByDate(selectedDate);
  const exercises = selectedWorkout?.exercises || [];

  const exerciseTypes: ExerciseType[] = ['pushup', 'squat', 'pullup', 'bodypump', 'bodycombat', 'leapfight'];

  const handleAddExercise = (type: ExerciseType) => {
    addExercise(type);
    setDialogVisible(false);
  };

  const getExerciseColor = (type: ExerciseType) => {
    return colors[type] || colors.strength;
  };

  const getExerciseIcon = (type: ExerciseType): string => {
    return EXERCISE_ICONS[type] || 'dumbbell';
  };

  useEffect(() => {
    if (!workoutTimerRunning) return;
    const intervalId = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [workoutTimerRunning]);

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const workoutDurationSeconds = getSelectedWorkoutDurationSeconds();

  const toggleEntryDetail = (key: string) => {
    setExpandedEntries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Button
            mode="text"
            onPress={() => setDatePickerVisible(true)}
            compact
            textColor={darkTheme.colors.onSurfaceVariant}
          >
            日付変更
          </Button>
        </View>
        <Text style={styles.durationText}>筋トレ時間 {formatDuration(workoutDurationSeconds)}</Text>

        {exercises.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={darkTheme.colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>今日のトレーニングを追加しましょう</Text>
            </Card.Content>
          </Card>
        ) : (
          exercises.map((exercise) => (
            <Card key={exercise.id} style={[styles.exerciseCard, { borderLeftColor: getExerciseColor(exercise.type) }]}>
              <Card.Title
                title={exercise.name}
                titleStyle={styles.exerciseTitle}
                left={() => (
                  <MaterialCommunityIcons
                    name={getExerciseIcon(exercise.type) as any}
                    size={24}
                    color={getExerciseColor(exercise.type)}
                  />
                )}
                right={() => (
                  <IconButton
                    icon="delete-outline"
                    iconColor={darkTheme.colors.error}
                    onPress={() => removeExercise(exercise.id)}
                  />
                )}
              />
              <Card.Content>
                {isDurationBasedExercise(exercise.type) ? (
                  <View>
                    <Text style={styles.setLabel}>時間を入力</Text>
                    <View style={styles.durationButtons}>
                      {DURATION_PRESETS.map((mins) => (
                        <Chip
                          key={mins}
                          mode={exercise.durationMinutes === mins ? 'flat' : 'outlined'}
                          selected={exercise.durationMinutes === mins}
                          onPress={() => updateDurationMinutes(exercise.id, mins)}
                          style={[
                            styles.durationChip,
                            exercise.durationMinutes === mins && { backgroundColor: getExerciseColor(exercise.type) }
                          ]}
                          textStyle={exercise.durationMinutes === mins ? { color: '#fff' } : { color: darkTheme.colors.onSurface }}
                        >
                          {mins}分
                        </Chip>
                      ))}
                    </View>
                  </View>
                ) : (
                  <>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setContainer}>
                        <View style={styles.setHeader}>
                          <Text style={styles.setLabel}>セット {setIndex + 1}</Text>
                          <View style={styles.setActions}>
                            <IconButton
                              icon="content-copy"
                              iconColor={darkTheme.colors.onSurfaceVariant}
                              size={18}
                              onPress={() => copySet(exercise.id, setIndex)}
                            />
                            <IconButton
                              icon={set.completed ? 'check-circle' : 'circle-outline'}
                              iconColor={set.completed ? '#22c55e' : darkTheme.colors.onSurfaceVariant}
                              size={20}
                              onPress={() => toggleSetCompleted(exercise.id, setIndex)}
                            />
                            <IconButton
                              icon="close"
                              iconColor={darkTheme.colors.error}
                              size={18}
                              onPress={() => removeSet(exercise.id, setIndex)}
                            />
                          </View>
                        </View>

                        {set.entries.map((entry, entryIndex) => {
                          const key = `${exercise.id}-${setIndex}-${entryIndex}`;
                          const isOpen = !!expandedEntries[key];
                          return (
                            <View key={entryIndex} style={styles.entryContainer}>
                              {set.entries.length > 1 && (
                                <View style={styles.entryHeader}>
                                  <Text style={styles.entryLabel}>種目 {entryIndex + 1}</Text>
                                  <IconButton
                                    icon="close-circle-outline"
                                    iconColor={darkTheme.colors.onSurfaceVariant}
                                    size={16}
                                    onPress={() => removeSetEntry(exercise.id, setIndex, entryIndex)}
                                  />
                                </View>
                              )}

                              <View style={styles.compactRow}>
                                <TextInput
                                  mode="outlined"
                                  label="回数"
                                  value={entry.reps > 0 ? entry.reps.toString() : ''}
                                  onChangeText={(text) => updateEntryReps(exercise.id, setIndex, entryIndex, parseInt(text, 10) || 0)}
                                  placeholder="0"
                                  keyboardType="number-pad"
                                  style={styles.compactInput}
                                  outlineColor={darkTheme.colors.outline}
                                  activeOutlineColor={getExerciseColor(exercise.type)}
                                  dense
                                />

                                <TextInput
                                  mode="outlined"
                                  label="重量"
                                  value={entry.weight ? entry.weight.toString() : ''}
                                  onChangeText={(text) => {
                                    const weight = parseFloat(text);
                                    updateEntryWeight(
                                      exercise.id,
                                      setIndex,
                                      entryIndex,
                                      Number.isFinite(weight) ? weight : 0
                                    );
                                  }}
                                  placeholder="kg"
                                  keyboardType="decimal-pad"
                                  style={styles.compactInput}
                                  outlineColor={darkTheme.colors.outline}
                                  activeOutlineColor={getExerciseColor(exercise.type)}
                                  dense
                                />
                              </View>

                              <Button
                                mode="text"
                                onPress={() => toggleEntryDetail(key)}
                                compact
                                textColor={darkTheme.colors.onSurfaceVariant}
                                style={styles.detailToggle}
                                icon={isOpen ? 'chevron-up' : 'chevron-down'}
                              >
                                詳細
                              </Button>

                              {isOpen && (
                                <View style={styles.detailBlock}>
                                  <View style={styles.setRow}>
                                    <TextInput
                                      mode="outlined"
                                      label="バリエーション"
                                      value={entry.variation || ''}
                                      onChangeText={(text) => updateEntryVariation(exercise.id, setIndex, entryIndex, text)}
                                      placeholder="例: ナロー"
                                      style={styles.variationInput}
                                      outlineColor={darkTheme.colors.outline}
                                      activeOutlineColor={getExerciseColor(exercise.type)}
                                      dense
                                    />
                                  </View>

                                  <View style={styles.setRow}>
                                    <TextInput
                                      mode="outlined"
                                      label="テンポ"
                                      value={entry.tempo || ''}
                                      onChangeText={(text) => updateEntryTempo(exercise.id, setIndex, entryIndex, text)}
                                      placeholder="例: 2-1-2"
                                      style={styles.tempoInput}
                                      outlineColor={darkTheme.colors.outline}
                                      activeOutlineColor={getExerciseColor(exercise.type)}
                                      dense
                                    />

                                    {exercise.type === 'pullup' && (
                                      <Chip
                                        mode={entry.assistance ? 'flat' : 'outlined'}
                                        selected={entry.assistance}
                                        onPress={() => toggleEntryAssistance(exercise.id, setIndex, entryIndex)}
                                        style={[
                                          styles.assistanceChip,
                                          entry.assistance && { backgroundColor: getExerciseColor(exercise.type) }
                                        ]}
                                        textStyle={entry.assistance ? { color: '#fff' } : { color: darkTheme.colors.onSurface }}
                                        icon={entry.assistance ? 'check' : 'hand-back-left'}
                                      >
                                        補助あり
                                      </Chip>
                                    )}
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        <Button
                          mode="text"
                          icon="plus"
                          onPress={() => addSetEntry(exercise.id, setIndex)}
                          textColor={darkTheme.colors.onSurfaceVariant}
                          compact
                          style={styles.addEntryButton}
                        >
                          セット内追加
                        </Button>
                      </View>
                    ))}
                    <Button
                      mode="text"
                      icon="plus"
                      onPress={() => addSet(exercise.id)}
                      textColor={darkTheme.colors.primary}
                    >
                      セット追加
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Button
        mode="contained"
        icon="plus"
        onPress={() => setDialogVisible(true)}
        style={styles.addButton}
        contentStyle={styles.addButtonContent}
      >
        種目追加
      </Button>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>種目を選択</Dialog.Title>
          <Dialog.Content>
            <View style={styles.chipContainer}>
              {exerciseTypes.map((type) => (
                <Chip
                  key={type}
                  mode="outlined"
                  onPress={() => handleAddExercise(type)}
                  style={[styles.chip, { borderColor: getExerciseColor(type) }]}
                  textStyle={{ color: getExerciseColor(type) }}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={getExerciseIcon(type) as any}
                      size={18}
                      color={getExerciseColor(type)}
                    />
                  )}
                >
                  {EXERCISE_NAMES[type]}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>キャンセル</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={datePickerVisible} onDismiss={() => setDatePickerVisible(false)} style={styles.dialog}>
          <Dialog.Title>日付を選択</Dialog.Title>
          <Dialog.Content>
            <Calendar
              theme={calendarTheme}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: darkTheme.colors.primary,
                },
              }}
              onDayPress={(day: DateData) => {
                setSelectedDate(day.dateString);
                setDatePickerVisible(false);
              }}
              enableSwipeMonths
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDatePickerVisible(false)}>キャンセル</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  dateText: {
    fontSize: 18,
    color: darkTheme.colors.onSurface,
    marginBottom: 16,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 16,
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
  exerciseCard: {
    backgroundColor: darkTheme.colors.surface,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  exerciseTitle: {
    color: darkTheme.colors.onSurface,
    fontWeight: '600',
  },
  setContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.outline,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryContainer: {
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryLabel: {
    color: darkTheme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  compactInput: {
    flex: 1,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  detailToggle: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  detailBlock: {
    marginBottom: 4,
  },
  setLabel: {
    color: darkTheme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  repsInput: {
    width: 80,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  variationInput: {
    flex: 1,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  tempoInput: {
    width: 100,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  assistanceChip: {
    marginLeft: 8,
  },
  addEntryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  durationChip: {
    marginRight: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: darkTheme.colors.primary,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
  dialog: {
    backgroundColor: darkTheme.colors.surface,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
});
