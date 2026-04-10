## Monorepo (Web + iOS + Android)

This repo contains:

- `apps/web`: Next.js web app
- `apps/mobile`: Expo (React Native) app for iOS + Android
- `packages/shared`: shared TypeScript code (types/schemas) used by both apps

### Run (after install)

```bash
npm install
npm run dev:web
npm run dev:mobile
```

### Notes

Your existing static site files are still at the repo root (`index.html`, `styles.css`, `app.js`, etc.). We can migrate them into `apps/web` whenever you’re ready.

### Node version

Expo / React Native tooling in this setup expects a newer Node 20+ (or Node 22). This repo includes an `.nvmrc` so you can run:

```bash
nvm use
```

