import { THEMES, type ThemeName } from '@todo/shared/themes';

export type { ThemeName };

export function getTokens(theme: ThemeName = 'warm-start') {
  const t = THEMES[theme].colors;
  return {
    colors: {
      bg: { screen: t.bgScreen, card: t.bgCard, input: t.bgInput },
      text: { primary: t.textPrimary, secondary: t.textSecondary, muted: t.textMuted },
      action: { primary: t.textPrimary, streak: t.accent, success: t.success, danger: t.danger },
      accent: { heading: t.accent },
      rest: t.rest,
      wheel: t.wheel,
      wheelLight: t.wheelLight,
    },
    radius: { card: 20, row: 16, pill: 100, sheet: 28, tag: 100 },
    spacing: { screenPad: 18, cardPad: 14, rowGap: 8 },
  } as const;
}

// Default export for backwards compatibility
export const TOKENS = getTokens('warm-start');
