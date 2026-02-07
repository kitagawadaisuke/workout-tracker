import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Vibration, Alert } from 'react-native';
import { Text, Button, SegmentedButtons, Card, IconButton, TextInput, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useWorkoutStore } from '@/stores/workoutStore';
import { darkTheme } from '@/constants/theme';
import { FeedbackMode } from '@/types/workout';

export default function TimerScreen() {
  const {
    timerSettings,
    updateTimerSettings,
    startWorkoutTimer,
    pauseWorkoutTimer,
    recordWorkoutTimer,
    resetWorkoutTimer,
    setRestIntervalSeconds,
    setMetronomeBpm,
    workoutTimerRunning,
    getSelectedWorkoutDurationSeconds,
  } = useWorkoutStore();
  const [mode, setMode] = useState<'interval' | 'metronome'>('interval');

  // Interval Timer State
  const [intervalTime, setIntervalTime] = useState(timerSettings.intervalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timerSettings.intervalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [, setDurationTick] = useState(0);
  const [restIntervalSnackbarVisible, setRestIntervalSnackbarVisible] = useState(false);
  const [restIntervalMessage, setRestIntervalMessage] = useState('');
  const [bpmSnackbarVisible, setBpmSnackbarVisible] = useState(false);
  const [bpmMessage, setBpmMessage] = useState('');

  // Metronome State
  const [bpm, setBpm] = useState(timerSettings.metronomeBpm);
  const [beats, setBeats] = useState<4 | 8>(timerSettings.metronomeBeats);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [barCount, setBarCount] = useState(0);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Feedback mode
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(timerSettings.feedbackMode || 'both');

  // Audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const clickSoundRef = useRef<Audio.Sound | null>(null);
  const accentSoundRef = useRef<Audio.Sound | null>(null);

  const intervalOptions = [30, 60, 90];

  useEffect(() => {
    setupAudio();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      cleanupAudio();
      Speech.stop();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
    } catch {
      // Silently fail
    }
  };

  const cleanupAudio = async () => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      if (clickSoundRef.current) await clickSoundRef.current.unloadAsync();
      if (accentSoundRef.current) await accentSoundRef.current.unloadAsync();
    } catch {
      // Silently fail
    }
  };

  const playBeep = useCallback(async (isAccent: boolean) => {
    const shouldVibrate = feedbackMode === 'vibration' || feedbackMode === 'both';
    const shouldSound = feedbackMode === 'sound' || feedbackMode === 'both';

    if (shouldVibrate) {
      Vibration.vibrate(isAccent ? 30 : 10);
    }

    if (shouldSound) {
      try {
        // 柔らかめのクリック音
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/wav;base64,${isAccent ? generateAccentBeep() : generateNormalBeep()}` },
          { shouldPlay: true, volume: isAccent ? 0.75 : 0.45 }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch {
        // 音が出ない場合はバイブレーションでフォールバック
        if (!shouldVibrate) {
          Vibration.vibrate(isAccent ? 30 : 10);
        }
      }
    }
  }, [feedbackMode]);
  

  const playTimerEnd = useCallback(async () => {
    const shouldVibrate = feedbackMode === 'vibration' || feedbackMode === 'both';
    const shouldSound = feedbackMode === 'sound' || feedbackMode === 'both';

    if (shouldVibrate) {
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    }

    if (shouldSound) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/wav;base64,${generateTimerEndBeep()}` },
          { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch {
        // Silently fail
      }
    }
  }, [feedbackMode]);

  // Interval Timer Logic
  useEffect(() => {
    if (isRunning && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playTimerEnd();
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
  }, [isRunning, intervalTime, playTimerEnd]);

  // Metronome Logic
  useEffect(() => {
    if (isMetronomeRunning) {
      const intervalMs = (60 / bpm) * 1000;
      metronomeRef.current = setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = (prev + 1) % beats;
          const isAccent = nextBeat === 0 || (beats === 8 && nextBeat === 4);
          playBeep(isAccent);

          if (nextBeat === 0) {
            setBarCount((prevBars) => {
              const nextBars = prevBars + 1;
              Speech.speak(String(nextBars));
              return nextBars;
            });
          }

          return nextBeat;
        });
      }, intervalMs);
    } else {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
      setCurrentBeat(0);
    }

    return () => {
      if (metronomeRef.current) clearInterval(metronomeRef.current);
    };
  }, [isMetronomeRunning, bpm, beats, playBeep]);

  useEffect(() => {
    if (!workoutTimerRunning) return;
    const intervalId = setInterval(() => {
      setDurationTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [workoutTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recordRestInterval = () => {
    setRestIntervalSeconds(intervalTime);
    setRestIntervalMessage(`セット間休憩（目安）を ${formatTime(intervalTime)} で記録しました`);
    setRestIntervalSnackbarVisible(true);
  };

  const recordMetronomeBpm = () => {
    setMetronomeBpm(bpm);
    setBpmMessage(`BPMを ${bpm} で記録しました`);
    setBpmSnackbarVisible(true);
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

  const applyCustomTime = () => {
    const mins = parseInt(customMinutes, 10) || 0;
    const secs = parseInt(customSeconds, 10) || 0;
    const totalSeconds = mins * 60 + secs;
    if (totalSeconds > 0) {
      selectIntervalTime(totalSeconds);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(200, bpm + delta));
    setBpm(newBpm);
    updateTimerSettings({ metronomeBpm: newBpm });
  };

  const startBpmHold = (delta: number) => {
    if (bpmHoldRef.current) return;
    bpmHoldRef.current = setInterval(() => {
      adjustBpm(delta);
    }, 120);
  };

  const stopBpmHold = () => {
    if (!bpmHoldRef.current) return;
    clearInterval(bpmHoldRef.current);
    bpmHoldRef.current = null;
  };

  const setBeatsPerBar = (value: 4 | 8) => {
    setBeats(value);
    updateTimerSettings({ metronomeBeats: value });
  };

  const resetBarCount = () => {
    setBarCount(0);
  };


  const toggleSoundMode = () => {
    const newMode: FeedbackMode = feedbackMode === 'sound' ? 'both' : 'sound';
    setFeedbackMode(newMode);
    updateTimerSettings({ feedbackMode: newMode });
  };

  const isAccentBeat = (beatIndex: number) => {
    if (beatIndex === 0) return true;
    if (beats === 8 && beatIndex === 4) return true;
    return false;
  };

  const soundModeLabel = feedbackMode === 'sound' ? '音のみ' : '振動＋音';

  const workoutTimerTotalSeconds = getSelectedWorkoutDurationSeconds();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <Card style={styles.workoutTimerCard}>
        <Card.Content style={styles.workoutTimerContent}>
          <Text style={styles.workoutTimerTitle}>筋トレタイマー</Text>
          <Text style={styles.workoutTimerValue}>{formatTime(workoutTimerTotalSeconds)}</Text>

          <View style={styles.workoutTimerActionsRow}>
            <Button
              mode="outlined"
              icon="play"
              onPress={startWorkoutTimer}
              disabled={workoutTimerRunning}
              style={[styles.workoutTimerButton, styles.outlineNeutral]}
              contentStyle={styles.workoutTimerButtonContent}
              textColor={darkTheme.colors.textSecondary}
              compact
            >
              開始
            </Button>
            <Button
              mode="outlined"
              icon="pause"
              onPress={pauseWorkoutTimer}
              disabled={!workoutTimerRunning}
              style={[styles.workoutTimerButton, styles.outlineNeutral]}
              contentStyle={styles.workoutTimerButtonContent}
              textColor={darkTheme.colors.textSecondary}
              compact
            >
              一時停止
            </Button>
            <Button
              mode="outlined"
              icon="restart"
              onPress={() => {
                Alert.alert(
                  'リセット',
                  '元に戻せません。リセットしますか？',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: 'リセット', style: 'destructive', onPress: resetWorkoutTimer },
                  ]
                );
              }}
              disabled={!workoutTimerRunning && workoutTimerTotalSeconds === 0}
              style={[styles.workoutTimerButton, styles.outlineNeutral]}
              contentStyle={styles.workoutTimerButtonContent}
              textColor={darkTheme.colors.textSecondary}
              compact
            >
              リセット
            </Button>
            <Button
              mode="contained"
              icon="check"
              onPress={recordWorkoutTimer}
              disabled={!workoutTimerRunning && workoutTimerTotalSeconds === 0}
              style={styles.workoutTimerButton}
              contentStyle={styles.workoutTimerButtonContent}
              buttonColor={darkTheme.colors.accent}
              textColor={darkTheme.colors.onPrimary}
              compact
            >
              記録
            </Button>
          </View>
        </Card.Content>
      </Card>

      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as 'interval' | 'metronome')}
        buttons={[
          { value: 'interval', label: 'インターバル' },
          { value: 'metronome', label: 'メトロノーム' },
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

      {mode === 'interval' ? (
        <View style={styles.content}>
          <Card style={styles.timerCard}>
            <Card.Content style={styles.timerContent}>
              <Text style={styles.timerDisplay}>{formatTime(remainingTime)}</Text>
              <Text style={styles.timerLabel}>
                {isRunning ? '残り時間' : '設定時間'}
              </Text>
              <Button
                mode="outlined"
                onPress={recordRestInterval}
                style={styles.recordRestButton}
                compact
              >
              休憩を記録
              </Button>
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
                buttonColor={darkTheme.colors.surfaceVariant}
                textColor={darkTheme.colors.textPrimary}
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
                buttonColor={darkTheme.colors.danger}
                textColor={darkTheme.colors.onPrimary}
              >
                ストップ
              </Button>
            )}
          </View>

          <Text style={styles.sectionTitle}>プリセット</Text>
          <View style={styles.intervalOptions}>
            {intervalOptions.map((seconds) => (
              <Button
                key={seconds}
                mode="outlined"
                onPress={() => selectIntervalTime(seconds)}
                style={[
                  styles.intervalButton,
                  intervalTime === seconds && styles.intervalButtonActive,
                ]}
                textColor={intervalTime === seconds ? darkTheme.colors.accent : darkTheme.colors.textSecondary}
                compact
              >
                {formatTime(seconds)}
              </Button>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>カスタム時間</Text>
          <View style={styles.customTimeRow}>
            <TextInput
              mode="outlined"
              label="分"
              value={customMinutes}
              onChangeText={setCustomMinutes}
              keyboardType="number-pad"
              style={styles.customTimeInput}
              outlineColor={darkTheme.colors.outline}
              activeOutlineColor={darkTheme.colors.primary}
              dense
            />
            <Text style={styles.customTimeSeparator}>:</Text>
            <TextInput
              mode="outlined"
              label="秒"
              value={customSeconds}
              onChangeText={setCustomSeconds}
              keyboardType="number-pad"
              style={styles.customTimeInput}
              outlineColor={darkTheme.colors.outline}
              activeOutlineColor={darkTheme.colors.primary}
              dense
            />
            <Button
              mode="contained"
              onPress={applyCustomTime}
              compact
              style={styles.customTimeButton}
            >
              適用
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.timerCard}>
            <Card.Content style={styles.metronomeContent}>
              <Text style={styles.bpmDisplay}>{bpm}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>
              <Text style={styles.barCountLabel}>小節数: {barCount}</Text>
              <Button
                mode="outlined"
                onPress={recordMetronomeBpm}
                style={styles.recordBpmButton}
                compact
              >
                BPMを記録
              </Button>

              <View style={styles.beatIndicators}>
                {Array.from({ length: beats }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.beatDot,
                      currentBeat === i && isMetronomeRunning && styles.beatDotActive,
                      isAccentBeat(i) && styles.beatDotAccent,
                      currentBeat === i && isMetronomeRunning && isAccentBeat(i) && styles.beatDotAccentActive,
                    ]}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={() => setIsMetronomeRunning(!isMetronomeRunning)}
              style={[styles.mainButton, isMetronomeRunning && styles.stopButton]}
              contentStyle={styles.mainButtonContent}
              icon={isMetronomeRunning ? 'stop' : 'play'}
              buttonColor={isMetronomeRunning ? darkTheme.colors.danger : darkTheme.colors.surfaceVariant}
              textColor={isMetronomeRunning ? darkTheme.colors.onPrimary : darkTheme.colors.textPrimary}
            >
              {isMetronomeRunning ? 'ストップ' : 'スタート'}
            </Button>
          </View>

          <View style={styles.bpmControls}>
            <IconButton
              icon="minus"
              mode="outlined"
              onPress={() => adjustBpm(-1)}
              onLongPress={() => startBpmHold(-1)}
              onPressOut={stopBpmHold}
              size={32}
            />
            <IconButton
              icon="plus"
              mode="outlined"
              onPress={() => adjustBpm(1)}
              onLongPress={() => startBpmHold(1)}
              onPressOut={stopBpmHold}
              size={32}
            />
          </View>

          <View style={styles.soundModeRow}>
            <Button
              mode="outlined"
              onPress={toggleSoundMode}
              style={styles.soundModeButton}
              textColor={darkTheme.colors.mutedText}
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name="volume-high"
                  size={size}
                  color={feedbackMode === 'sound' ? darkTheme.colors.secondaryAccent : darkTheme.colors.mutedText}
                />
              )}
              compact
            >
              サウンド: {soundModeLabel}
            </Button>
          </View>

          <SegmentedButtons
            value={String(beats)}
            onValueChange={(value) => setBeatsPerBar((value === '8' ? 8 : 4) as 4 | 8)}
            buttons={[
              { value: '4', label: '4拍子' },
              { value: '8', label: '8拍子' },
            ]}
            style={styles.beatsSegmented}
          />

          <View style={styles.metronomeActions}>
            <Button
              mode="outlined"
              onPress={resetBarCount}
              style={styles.resetButton}
              textColor={darkTheme.colors.textSecondary}
              compact
            >
              リセット
            </Button>
          </View>
        </View>
      )}

      <Snackbar
        visible={restIntervalSnackbarVisible}
        onDismiss={() => setRestIntervalSnackbarVisible(false)}
        duration={4000}
      >
        {restIntervalMessage}
      </Snackbar>
      <Snackbar
        visible={bpmSnackbarVisible}
        onDismiss={() => setBpmSnackbarVisible(false)}
        duration={4000}
      >
        {bpmMessage}
      </Snackbar>
    </ScrollView>
  );
}

