# miket.env.pm

Portfolio for **miket-tsx** — 17, India. Discord bots in Node.js and TypeScript.

Every repository on the page is fetched live from the GitHub API and cached for
five minutes, so new repos appear automatically without a rebuild.

## Stack

- `server.js` — Express: static files, `/api/repos` (cached GitHub proxy), `/api/profile`, `/healthz`
- `public/` — hand-written HTML/CSS/JS, no build step
- Port `25138` by default, override with `PORT`

## Run locally

```sh
npm install
npm start
# http://localhost:25138
```

## Deploy to bot-hosting.net

Their panel runs an **entry file**, not `npm start`, and hands you a port through
`SERVER_PORT`. Both are handled.

1. **New Deployment** → type **Application** → Source **GitHub** →
   pick `miket-tsx/mikey` → Runtime **Node.js**.
2. **Startup** tab → `Entry File (STARTUP_FILE)` = `server.js`.
3. Leave the port alone. The app reads `SERVER_PORT` first, then `PORT`, then
   falls back to `25138`.
4. **Files** tab → do not upload `node_modules`; the panel installs from
   `package.json` on boot.
5. **Domains** tab → **Activate** for a free
   `<name>.apps.bot-hosting.cloud` with HTTPS, or **Attach** `miket.env.pm`
   and add the DNS records it prints.
6. Optional: add `GITHUB_TOKEN` in environment variables. Unauthenticated
   GitHub allows 60 requests/hour per IP; the 5-minute cache uses 12, and a
   shared host IP can burn that fast. A token raises it to 5000.

Free plan is 256 MB RAM / 512 MB disk / 1 deployment, and you re-renew it every
4 days from the panel.

### Notes

- `server.js` binds `HOST` (default `0.0.0.0`) so the panel's proxy can reach it.
- If it exits with `could not bind`, the allocated port didn't match — set `PORT`
  or `SERVER_PORT` in the environment to the port shown in the panel.
- `dotfiles: 'allow'` is required, otherwise `/.well-known/discord` 404s.

## Files

```
server.js            express + github cache
public/index.html    markup
public/styles.css    all styling, moonlight tokens at the top
public/app.js        preloader, stars, repos
public/avatar.png    profile image (from github.com/miket-tsx)
public/404.html      not found
Dockerfile           container build
```
