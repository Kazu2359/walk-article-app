import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Recording'>;

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const BAR_HEIGHTS = [14, 28, 10, 36, 20, 30, 16, 24];

export default function RecordingScreen({ navigation }: Props) {
  const theme = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.recBadge, { backgroundColor: theme.accentDim }]}>
          <Text style={[styles.recBadgeText, { color: theme.accent }]}>● REC</Text>
        </View>

        <Text style={[styles.timer, { color: theme.ink }]}>{formatElapsed(elapsed)}</Text>

        <View style={styles.meter}>
          {BAR_HEIGHTS.map((h, i) => (
            <View
              key={i}
              style={[styles.meterBar, { height: isPaused ? 6 : h, backgroundColor: theme.wire }]}
            />
          ))}
        </View>

        <View style={styles.controls}>
          <Pressable
            style={[styles.circleButton, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}
            onPress={() => setIsPaused((p) => !p)}
          >
            <Text style={[styles.circleButtonText, { color: theme.muted }]}>
              {isPaused ? '再開' : '一時停止'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.circleButton, { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => navigation.replace('Processing')}
          >
            <Text style={[styles.circleButtonText, { color: '#fff' }]}>停止</Text>
          </Pressable>
        </View>

        <View style={[styles.note, { borderColor: theme.wire }]}>
          <Text style={[styles.noteText, { color: theme.muted }]}>
            {isPaused ? '一時停止中です' : 'ロックしても録音は続きます'}
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
  timer: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  meter: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 },
  meterBar: { width: 4, borderRadius: 2 },
  controls: { flexDirection: 'row', gap: 18, marginTop: 10 },
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
