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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <Text style={[styles.pageTitle, { color: theme.ink }]}>履歴</Text>

        <View style={[styles.searchPill, { backgroundColor: theme.wireFill }]}>
          <Ionicons name="search-outline" size={16} color={theme.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.ink }]}
            placeholder="記事を検索"
            placeholderTextColor={theme.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => load(query)}
            returnKeyType="search"
          />
        </View>

        <View style={[styles.segctl, { backgroundColor: theme.wireFill }]}>
          <PressableOpacity
            style={[styles.segButton, tab === 'note' && { backgroundColor: theme.panel, ...segShadow }]}
            onPress={() => setTab('note')}
          >
            <View style={[styles.segDot, { backgroundColor: tab === 'note' ? theme.accent : theme.muted }]} />
            <Text style={[styles.segButtonText, { color: tab === 'note' ? theme.ink : theme.muted }]}>Note</Text>
          </PressableOpacity>
          <PressableOpacity
            style={[styles.segButton, tab === 'x' && { backgroundColor: theme.panel, ...segShadow }]}
            onPress={() => setTab('x')}
          >
            <View style={[styles.segDot, { backgroundColor: tab === 'x' ? theme.accent : theme.muted }]} />
            <Text style={[styles.segButtonText, { color: tab === 'x' ? theme.ink : theme.muted }]}>X</Text>
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
                style={[styles.card, { backgroundColor: theme.panel }]}
                onPress={() => navigation.navigate('ArticlePreview', { recordingId: item.recordingId })}
              >
                <View style={[styles.cardBadge, { backgroundColor: theme.accentDim }]}>
                  {item.platform === 'note' ? (
                    <Ionicons name="document-text-outline" size={15} color={theme.accent} />
                  ) : (
                    <Text style={[styles.cardBadgeX, { color: theme.accent }]}>X</Text>
                  )}
                </View>
                <View style={styles.cardCopy}>
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
                </View>
              </PressableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const segShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6 },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  pageTitle: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  searchPill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 13, height: '100%' },
  segctl: { flexDirection: 'row', borderRadius: 11, padding: 3, gap: 3 },
  segButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 8 },
  segDot: { width: 6, height: 6, borderRadius: 3 },
  segButtonText: { fontSize: 12.5, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13 },
  emptyLink: { fontSize: 13, fontWeight: '700' },
  dateHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', paddingTop: 12, paddingBottom: 6 },
  card: {
    flexDirection: 'row',
    gap: 11,
    borderRadius: 16,
    padding: 13,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  cardBadge: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  cardBadgeX: { fontSize: 13, fontWeight: '800' },
  cardCopy: { flex: 1, minWidth: 0, gap: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  cardTime: { fontSize: 10.5 },
  cardExcerpt: { fontSize: 12, lineHeight: 17 },
});
