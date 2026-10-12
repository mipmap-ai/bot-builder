# Bot Builder engineering guide

## Production and repository

- This app is designed for Cloudflare Workers and is deployed at https://botbuilder.mipmap.ai.
- Repository: https://github.com/mipmap-ai/bot-builder. Worker name: `botbuilder`.
- `wrangler.json` is the deployment configuration. Serve `dist/client` through the `ASSETS` binding and route `/api/*` to `dist/server/index.js`.
- Feedback uses the private R2 bucket `botbuilder-feedback` through `BUCKET`. Keep the bucket private. Photo matching runs on the visitor's device.
- The old Sites URL redirects to Cloudflare and preserves paths, query strings, and avatar links. Its redirect source is in `legacy-site/index.js`. Cloudflare is the production deployment target; do not publish the editor through Sites.

## Local setup and checks

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Before a pull request, run:

```sh
npm run check
npx wrangler deploy --dry-run
```

The checks cover module references, feedback, photo matching, random selections, and existing avatar image compatibility. Check affected controls and exports in a browser when behavior changes.

## Editing the app

The editor is a captured compiled application. Its deployed JavaScript and artwork are committed in `dist/client/assets`; there is no complete editor framework source to rebuild. Make focused changes to these bundles where necessary.

Feature source modules have explicit build commands. After editing one, rebuild and commit its output:

- `src/photo`: `npm run build:photo`
- `src/rabbit`: `npm run build:rabbit`
- `src/formal`: `npm run build:formal`
- `src/randomize`: `npm run build:randomize`
- `src/webmcp`: `npm run build:webmcp`

WebMCP registers through `document.modelContext` only in supported browsers. Its tools use the existing editor state and catalog. Preserve the named bridge exports in the captured editor bundle. After photo UI changes, rebuild the UI bundle with the esbuild command in `scripts/build-photo.mjs` (the full photo build also copies the model runtimes). Verify registration and actual tool calls in the in-app browser before deployment. Photo matching starts asynchronously; poll `get_photo_match_status` and read the current bot when complete. Tools must never accept arbitrary photo URLs or local file paths.

Do not run unrelated rebuilds. Preserve existing URL IDs, defaults, and rendered avatars. Append new options. Replace or retire an option only when Brett explicitly asks; migrate its old URL value as requested. `character=muni` is the requested Penguin replacement. `held=sweet-potato` resolves to Nothing held. Keep existing avatar hash fixtures unchanged.

Preserve the credit `original by Matt · remixed by Brett`, linking Matt to https://x.com/mattyp and Brett to https://x.com/bretthamlin. No redistribution license for the original editor or artwork has been identified; do not claim the original material is MIT-licensed or otherwise open source.

## Publishing through Cloudflare Workers Builds

Automatic deployment is enabled through Cloudflare Workers Builds. The Git integration is configured in Cloudflare, not in GitHub Actions. In the Cloudflare dashboard, open Workers & Pages > botbuilder > Settings > Builds. Use:

- Git repository: `mipmap-ai/bot-builder`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run check`
- Deploy command: `npm run deploy`
- Automatic builds enabled; preview builds disabled.

Cloudflare installs dependencies from the committed npm lockfile. The committed app assets are deployable without a framework build. The build command runs checks before the deploy command uploads the Worker and assets.

Publish changes by pushing a feature branch and merging a pull request into `main`. Never push directly to the shared default branch. A production-branch merge triggers Cloudflare's build and deployment. Watch the build history and logs; a merged PR alone does not prove deployment. Confirm a successful build for the merged commit and check https://botbuilder.mipmap.ai afterward.

To restore service after a failed deployment, use the Worker Deployments tab to roll back to a known working version, then fix the repository through a pull request. Do not rename the Worker or change its domain, account, or bucket as part of an unrelated edit.

## Manual deployment fallback and credentials

If automatic builds are unavailable, use an existing authorized Cloudflare connection or `wrangler login` on the owner machine. From the tested, published commit:

```sh
npm ci
npm run check
npm run deploy
```

Verify the target Cloudflare account before deployment. Keep credentials in the authorized secret store or process environment, never in source, shell arguments, logs, or chat. Cloudflare's build credential stays in Cloudflare. Do not create a duplicate Worker, R2 bucket, or DNS record. Do not commit `.env`, `.dev.vars`, `.wrangler`, local feedback, or personal photos.

For per-ticket worktrees on Brett's machine, use `~/.codex/bin/agent-worktree <issue-key>` and wait for setup to finish. Never copy or symlink `node_modules` between checkouts.
