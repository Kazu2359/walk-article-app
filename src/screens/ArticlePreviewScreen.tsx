import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import type { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import {
  deleteArticle,
  getRecordingArticles,
  markArticleCopied,
  updateArticle,
  type RecordingArticle,
} from '../services/api';

type Props = RootStackScreenProps<'ArticlePreview'>;
type Tab = 'note' | 'x';

const KEYBOARD_ACCESSORY_ID = 'articlePreviewKeyboardDone';

export default function ArticlePreviewScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const { recordingId } = route.params;

  const [articles, setArticles] = useState<Partial<Record<Tab, RecordingArticle>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getRecordingArticles(accessToken, recordingId)
      .then(({ articles: fetched }) => {
        const byPlatform = Object.fromEntries(
          fetched.map((article) => [article.platform, article]),
        ) as Partial<Record<Tab, RecordingArticle>>;
        setArticles(byPlatform);
      })
      .catch(() => Alert.alert('記事の取得に失敗しました'))
      .finally(() => setIsLoading(false));
  }, [accessToken, recordingId]);

  useEffect(() => {
    const current = articles?.[tab];
    if (!current) return;
    setTitle(current.title ?? '');
    setBody(current.editedBody ?? current.body);
  }, [articles, tab]);

  // 表示中のタブの記事が削除された場合、もう一方のタブへ切り替えるか、
  // どちらも無ければ履歴一覧へ戻る
  useEffect(() => {
    if (!articles || articles[tab]) return;
    const otherTab: Tab = tab === 'note' ? 'x' : 'note';
    if (articles[otherTab]) {
      setTab(otherTab);
    } else {
      navigation.navigate('Main', { screen: 'History' });
    }
  }, [articles, tab, navigation]);

  const saveEdits = useCallback(
    async (nextTitle: string, nextBody: string) => {
      const current = articles?.[tab];
      if (!accessToken || !current) return;
      try {
        const updated = await updateArticle(accessToken, current.id, {
          editedBody: nextBody,
          ...(current.platform === 'note' ? { editedTitle: nextTitle } : {}),
        });
        setArticles((prev) => (prev ? { ...prev, [tab]: updated } : prev));
      } catch {
        // 編集の保存に失敗しても画面上のテキストはそのまま残す
      }
    },
    [accessToken, articles, tab],
  );

  const handleCopy = async () => {
    const current = articles?.[tab];
    if (!current) return;

    await Clipboard.setStringAsync(tab === 'note' ? `${title}\n\n${body}` : body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);

    if (accessToken) {
      markArticleCopied(accessToken, current.id).catch(() => {
        // コピー記録の失敗はユーザー操作をブロックしない
      });
    }

    try {
      if (tab === 'x') {
        // Xは投稿画面に文面を事前入力した状態で開ける
        await Linking.openURL(`https://x.com/intent/post?text=${encodeURIComponent(body)}`);
      } else {
        // Noteには下書きを事前入力するAPIがないため、開いた上で手動貼り付けを案内する（§9-1）。
        // トップページではなく新規投稿作成画面に直接遷移させ、ログイン済みの場合の手間を1手減らす
        await Linking.openURL('https://note.com/notes/new');
        Alert.alert('コピーしました', 'Noteを開きました。コピーした内容を貼り付けて投稿してください。');
      }
    } catch {
      Alert.alert('コピーしました', `${tab === 'x' ? 'X' : 'Note'}を開けませんでした。アプリを開いて貼り付けてください。`);
    }
  };

  const handleDelete = () => {
    const current = articles?.[tab];
    if (!current) return;

    Alert.alert('この記事を削除しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          if (!accessToken) return;
          try {
            await deleteArticle(accessToken, current.id);
            setArticles((prev) => {
              if (!prev) return prev;
              const next = { ...prev };
              delete next[tab];
              return next;
            });
          } catch {
            Alert.alert('削除に失敗しました', 'しばらくしてからもう一度お試しください。');
          }
        },
      },
    ]);
  };

  if (isLoading || !articles) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.topRow}>
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
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Text style={[styles.deleteLink, { color: theme.accent }]}>削除</Text>
          </Pressable>
        </View>

        {tab === 'note' && (
          <TextInput
            style={[styles.heading, { color: theme.ink }]}
            value={title}
            onChangeText={setTitle}
            onEndEditing={() => saveEdits(title, body)}
            multiline
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
        )}
        <TextInput
          style={[styles.body, { color: theme.ink, borderColor: theme.line }]}
          value={body}
          onChangeText={setBody}
          onEndEditing={() => saveEdits(title, body)}
          multiline
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <View style={[styles.keyboardBar, { backgroundColor: theme.wireFill, borderColor: theme.wire }]}>
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8}>
              <Text style={[styles.keyboardBarButton, { color: theme.accent }]}>閉じる</Text>
            </Pressable>
          </View>
        </InputAccessoryView>

        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={handleCopy}>
          <Text style={styles.primaryButtonText}>{copied ? 'コピーしました' : 'コピーして開く'}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Main', { screen: 'History' })}>
          <Text style={[styles.link, { color: theme.muted }]}>履歴一覧へ</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabRow: { flex: 1, flexDirection: 'row', gap: 6 },
  tabButton: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tabButtonText: { fontSize: 13, fontWeight: '700' },
  deleteLink: { fontSize: 12, fontWeight: '700' },
  heading: { fontSize: 16, fontWeight: '700', paddingVertical: 4 },
  body: { flex: 1, fontSize: 14, lineHeight: 22, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top' },
  primaryButton: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 12, paddingVertical: 6 },
  keyboardBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, borderTopWidth: 1 },
  keyboardBarButton: { fontSize: 14, fontWeight: '700' },
});
