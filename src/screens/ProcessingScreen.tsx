import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { getRecordingStatus, type RecordingStatus } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

const STEPS = ['アップロード', '文字起こし', '記事生成'];
const POLL_INTERVAL_MS = 3000;

function stepIndexForStatus(status: RecordingStatus): number {
  switch (status) {
    case 'uploading':
    case 'queued':
      return 0;
    case 'transcribing':
      return 1;
    case 'generating':
    case 'completed':
      return 2;
    default:
      return 0;
  }
}

export default function ProcessingScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const { recordingId } = route.params;
  const [status, setStatus] = useState<RecordingStatus>('uploading');
  const [failedReason, setFailedReason] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const poll = async () => {
      try {
        const result = await getRecordingStatus(accessToken, recordingId);
        setStatus(result.status);
        setFailedReason(result.failedReason);
        if (result.status === 'completed' || result.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // 一時的な通信エラーは無視し、次のポーリングで再試行する
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [accessToken, recordingId]);

  const currentStep = stepIndexForStatus(status);
  const isDone = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        {isFailed ? (
          <Text style={[styles.title, { color: theme.ink }]}>記事の作成に失敗しました</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.title, { color: theme.ink }]}>記事を作成しています…</Text>
          </>
        )}

        {!isFailed && (
          <View style={styles.steps}>
            {STEPS.map((label, i) => (
              <View key={label} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i <= currentStep ? theme.accentDim : theme.wireFill,
                      borderColor: i <= currentStep ? theme.accent : theme.wire,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    { color: i <= currentStep ? theme.ink : theme.muted, opacity: i <= currentStep ? 1 : 0.5 },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.note, { borderColor: theme.wire }]}>
          <Text style={[styles.noteText, { color: theme.muted }]}>
            {isFailed ? (failedReason ?? '時間をおいてもう一度お試しください') : '完了したら通知します。このままアプリを閉じても大丈夫です'}
          </Text>
        </View>

        {isDone && (
          <PressableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.replace('ArticlePreview', { recordingId })}
          >
            <Text style={styles.primaryButtonText}>記事を確認する</Text>
          </PressableOpacity>
        )}

        {isFailed && (
          <PressableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.replace('Main', { screen: 'Home' })}
          >
            <Text style={styles.primaryButtonText}>ホームに戻る</Text>
          </PressableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 },
  title: { fontSize: 15, fontWeight: '700' },
  steps: { width: '100%', gap: 10, marginTop: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  stepLabel: { fontSize: 13, fontWeight: '600' },
  note: {
    width: '100%',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  noteText: { fontSize: 11, textAlign: 'center' },
  primaryButton: { marginTop: 8, height: 46, width: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
