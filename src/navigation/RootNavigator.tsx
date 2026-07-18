import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import RecordingScreen from '../screens/RecordingScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ArticlePreviewScreen from '../screens/ArticlePreviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface Props {
  initialRouteName: keyof RootStackParamList;
}

export default function RootNavigator({ initialRouteName }: Props) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Recording" component={RecordingScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="ArticlePreview" component={ArticlePreviewScreen} />
    </Stack.Navigator>
  );
}
