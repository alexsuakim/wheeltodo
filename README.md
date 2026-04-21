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

If `node -v` still shows an older Node after `nvm use`, you likely have another Node installation earlier in your `PATH` (commonly Conda). In that case:

```bash
which node
echo $PATH
```

and make sure `~/.nvm/versions/node/.../bin` comes before the Conda `bin` directory in your shell init.

### Push notifications (recommended approach)

For early-stage mobile apps, the simplest, most reliable option is **Expo Notifications** (`expo-notifications`) using the **Expo Push Token**. This works well with EAS builds and keeps your server-side logic simple (you send messages to Expo’s push API using the Expo push token).

To enable push in standalone builds you’ll still need platform credentials:

- **iOS (APNs)**: configure an APNs key in your Apple Developer account / App Store Connect (EAS can guide credential setup).
- **Android (FCM)**: create a Firebase project and add `google-services.json` to your Expo config (EAS will also guide you).

Next steps (run from `apps/mobile`):

```bash
node ./node_modules/eas-cli/bin/run login
node ./node_modules/eas-cli/bin/run init
```

Then you can build an installable dev client:

```bash
npm run build:dev
npm run start:dev
```

