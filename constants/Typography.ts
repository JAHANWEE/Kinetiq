import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  // Hero numbers
  displayScore: {
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
    letterSpacing: -3,
  },
  // Page & section titles
  headlineLg: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headlineLgMobile: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  // Metric numbers inside cards
  metricLg: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  metricMd: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metricSm: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  // Body
  bodyMd: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  // Overline / labels
  labelCaps: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },
};
