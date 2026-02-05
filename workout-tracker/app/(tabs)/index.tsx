import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, TextInput, Chip, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme, colors } from '@/constants/theme';
import { ExerciseType, EXERCISE_NAMES } from '@/types/workout';

export default function HomeScreen() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const { getTodayWorkout, addExercise, removeExercise, addSet, removeSet, updateSetReps, toggleSetCompleted, updateCardioDuration } = useWorkoutStore();

  const todayWorkout = getTodayWorkout();
  const exercises = todayWorkout?.exercises || [];

  const exerciseTypes: ExerciseType[] = ['pushup', 'squat', 'pullup', 'cardio'];

  const handleAddExercise = (type: ExerciseType) => {
    addExercise(type);
    setDialogVisible(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseDuration = (text: string): number => {
    const parts = text.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    return parseInt(text, 10) || 0;
  };

  const getExerciseColor = (type: ExerciseType) => {
    return colors[type] || colors.strength;
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
                left={(props) => (
                  <MaterialCommunityIcons
                    name={exercise.type === 'cardio' ? 'run' : 'arm-flex'}
                    size={24}
                    color={getExerciseColor(exercise.type)}
                  />
                )}
                right={(props) => (
                  <IconButton
                    icon="delete-outline"
                    iconColor={darkTheme.colors.error}
                    onPress={() => removeExercise(exercise.id)}
                  />
                )}
              />
              <Card.Content>
                {exercise.type === 'cardio' ? (
                  <View style={styles.cardioInput}>
                    <Text style={styles.setLabel}>運動時間</Text>
                    <TextInput
                      mode="outlined"
                      value={formatDuration(exercise.duration || 0)}
                      onChangeText={(text) => updateCardioDuration(exercise.id, parseDuration(text))}
                      placeholder="0:00"
                      keyboardType="numbers-and-punctuation"
                      style={styles.durationInput}
                      outlineColor={darkTheme.colors.outline}
                      activeOutlineColor={getExerciseColor(exercise.type)}
                    />
                    <Text style={styles.unitText}>分:秒</Text>
                  </View>
                ) : (
                  <>
                    {exercise.sets.map((set, index) => (
                      <View key={index} style={styles.setRow}>
                        <Text style={styles.setLabel}>セット {index + 1}</Text>
                        <TextInput
                          mode="outlined"
                          value={set.reps > 0 ? set.reps.toString() : ''}
                          onChangeText={(text) => updateSetReps(exercise.id, index, parseInt(text, 10) || 0)}
                          placeholder="0"
                          keyboardType="number-pad"
                          style={styles.repsInput}
                          outlineColor={darkTheme.colors.outline}
                          activeOutlineColor={getExerciseColor(exercise.type)}
                        />
                        <Text style={styles.unitText}>回</Text>
                        <IconButton
                          icon={set.completed ? 'check-circle' : 'circle-outline'}
                          iconColor={set.completed ? '#22c55e' : darkTheme.colors.onSurfaceVariant}
                          onPress={() => toggleSetCompleted(exercise.id, index)}
                        />
                        <IconButton
                          icon="close"
                          iconColor={darkTheme.colors.error}
                          size={20}
                          onPress={() => removeSet(exercise.id, index)}
                        />
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
                      name={type === 'cardio' ? 'run' : type === 'pullup' ? 'human-handsup' : type === 'squat' ? 'human' : 'arm-flex'}
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setLabel: {
    color: darkTheme.colors.onSurfaceVariant,
    width: 70,
  },
  repsInput: {
    width: 80,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  durationInput: {
    width: 100,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  unitText: {
    color: darkTheme.colors.onSurfaceVariant,
    marginLeft: 8,
    marginRight: 8,
  },
  cardioInput: {
    flexDirection: 'row',
    alignItems: 'center',
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
