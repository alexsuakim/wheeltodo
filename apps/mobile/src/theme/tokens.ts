export const TOKENS = {
  colors: {
    bg: { screen: '#f2f0eb', card: '#ffffff', input: '#f7f6f3' },
    text: { primary: '#111111', secondary: '#aaaaaa', muted: '#bbbbbb' },
    action: { primary: '#111111', streak: '#FF5C4D', success: '#22a722', danger: '#FF5C4D' },
    wheel: ['#FF5C4D','#FF9B50','#4ECDC4','#FFE66D','#A78BFA','#F9A8D4'],
    wheelLight: ['#FFE8E6','#FFF0E8','#E8FAFA','#FFFAE8','#F0EEFF','#FEF0F8'],
  },
  radius: { card: 20, row: 16, pill: 100, sheet: 28, tag: 100 },
  spacing: { screenPad: 18, cardPad: 14, rowGap: 8 },
} as const;
