import { useColorScheme } from 'react-native';

const light = {
  paper: '#EEF1F6',
  panel: '#FFFFFF',
  ink: '#1B2430',
  muted: '#6B7686',
  wire: '#B9C2CF',
  wireFill: '#E4E8EE',
  wireFill2: '#D9DFE7',
  accent: '#D6572A',
  accentDim: '#FBE3D8',
  line: '#D6DCE4',
};

const dark = {
  paper: '#12161D',
  panel: '#1A2029',
  ink: '#E7EAF0',
  muted: '#8B95A5',
  wire: '#3A4452',
  wireFill: '#212833',
  wireFill2: '#28313D',
  accent: '#FF8659',
  accentDim: '#3A2A20',
  line: '#2A323D',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
