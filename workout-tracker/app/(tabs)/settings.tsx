import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, List, Divider, Portal, Dialog, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/stores/workoutStore';
import { isDurationBasedExercise } from '@/types/workout';
import { darkTheme } from '@/constants/theme';
import { exportToJson, filterWorkoutsByDateRange } from '@/utils/export';

export default function SettingsScreen() {
  const { getAllWorkouts } = useWorkoutStore();
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportRange, setExportRange] = useState<'all' | 'week' | 'month'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const workouts = getAllWorkouts();

  const getDateRange = (range: 'all' | 'week' | 'month') => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];

    if (range === 'all') {
      return { start: '1970-01-01', end: endDate };
    }

    const startDate = new Date();
    if (range === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setMonth(today.getMonth() - 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate,
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { start, end } = getDateRange(exportRange);
      const filteredWorkouts = exportRange === 'all'
        ? workouts
        : filterWorkoutsByDateRange(workouts, start, end);

      if (filteredWorkouts.length === 0) {
        Alert.alert('エクスポート', 'エクスポートするデータがありません。');
        return;
      }

      const success = await exportToJson(filteredWorkouts);
      if (success) {
        setExportDialogVisible(false);
      } else {
        Alert.alert('エラー', 'エクスポートに失敗しました。');
      }
    } catch (error) {
      Alert.alert('エラー', 'エクスポート中にエラーが発生しました。');
    } finally {
      setIsExporting(false);
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const currentYM = now.toISOString().slice(0, 7);
  const [monthYear, monthNumber] = currentYM.split('-');
  const monthStatsTitle = `${monthYear}年${Number(monthNumber)}月の統計`;

  const calcStatsSummary = (
    sourceWorkouts: typeof workouts,
    filter: { year?: number; month?: number }
  ) => {
    const filtered = sourceWorkouts.filter((workout) => {
      // filter by year/month when specified
      const workoutDate = workout.date instanceof Date ? workout.date : new Date(workout.date);
      if (Number.isNaN(workoutDate.getTime())) return false;
      if (filter.year !== undefined && workoutDate.getFullYear() !== filter.year) return false;
      if (filter.month !== undefined && workoutDate.getMonth() + 1 !== filter.month) return false;
      return true;
    });

    return filtered.reduce(
      (acc, workout) => {
        acc.days += 1;
        acc.exercises += workout.exercises.length;
        acc.sets += workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
        acc.workoutTimerSeconds += workout.durationSeconds || 0;
        acc.durationExerciseSeconds += workout.exercises
          .filter((e) => isDurationBasedExercise(e.type))
          .reduce((sum, e) => sum + (e.duration || 0), 0);
        if (workout.restIntervalSeconds !== undefined) {
          acc.restIntervalSecondsSum += workout.restIntervalSeconds;
          acc.restIntervalSecondsCount += 1;
        }
        return acc;
      },
      {
        days: 0,
        exercises: 0,
        sets: 0,
        workoutTimerSeconds: 0,
        durationExerciseSeconds: 0,
        restIntervalSecondsSum: 0,
        restIntervalSecondsCount: 0,
      }
    );
  };

  const yearStats = calcStatsSummary(workouts, { year });
  const yearTotalSeconds = yearStats.workoutTimerSeconds + yearStats.durationExerciseSeconds;

  const monthStats = calcStatsSummary(workouts, { year: Number(monthYear), month: Number(monthNumber) });
  const monthTotalSeconds = monthStats.workoutTimerSeconds + monthStats.durationExerciseSeconds;
  const monthAvgRestSeconds =
    monthStats.restIntervalSecondsCount > 0
      ? Math.round(monthStats.restIntervalSecondsSum / monthStats.restIntervalSecondsCount)
      : undefined;

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
    return `${mins}分${secs}秒`;
  };

  const statColors = {
    days: darkTheme.colors.strength,
    exercises: darkTheme.colors.duration,
    sets: darkTheme.colors.accent,
    strength: darkTheme.colors.strength,
    cardio: darkTheme.colors.duration,
    total: darkTheme.colors.accent,
    rest: darkTheme.colors.textSecondary,
  };

  const renderStatItem = (label: string, value: string | number, color: string) => (
    <View key={label} style={styles.statItem}>
      <View style={[styles.statAccent, { backgroundColor: color }]} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>今年（{year}年）の統計</Text>
            <View style={styles.statsGrid}>
              {renderStatItem('トレーニング日数', yearStats.days, statColors.days)}
              {renderStatItem('総種目数', yearStats.exercises, statColors.exercises)}
              {renderStatItem('総セット数', yearStats.sets, statColors.sets)}
              {renderStatItem('累計 筋トレ時間', formatDuration(yearStats.workoutTimerSeconds), statColors.strength)}
              {renderStatItem('累計 有酸素時間', formatDuration(yearStats.durationExerciseSeconds), statColors.cardio)}
              {renderStatItem('累計 合計時間', formatDuration(yearTotalSeconds), statColors.total)}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{monthStatsTitle}</Text>
            <View style={styles.statsGrid}>
              {renderStatItem('トレーニング日数', monthStats.days, statColors.days)}
              {renderStatItem('総種目数', monthStats.exercises, statColors.exercises)}
              {renderStatItem('総セット数', monthStats.sets, statColors.sets)}
              {renderStatItem('筋トレ時間', formatDuration(monthStats.workoutTimerSeconds), statColors.strength)}
              {renderStatItem('有酸素時間', formatDuration(monthStats.durationExerciseSeconds), statColors.cardio)}
              {renderStatItem('合計時間', formatDuration(monthTotalSeconds), statColors.total)}
              {monthAvgRestSeconds !== undefined &&
                renderStatItem('平均セット間休憩（目安）', formatMinSec(monthAvgRestSeconds), statColors.rest)}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>データ連携</Text>
          </Card.Content>
          <List.Item
            title="JSONエクスポート"
            description="AI分析用にデータをエクスポート"
            left={(props) => (
              <List.Icon {...props} icon="export" color={darkTheme.colors.primary} />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setExportDialogVisible(true)}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="エクスポート形式"
            description="JSON（AI分析に最適）"
            left={(props) => (
              <List.Icon {...props} icon="code-json" color={darkTheme.colors.secondary} />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>アプリ情報</Text>
          </Card.Content>
          <List.Item
            title="バージョン"
            description="1.0.0"
            left={(props) => (
              <List.Icon {...props} icon="information-outline" color={darkTheme.colors.onSurfaceVariant} />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="開発"
            description="Claude Code + Expo"
            left={(props) => (
              <List.Icon {...props} icon="code-tags" color={darkTheme.colors.onSurfaceVariant} />
            )}
            titleStyle={styles.listTitle}
            descriptionStyle={styles.listDescription}
          />
        </Card>

        <Card style={styles.tipCard}>
          <Card.Content style={styles.tipContent}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={24}
              color={darkTheme.colors.secondary}
            />
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipTitle}>AI分析のヒント</Text>
              <Text style={styles.tipText}>
                エクスポートしたJSONファイルをClaudeなどのAIに読み込ませることで、
                トレーニングの傾向分析や改善アドバイスを受けられます。
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={exportDialogVisible}
          onDismiss={() => setExportDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>データをエクスポート</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>エクスポート範囲を選択</Text>
            <RadioButton.Group
              value={exportRange}
              onValueChange={(value) => setExportRange(value as 'all' | 'week' | 'month')}
            >
              <RadioButton.Item
                label="すべてのデータ"
                value="all"
                labelStyle={styles.radioLabel}
              />
              <RadioButton.Item
                label="直近1週間"
                value="week"
                labelStyle={styles.radioLabel}
              />
              <RadioButton.Item
                label="直近1ヶ月"
                value="month"
                labelStyle={styles.radioLabel}
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExportDialogVisible(false)}>キャンセル</Button>
            <Button
              mode="contained"
              onPress={handleExport}
              loading={isExporting}
              disabled={isExporting}
            >
              エクスポート
            </Button>
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
    padding: 16,
  },
  statsCard: {
    backgroundColor: darkTheme.colors.surfaceVariant,
    marginBottom: 16,
  },
  card: {
    backgroundColor: darkTheme.colors.surface,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.colors.onSurface,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 8,
  },
  statAccent: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: darkTheme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: darkTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  listTitle: {
    color: darkTheme.colors.onSurface,
  },
  listDescription: {
    color: darkTheme.colors.onSurfaceVariant,
  },
  divider: {
    backgroundColor: darkTheme.colors.outline,
  },
  tipCard: {
    backgroundColor: darkTheme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: darkTheme.colors.secondary,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.colors.onSurface,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: darkTheme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  dialog: {
    backgroundColor: darkTheme.colors.surface,
  },
  dialogText: {
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  radioLabel: {
    color: darkTheme.colors.onSurface,
  },
});
