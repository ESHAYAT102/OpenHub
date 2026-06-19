# Xenon
**Raycast for GitHub in the web, also Twitter for developers: a scrollable feed for discovering repos, fast navigation, rich repo browsing, and keyboard-driven workflows.**

---

Features

- Trending repositories discovery
- Profile pages with activity and repositories
- Repository explorer with file tree, previews, and edits
- Command palette with slash commands and quick actions
- Keyboard shortcuts for repo actions and tabs
- Context menus for links, inputs, and media

Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS + shadcn/ui
- GitHub OAuth with encrypted first-party session cookies
- cmdk, sonner, react-markdown

Getting started

1. Install dependencies: `bun install`
2. Create `.env` from `.env.example`
3. Start dev server: `bun dev`

Portless

- This app supports `portless` for stable local URLs such as `https://xenon.localhost`.
- Run `portless` from the repo root to use the project config in `portless.json`.
- When using `portless`, set `NEXTAUTH_URL=https://xenon.localhost` in your local `.env`.
- Next.js dev requests from `xenon.localhost` and `*.xenon.localhost` are explicitly allowed in `next.config.mjs`.
- On Arch Linux, `portless` `0.11.0` may fail while trusting its local CA with `update-ca-trust`. The proxy can still start, but browsers may show a certificate warning until the CA is installed correctly.
- Workaround on Arch: copy the generated CA into `/etc/ca-certificates/trust-source/anchors/` and then run `sudo trust extract-compat`.
- Temporary workaround: run plain Next with `bun dev`, or use `portless proxy start --port 1355 --https` if you want to avoid binding port `443`.

Environment variables

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

Scripts

- `bun dev` runs the dev server
- `bun run build` builds the app
- `bun run start` starts the production server
- `bun run lint` runs ESLint
- `bun run typecheck` runs TypeScript

Notes

- Add `http://localhost:3000/api/auth/github/callback` as the GitHub OAuth callback URL for local development.
- If you use `portless`, also add `https://xenon.localhost/api/auth/github/callback` as a GitHub OAuth callback URL.