// WAVサウンド生成ヘルパー
const generateWavHeader = (dataLength: number, sampleRate: number = 22050): number[] => {
  const header = [];
  const totalLength = 44 + dataLength;

  // RIFF header
  header.push(0x52, 0x49, 0x46, 0x46); // "RIFF"
  pushInt32LE(header, totalLength - 8);
  header.push(0x57, 0x41, 0x56, 0x45); // "WAVE"

  // fmt chunk
  header.push(0x66, 0x6D, 0x74, 0x20); // "fmt "
  pushInt32LE(header, 16); // chunk size
  pushInt16LE(header, 1); // PCM format
  pushInt16LE(header, 1); // mono
  pushInt32LE(header, sampleRate);
  pushInt32LE(header, sampleRate); // byte rate (8-bit mono)
  pushInt16LE(header, 1); // block align
  pushInt16LE(header, 8); // bits per sample

  // data chunk
  header.push(0x64, 0x61, 0x74, 0x61); // "data"
  pushInt32LE(header, dataLength);

  return header;
};

const pushInt16LE = (arr: number[], value: number) => {
  arr.push(value & 0xFF, (value >> 8) & 0xFF);
};

const pushInt32LE = (arr: number[], value: number) => {
  arr.push(value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF);
};

const arrayToBase64 = (bytes: number[]): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const generateNormalBeep = (): string => {
  const sampleRate = 22050;
  const duration = 0.035; // 35ms
  const frequency = 620;
  const samples = Math.floor(sampleRate * duration);
  const data: number[] = [];

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 55);
    const value = Math.sin(2 * Math.PI * frequency * t) * 0.6 * envelope;
    data.push(Math.floor((value + 1) * 127.5));
  }

  const header = generateWavHeader(data.length, sampleRate);
  return arrayToBase64([...header, ...data]);
};

