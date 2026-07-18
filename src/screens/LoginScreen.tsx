import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
  }, []);

  const handleSignIn = async () => {
    try {
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch {
      // バックエンド未接続のため、この段階では認証結果を検証せず先へ進む
    }
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.logo, { backgroundColor: theme.wireFill, borderColor: theme.wire }]} />
        <Text style={[styles.title, { color: theme.ink }]}>散歩記事化アプリ</Text>

        <View style={styles.spacer} />

        {appleAuthAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          <Pressable style={[styles.fallbackButton, { backgroundColor: theme.ink }]} onPress={handleSignIn}>
            <Text style={styles.fallbackButtonText}>Appleでサインイン</Text>
          </Pressable>
        )}

        <Text style={[styles.terms, { color: theme.muted }]}>利用規約・プライバシーポリシー</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  logo: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700' },
  spacer: { flex: 1 },
  appleButton: { width: '100%', height: 48 },
  fallbackButton: { width: '100%', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fallbackButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  terms: { marginTop: 14, fontSize: 11 },
});
