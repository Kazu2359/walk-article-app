import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { listRecordings, type HistoryItem } from '../services/api';

type Props = MainTabScreenProps<'Home'>;

function greetingOf(hour: number): string {
  if (hour < 5) return 'こんばんは';
  if (hour < 11) return 'おはようございます';
  if (hour < 17) return 'こんにちは';
  return 'こんばんは';
}

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [recent, setRecent] = useState<HistoryItem | null>(null);
  const [hasError, setHasError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      listRecordings(accessToken, { limit: 1 })
        .then(({ items }) => {
          setRecent(items[0] ?? null);
          setHasError(false);
        })
        .catch(() => {
          setRecent(null);
          setHasError(true);
        });
    }, [accessToken]),
  );

  const excerpt = recent?.articles[0]?.excerpt;
  const recentCardText = excerpt ?? (hasError ? '読み込みに失敗しました' : 'まだ記事がありません');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.header}>
        <Text style={[styles.headerEyebrow, { color: theme.muted }]}>{greetingOf(new Date().getHours())}</Text>
        <Text style={[styles.headerTitle, { color: theme.ink }]}>今日の散歩、記録しませんか</Text>
      </View>

      <View style={styles.center}>
        <PressableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: theme.accentDim,
              borderColor: theme.accent,
              shadowColor: theme.accent,
            },
          ]}
          onPress={() => navigation.navigate('Recording')}
        >
          <View style={[styles.recordDot, { backgroundColor: theme.accent }]} />
        </PressableOpacity>
        <Text style={[styles.recordHint, { color: theme.ink }]}>タップで録音開始</Text>
        <Text style={[styles.recordSub, { color: theme.muted }]}>歩きながら話すだけで、記事になる</Text>
      </View>

      <PressableOpacity
        style={[styles.recentCard, { backgroundColor: theme.panel }]}
        disabled={!recent}
        onPress={() => recent && navigation.navigate('ArticlePreview', { recordingId: recent.id })}
      >
        <View style={[styles.recentThumb, { backgroundColor: theme.accentDim }]}>
          <Ionicons name="document-text-outline" size={18} color={theme.accent} />
        </View>
        <View style={styles.recentCopy}>
          <Text style={[styles.recentEyebrow, { color: theme.accent }]}>最新の記事</Text>
          <Text style={[styles.recentText, { color: theme.ink }]} numberOfLines={1}>
            {recentCardText}
          </Text>
        </View>
        {recent ? <Ionicons name="chevron-forward" size={16} color={theme.muted} /> : null}
      </PressableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerEyebrow: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  recordButton: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 24 },
      android: { elevation: 10 },
    }),
  },
  recordDot: { width: 30, height: 30, borderRadius: 15 },
  recordHint: { fontSize: 14, fontWeight: '700' },
  recordSub: { fontSize: 12 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  recentThumb: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recentCopy: { flex: 1, minWidth: 0 },
  recentEyebrow: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  recentText: { fontSize: 13, fontWeight: '600' },
});
