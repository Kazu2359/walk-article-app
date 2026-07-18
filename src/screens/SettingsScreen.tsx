import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, Switch } from 'react-native';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = MainTabScreenProps<'Settings'>;

const TONE_OPTIONS = ['カジュアル', '丁寧語'] as const;

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [xLinked, setXLinked] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [tone, setTone] = useState<(typeof TONE_OPTIONS)[number]>('カジュアル');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={[styles.accountRow, { borderColor: theme.wire }]}>
          <View style={[styles.avatar, { backgroundColor: theme.wireFill }]} />
          <Text style={[styles.accountText, { color: theme.ink }]}>Apple IDでログイン中</Text>
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>X連携</Text>
          <Switch value={xLinked} onValueChange={setXLinked} trackColor={{ true: theme.accent }} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.ink }]}>自動投稿（X限定・Phase2）</Text>
          <Switch
            value={autoPost}
            onValueChange={setAutoPost}
            disabled={!xLinked}
            trackColor={{ true: theme.accent }}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>文体トーン</Text>
        <View style={styles.toneRow}>
          {TONE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.toneOption,
                {
                  backgroundColor: tone === option ? theme.accent : theme.wireFill,
                  borderColor: tone === option ? theme.accent : theme.wire,
                },
              ]}
              onPress={() => setTone(option)}
            >
              <Text style={[styles.toneOptionText, { color: tone === option ? '#fff' : theme.muted }]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.logoutRow, { borderColor: theme.wire }]}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={[styles.logoutText, { color: theme.muted }]}>ログアウト</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