const generateAccentBeep = (): string => {
  const sampleRate = 22050;
  const duration = 0.045; // 45ms
  const frequency = 900;
  const samples = Math.floor(sampleRate * duration);
  const data: number[] = [];

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 45);
    const value = Math.sin(2 * Math.PI * frequency * t) * 0.75 * envelope;
    data.push(Math.floor((value + 1) * 127.5));
  }

  const header = generateWavHeader(data.length, sampleRate);
  return arrayToBase64([...header, ...data]);
};

const generateTimerEndBeep = (): string => {
  const sampleRate = 22050;
  const duration = 0.8;
  const samples = Math.floor(sampleRate * duration);
  const data: number[] = [];

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // 3拍のビープ音
    const beepPhase = (t * 3) % 1;
    const isOn = beepPhase < 0.4;
    const frequency = 1000;
    const envelope = isOn ? 1 : 0;
    const value = Math.sin(2 * Math.PI * frequency * t) * 0.8 * envelope;
    data.push(Math.floor((value + 1) * 127.5));
  }

  const header = generateWavHeader(data.length, sampleRate);
  return arrayToBase64([...header, ...data]);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.colors.background,
    padding: 16,
  },
  containerContent: {
    paddingBottom: 120,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  feedbackButton: {
    marginBottom: 16,
    alignSelf: 'center',
  },
  workoutTimerCard: {
    backgroundColor: darkTheme.colors.surface,
    width: '100%',
    marginBottom: 12,
  },
  workoutTimerContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  workoutTimerTitle: {
    fontSize: 14,
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  workoutTimerValue: {
    fontSize: 24,
    color: darkTheme.colors.onSurface,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  workoutTimerActions: {
    width: '100%',
  },
  workoutTimerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  workoutTimerButton: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 120,
  },
  workoutTimerButtonContent: {
    paddingHorizontal: 16,
    minHeight: 44,
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
    color: darkTheme.colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: darkTheme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  recordRestButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  recordBpmButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  bpmDisplay: {
    fontSize: 80,
    fontWeight: '200',
    color: darkTheme.colors.onSurface,
  },
  bpmLabel: {
    fontSize: 18,
    color: darkTheme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  barCountLabel: {
    marginTop: 8,
    fontSize: 14,
    color: darkTheme.colors.onSurfaceVariant,
  },
  beatIndicators: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  beatDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  beatDotActive: {
    backgroundColor: darkTheme.colors.textPrimary,
    transform: [{ scale: 1.3 }],
  },
  beatDotAccent: {
    backgroundColor: darkTheme.colors.textSecondary,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  beatDotAccentActive: {
    backgroundColor: darkTheme.colors.textPrimary,
    transform: [{ scale: 1.4 }],
  },
  bpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  soundModeRow: {
    width: '100%',
    marginBottom: 12,
  },
  soundModeButton: {
    borderColor: darkTheme.colors.outline,
  },
  beatsSegmented: {
    marginBottom: 12,
  },
  metronomeActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  resetButton: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  mainButton: {
    flex: 1,
    backgroundColor: darkTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: darkTheme.colors.outline,
  },
  mainButtonContent: {
    paddingVertical: 12,
  },
  stopButton: {
    backgroundColor: darkTheme.colors.danger,
    borderColor: darkTheme.colors.danger,
  },
  sectionTitle: {
    fontSize: 16,
    color: darkTheme.colors.onSurfaceVariant,
    marginBottom: 12,
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
    borderColor: darkTheme.colors.outline,
  },
  intervalButtonActive: {
    borderColor: darkTheme.colors.accent,
  },
  outlineNeutral: {
    borderColor: darkTheme.colors.outline,
  },
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  customTimeInput: {
    width: 70,
    height: 40,
    backgroundColor: darkTheme.colors.surfaceVariant,
  },
  customTimeSeparator: {
    fontSize: 24,
    color: darkTheme.colors.onSurface,
  },
  customTimeButton: {
    marginLeft: 4,
  },
});
