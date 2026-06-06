import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  displayScore: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  headlineLg: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headlineLgMobile: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metricMd: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  bodyMd: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  labelCaps: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
};
