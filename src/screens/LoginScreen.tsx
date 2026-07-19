import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, Platform, Alert, Linking } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { ApiError, BASE_URL } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { signInWithApple } = useAuth();
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
  }, []);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Appleからidentity tokenを取得できませんでした');
      }

      await signInWithApple(credential.identityToken, {
        givenName: credential.fullName?.givenName,
        familyName: credential.fullName?.familyName,
      });

      navigation.replace('Main');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      const message = error instanceof ApiError ? error.message : 'サインインに失敗しました。もう一度お試しください。';
      Alert.alert('サインインエラー', message);
    } finally {
      setIsSigningIn(false);
    }
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

        {isSigningIn && <Text style={[styles.terms, { color: theme.muted }]}>サインイン中…</Text>}

        <Pressable onPress={() => Linking.openURL(`${BASE_URL}/privacy`)}>
          <Text style={[styles.terms, { color: theme.muted, textDecorationLine: 'underline' }]}>
            プライバシーポリシー
          </Text>
        </Pressable>
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
