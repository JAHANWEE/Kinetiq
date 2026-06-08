/**
 * Kinetiq color system — dual theme.
 *
 * Palette philosophy:
 *   Dark  → deep charcoal (#0C0C0C), warm off-white text, single emerald accent
 *   Light → warm white (#F8F7F4), near-black text, same emerald accent
 *
 * No purple, no blue, no orange. Clean and confident.
 */

export type ThemeColors = {
  bg:            string;  // page background
  bgAlt:         string;  // slightly lifted bg (used under cards on dark)
  card:          string;  // card / panel
  cardAlt:       string;  // slightly elevated card
  overlay:       string;  // modal sheet bg

  accent:        string;  // emerald — the ONE colour
  accentSoft:    string;  // accent @ ~12% opacity (icon backgrounds, active states)
  accentText:    string;  // text on filled accent (always near-white / near-black)

  text:          string;  // primary text
  textSub:       string;  // secondary label / meta
  textMuted:     string;  // placeholders, disabled

  sep:           string;  // divider / border (very subtle)
  sepStrong:     string;  // slightly visible border

  // Semantic — intentionally desaturated so they don't fight the accent
  ok:            string;  // positive (green-teal)
  okSoft:        string;
  warn:          string;  // caution (warm yellow)
  warnSoft:      string;
  bad:           string;  // negative (rose)
  badSoft:       string;

  // Tab bar
  tabBg:         string;
  tabLine:       string;

  isDark:        boolean;
};

export const Dark: ThemeColors = {
  bg:        '#0C0C0C',
  bgAlt:     '#111111',
  card:      '#181818',
  cardAlt:   '#202020',
  overlay:   '#1A1A1A',

  accent:     '#7DD3FC',   // sky-300 — soft pastel blue, not electric
  accentSoft: '#7DD3FC14',
  accentText: '#0C1A2E',   // dark navy text on pastel blue

  text:       '#F0EEE9',
  textSub:    '#7A7873',
  textMuted:  '#3D3C3A',

  sep:        '#FFFFFF0A',
  sepStrong:  '#FFFFFF14',

  ok:         '#34D399',
  okSoft:     '#34D39914',
  warn:       '#FCD34D',   // amber but softer
  warnSoft:   '#FCD34D14',
  bad:        '#F87171',   // rose but softer
  badSoft:    '#F8717114',

  tabBg:      '#0C0C0C',
  tabLine:    '#FFFFFF0A',
  isDark:     true,
};

export const Light: ThemeColors = {
  bg:        '#F5F7FA',
  bgAlt:     '#ECEEF2',
  card:      '#FFFFFF',
  cardAlt:   '#F0F2F6',
  overlay:   '#FFFFFF',

  accent:     '#38BDF8',   // sky-400 — pastel blue on light
  accentSoft: '#38BDF814',
  accentText: '#FFFFFF',

  text:       '#0F0E0D',
  textSub:    '#6B6762',
  textMuted:  '#A8A49E',

  sep:        '#0000000A',
  sepStrong:  '#00000014',

  ok:         '#10B981',
  okSoft:     '#10B98112',
  warn:       '#F59E0B',
  warnSoft:   '#F59E0B12',
  bad:        '#F43F5E',
  badSoft:    '#F43F5E12',

  tabBg:      '#FFFFFF',
  tabLine:    '#0000000A',
  isDark:     false,
};

/**
 * Legacy shim — screens that still import `Colors.xxx` get Dark values.
 * Gradually replace with `useTheme()`.
 */
export const Colors = {
  ...Dark,
  background:              Dark.bg,
  surfaceCard:             Dark.card,
  surfaceElevated:         Dark.overlay,
  surfaceHighlight:        Dark.cardAlt,
  primary:                 Dark.accent,
  primaryDim:              Dark.accentSoft,
  primaryContainer:        '#0D1E2E',
  onSurface:               Dark.text,
  onSurfaceSecondary:      Dark.textSub,
  onSurfaceMuted:          Dark.textMuted,
  onPrimary:               Dark.accentText,
  success:                 Dark.ok,
  successDim:              Dark.okSoft,
  warning:                 Dark.warn,
  warningDim:              Dark.warnSoft,
  danger:                  Dark.bad,
  dangerDim:               Dark.badSoft,
  error:                   Dark.bad,
  errorDim:                Dark.badSoft,
  border:                  Dark.sep,
  borderStrong:            Dark.sepStrong,
  outlineVariant:          Dark.sep,
  outline:                 Dark.sepStrong,
  surfaceContainerLowest:  Dark.bg,
  surfaceContainerLow:     Dark.card,
  surfaceContainer:        Dark.cardAlt,
  surfaceContainerHigh:    Dark.overlay,
  surfaceContainerHighest: Dark.cardAlt,
  onSurfaceVariant:        Dark.textSub,
  onBackground:            Dark.text,
  surface:                 Dark.card,
  brandAccent:             Dark.accent,
};
