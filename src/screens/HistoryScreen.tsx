import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput, FlatList } from 'react-native';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = MainTabScreenProps<'History'>;

type HistoryItem = {
  id: string;
  platform: 'Note' | 'X';
  excerpt: string;
  date: string;
};

const DUMMY_HISTORY: HistoryItem[] = [
  { id: '1', platform: 'Note', excerpt: '散歩しながら考えたこと', date: '2026-07-16 09:12' },
  { id: '2', platform: 'X', excerpt: '散歩しながら考えをまとめるの、地味に効果ある', date: '2026-07-15 18:40' },
  { id: '3', platform: 'Note', excerpt: '朝の散歩で見つけた小さな発見', date: '2026-07-14 07:55' },
];

export default function HistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = DUMMY_HISTORY.filter((item) => item.excerpt.includes(query));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <TextInput
          style={[styles.search, { backgroundColor: theme.wireFill, borderColor: theme.wire, color: theme.ink }]}
          placeholder="検索"
          placeholderTextColor={theme.muted}
          value={query}
          onChangeText={setQuery}
        />

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.muted }]}>まだ記事がありません</Text>
            <Pressable onPress={() => navigation.navigate('Home')}>
              <Text style={[styles.emptyLink, { color: theme.accent }]}>最初の録音をしてみましょう</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.card, { borderColor: theme.wire }]}
                onPress={() => navigation.navigate('ArticlePreview')}
              >
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: item.platform === 'Note' ? theme.accentDim : theme.wireFill },
                  ]}
                >
                  <Text style={[styles.tagText, { color: item.platform === 'Note' ? theme.accent : theme.muted }]}>
                    {item.platform}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardExcerpt, { color: theme.ink }]} numberOfLines={1}>
                    {item.excerpt}
                  </Text>
                  <Text style={[styles.cardDate, { color: theme.muted }]}>{item.date}</Text>
                </View>
              </Pressable>
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
