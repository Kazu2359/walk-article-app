import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Alert, ActivityIndicator, AppState } from 'react-native';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { File } from 'expo-file-system';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { completeUpload, createRecording, uploadAudioToStorage } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Recording'>;

// 要件定義書§10の上限（バックエンドのバリデーションと合わせる）
const MAX_DURATION_SECONDS = 30 * 60;

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const BAR_HEIGHTS = [14, 28, 10, 36, 20, 30, 16, 24];

export default function RecordingScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  // 音楽ではなく音声（Whisper文字起こし用途）のため、HIGH_QUALITY（128kbps）ではなく
  // LOW_QUALITY（64kbps）で十分。30分録音時のファイルサイズをおよそ半分に抑えられる
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(new Date());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        allowsBackgroundRecording: true,
      });
      await recorder.prepareToRecordAsync();
      if (!isMounted) return;
      startedAtRef.current = new Date();
      recorder.record();
      setHasStarted(true);
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 電話着信などでシステムに録音を中断された場合（isPausedを自分では立てていないのにisRecordingがfalseになる）、
  // アプリがフォアグラウンドに戻ったタイミングで自動再開を試みる
  const isInterrupted = hasStarted && !isPaused && !isUploading && !recorderState.isRecording;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isInterrupted) {
        recorder.record();
      }
    });
    return () => subscription.remove();
  }, [isInterrupted, recorder]);

  useEffect(() => {
    if (isPaused || isUploading || !recorderState.isRecording) return;
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, isUploading, recorderState.isRecording]);

  const handleTogglePause = () => {
    if (isPaused) {
      recorder.record();
      setIsPaused(false);
    } else {
      recorder.pause();
      setIsPaused(true);
    }
  };

  const handleStop = async () => {
    if (isUploading || !accessToken) return;
    setIsUploading(true);
    try {
      // 電話等の中断で既に録音が停止している場合、stop()を再度呼ぶとネイティブ側でエラーになるため呼ばない
      if (recorderState.isRecording) {
        await recorder.stop();
      }
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('録音ファイルの取得に失敗しました');
      }

      const audio = await (await fetch(uri)).blob();

      const { recordingId, uploadUrl } = await createRecording(accessToken, {
        durationSeconds: Math.max(elapsed, 1),
        fileSizeBytes: audio.size,
        recordedAt: startedAtRef.current.toISOString(),
      });

      await uploadAudioToStorage(uploadUrl, audio);
      await completeUpload(accessToken, recordingId);

      navigation.replace('Processing', { recordingId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'アップロードに失敗しました';
      Alert.alert('録音の保存に失敗しました', message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setIsUploading(false);
    }
  };

  // §10の上限（30分）に達したら自動停止する
  useEffect(() => {
    if (elapsed >= MAX_DURATION_SECONDS && !isUploading) {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const handleCancel = () => {
    if (isUploading) return;
    Alert.alert('録音を破棄しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '破棄する',
        style: 'destructive',
        onPress: async () => {
          try {
            await recorder.stop();
          } catch {
            // すでに停止している場合等は無視
          }
          const uri = recorder.uri;
          if (uri) {
            try {
              new File(uri).delete();
            } catch {
              // ファイルが既に存在しない場合等は無視
            }
          }
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.recBadge, { backgroundColor: theme.accentDim }]}>
          <Text style={[styles.recBadgeText, { color: theme.accent }]}>● REC</Text>
        </View>

        {!isUploading && (
          <PressableOpacity style={styles.cancelLink} onPress={handleCancel} hitSlop={8}>
            <Text style={[styles.cancelLinkText, { color: theme.muted }]}>破棄</Text>
          </PressableOpacity>
        )}

        <Text style={[styles.timer, { color: theme.ink }]}>{formatElapsed(elapsed)}</Text>

        <View style={styles.meter}>
          {BAR_HEIGHTS.map((h, i) => (
            <View
              key={i}
              style={[
                styles.meterBar,
                { height: isPaused || !recorderState.isRecording ? 6 : h, backgroundColor: theme.wire },
              ]}
            />
          ))}
        </View>

        {isUploading ? (
          <View style={styles.controls}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.noteText, { color: theme.muted }]}>アップロード中…</Text>
          </View>
        ) : (
          <View style={styles.controls}>
            <PressableOpacity
              style={[styles.circleButton, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}
              onPress={handleTogglePause}
            >
              <Text style={[styles.circleButtonText, { color: theme.muted }]}>
                {isPaused ? '再開' : '一時停止'}
              </Text>
            </PressableOpacity>
            <PressableOpacity
              style={[styles.circleButton, { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={handleStop}
            >
              <Text style={[styles.circleButtonText, { color: '#fff' }]}>停止</Text>
            </PressableOpacity>
          </View>
        )}

        <View style={[styles.note, { borderColor: theme.wire }]}>
          <Text style={[styles.noteText, { color: theme.muted }]}>
            {isPaused
              ? '一時停止中です'
              : isInterrupted
                ? '電話などで録音が中断されています。通話が終わると自動で再開します'
                : 'ロックしても録音は続きます'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 },
  recBadge: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  recBadgeText: { fontSize: 10, fontWeight: '800' },
  cancelLink: { position: 'absolute', top: 20, right: 16 },
  cancelLinkText: { fontSize: 12, fontWeight: '700' },
  timer: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  meter: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  meterBar: { width: 4, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 18, marginTop: 10, alignItems: 'center' },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: { fontSize: 11, fontWeight: '700' },
  note: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  noteText: { fontSize: 11 },
});
