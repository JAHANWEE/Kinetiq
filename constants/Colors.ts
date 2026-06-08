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

  accent:     '#10B981',   // emerald-500
  accentSoft: '#10B98115',
  accentText: '#FFFFFF',

  text:       '#F0EEE9',   // warm off-white
  textSub:    '#7A7873',   // mid warm grey
  textMuted:  '#3D3C3A',   // very dim

  sep:        '#FFFFFF0A', // 4% white — barely a breath
  sepStrong:  '#FFFFFF14', // 8% white

  ok:         '#34D399',   // emerald-400
  okSoft:     '#34D39914',
  warn:       '#F59E0B',   // amber-500 — muted, not neon
  warnSoft:   '#F59E0B14',
  bad:        '#F43F5E',   // rose-500
  badSoft:    '#F43F5E14',

  tabBg:      '#0C0C0C',
  tabLine:    '#FFFFFF0A',
  isDark:     true,
};

export const Light: ThemeColors = {
  bg:        '#F8F7F4',   // warm white — never pure #FFF
  bgAlt:     '#F0EFE9',
  card:      '#FFFFFF',
  cardAlt:   '#F5F4F0',
  overlay:   '#FFFFFF',

  accent:     '#059669',   // emerald-600 on light (darker for contrast)
  accentSoft: '#05966912',
  accentText: '#FFFFFF',

  text:       '#0F0E0D',   // near-black, warm
  textSub:    '#6B6762',
  textMuted:  '#A8A49E',

  sep:        '#0000000A',
  sepStrong:  '#00000014',

  ok:         '#059669',
  okSoft:     '#05966912',
  warn:       '#D97706',
  warnSoft:   '#D9770612',
  bad:        '#E11D48',
  badSoft:    '#E11D4812',

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
  primaryContainer:        '#0D2E22',
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
