const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/content.json'), 'utf8'));
const dist = path.join(__dirname, 'dist');
fs.mkdirSync(dist, { recursive: true });

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
}

copyDir(path.join(__dirname, 'src'), path.join(dist, 'src'));
copyDir(path.join(__dirname, 'data'), path.join(dist, 'data'));
for (const f of ['_headers', 'ads.txt', 'robots.txt', 'manifest.json', 'sw.js']) {
  if (fs.existsSync(path.join(__dirname, f))) fs.copyFileSync(path.join(__dirname, f), path.join(dist, f));
}

const urls = [];
function writePage(relPath, { title, desc, body, jsonLd }) {
  const canonical = data.site.domain + (relPath === 'index.html' ? '/' : '/' + relPath.replace(/index\.html$/, ''));
  urls.push(canonical);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="stylesheet" href="/src/styles.css" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
  <header class="topbar">
    <a href="/" style="font-weight:800;font-size:1.05rem;">Bullkarry Drops</a>
    <nav class="navlinks" aria-label="Main navigation">
      <a href="/airdrops/">Airdrops</a>
      <a href="/claims/">Claims</a>
      <a href="/raises/">Raises</a>
      <a href="/guides/">Guides</a>
      <a href="/events/">Events</a>
      <button id="themeToggle" class="btn" aria-label="Toggle theme">Theme</button>
    </nav>
  </header>
  <main class="wrap">${body}</main>
  <footer class="footer">
    <div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;">
      <span>&copy; 2026 Bullkarry Drops &mdash; Educational Web3 Research (DYOR)</span>
      <div style="display:flex;flex-wrap:wrap;gap:1rem;">
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
        <a href="/editorial-policy/">Editorial Policy</a>
        <a href="/privacy/">Privacy Policy</a>
        <a href="/terms/">Terms</a>
        <a href="/disclaimer/">Disclaimer</a>
      </div>
    </div>
  </footer>
  <script src="/src/app.js" defer></script>
</body>
</html>`;
  const outPath = path.join(dist, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
}

// 1. Home
writePage('index.html', {
  title: 'Bullkarry Drops — Verified Crypto Airdrops, Claims & Guides',
  desc: data.site.description,
  body: `
    <section class="card" style="margin-bottom:1.25rem;">
      <h1 style="margin:0 0 0.5rem;">Crypto Airdrops &amp; Web3 Research</h1>
      <p style="margin:0 0 1rem;color:var(--muted);">Credible protocols, verified claim portals, and transparent risk analysis.</p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <a href="/airdrops/" class="btn btn-primary">Browse Airdrops</a>
        <a href="/guides/" class="btn">Read Security Guides</a>
      </div>
    </section>
    <div class="grid2">
      ${data.airdrops.map(a => `
        <article class="card">
          <span class="badge">${esc(a.status)} &bull; ${esc(a.verifiedBadge)}</span>
          <h2 style="margin:0.5rem 0 0.25rem;"><a href="/airdrops/${esc(a.id)}/">${esc(a.name)}</a></h2>
          <p style="font-size:0.88rem;color:var(--muted);">${esc(a.shortDesc)}</p>
          <a href="/airdrops/${esc(a.id)}/" class="btn">View Guide &amp; Risks</a>
        </article>
      `).join('')}
    </div>
  `
});

// 2. Airdrops Index + Per-Airdrop Static SEO Pages
writePage('airdrops/index.html', {
  title: 'Crypto Airdrops List — Bullkarry Drops',
  desc: 'Search and filter verified crypto airdrops with risk analysis and official links.',
  body: `
    <h1>Crypto Airdrops List</h1>
    <input id="airdropSearch" type="search" placeholder="Search airdrops by name or chain..." aria-label="Search airdrops" style="width:100%;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid var(--border);margin-bottom:1rem;" />
    <div id="airdropCards" class="grid2">
      ${data.airdrops.map(a => `
        <article class="card" data-search="${esc((a.name + ' ' + a.chain + ' ' + a.category).toLowerCase())}">
          <span class="badge">${esc(a.status)} &bull; ${esc(a.chain)}</span>
          <h2 style="margin:0.5rem 0;"><a href="/airdrops/${esc(a.id)}/">${esc(a.name)}</a></h2>
          <p style="font-size:0.88rem;color:var(--muted);">${esc(a.shortDesc)}</p>
          <a href="/airdrops/${esc(a.id)}/" class="btn">Open Analysis</a>
        </article>
      `).join('')}
    </div>
  `
});

for (const a of data.airdrops) {
  writePage(`airdrops/${a.id}/index.html`, {
    title: `${a.name} Airdrop Guide, Tasks & Risks — Bullkarry Drops`,
    desc: a.shortDesc,
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: `${a.name} Airdrop Guide`, dateModified: a.lastVerified },
    body: `
      <a href="/airdrops/" class="btn" style="margin-bottom:1rem;">&larr; All Airdrops</a>
      <article class="card">
        <span class="badge">${esc(a.status)} &bull; ${esc(a.verifiedBadge)} &bull; Last checked ${esc(a.lastVerified)}</span>
        <h1 style="margin:0.5rem 0;">${esc(a.name)} (${esc(a.chain)})</h1>
        <p><strong>Category:</strong> ${esc(a.category)} &bull; <strong>Funding:</strong> ${esc(a.funding)}</p>
        <p>${esc(a.analysis)}</p>
        <h2>Tasks &amp; Participation Steps</h2>
        <ul>${a.tasks.map(t => `<li><strong>${esc(t.title)}:</strong> ${esc(t.desc)}</li>`).join('')}</ul>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">
          <a href="${esc(a.officialUrl)}" target="_blank" rel="noopener nofollow" class="btn btn-primary">Official Website</a>
          ${a.claimUrl ? `<a href="${esc(a.claimUrl)}" target="_blank" rel="noopener nofollow" class="btn">Official Claim Portal</a>` : ''}
        </div>
      </article>
      <div class="ad-slot" aria-label="Advertisement">AdSense Slot (Reserved min-height 90px — Active after approval)</div>
    `
  });
}

// 3. Claims, Raises, Events, Guides, Policy Pages
writePage('claims/index.html', {
  title: 'Verified Token Claims — Bullkarry Drops',
  desc: 'Official claim portals and safety reminders.',
  body: `<h1>Open Claims</h1><div class="grid2">${data.claims.map(c => `<div class="card"><h2>${esc(c.project)}</h2><p>${esc(c.desc)}</p><p><strong>Deadline:</strong> ${esc(c.deadline)}</p><a href="${esc(c.url)}" target="_blank" rel="noopener nofollow" class="btn btn-primary">Official Claim</a></div>`).join('')}</div>`
});

writePage('raises/index.html', {
  title: 'Crypto Funding Raises — Bullkarry Drops',
  desc: 'Recent Web3 fundraising rounds and venture investors.',
  body: `<h1>Crypto Raises</h1><div class="card">${data.raises.map(r => `<p><strong>${esc(r.project)}</strong> (${esc(r.category)}) &mdash; ${esc(r.funding)} ${esc(r.round)} &bull; ${esc(r.investors)} (${esc(r.date)})</p>`).join('')}</div>`
});

writePage('events/index.html', {
  title: 'Airdrop & TGE Events Calendar — Bullkarry Drops',
  desc: 'Upcoming snapshots, claim deadlines, and token events.',
  body: `<h1>Events Calendar</h1><div class="grid2">${data.events.map(e => `<div class="card"><span class="badge">${esc(e.type)}</span><h2>${esc(e.title)}</h2><p>Date: ${esc(e.date)} &bull; Project: ${esc(e.project)}</p></div>`).join('')}</div>`
});

writePage('guides/index.html', {
  title: 'Crypto Airdrop & Security Guides — Bullkarry Drops',
  desc: 'Original educational guides on wallet safety, points math, and perps risks.',
  body: `<h1>Guides &amp; Research</h1><div class="grid2">${data.guides.map(g => `<article class="card"><h2><a href="/guides/${esc(g.slug)}/">${esc(g.title)}</a></h2><p>${esc(g.summary)}</p><a href="/guides/${esc(g.slug)}/" class="btn">Read Guide</a></article>`).join('')}</div>`
});

for (const g of data.guides) {
  writePage(`guides/${g.slug}/index.html`, {
    title: `${g.title} — Bullkarry Drops`,
    desc: g.summary,
    body: `<a href="/guides/" class="btn" style="margin-bottom:1rem;">&larr; All Guides</a><article class="card"><h1>${esc(g.title)}</h1><p>${esc(g.body)}</p></article>`
  });
}

const staticPages = [
  ['about', 'About Bullkarry Drops', 'Independent Web3 research directory helping users evaluate airdrops, points programs, and protocol risks without hype or guaranteed-return claims.'],
  ['editorial-policy', 'How We Select Airdrops (Editorial Policy)', 'We list protocols based on public documentation, verifiable on-chain contracts, and disclosed funding. We never endorse guaranteed earnings or ask for private keys.'],
  ['privacy', 'Privacy Policy', 'Bullkarry Drops stores theme preferences locally in your browser. When Google AdSense or certified CMP cookies are active, third-party vendors may use cookies to serve personalized or non-personalized ads.'],
  ['terms', 'Terms of Use', 'All content is provided for informational purposes only. Users are solely responsible for verifying smart contracts and tax obligations in their jurisdiction.'],
  ['disclaimer', 'Risk Disclaimer', 'Cryptocurrency and DeFi participation carries risk of capital loss. Nothing on this site is financial, legal, or tax advice.']
];
for (const [slug, title, body] of staticPages) {
  writePage(`${slug}/index.html`, { title: `${title} — Bullkarry Drops`, desc: body.slice(0, 140), body: `<article class="card"><h1>${esc(title)}</h1><p>${esc(body)}</p></article>` });
}

writePage('contact/index.html', {
  title: 'Contact Us — Bullkarry Drops',
  desc: 'Submit corrections, project updates, or partnership inquiries.',
  body: `
    <article class="card">
      <h1>Contact Us</h1>
      <form name="contact" method="POST" data-netlify="true" style="display:grid;gap:0.75rem;max-width:480px;">
        <input type="hidden" name="form-name" value="contact" />
        <label>Name <input type="text" name="name" required style="width:100%;padding:0.6rem;border-radius:0.5rem;border:1px solid var(--border);" /></label>
        <label>Email <input type="email" name="email" required style="width:100%;padding:0.6rem;border-radius:0.5rem;border:1px solid var(--border);" /></label>
        <label>Message <textarea name="message" rows="4" required style="width:100%;padding:0.6rem;border-radius:0.5rem;border:1px solid var(--border);"></textarea></label>
        <button type="submit" class="btn btn-primary">Send Message</button>
      </form>
    </article>
  `
});


writePage('admin/index.html', {
  title: 'Admin Auto-Publish — Bullkarry Drops',
  desc: 'GitHub-connected visual admin workspace for Bullkarry Drops.',
  body: `
    <div id="adminToast" style="display:none;position:fixed;bottom:1rem;right:1rem;z-index:50;color:#fff;padding:0.75rem 1rem;border-radius:0.75rem;font-weight:700;font-size:0.85rem;"></div>
    <section id="loginBox" class="card" style="max-width:520px;margin:1.5rem auto;display:grid;gap:0.75rem;">
      <h1 style="margin:0;">Admin Auto-Publish (GitHub + Netlify)</h1>
      <p style="margin:0;font-size:0.88rem;color:var(--muted);">Connect once using a GitHub Fine-grained Token (Contents: Read &amp; Write). Changes publish straight to GitHub and Netlify rebuilds automatically.</p>
      <label>GitHub Username <input id="ghOwner" type="text" placeholder="your-github-username" style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:0.5rem;" /></label>
      <label>Repository Name <input id="ghRepo" type="text" placeholder="bullkarry" style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:0.5rem;" /></label>
      <label>Branch <input id="ghBranch" type="text" value="main" style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:0.5rem;" /></label>
      <label>GitHub Token <input id="ghToken" type="password" placeholder="github_pat_..." style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:0.5rem;" /></label>
      <button id="connectBtn" type="button" class="btn btn-primary">Connect &amp; Load Site Data</button>
    </section>
    <section id="workspaceBox" style="display:none;gap:1rem;">
      <div class="card" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0.75rem;margin-bottom:1rem;">
        <div id="adminTabs" style="display:flex;flex-wrap:wrap;gap:0.5rem;"></div>
        <div style="display:flex;gap:0.5rem;">
          <button id="logoutBtn" type="button" class="btn">Disconnect</button>
          <button id="publishBtn" type="button" class="btn btn-primary">Publish Live to Netlify</button>
        </div>
      </div>
      <div id="adminBody"></div>
    </section>
    <script src="/src/admin.js" defer></script>
  `
});

// 4. Generate sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Built ${urls.length} static SEO pages + sitemap.xml in dist/`);
