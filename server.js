import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 25138;
const USER = process.env.GITHUB_USER || 'miket-tsx';
const TTL = 5 * 60 * 1000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

/* ── tiny in-memory cache, survives panel refreshes ── */
const cache = { at: 0, data: null, error: null };

async function fetchRepos() {
  const fresh = cache.data && Date.now() - cache.at < TTL;
  if (fresh) return cache.data;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${USER}-site`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`,
      { headers },
    );
    if (!res.ok) throw new Error(`github responded ${res.status}`);

    const raw = await res.json();
    const repos = raw
      .filter((r) => !r.fork && !r.archived)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .map((r) => ({
        name: r.name,
        description: r.description || '',
        url: r.html_url,
        homepage: r.homepage || '',
        language: r.language || '',
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics || [],
        pushed_at: r.pushed_at,
        created_at: r.created_at,
        size: r.size,
      }));

    cache.at = Date.now();
    cache.data = { user: USER, count: repos.length, repos, fetched: new Date().toISOString() };
    cache.error = null;
    return cache.data;
  } catch (err) {
    cache.error = err.message;
    if (cache.data) return { ...cache.data, stale: true, error: err.message };
    throw err;
  }
}

app.get('/api/repos', async (_req, res) => {
  try {
    const data = await fetchRepos();
    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'github unavailable', detail: err.message, repos: [] });
  }
});

app.get('/api/profile', (_req, res) => {
  res.json({
    handle: USER,
    name: 'miket',
    age: 17,
    location: 'India',
    discord: 'miket.tsx',
    github: `https://github.com/${USER}`,
    languages: ['JavaScript', 'TypeScript', 'Java', 'Python'],
    learning: ['Rust'],
  });
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()), cold: !cache.data });
});

/* ── static ── */
app.use(
  express.static(join(__dirname, 'public'), {
    extensions: ['html'],
    setHeaders(res, path) {
      if (/\.(png|jpe?g|webp|avif|svg|woff2|mp3|ogg)$/.test(path)) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  }),
);

app.use((_req, res) => {
  res.status(404).sendFile(join(__dirname, 'public', '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`moonlight on http://localhost:${PORT}  (user: ${USER})`);
});
