import { StyleSheet, Text, View, Pressable, SafeAreaView } from 'react-native';
import type { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../constants/theme';

type Props = MainTabScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.paper }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.ink }]}>散歩記事化</Text>
      </View>

      <View style={styles.center}>
        <Pressable
          style={[styles.recordButton, { backgroundColor: theme.accentDim, borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Recording')}
        >
          <Text style={styles.recordIcon}>●</Text>
        </Pressable>
        <Text style={[styles.recordHint, { color: theme.muted }]}>タップで録音開始</Text>
      </View>

      <View style={[styles.recentCard, { borderColor: theme.wire }]}>
        <View style={[styles.recentThumb, { backgroundColor: theme.wireFill2, borderColor: theme.wire }]} />
        <Text style={[styles.recentText, { color: theme.muted }]}>まだ記事がありません</Text>
      </View>
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
  recentText: { fontSize: 12 },
});
