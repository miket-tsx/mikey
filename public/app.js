/* miket-tsx — site runtime */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────────────────────── preloader ───────────────────────── */
(() => {
  const el = document.getElementById('preloader');
  const pct = el.querySelector('.pre-pct');
  const start = performance.now();
  const min = reduced ? 300 : 1900;

  const tick = () => {
    const t = Math.min(1, (performance.now() - start) / min);
    const eased = 1 - Math.pow(1 - t, 2.2);
    pct.textContent = String(Math.min(99, Math.floor(eased * 100))).padStart(2, '0');
    if (t < 1) requestAnimationFrame(tick);
    else finish();
  };

  function finish() {
    pct.textContent = '100';
    el.classList.add('done');
    document.body.classList.add('ready');
    setTimeout(() => el.remove(), 1000);
  }

  requestAnimationFrame(tick);
})();

/* ───────────────────────── starfield ───────────────────────── */
(() => {
  const cv = document.getElementById('stars');
  const ctx = cv.getContext('2d');
  let w, h, dpr, stars = [];

  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr;
    h = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    const count = Math.round((innerWidth * innerHeight) / 11000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.9,
      r: (Math.random() * 1.15 + 0.25) * dpr,
      a: Math.random() * 0.55 + 0.15,
      ph: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.9 + 0.25,
    }));
  };

  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const tw = reduced ? 1 : 0.62 + 0.38 * Math.sin(t * 0.001 * s.sp + s.ph);
      ctx.globalAlpha = s.a * tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#dfe9ff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(draw);
  };

  build();
  requestAnimationFrame(draw);
  addEventListener('resize', () => { build(); if (reduced) draw(0); });
})();

/* ───────────────────────── cursor light ───────────────────────── */
(() => {
  if (reduced || matchMedia('(pointer: coarse)').matches) return;
  const light = document.getElementById('cursor-light');
  const moon = document.querySelector('.moonfield');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;

  const loop = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    light.style.transform = `translate(${x}px, ${y}px)`;
    if (moon) moon.style.transform = `translate(${(x - innerWidth / 2) * -0.012}px, ${(y - innerHeight / 2) * -0.012}px)`;
    raf = requestAnimationFrame(loop);
  };

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!raf) { light.style.opacity = 1; loop(); }
  }, { passive: true });
})();

/* ───────────────────────── nav ───────────────────────── */
addEventListener('scroll', () => {
  document.querySelector('.nav').classList.toggle('scrolled', scrollY > 24);
}, { passive: true });

/* ───────────────────────── reveal ───────────────────────── */
(() => {
  const els = document.querySelectorAll('.section, .hero-copy, .hero-disc, .repo');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  els.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
})();

/* ───────────────────────── discord copy ───────────────────────── */
(() => {
  document.querySelectorAll('[data-handle]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const handle = btn.dataset.handle;
      const label = btn.tagName === 'BUTTON' ? btn.querySelector('span') || btn : btn;
      const original = label.textContent;
      try {
        await navigator.clipboard.writeText(handle);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = handle;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      label.textContent = 'copied';
      btn.classList.add('copied');
      setTimeout(() => { label.textContent = original; btn.classList.remove('copied'); }, 1400);
    });
  });
})();

/* ───────────────────────── repos ───────────────────────── */
(() => {
  const grid = document.getElementById('repo-grid');
  const status = document.getElementById('repo-status');
  const foot = document.getElementById('repo-foot');

  const COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Rust: '#dea584',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Dockerfile: '#384d54',
  };

  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div');
    s.className = 'skel';
    grid.appendChild(s);
  }

  const ago = (iso) => {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    if (d < 2592000) return `${Math.floor(d / 86400)}d ago`;
    if (d < 31536000) return `${Math.floor(d / 2592000)}mo ago`;
    return `${Math.floor(d / 31536000)}y ago`;
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const card = (r) => {
    const a = document.createElement('a');
    a.className = 'repo';
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener';
    const color = COLORS[r.language] || '#7aa2ff';
    a.innerHTML = `
      <div class="repo-top">
        <h3 class="repo-name">${esc(r.name)}</h3>
        ${r.stars ? `<span class="repo-stars">★ ${r.stars}</span>` : ''}
      </div>
      ${r.description ? `<p class="repo-desc">${esc(r.description)}</p>` : ''}
      ${r.topics?.length ? `<div class="repo-topics">${r.topics.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="repo-meta">
        ${r.language ? `<span class="lang" style="color:${color}"><i style="color:${color};background:${color}"></i>${esc(r.language)}</span>` : ''}
        <span>updated ${ago(r.pushed_at)}</span>
      </div>`;
    return a;
  };

  (async () => {
    try {
      const res = await fetch('/api/repos', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `http ${res.status}`);

      const repos = data.repos || [];
      grid.innerHTML = '';

      if (!repos.length) {
        grid.innerHTML = '<p style="color:var(--moon-dim)">No public repositories yet.</p>';
        status.innerHTML = '<span class="pulse"></span> 0 repos';
        return;
      }

      const frag = document.createDocumentFragment();
      repos.forEach((r) => frag.appendChild(card(r)));
      grid.appendChild(frag);

      status.innerHTML = `<span class="pulse"></span> ${repos.length} repos · live`;
      foot.innerHTML = `loaded ${new Date(data.fetched).toLocaleTimeString()} · refreshed every 5 min · <a href="https://github.com/miket-tsx?tab=repositories" target="_blank" rel="noopener">all on github ↗</a>`;
    } catch (err) {
      grid.innerHTML = '';
      status.innerHTML = '<span class="pulse err"></span> github unreachable';
      foot.innerHTML = `couldn't reach the api (${esc(err.message)}). <a href="https://github.com/miket-tsx?tab=repositories" target="_blank" rel="noopener">browse directly ↗</a>`;
    }
  })();
})();

