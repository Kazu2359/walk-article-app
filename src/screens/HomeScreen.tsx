import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabScreenProps } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { listRecordings, type HistoryItem } from '../services/api';

type Props = MainTabScreenProps<'Home'>;

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
        <Text style={[styles.headerTitle, { color: theme.ink }]}>散歩記事化</Text>
      </View>

      <View style={styles.center}>
        <PressableOpacity
          style={[styles.recordButton, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Recording')}
        >
          <Text style={styles.recordIcon}>●</Text>
        </PressableOpacity>
        <Text style={[styles.recordHint, { color: theme.muted }]}>タップで録音開始</Text>
      </View>

      <PressableOpacity
        style={[styles.recentCard, { borderColor: theme.wire }]}
        disabled={!recent}
        onPress={() => recent && navigation.navigate('ArticlePreview', { recordingId: recent.id })}
      >
        <View style={[styles.recentThumb, { backgroundColor: theme.wireFill2, borderColor: theme.wire }]} />
        <Text style={[styles.recentText, { color: theme.muted }]} numberOfLines={1}>
          {recentCardText}
        </Text>
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
  headerTitle: { fontSize: 15, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  recordButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIcon: { fontSize: 40, color: '#D6572A' },
  recordHint: { fontSize: 12 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  recentThumb: { width: 36, height: 36, borderRadius: 6, borderWidth: 1 },
  recentText: { flex: 1, fontSize: 12 },
});
