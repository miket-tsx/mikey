# mikey.js.org

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

1. Push this repo.
2. Set the start command to `npm start`.
3. Point the exposed port at `25138`.
4. Optional: set `GITHUB_TOKEN` in the environment. Unauthenticated GitHub
   allows 60 requests an hour per IP; the 5-minute cache uses 12. A token
   raises that to 5000 and makes the repo panel resilient to shared hosting IPs.

Docker is included if the panel wants an image:

```sh
docker build -t mikey-site .
docker run -p 25138:25138 -e PORT=25138 mikey-site
```

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
