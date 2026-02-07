import React, { useEffect, useMemo, useRef, useState } from 'react';





import { View, ScrollView, StyleSheet, Modal, Pressable, Animated, Dimensions, Alert } from 'react-native';





import { Text, Card, Button, IconButton, TextInput, Chip, Portal, Dialog, SegmentedButtons, Menu } from 'react-native-paper';





import { MaterialCommunityIcons } from '@expo/vector-icons';





import { Calendar, DateData } from 'react-native-calendars';





import { useSafeAreaInsets } from 'react-native-safe-area-context';





import { useWorkoutStore } from '@/stores/workoutStore';





import { darkTheme, calendarTheme } from '@/constants/theme';





import { ExerciseType, EXERCISE_NAMES, isDurationBasedExercise, DURATION_PRESETS } from '@/types/workout';





import { getExerciseColor as getExerciseColorFromName } from '@/utils/exerciseColor';
import { getExerciseColorForType, getExerciseIconForType } from '@/utils/exerciseStyle';











export default function HomeScreen() {





  const [dialogVisible, setDialogVisible] = useState(false);





  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);





  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});





  const [, setTimerTick] = useState(0);





  const [searchInput, setSearchInput] = useState('');





  const [searchQuery, setSearchQuery] = useState('');





  const [activeTab, setActiveTab] = useState<'recent' | 'favorite' | 'all'>('recent');





  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [isAddExerciseVisible, setIsAddExerciseVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseKind, setNewExerciseKind] = useState<'strength' | 'cardio' | 'machine' | 'freeweight'>('strength');





  const sheetTranslateY = useRef(new Animated.Value(0)).current;





  const sheetHeight = useRef(Dimensions.get('window').height * 0.7).current;





  const insets = useSafeAreaInsets();





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





    toggleExerciseFavorite,





    updateExerciseLastUsed,
    addCustomExercise,
    removeCustomExercise,
    clearSelectedWorkoutExercises,






    exercisePreferences,
    customExercises,





  } = useWorkoutStore();











  const selectedWorkout = getWorkoutByDate(selectedDate);





  const exercises = selectedWorkout?.exercises || [];

















  const handleAddExercise = (type: ExerciseType) => {





    updateExerciseLastUsed(type);





    addExercise(type);





    closeSheet();





  };











  const getExerciseColor = (type: ExerciseType) => getExerciseColorForType(type);











  const getExerciseIcon = (type: ExerciseType): string => getExerciseIconForType(type);











  useEffect(() => {





    if (!workoutTimerRunning) return;





    const intervalId = setInterval(() => {





      setTimerTick((tick) => tick + 1);





    }, 1000);





    return () => clearInterval(intervalId);





  }, [workoutTimerRunning]);











  useEffect(() => {





    const timeout = setTimeout(() => {





      setSearchQuery(searchInput.trim());





    }, 150);





    return () => clearTimeout(timeout);





  }, [searchInput]);











  useEffect(() => {





    if (!dialogVisible) return;





    sheetTranslateY.setValue(sheetHeight);





    Animated.timing(sheetTranslateY, {





      toValue: 0,





      duration: 220,





      useNativeDriver: true,





    }).start();





  }, [dialogVisible, sheetHeight, sheetTranslateY]);











  const closeSheet = () => {





    Animated.timing(sheetTranslateY, {





      toValue: sheetHeight,





      duration: 180,





      useNativeDriver: true,





    }).start(() => {





      setDialogVisible(false);





      setSearchInput('');





      setSearchQuery('');





    });





  };











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











  const exerciseCatalog = useMemo(() => {
    const customItems = customExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.kind === 'strength' ? '筋トレ' : exercise.kind === 'cardio' ? '有酸素' : exercise.kind === 'machine' ? 'マシン' : exercise.kind === 'freeweight' ? 'フリーウェイト' : '筋トレ',
      isCustom: true,
    }));

    return [
      { id: 'pushup', name: EXERCISE_NAMES.pushup, category: '自重トレ', isCustom: false },
      { id: 'squat', name: EXERCISE_NAMES.squat, category: '自重トレ', isCustom: false },
      { id: 'pullup', name: EXERCISE_NAMES.pullup, category: '自重トレ', isCustom: false },
      { id: 'bodypump', name: EXERCISE_NAMES.bodypump, category: 'スタジオ', isCustom: false },
      { id: 'bodycombat', name: EXERCISE_NAMES.bodycombat, category: 'スタジオ', isCustom: false },
      { id: 'leapfight', name: EXERCISE_NAMES.leapfight, category: 'スタジオ', isCustom: false },
      ...customItems,
    ];
  }, [customExercises]);











  const categories = useMemo(() => {





    const set = new Set(exerciseCatalog.map((item) => item.category));





    return Array.from(set);





  }, [exerciseCatalog]);











  const filteredExercises = useMemo(() => {





    let list = exerciseCatalog;





    if (searchQuery.length > 0) {





      const q = searchQuery.toLowerCase();





      list = list.filter((item) => item.name.toLowerCase().includes(q));





    } else if (activeTab === 'all' && activeCategory) {





      list = list.filter((item) => item.category === activeCategory);





    }











    if (activeTab === 'recent') {





      list = [...list].sort((a, b) => {





        const aTime = exercisePreferences[a.id]?.lastUsedAt || 0;





        const bTime = exercisePreferences[b.id]?.lastUsedAt || 0;





        return bTime - aTime;





      });





    } else if (activeTab === 'favorite') {





      list = [...list].sort((a, b) => {





        const aFav = exercisePreferences[a.id]?.isFavorite ? 1 : 0;





        const bFav = exercisePreferences[b.id]?.isFavorite ? 1 : 0;





        if (aFav !== bFav) return bFav - aFav;





        return a.name.localeCompare(b.name, 'ja-JP');





      });





    } else {





      list = [...list].sort((a, b) => {





        const cat = (a.category || '').localeCompare(b.category || '', 'ja-JP');





        if (cat !== 0) return cat;





        return a.name.localeCompare(b.name, 'ja-JP');





      });





    }





    return list;





  }, [exerciseCatalog, searchQuery, activeTab, activeCategory, exercisePreferences]);











  return (





    <View style={styles.container}>





      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>





        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={styles.dateActions}>
            <Button
              mode="text"
              onPress={() => setDatePickerVisible(true)}
              compact
              textColor={darkTheme.colors.onSurfaceVariant}
            >
              日付変更
            </Button>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={(
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                  iconColor={darkTheme.colors.onSurfaceVariant}
                  accessibilityLabel="メニュー"
                />
              )}
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                title="この日のトレーニングをリセット"
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert(
                    'この日のトレーニングをリセット',
                    '登録されている種目・セットをすべて削除します。',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '削除', style: 'destructive', onPress: clearSelectedWorkoutExercises },
                    ]
                  );
                }}
              />
            </Menu>
          </View>
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
          <React.Fragment>
            {exercises.map((exercise) => (





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





                {(isDurationBasedExercise(exercise.type) || exercise.duration !== undefined) ? (





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





                          {mins}分</Chip>





                      ))}





                    </View>





                  </View>





                ) : (





                  <React.Fragment>





                    {exercise.sets.map((set, setIndex) => (





                      <View key={setIndex} style={styles.setContainer}>





                        <View style={styles.setHeader}>





                          <Text style={styles.setLabel}>セット {setIndex + 1}</Text>
                          {set.completed && (
                            <Text style={styles.setStatus}>
                              完了
                            </Text>
                          )}





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

                              {(
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





                  </React.Fragment>





                )}





              </Card.Content>





            </Card>





          ))}
          </React.Fragment>





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





      <Modal visible={dialogVisible} transparent animationType="none" onRequestClose={closeSheet}>





        <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />





        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}>





          <View style={[styles.sheetContent, { paddingBottom: Math.max(12, insets.bottom) }]}>





            <View style={styles.sheetHeader}>





              <Text style={styles.sheetTitle}>種目を選択</Text>





              <IconButton icon="close" size={20} onPress={closeSheet} />





            </View>

            <Button
              mode="outlined"
              icon="plus"
              onPress={() => {
                closeSheet();
                setTimeout(() => setIsAddExerciseVisible(true), 350);
              }}
              style={styles.addExerciseButton}
              compact
            >
              新しい種目を追加
            </Button>











            <TextInput





              mode="outlined"





              placeholder=""





              value={searchInput}





              onChangeText={setSearchInput}





              style={styles.searchInput}





              outlineColor={darkTheme.colors.outline}





              activeOutlineColor={darkTheme.colors.primary}





              dense





            />











            <SegmentedButtons





              value={activeTab}





              onValueChange={(value) => setActiveTab(value as 'recent' | 'favorite' | 'all')}





              buttons={[





                { value: 'recent', label: '最近' },





                { value: 'favorite', label: 'お気に入り' },





                { value: 'all', label: '全て' },





              ]}





              theme={{





                colors: {





                  secondaryContainer: darkTheme.colors.surface,





                  onSecondaryContainer: darkTheme.colors.textPrimary,





                  outline: darkTheme.colors.outline,





                },





              }}





              style={styles.segmentedButtons}





            />











            {activeTab === 'all' && searchQuery.length === 0 && (





              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>





                <Chip





                  mode={activeCategory === null ? 'flat' : 'outlined'}





                  onPress={() => setActiveCategory(null)}





                  style={styles.categoryChip}





                >





                  全て




                </Chip>





                {categories.map((cat) => (





                  <Chip





                    key={cat}





                    mode={activeCategory === cat ? 'flat' : 'outlined'}





                    onPress={() => setActiveCategory(cat)}





                    style={styles.categoryChip}





                  >





                    {cat}





                  </Chip>





                ))}





              </ScrollView>





            )}











            <ScrollView style={styles.sheetList}>





              {filteredExercises.map((item) => {





                const color = getExerciseColorFromName(item.name);





                const isFavorite = !!exercisePreferences[item.id]?.isFavorite;





                return (





                  <Pressable





                    key={item.id}





                    style={styles.exerciseRow}





                    onPress={() => handleAddExercise(item.id as ExerciseType)}





                  >





                    <View style={[styles.exerciseAccent, { backgroundColor: color }]} />





                    <View style={styles.exerciseMain}>





                      <MaterialCommunityIcons





                        name={getExerciseIcon(item.id as ExerciseType) as any}





                        size={20}





                        color={color}





                      />





                      <View style={styles.exerciseText}>





                        <Text style={styles.exerciseRowTitle}>{item.name}</Text>





                        {item.category ? (
                          <Text style={styles.exerciseCategory}>{item.category}</Text>
                        ) : null}





                      </View>





                    </View>





                    <IconButton





                      icon={isFavorite ? 'star' : 'star-outline'}





                      iconColor={isFavorite ? darkTheme.colors.accent : darkTheme.colors.mutedText}





                      size={20}





                      onPress={() => toggleExerciseFavorite(item.id)}





                    />
                    {item.isCustom && (                      <IconButton                        icon="delete-outline"                        iconColor={darkTheme.colors.error}                        size={20}                        onPress={() => {                          Alert.alert(                            '種目を削除',                            `「${item.name}」を削除しますか？`,                            [                              { text: 'キャンセル', style: 'cancel' },                              {                                text: '削除',                                style: 'destructive',                                onPress: () => removeCustomExercise(item.id),                              },                            ]                          );                        }}                      />                    )}





                  </Pressable>





                );





              })}





            </ScrollView>





          </View>





        </Animated.View>





      </Modal>











      <Portal>
      <Dialog
        visible={isAddExerciseVisible}
        onDismiss={() => setIsAddExerciseVisible(false)}
        style={styles.dialog}
      >
        <Dialog.Title>新しい種目を追加</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label="種目名"
            value={newExerciseName}
            onChangeText={(text) => setNewExerciseName(text)}
            style={styles.addExerciseInput}
            outlineColor={darkTheme.colors.outline}
            activeOutlineColor={darkTheme.colors.primary}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="default"
            textContentType="none"
            returnKeyType="done"
            selectTextOnFocus={false}
            dense
          />
          <SegmentedButtons
            value={newExerciseKind}
            onValueChange={(value) => setNewExerciseKind(value as "strength" | "cardio" | "machine" | "freeweight")}
            buttons={[
              { value: "strength", label: "筋トレ" },
              { value: "cardio", label: "有酸素" },
              { value: "machine", label: "マシン" },
              { value: "freeweight", label: "フリーウェイト" },
            ]}
            style={styles.addExerciseSegments}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => {
            setIsAddExerciseVisible(false);
            setNewExerciseName("");
            setNewExerciseKind("strength");
          }}>キャンセル</Button>
          <Button
            onPress={() => {
              try {
                const trimmed = newExerciseName.trim();
                if (!trimmed) return;
                addCustomExercise(trimmed, newExerciseKind);
                setIsAddExerciseVisible(false);
                setNewExerciseName("");
                setNewExerciseKind("strength");
                setActiveTab("all");
                setActiveCategory(null);
                setSearchInput("");
                setSearchQuery("");
              } catch (error) {
                console.error('[ERROR] 種目追加失敗:', error);
              }
            }}
            disabled={!newExerciseName.trim()}
          >
            保存
          </Button>
        </Dialog.Actions>
      </Dialog>






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

  dateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuContent: {
    backgroundColor: darkTheme.colors.surface,
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
  setStatus: {
    marginLeft: 8,
    color: darkTheme.colors.onSurfaceVariant,
    fontSize: 12,
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





    flexWrap: 'wrap',





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





  sheetBackdrop: {





    flex: 1,





    backgroundColor: 'rgba(0,0,0,0.45)',





  },





  sheetContainer: {





    position: 'absolute',





    left: 0,





    right: 0,





    bottom: 0,





    height: '70%',





    backgroundColor: darkTheme.colors.surface,





    borderTopLeftRadius: 20,





    borderTopRightRadius: 20,





    overflow: 'hidden',





  },





  sheetContent: {





    flex: 1,





    padding: 16,





  },





  sheetHeader: {





    flexDirection: 'row',





    alignItems: 'center',





    justifyContent: 'space-between',





    marginBottom: 8,





  },





  sheetTitle: {





    fontSize: 16,





    fontWeight: '600',





    color: darkTheme.colors.onSurface,





  },





  searchInput: {





    backgroundColor: darkTheme.colors.surfaceVariant,





    marginBottom: 12,





  },
  addExerciseButton: {
    marginBottom: 12,
  },
  addExerciseInput: {
    backgroundColor: darkTheme.colors.surfaceVariant,
    marginBottom: 12,
  },
  addExerciseSegments: {
    marginBottom: 4,
  },





  segmentedButtons: {





    marginBottom: 12,





  },





  categoryRow: {





    marginBottom: 12,





  },





  categoryChip: {





    marginRight: 8,





  },





  sheetList: {





    flex: 1,





  },





  exerciseRow: {





    flexDirection: 'row',





    alignItems: 'center',





    paddingVertical: 10,





    borderBottomWidth: 1,





    borderBottomColor: darkTheme.colors.outline,





  },





  exerciseAccent: {





    width: 3,





    alignSelf: 'stretch',





    borderRadius: 2,





    marginRight: 12,





  },





  exerciseMain: {





    flex: 1,





    flexDirection: 'row',





    alignItems: 'center',





    gap: 12,





  },





  exerciseText: {





    flex: 1,





  },





  exerciseRowTitle: {





    fontSize: 15,





    color: darkTheme.colors.onSurface,





    fontWeight: '600',





  },





  exerciseCategory: {





    fontSize: 12,





    color: darkTheme.colors.onSurfaceVariant,





    marginTop: 2,





  },});






















