import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabScreenProps, RootStackParamList } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import {
  connectXAccount,
  deleteAccount,
  disconnectXAccount,
  getMe,
  getSettings,
  registerPushToken,
  updateSettings,
  type Tone,
} from '../services/api';

type Props = MainTabScreenProps<'Settings'>;

const TONE_OPTIONS: Array<{ value: Tone; label: string }> = [
  { value: 'casual', label: 'カジュアル' },
  { value: 'polite', label: '丁寧語' },
];

// Phase4: X OAuth2連携（PKCE）
const X_AUTHORIZATION_ENDPOINT = 'https://x.com/i/oauth2/authorize';
const X_CLIENT_ID = process.env.EXPO_PUBLIC_X_CLIENT_ID ?? '';
const X_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'walkarticleapp', path: 'x-oauth-callback' });

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken, signOut } = useAuth();
  const [xConnected, setXConnected] = useState(false);
  const [isConnectingX, setIsConnectingX] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [autoPost, setAutoPost] = useState(false);
  const [tone, setTone] = useState<Tone>('casual');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [xAuthRequest, , promptXAuthAsync] = AuthSession.useAuthRequest(
    {
      clientId: X_CLIENT_ID,
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      redirectUri: X_REDIRECT_URI,
      usePKCE: true,
    },
    { authorizationEndpoint: X_AUTHORIZATION_ENDPOINT },
  );

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
    getMe(accessToken)
      .then((me) => {
        setXConnected(me.xConnected);
        setDisplayName(me.displayName);
      })
      .catch(() => {
        // 取得失敗時は未連携として表示する
      });
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

  const handleConnectX = async () => {
    if (!accessToken || !xAuthRequest || isConnectingX) return;
    setIsConnectingX(true);
    try {
      const result = await promptXAuthAsync();
      if (result.type === 'success') {
        await connectXAccount(accessToken, {
          code: result.params.code,
          codeVerifier: xAuthRequest.codeVerifier ?? '',
          redirectUri: X_REDIRECT_URI,
        });
        setXConnected(true);
      } else if (result.type === 'error') {
        Alert.alert('X連携に失敗しました', 'しばらくしてからもう一度お試しください。');
      }
    } catch {
      Alert.alert('X連携に失敗しました', 'しばらくしてからもう一度お試しください。');
    } finally {
      setIsConnectingX(false);
    }
  };

  const handleDisconnectX = async () => {
    if (!accessToken || isConnectingX) return;
    setIsConnectingX(true);
    try {
      await disconnectXAccount(accessToken);
      setXConnected(false);
      setAutoPost(false);
    } catch {
      Alert.alert('連携解除に失敗しました', 'しばらくしてからもう一度お試しください。');
    } finally {
      setIsConnectingX(false);
    }
  };

  const goToLogin = () => {
    const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleLogout = async () => {
    await signOut();
    goToLogin();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除しますか？',
      '録音・記事・音声を含むすべてのデータが削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            if (!accessToken || isDeleting) return;
            setIsDeleting(true);
            try {
              await deleteAccount(accessToken);
              await signOut();
              goToLogin();
            } catch {
              Alert.alert('アカウントの削除に失敗しました', 'しばらくしてからもう一度お試しください。');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
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

  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <Text style={[styles.pageTitle, { color: theme.ink }]}>設定</Text>

        <View style={[styles.accountRow, { backgroundColor: theme.panel }, cardShadow]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            {initial ? (
              <Text style={styles.avatarText}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={18} color="#fff" />
            )}
          </View>
          <View>
            <Text style={[styles.accountText, { color: theme.ink }]}>Apple IDでログイン中</Text>
            {displayName ? <Text style={[styles.accountSub, { color: theme.muted }]}>{displayName}</Text> : null}
          </View>
        </View>

        <Text style={[styles.groupLabel, { color: theme.muted }]}>X連携</Text>
        <View style={[styles.group, { backgroundColor: theme.panel }, cardShadow]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: theme.accentDim }]}>
              <Ionicons name="at" size={15} color={theme.accent} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.ink }]}>Xアカウント</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>{xConnected ? '連携済み' : '未連携'}</Text>
            </View>
            <PressableOpacity
              style={[styles.xConnectButton, { borderColor: theme.accent }]}
              onPress={xConnected ? handleDisconnectX : handleConnectX}
              disabled={isConnectingX || (!xConnected && !xAuthRequest)}
            >
              {isConnectingX ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={[styles.xConnectButtonText, { color: theme.accent }]}>
                  {xConnected ? '解除する' : '連携する'}
                </Text>
              )}
            </PressableOpacity>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.line }]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.accentDim }]}>
              <Ionicons name="flash-outline" size={15} color={theme.accent} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.ink }]}>自動投稿</Text>
              <Text style={[styles.rowSub, { color: theme.muted }]}>記事生成後に自動でXへ投稿</Text>
            </View>
            <Switch
              value={autoPost}
              onValueChange={handleToggleAutoPost}
              disabled={!xConnected}
              trackColor={{ true: theme.accent }}
            />
          </View>
        </View>

        <Text style={[styles.groupLabel, { color: theme.muted }]}>文体トーン</Text>
        <View style={[styles.group, styles.toneGroup, { backgroundColor: theme.panel }, cardShadow]}>
          <View style={styles.toneRow}>
            {TONE_OPTIONS.map((option) => (
              <PressableOpacity
                key={option.value}
                style={[
                  styles.toneOption,
                  { backgroundColor: tone === option.value ? theme.accent : theme.wireFill },
                ]}
                onPress={() => handleSelectTone(option.value)}
              >
                <Text style={[styles.toneOptionText, { color: tone === option.value ? '#fff' : theme.muted }]}>
                  {option.label}
                </Text>
              </PressableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        <Text style={[styles.groupLabel, { color: theme.muted }]}>アカウント</Text>
        <View style={[styles.group, { backgroundColor: theme.panel }, cardShadow]}>
          <PressableOpacity style={styles.actionRow} onPress={handleLogout}>
            <Text style={[styles.actionText, { color: theme.muted }]}>ログアウト</Text>
          </PressableOpacity>
          <PressableOpacity
            style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: theme.line }]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text style={[styles.actionText, styles.actionTextDanger, { color: theme.accent }]}>
                アカウントを削除
              </Text>
            )}
          </PressableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 16 },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 13, marginBottom: 20 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  accountText: { fontSize: 13.5, fontWeight: '700' },
  accountSub: { fontSize: 11, marginTop: 1 },
  groupLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginLeft: 4 },
  group: { borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  rowIcon: { width: 27, height: 27, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: '600' },
  rowSub: { fontSize: 11, marginTop: 1 },
  xConnectButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.4, minWidth: 78, alignItems: 'center' },
  xConnectButtonText: { fontSize: 12, fontWeight: '700' },
  toneGroup: { padding: 10 },
  toneRow: { flexDirection: 'row', gap: 8 },
  toneOption: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  toneOptionText: { fontSize: 12.5, fontWeight: '700' },
  spacer: { flex: 1 },
  actionRow: { padding: 13, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600' },
  actionTextDanger: { fontWeight: '700' },
});
