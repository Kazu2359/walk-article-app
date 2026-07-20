import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = PressableProps & { style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>) };

// アプリ全体のPressableに、押した時の視覚的フィードバック(不透明度を下げる)を
// 一貫して持たせるためのラッパー。素のPressableは押しても見た目が変わらず
// 反応が薄く感じられるため、ボタンらしい手触りにする。
export default function PressableOpacity({ style, ...props }: Props) {
  return (
    <Pressable
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && { opacity: 0.6 },
      ]}
      {...props}
    />
  );
}
