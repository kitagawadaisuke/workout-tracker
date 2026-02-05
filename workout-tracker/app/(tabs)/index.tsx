import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, TextInput, Chip, Portal, Dialog, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme, colors } from '@/constants/theme';
import { ExerciseType, EXERCISE_NAMES, EXERCISE_ICONS, isDurationBasedExercise, DURATION_PRESETS } from '@/types/workout';

export default function HomeScreen() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const {
    getTodayWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSetReps,
    updateSetVariation,
    updateSetTempo,
    toggleSetAssistance,
    toggleSetCompleted,
    updateDurationMinutes,
  } = useWorkoutStore();

  const todayWorkout = getTodayWorkout();
  const exercises = todayWorkout?.exercises || [];

  const exerciseTypes: ExerciseType[] = ['pushup', 'squat', 'pullup', 'cardio', 'bodypump', 'bodycombat', 'leapfight'];

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

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dateText}>{today}</Text>

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
                    <Text style={styles.setLabel}>時間を選択</Text>
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
                    {exercise.sets.map((set, index) => (
                      <View key={index} style={styles.setContainer}>
                        <View style={styles.setHeader}>
                          <Text style={styles.setLabel}>セット {index + 1}</Text>
                          <View style={styles.setActions}>
                            <IconButton
                              icon={set.completed ? 'check-circle' : 'circle-outline'}
                              iconColor={set.completed ? '#22c55e' : darkTheme.colors.onSurfaceVariant}
                              size={20}
                              onPress={() => toggleSetCompleted(exercise.id, index)}
                            />
                            <IconButton
                              icon="close"
                              iconColor={darkTheme.colors.error}
                              size={18}
                              onPress={() => removeSet(exercise.id, index)}
                            />
                          </View>
                        </View>

                        <View style={styles.setRow}>
                          <TextInput
                            mode="outlined"
                            label="回数"
                            value={set.reps > 0 ? set.reps.toString() : ''}
                            onChangeText={(text) => updateSetReps(exercise.id, index, parseInt(text, 10) || 0)}
                            placeholder="0"
                            keyboardType="number-pad"
                            style={styles.repsInput}
                            outlineColor={darkTheme.colors.outline}
                            activeOutlineColor={getExerciseColor(exercise.type)}
                            dense
                          />

                          <TextInput
                            mode="outlined"
                            label="バリエーション"
                            value={set.variation || ''}
                            onChangeText={(text) => updateSetVariation(exercise.id, index, text)}
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
                            value={set.tempo || ''}
                            onChangeText={(text) => updateSetTempo(exercise.id, index, text)}
                            placeholder="例: 2-1-2"
                            style={styles.tempoInput}
                            outlineColor={darkTheme.colors.outline}
                            activeOutlineColor={getExerciseColor(exercise.type)}
                            dense
                          />

                          {exercise.type === 'pullup' && (
                            <Chip
                              mode={set.assistance ? 'flat' : 'outlined'}
                              selected={set.assistance}
                              onPress={() => toggleSetAssistance(exercise.id, index)}
                              style={[
                                styles.assistanceChip,
                                set.assistance && { backgroundColor: getExerciseColor(exercise.type) }
                              ]}
                              textStyle={set.assistance ? { color: '#fff' } : { color: darkTheme.colors.onSurface }}
                              icon={set.assistance ? 'check' : 'hand-back-left'}
                            >
                              補助あり
                            </Chip>
                          )}
                        </View>
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
        種目を追加
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
    marginBottom: 8,
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
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
