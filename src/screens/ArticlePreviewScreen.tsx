import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, TextInput } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = RootStackScreenProps<'ArticlePreview'>;
type Tab = 'note' | 'x';

const DUMMY_ARTICLES: Record<Tab, { title: string; body: string }> = {
  note: {
    title: '散歩しながら考えたこと',
    body: '今日は近所を30分ほど歩きながら、最近考えていたアイデアについて話してみました。歩くとなぜか頭が整理されて、言葉が自然に出てくる気がします。',
  },
  x: {
    title: '',
    body: '散歩しながら考えをまとめるの、地味に効果ある。頭の中がスッキリする。#散歩思考',
  },
};

export default function ArticlePreviewScreen({ navigation }: Props) {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('note');
  const [copied, setCopied] = useState(false);
  const article = DUMMY_ARTICLES[tab];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.container}>
        <View style={styles.tabRow}>
          <Pressable
            style={[
              styles.tabButton,
              { backgroundColor: tab === 'note' ? theme.accent : theme.wireFill, borderColor: tab === 'note' ? theme.accent : theme.wire },
            ]}
            onPress={() => setTab('note')}
          >
            <Text style={[styles.tabButtonText, { color: tab === 'note' ? '#fff' : theme.muted }]}>Note用</Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              { backgroundColor: tab === 'x' ? theme.accent : theme.wireFill, borderColor: tab === 'x' ? theme.accent : theme.wire },
            ]}
            onPress={() => setTab('x')}
          >
            <Text style={[styles.tabButtonText, { color: tab === 'x' ? '#fff' : theme.muted }]}>X用</Text>
          </Pressable>
        </View>

        {article.title.length > 0 && (
          <TextInput style={[styles.heading, { color: theme.ink }]} value={article.title} multiline />
        )}
        <TextInput
          style={[styles.body, { color: theme.ink, borderColor: theme.line }]}
          value={article.body}
          multiline
        />

        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={handleCopy}>
          <Text style={styles.primaryButtonText}>{copied ? 'コピーしました' : 'コピーして開く'}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Main', { screen: 'History' })}>
          <Text style={[styles.link, { color: theme.muted }]}>履歴一覧へ</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 10 },
  tabRow: { flexDirection: 'row', gap: 6 },
  tabButton: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tabButtonText: { fontSize: 13, fontWeight: '700' },
  heading: { fontSize: 16, fontWeight: '700', paddingVertical: 4 },
  body: { flex: 1, fontSize: 14, lineHeight: 22, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top' },
  primaryButton: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 12, paddingVertical: 6 },
});
