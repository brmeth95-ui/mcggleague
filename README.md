# MCGG LEAGUE by WWS

Tournament website for **Magic Chess Go Go** (8 teams, 4v4, BO3). React/Vite frontend; Cloudflare Worker API; Cloudflare D1 database.

## Build

```bash
npm install
npm run build
```

## Cloudflare setup

1. Create a D1 database in Cloudflare: `mcggleague-db`.
2. Copy its **Database ID** into `wrangler.jsonc` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`). Database ID is not a password.
3. In Cloudflare Workers & Pages, open the existing Worker `mcggleaguewws`, then **Settings → Builds → Connect** and choose the GitHub repository `brmeth95-ui/mcggleague` (branch `main`).
4. Configure **Build command** `npm run build`, **Deploy command** `npx wrangler deploy`, **Root directory** `/`. The Wrangler `name` must match the existing Worker `mcggleaguewws`.
5. Once deployed, verify the site from a private/incognito browser, then test the organizer login and saving a team.

For local dev (`npm run dev`), `/api/*` requires a Cloudflare Worker and D1. The site can render without the API, but edits cannot be saved locally.

The Worker automatically creates its two required tables in D1 on the first API request. Protect your organizer password and do not publish it in the repo.

**Existing tournament data:** Linking a newly created D1 database will start with default placeholder teams. If scores were already saved on the old service, they require a separate data migration.
