import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

const STEPS = ['アップロード', '文字起こし', '記事生成'];

export default function ProcessingScreen({ navigation }: Props) {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 1800);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const isDone = currentStep >= STEPS.length - 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.title, { color: theme.ink }]}>記事を作成しています…</Text>

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

        <View style={[styles.note, { borderColor: theme.wire }]}>
          <Text style={[styles.noteText, { color: theme.muted }]}>
            完了したら通知します。このままアプリを閉じても大丈夫です
          </Text>
        </View>

        {isDone && (
          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.replace('ArticlePreview')}
          >
            <Text style={styles.primaryButtonText}>記事を確認する</Text>
          </Pressable>
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
