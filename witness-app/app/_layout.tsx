import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { WitnessProvider } from '@/contexts/WitnessContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WitnessProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(drawer)" />
        </Stack>
        <StatusBar style="light" />
      </WitnessProvider>
    </GestureHandlerRootView>
  );
}
