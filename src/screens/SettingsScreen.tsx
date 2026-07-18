import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, Switch, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabScreenProps, RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { getSettings, registerPushToken, updateSettings, type Tone } from '../services/api';

type Props = MainTabScreenProps<'Settings'>;

const TONE_OPTIONS: Array<{ value: Tone; label: string }> = [
  { value: 'casual', label: 'カジュアル' },
  { value: 'polite', label: '丁寧語' },
];

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken, signOut } = useAuth();
  const [xLinked, setXLinked] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [tone, setTone] = useState<Tone>('casual');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getSettings(accessToken)
      .then((settings) => {
        setTone(settings.tone);
        setAutoPost(settings.autoPostXEnabled);
      })
      .catch(() => {
        // 取得失敗時は既定値（カジュアル・自動投稿OFF）のまま表示する
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        await registerPushToken(accessToken, token.data);
      } catch {
        // Push通知トークンの登録失敗はアプリの利用をブロックしない
      }
    })();
  }, [accessToken]);

  const handleSelectTone = (nextTone: Tone) => {
    setTone(nextTone);
    if (accessToken) {
      updateSettings(accessToken, { tone: nextTone }).catch(() => {
        // 保存失敗時も画面上の選択状態はそのまま残す
      });
    }
  };

  const handleToggleAutoPost = (value: boolean) => {
    setAutoPost(value);
    if (accessToken) {
      updateSettings(accessToken, { autoPostXEnabled: value }).catch(() => {
        // 保存失敗時も画面上のトグル状態はそのまま残す
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.accountRow, { borderColor: theme.wire }]}>
          <View style={[styles.avatar, { backgroundColor: theme.wireFill }]} />
          <Text style={[styles.accountText, { color: theme.ink }]}>Apple IDでログイン中</Text>
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>X連携（Phase2で対応予定）</Text>
          <Switch value={xLinked} onValueChange={setXLinked} trackColor={{ true: theme.accent }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>自動投稿（X限定・Phase2）</Text>
          <Switch
            value={autoPost}
            onValueChange={handleToggleAutoPost}
            disabled={!xLinked}
            trackColor={{ true: theme.accent }}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>文体トーン</Text>
        <View style={styles.toneRow}>
          {TONE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.toneOption,
                {
                  backgroundColor: tone === option.value ? theme.accent : theme.wireFill,
                  borderColor: tone === option.value ? theme.accent : theme.wire,
                },
              ]}
              onPress={() => handleSelectTone(option.value)}
            >
              <Text style={[styles.toneOptionText, { color: tone === option.value ? '#fff' : theme.muted }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />

        <Pressable style={[styles.logoutRow, { borderColor: theme.wire }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: theme.muted }]}>ログアウト</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, gap: 14 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 10, padding: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  accountText: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 11, marginTop: 4 },
  toneRow: { flexDirection: 'row', gap: 8 },
  toneOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  toneOptionText: { fontSize: 12, fontWeight: '700' },
  spacer: { flex: 1 },
  logoutRow: { borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center' },
  logoutText: { fontSize: 13, fontWeight: '600' },
});
