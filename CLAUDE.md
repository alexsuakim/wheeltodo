# wheeltodo — Claude Code Rules

## No hardcoded values

**Never hardcode colours, spacing, or theme-related values inline.**

### Colours
All colours must come from one of two sources:

**TypeScript/TSX** — import from the shared themes package:
```ts
import { THEMES, PALETTE } from '@todo/shared/themes';
// Use THEMES['warm-start'].colors.accent, PALETTE.coral, etc.
```

**CSS/Tailwind** — use CSS variables defined in `globals.css`:
```css
color: var(--text-primary);
background: var(--bg-card);
/* Wheel slice colours: var(--wheel-1) through var(--wheel-6) */
```

**Tailwind arbitrary values with CSS vars** (preferred over hardcoded hex):
```tsx
// ❌ Wrong
<div className="bg-[#E59880]" />

// ✅ Correct
<div style={{ background: 'var(--accent)' }} />
```

**If you need to add a new colour** — add it to `packages/shared/src/themes.ts` first, then reference it via the theme system. Never add a raw hex value directly to a component.

### The 4 themes
| Class | Name | Mode |
|-------|------|------|
| `.theme-warm-start` | Warm Start | Light (default) |
| `.theme-slow-down` | Slow Down | Dark |
| `.theme-light-a11y` | Light Accessible | Light, high contrast |
| `.theme-dark-a11y` | Dark Accessible | Dark, high contrast |

All UI must work correctly across all 4 themes using CSS variables.

---

## Project structure

- `packages/shared/src/themes.ts` — single source of truth for all colours and themes
- `apps/web/src/app/globals.css` — CSS variable definitions per theme class
- `apps/mobile/src/theme/tokens.ts` — mobile theme tokens via `getTokens(themeName)`
- `apps/web/src/context/AppContext.tsx` — app state, `COLORS` array (warm-start defaults)

## Stack

- **Web**: Next.js + Tailwind CSS
- **Mobile**: Expo / React Native
- **Shared**: `@todo/shared` package (types, themes, Supabase)

## Other rules

- No `console.log` left in committed code
- All new components must work in both light and dark themes
- Mobile: use `getTokens()` from `apps/mobile/src/theme/tokens.ts`, never hardcode colours
