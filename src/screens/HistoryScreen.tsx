import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { MainTabScreenProps } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { listRecordings, type ArticlePlatform } from '../services/api';

type Props = MainTabScreenProps<'History'>;

type Row = {
  key: string;
  recordingId: string;
  platform: ArticlePlatform;
  excerpt: string;
  date: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchRows = useCallback(
    async (searchQuery: string) => {
      if (!accessToken) return;
      try {
        const { items } = await listRecordings(accessToken, { query: searchQuery || undefined });
        const flattened = items.flatMap((item) =>
          item.articles.map((article) => ({
            key: `${item.id}-${article.platform}`,
            recordingId: item.id,
            platform: article.platform,
            excerpt: article.excerpt,
            date: formatDate(item.recordedAt),
          })),
        );
        setRows(flattened);
        setHasError(false);
      } catch {
        // 空データとの区別のため、通信エラー時はrowsをクリアしてエラー状態を表示する
        setRows([]);
        setHasError(true);
      }
    },
    [accessToken],
  );

  const load = useCallback(
    (searchQuery: string) => {
      setIsLoading(true);
      fetchRows(searchQuery).finally(() => setIsLoading(false));
    },
    [fetchRows],
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRows(query).finally(() => setIsRefreshing(false));
  }, [fetchRows, query]);

  useEffect(() => {
    load('');
  }, [load]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <TextInput
          style={[styles.search, { backgroundColor: theme.wireFill, borderColor: theme.wire, color: theme.ink }]}
          placeholder="検索"
          placeholderTextColor={theme.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query)}
          returnKeyType="search"
        />

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : hasError ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>読み込みに失敗しました</Text>
            <PressableOpacity onPress={() => load(query)}>
              <Text style={[styles.emptyLink, { color: theme.accent }]}>もう一度試す</Text>
            </PressableOpacity>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>まだ記事がありません</Text>
            <PressableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={[styles.emptyLink, { color: theme.accent }]}>最初の録音をしてみましょう</Text>
            </PressableOpacity>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            contentContainerStyle={{ gap: 8 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />
            }
            renderItem={({ item }) => (
              <PressableOpacity
                style={[styles.card, { borderColor: theme.wire }]}
                onPress={() => navigation.navigate('ArticlePreview', { recordingId: item.recordingId })}
              >
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: item.platform === 'note' ? theme.accentDim : theme.wireFill },
                  ]}
                >
                  <Text style={[styles.tagText, { color: item.platform === 'note' ? theme.accent : theme.muted }]}>
                    {item.platform === 'note' ? 'Note' : 'X'}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardExcerpt, { color: theme.ink }]} numberOfLines={1}>
                    {item.excerpt}
                  </Text>
                  <Text style={[styles.cardDate, { color: theme.muted }]}>{item.date}</Text>
                </View>
              </PressableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 10 },
  search: { height: 38, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13 },
  emptyLink: { fontSize: 13, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 10, padding: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '800' },
  cardBody: { flex: 1, gap: 3 },
  cardExcerpt: { fontSize: 13, fontWeight: '600' },
  cardDate: { fontSize: 10 },
});
