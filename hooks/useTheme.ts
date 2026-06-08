import { useColorScheme } from 'react-native';
import { Dark, Light, ThemeColors } from '../constants/Colors';

export function useTheme(): ThemeColors {
  return useColorScheme() === 'light' ? Light : Dark;
}
