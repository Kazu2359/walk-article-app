import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const [micGranted, setMicGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState<boolean | null>(null);

  const handleRequestMic = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    setMicGranted(granted);
  };

  const handleRequestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationGranted(status === 'granted');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.logo, { backgroundColor: theme.wireFill, borderColor: theme.wire }]} />
        <Text style={[styles.title, { color: theme.ink }]}>散歩記事化アプリ</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          歩きながら話すだけで、記事になる
        </Text>

        <Pressable
          style={[styles.permissionRow, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}
          onPress={handleRequestMic}
        >
          <Text style={styles.permissionIcon}>🎙️</Text>
          <Text style={[styles.permissionLabel, { color: theme.ink }]}>マイクへのアクセスを許可</Text>
          <Text style={[styles.permissionStatus, { color: micGranted ? theme.accent : theme.muted }]}>
            {micGranted ? '許可済み' : '未許可'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.permissionRow, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}
          onPress={handleRequestNotifications}
        >
          <Text style={styles.permissionIcon}>🔔</Text>
          <Text style={[styles.permissionLabel, { color: theme.ink }]}>通知を許可（記事完成をお知らせ）</Text>
          <Text style={[styles.permissionStatus, { color: notificationGranted ? theme.accent : theme.muted }]}>
            {notificationGranted === null ? '未許可' : notificationGranted ? '許可済み' : '拒否'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>はじめる</Text>
        </Pressable>
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
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  permissionIcon: { fontSize: 18 },
  permissionLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  permissionStatus: { fontSize: 11, fontWeight: '700' },
  primaryButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
