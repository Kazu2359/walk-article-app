import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const [aiConsent, setAiConsent] = useState(false);

  const handleStart = async () => {
    // マイク・通知の許可はシステムダイアログのみで判断させる
    // （Apple Guideline 5.1.1(iv)対応: カスタム「許可」ボタンを置かず、
    // 中立的な文言のこのボタンからのみ、迂回・遅延なしでリクエストする）
    await requestRecordingPermissionsAsync();
    await Notifications.requestPermissionsAsync();
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.logo, { backgroundColor: theme.wireFill, borderColor: theme.wire }]} />
        <Text style={[styles.title, { color: theme.ink }]}>さんぽライター</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          歩きながら話すだけで、記事になる
        </Text>

        <PressableOpacity
          style={[styles.consentCard, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}
          onPress={() => setAiConsent((prev) => !prev)}
        >
          <View style={[styles.checkbox, { borderColor: theme.wire }, aiConsent && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
            {aiConsent && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={[styles.consentText, { color: theme.ink }]}>
            録音した音声はOpenAI（文字起こし）・Anthropic（記事生成）に送信され、処理に利用されます。内容に同意します。
          </Text>
        </PressableOpacity>

        <PressableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.accent }, !aiConsent && styles.primaryButtonDisabled]}
          onPress={handleStart}
          disabled={!aiConsent}
        >
          <Text style={styles.primaryButtonText}>はじめる</Text>
        </PressableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 14 },
  logo: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 18 },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  consentText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  primaryButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
