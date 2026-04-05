import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-white text-2xl font-bold">400 Scorekeeper</Text>
      <Text className="text-emerald-500 mt-2">NativeWind working ✓</Text>
    </View>
  );
}
