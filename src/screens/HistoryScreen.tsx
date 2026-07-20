import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { MainTabScreenProps } from '../navigation/types';
import PressableOpacity from '../components/PressableOpacity';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { listRecordings, type ArticlePlatform } from '../services/api';

type Props = MainTabScreenProps<'History'>;
type Tab = 'note' | 'x';

type Row = {
  key: string;
  recordingId: string;
  platform: ArticlePlatform;
  title: string | null;
  excerpt: string;
  recordedAt: string;
  dateKey: string;
};

type Section = { title: string; data: Row[] };

function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatDateHeading(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return d.getFullYear() === now.getFullYear() ? `${month}月${day}日` : `${d.getFullYear()}年${month}月${day}日`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('note');
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
            title: article.title,
            excerpt: article.excerpt,
            recordedAt: item.recordedAt,
            dateKey: dateKeyOf(item.recordedAt),
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

  const sections = useMemo<Section[]>(() => {
    const filtered = rows.filter((row) => row.platform === tab);
    const result: Section[] = [];
    for (const row of filtered) {
      const heading = formatDateHeading(row.recordedAt);
      const current = result.at(-1);
      if (current?.title === heading) {
        current.data.push(row);
      } else {
        result.push({ title: heading, data: [row] });
      }
    }
    return result;
  }, [rows, tab]);

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

        <View style={styles.tabRow}>
          <PressableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: tab === 'note' ? theme.accent : theme.wireFill, borderColor: tab === 'note' ? theme.accent : theme.wire },
            ]}
            onPress={() => setTab('note')}
          >
            <Text style={[styles.tabButtonText, { color: tab === 'note' ? '#fff' : theme.muted }]}>Note</Text>
          </PressableOpacity>
          <PressableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: tab === 'x' ? theme.accent : theme.wireFill, borderColor: tab === 'x' ? theme.accent : theme.wire },
            ]}
            onPress={() => setTab('x')}
          >
            <Text style={[styles.tabButtonText, { color: tab === 'x' ? '#fff' : theme.muted }]}>X</Text>
          </PressableOpacity>
        </View>

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
        ) : sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>まだ記事がありません</Text>
            <PressableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={[styles.emptyLink, { color: theme.accent }]}>最初の録音をしてみましょう</Text>
            </PressableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(row) => row.key}
            contentContainerStyle={{ gap: 4, paddingBottom: 8 }}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />
            }
            renderSectionHeader={({ section }) => (
              <Text style={[styles.dateHeading, { color: theme.muted, backgroundColor: theme.paper }]}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => (
              <PressableOpacity
                style={[styles.card, { borderColor: theme.wire, backgroundColor: theme.panel }]}
                onPress={() => navigation.navigate('ArticlePreview', { recordingId: item.recordingId })}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: theme.ink }]} numberOfLines={1}>
                    {item.title || item.excerpt}
                  </Text>
                  <Text style={[styles.cardTime, { color: theme.muted }]}>{formatTime(item.recordedAt)}</Text>
                </View>
                {item.title ? (
                  <Text style={[styles.cardExcerpt, { color: theme.muted }]} numberOfLines={2}>
                    {item.excerpt}
                  </Text>
                ) : null}
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
  tabRow: { flexDirection: 'row', gap: 6 },
  tabButton: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tabButtonText: { fontSize: 13, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13 },
  emptyLink: { fontSize: 13, fontWeight: '700' },
  dateHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, paddingTop: 12, paddingBottom: 4 },
  card: { gap: 4, borderWidth: 1.5, borderRadius: 12, padding: 11 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  cardTime: { fontSize: 11 },
  cardExcerpt: { fontSize: 12, lineHeight: 17 },
});
