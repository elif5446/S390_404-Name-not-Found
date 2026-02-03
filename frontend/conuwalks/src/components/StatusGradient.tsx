import { useColorScheme } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import styles from '@/src/styles/statusGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StatusGradient = () => {
  const mode = useColorScheme() || 'light';
  return (<LinearGradient
    colors={[
      mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', // Top
      mode === 'dark' ? 'rgba(0,0,0,0.0)' : 'rgba(255,255,255,0.0)', // Bottom
    ]}
    style={[styles.topGradient, { height: useSafeAreaInsets().top + 100 }]}
    pointerEvents="none"
    accessibilityElementsHidden={true} 
    importantForAccessibility="no-hide-descendants"
  />);
}

export default StatusGradient;