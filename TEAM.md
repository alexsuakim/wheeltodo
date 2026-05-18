# wheeltodo — Team Guide

Fast orientation for new teammates. See `CLAUDE.md` for Claude Code rules.

---

## Project structure

```
wheeltodo/
├── apps/
│   ├── web/          # Next.js + Tailwind CSS (deployed on Vercel)
│   └── mobile/       # Expo / React Native
└── packages/
    └── shared/       # @todo/shared — types, themes, Supabase client
```

Key files:
- `packages/shared/src/themes.ts` — single source of truth for all colours and theme tokens
- `apps/web/src/app/globals.css` — CSS variable definitions per theme class
- `apps/web/src/context/AppContext.tsx` — global app state, `COLORS` array (warm-start defaults)
- `apps/mobile/src/theme/tokens.ts` — mobile theme tokens via `getTokens(themeName)`

---

## Team

| Name | Role |
|------|------|
| Sua | Lead |
| Amithi | |
| Jade | |
| Paoli | |
| Johanna | |

GitHub org: `ionstudioapps/wheeltodo`

---

## Deployment

| Target | URL |
|--------|-----|
| Production (Vercel) | `wheeltodo-hdjty5498-alexsuakim-3649s-projects.vercel.app` |
| Vercel project | `wheeltodo-web` under `alexsuakim-3649s-projects` |

**Redeploy:**
```bash
# Preview deploy
/vercel:deploy

# Production deploy
/vercel:deploy prod
```

**Check deploy status:**
```bash
/vercel:status
```

---

## Secrets / credentials

Secrets live in the **`ionstudioapps/secrets`** repo as `rocky.env`.

Pull them locally with:
```bash
/vercel:env pull        # syncs Vercel env vars to .env.local
```

Never commit `.env*` files. Never hardcode credentials in source.

---

## Colour system — must follow

All colours come from two sources only. **No hardcoded hex values, ever.**

**TypeScript / TSX:**
```ts
import { THEMES, PALETTE } from '@todo/shared/themes';
// e.g. THEMES['warm-start'].colors.accent
```

**CSS / Tailwind:**
```css
color: var(--text-primary);
background: var(--bg-card);
/* Wheel slices: var(--wheel-1) through var(--wheel-6) */
```

**Adding a new colour:** add it to `packages/shared/src/themes.ts` first, then reference via the theme system.

### The 4 themes

| Class | Name | Mode |
|-------|------|------|
| `.theme-warm-start` | Warm Start | Light (default) |
| `.theme-slow-down` | Slow Down | Dark |
| `.theme-light-a11y` | Light Accessible | Light, high contrast |
| `.theme-dark-a11y` | Dark Accessible | Dark, high contrast |

Every component must work correctly across all 4 themes.

**Mobile:** use `getTokens()` from `apps/mobile/src/theme/tokens.ts`, never hardcode colours.

---

## Other code rules

- No `console.log` left in committed code
- All new components must work in both light and dark themes
- Full rules live in `CLAUDE.md` at repo root

---

## Claude skills

These slash commands are installed from `ionstudioapps/claude-skills`:

| Skill | What it does |
|-------|-------------|
| `/project-status` | Pulls a project update from GitHub, Notion, and Slack — useful for standups |
| `/schedule-meeting` | Creates a Google Meet + Calendar event, optionally posts to Slack |
| `/ionstudio-init` | Sets up the ionstudioapps dev environment (run once on a new machine) |
| `/vercel:deploy` | Deploy to Vercel (add `prod` for production) |
| `/vercel:status` | Show recent deployments and project info |
| `/vercel:env` | Manage/sync Vercel environment variables |

Ask Claude Code: "what skills are available?" to see the full list at any time.

---

## Quick-start checklist for new teammates

- [ ] Clone `ionstudioapps/wheeltodo`
- [ ] Run `/ionstudio-init` in Claude Code to set up environment
- [ ] Pull secrets: `/vercel:env pull` (or clone `ionstudioapps/secrets` and source `rocky.env`)
- [ ] Read `CLAUDE.md` (2 min) — the colour rules will save you a review cycle
- [ ] Run `npm install` from repo root, then `npm run dev` inside `apps/web`
