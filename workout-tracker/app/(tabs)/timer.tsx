import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Vibration } from 'react-native';
import { Text, Button, SegmentedButtons, Card, IconButton } from 'react-native-paper';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme } from '@/constants/theme';

export default function TimerScreen() {
  const { timerSettings, updateTimerSettings } = useWorkoutStore();
  const [mode, setMode] = useState<'interval' | 'metronome'>('interval');

  // Interval Timer State
  const [intervalTime, setIntervalTime] = useState(timerSettings.intervalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timerSettings.intervalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Metronome State
  const [bpm, setBpm] = useState(timerSettings.metronomeBpm);
  const [beats, setBeats] = useState<3 | 4 | 8>(timerSettings.metronomeBeats);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const intervalOptions = [30, 45, 60, 90, 120, 180, 300];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, []);

  // Interval Timer Logic
  useEffect(() => {
    if (isRunning && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            Vibration.vibrate([0, 500, 200, 500]);
            playSound();
            return intervalTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, intervalTime]);

  // Metronome Logic
  useEffect(() => {
    if (isMetronomeRunning) {
      const intervalMs = (60 / bpm) * 1000;
      metronomeRef.current = setInterval(() => {
        setCurrentBeat((prev) => (prev + 1) % beats);
        playClick();
      }, intervalMs);
    } else {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      setCurrentBeat(0);
    }

    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [isMetronomeRunning, bpm, beats]);

  const playSound = async () => {
    // タイマー終了時はバイブレーションで通知
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
  };

  const playClick = async () => {
    try {
      Vibration.vibrate(10);
    } catch {
      // Silently fail
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterval = () => {
    setRemainingTime(intervalTime);
    setIsRunning(true);
  };

  const stopInterval = () => {
    setIsRunning(false);
    setRemainingTime(intervalTime);
  };

  const selectIntervalTime = (seconds: number) => {
    setIntervalTime(seconds);
    setRemainingTime(seconds);
    updateTimerSettings({ intervalSeconds: seconds });
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(120, bpm + delta));
    setBpm(newBpm);
    updateTimerSettings({ metronomeBpm: newBpm });
  };

  const cycleBeats = () => {
    const newBeats: 3 | 4 | 8 = beats === 3 ? 4 : beats === 4 ? 8 : 3;
    setBeats(newBeats);
    updateTimerSettings({ metronomeBeats: newBeats });
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as 'interval' | 'metronome')}
        buttons={[
          { value: 'interval', label: 'インターバル' },
          { value: 'metronome', label: 'メトロノーム' },
        ]}
        style={styles.segmentedButtons}
      />

      {mode === 'interval' ? (
        <View style={styles.content}>
          <Card style={styles.timerCard}>
            <Card.Content style={styles.timerContent}>
              <Text style={styles.timerDisplay}>{formatTime(remainingTime)}</Text>
              <Text style={styles.timerLabel}>
                {isRunning ? '残り時間' : '設定時間'}
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.buttonRow}>
            {!isRunning ? (
              <Button
                mode="contained"
                onPress={startInterval}
                style={styles.mainButton}
                contentStyle={styles.mainButtonContent}
                icon="play"
              >
                スタート
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={stopInterval}
                style={[styles.mainButton, styles.stopButton]}
                contentStyle={styles.mainButtonContent}
                icon="stop"
              >
                ストップ
              </Button>
            )}
          </View>

          <Text style={styles.sectionTitle}>休憩時間を選択</Text>
          <View style={styles.intervalOptions}>
            {intervalOptions.map((seconds) => (
              <Button
                key={seconds}
                mode={intervalTime === seconds ? 'contained' : 'outlined'}
                onPress={() => selectIntervalTime(seconds)}
                style={styles.intervalButton}
                compact
              >
                {formatTime(seconds)}
              </Button>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.timerCard}>
            <Card.Content style={styles.metronomeContent}>
              <Text style={styles.bpmDisplay}>{bpm}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>

              <View style={styles.beatIndicators}>
                {Array.from({ length: beats }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.beatDot,
                      currentBeat === i && isMetronomeRunning && styles.beatDotActive,
                      i === 0 && styles.beatDotFirst,
                    ]}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>

          <View style={styles.bpmControls}>
            <IconButton
              icon="minus"
              mode="contained"
              onPress={() => adjustBpm(-5)}
              size={32}
            />
            <IconButton
              icon="minus"
              mode="outlined"
              onPress={() => adjustBpm(-1)}
              size={24}
            />
            <IconButton
              icon="plus"
              mode="outlined"
              onPress={() => adjustBpm(1)}
              size={24}
            />
            <IconButton
              icon="plus"
              mode="contained"
              onPress={() => adjustBpm(5)}
              size={32}
            />
          </View>

          <Button
            mode="outlined"
            onPress={cycleBeats}
            style={styles.beatsButton}
          >
            {beats}拍子
          </Button>

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={() => setIsMetronomeRunning(!isMetronomeRunning)}
              style={[styles.mainButton, isMetronomeRunning && styles.stopButton]}
              contentStyle={styles.mainButtonContent}
              icon={isMetronomeRunning ? 'stop' : 'play'}
            >
              {isMetronomeRunning ? 'ストップ' : 'スタート'}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    padding: 16,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  timerCard: {
    backgroundColor: darkTheme.colors.surface,
    width: '100%',
    marginBottom: 24,
  },
  timerContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  metronomeContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '200',
    color: darkTheme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: darkTheme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  bpmDisplay: {
    fontSize: 80,
    fontWeight: '200',
    color: darkTheme.colors.primary,
  },
  bpmLabel: {
    fontSize: 18,
    color: darkTheme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  beatIndicators: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  beatDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  beatDotActive: {
    backgroundColor: darkTheme.colors.primary,
    transform: [{ scale: 1.3 }],
  },
  beatDotFirst: {
    backgroundColor: darkTheme.colors.secondary,
  },
  bpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  beatsButton: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  mainButton: {
    flex: 1,
    backgroundColor: darkTheme.colors.primary,
  },
  mainButtonContent: {
    paddingVertical: 12,
  },
  stopButton: {
    backgroundColor: darkTheme.colors.error,
  },
  sectionTitle: {
    fontSize: 16,
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  intervalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  intervalButton: {
    minWidth: 70,
  },
});
