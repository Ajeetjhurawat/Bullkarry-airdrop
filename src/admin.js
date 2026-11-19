(function () {
  const CFG_KEY = 'bk_gh_cfg_v1';
  let content = null;
  let fileSha = null;
  let activeTab = 'airdrops';

  const el = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function loadCfg() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveCfg(cfg) {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  function toBase64Utf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function fromBase64Utf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
  }

  function toast(msg, isErr) {
    const t = el('adminToast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = isErr ? '#dc2626' : '#16a34a';
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3500);
  }

  async function connectAndLoad() {
    const owner = el('ghOwner').value.trim();
    const repo = el('ghRepo').value.trim();
    const branch = el('ghBranch').value.trim() || 'main';
    const token = el('ghToken').value.trim();
    if (!owner || !repo || !token) return toast('Please fill GitHub Username, Repo, and Token.', true);

    saveCfg({ owner, repo, branch, token });
    el('connectBtn').textContent = 'Loading...';
    try {
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/data/content.json?ref=${encodeURIComponent(branch)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
      });
      if (!res.ok) throw new Error('GitHub error ' + res.status + ' — check repo name & token permissions.');
      const json = await res.json();
      fileSha = json.sha;
      content = JSON.parse(fromBase64Utf8(json.content));
      el('loginBox').style.display = 'none';
      el('workspaceBox').style.display = 'block';
      renderWorkspace();
      toast('Connected! Loaded live content.json from GitHub.');
    } catch (err) {
      toast(err.message, true);
    } finally {
      el('connectBtn').textContent = 'Connect & Load Site Data';
    }
  }

  async function publishLive() {
    const cfg = loadCfg();
    if (!content || !cfg.token) return toast('Not connected to GitHub.', true);
    const btn = el('publishBtn');
    btn.disabled = true;
    btn.textContent = 'Publishing...';
    try {
      const bodyStr = JSON.stringify(content, null, 2) + '\n';
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/data/content.json`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update content.json via Bullkarry Admin',
          content: toBase64Utf8(bodyStr),
          sha: fileSha,
          branch: cfg.branch || 'main'
        })
      });
      if (!res.ok) throw new Error('Publish failed (' + res.status + '). Reload data and try again.');
      const out = await res.json();
      fileSha = out.content.sha;
      toast('Published! Netlify is rebuilding your live site (~45s).');
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish Live to Netlify';
    }
  }

  function renderWorkspace() {
    const tabs = [
      ['airdrops', 'Airdrops (' + (content.airdrops || []).length + ')'],
      ['claims', 'Claims (' + (content.claims || []).length + ')'],
      ['raises', 'Raises (' + (content.raises || []).length + ')'],
      ['guides', 'Guides (' + (content.guides || []).length + ')'],
      ['events', 'Events (' + (content.events || []).length + ')']
    ];
    el('adminTabs').innerHTML = tabs.map(([id, label]) =>
      `<button type="button" data-tab="${id}" class="btn ${activeTab === id ? 'btn-primary' : ''}">${esc(label)}</button>`
    ).join('');
    el('adminTabs').querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => { activeTab = b.getAttribute('data-tab'); renderWorkspace(); });
    });

    const body = el('adminBody');
    if (activeTab === 'airdrops') {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h2 style="margin:0;">Manage Airdrops</h2>
          <button type="button" id="addAirdropBtn" class="btn btn-primary">+ Add Airdrop</button>
        </div>
        <div style="display:grid;gap:0.75rem;">
          ${(content.airdrops || []).map((a, i) => `
            <div class="card" style="display:grid;gap:0.5rem;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.5rem;">
                <input data-arr="airdrops" data-idx="${i}" data-key="name" value="${esc(a.name)}" placeholder="Name" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
                <input data-arr="airdrops" data-idx="${i}" data-key="id" value="${esc(a.id)}" placeholder="Slug ID (e.g. txflow)" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
                <input data-arr="airdrops" data-idx="${i}" data-key="chain" value="${esc(a.chain)}" placeholder="Chain" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
                <select data-arr="airdrops" data-idx="${i}" data-key="status" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;">
                  ${['Active','Upcoming','Claimable','Ended'].map(st => `<option value="${st}" ${a.status===st?'selected':''}>${st}</option>`).join('')}
                </select>
                <input data-arr="airdrops" data-idx="${i}" data-key="funding" value="${esc(a.funding)}" placeholder="Funding" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
                <input data-arr="airdrops" data-idx="${i}" data-key="officialUrl" value="${esc(a.officialUrl)}" placeholder="Official URL" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
                <input data-arr="airdrops" data-idx="${i}" data-key="claimUrl" value="${esc(a.claimUrl || '')}" placeholder="Claim URL (optional)" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              </div>
              <input data-arr="airdrops" data-idx="${i}" data-key="shortDesc" value="${esc(a.shortDesc)}" placeholder="Short description" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <textarea data-arr="airdrops" data-idx="${i}" data-key="analysis" rows="3" placeholder="Original analysis (300+ words recommended)" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;">${esc(a.analysis)}</textarea>
              <div style="display:flex;justify-content:flex-end;">
                <button type="button" data-del="airdrops" data-idx="${i}" class="btn" style="color:#dc2626;">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>`;
      el('addAirdropBtn').onclick = () => {
        content.airdrops.unshift({
          id: 'project-' + Date.now(), name: 'New Project', category: 'DeFi', chain: 'Ethereum',
          status: 'Active', verifiedBadge: 'Verified', lastVerified: new Date().toISOString().slice(0, 10),
          funding: 'Undisclosed', officialUrl: 'https://example.com', shortDesc: 'Short summary...',
          analysis: 'Write original protocol overview, participation steps, and risk notes here.', tasks: []
        });
        renderWorkspace();
      };
    } else if (activeTab === 'claims') {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h2 style="margin:0;">Manage Claims</h2>
          <button type="button" id="addClaimBtn" class="btn btn-primary">+ Add Claim</button>
        </div>
        <div style="display:grid;gap:0.75rem;">
          ${(content.claims || []).map((c, i) => `
            <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.5rem;align-items:center;">
              <input data-arr="claims" data-idx="${i}" data-key="project" value="${esc(c.project)}" placeholder="Project" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="claims" data-idx="${i}" data-key="chain" value="${esc(c.chain)}" placeholder="Chain" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="claims" data-idx="${i}" data-key="deadline" value="${esc(c.deadline)}" placeholder="Deadline" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="claims" data-idx="${i}" data-key="url" value="${esc(c.url)}" placeholder="Official Claim URL" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <button type="button" data-del="claims" data-idx="${i}" class="btn" style="color:#dc2626;">Delete</button>
            </div>
          `).join('')}
        </div>`;
      el('addClaimBtn').onclick = () => {
        content.claims.unshift({ id: 'claim-' + Date.now(), project: 'New Claim', chain: 'Ethereum', status: 'Open', deadline: 'TBA', url: 'https://example.com', desc: 'Official claim portal.' });
        renderWorkspace();
      };
    } else if (activeTab === 'raises') {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h2 style="margin:0;">Manage Raises</h2>
          <button type="button" id="addRaiseBtn" class="btn btn-primary">+ Add Raise</button>
        </div>
        <div style="display:grid;gap:0.75rem;">
          ${(content.raises || []).map((r, i) => `
            <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.5rem;align-items:center;">
              <input data-arr="raises" data-idx="${i}" data-key="project" value="${esc(r.project)}" placeholder="Project" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="raises" data-idx="${i}" data-key="funding" value="${esc(r.funding)}" placeholder="Funding ($10M)" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="raises" data-idx="${i}" data-key="round" value="${esc(r.round)}" placeholder="Round (Seed)" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="raises" data-idx="${i}" data-key="investors" value="${esc(r.investors)}" placeholder="Investors" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <button type="button" data-del="raises" data-idx="${i}" class="btn" style="color:#dc2626;">Delete</button>
            </div>
          `).join('')}
        </div>`;
      el('addRaiseBtn').onclick = () => {
        content.raises.unshift({ project: 'New Protocol', category: 'DeFi', funding: '$10M', round: 'Seed', investors: 'TBA', date: new Date().toISOString().slice(0, 10) });
        renderWorkspace();
      };
    } else if (activeTab === 'guides') {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h2 style="margin:0;">Manage Guides</h2>
          <button type="button" id="addGuideBtn" class="btn btn-primary">+ Add Guide</button>
        </div>
        <div style="display:grid;gap:0.75rem;">
          ${(content.guides || []).map((g, i) => `
            <div class="card" style="display:grid;gap:0.5rem;">
              <input data-arr="guides" data-idx="${i}" data-key="title" value="${esc(g.title)}" placeholder="Title" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;font-weight:700;" />
              <input data-arr="guides" data-idx="${i}" data-key="slug" value="${esc(g.slug)}" placeholder="URL slug" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <textarea data-arr="guides" data-idx="${i}" data-key="body" rows="3" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;">${esc(g.body)}</textarea>
              <button type="button" data-del="guides" data-idx="${i}" class="btn" style="color:#dc2626;justify-self:end;">Delete</button>
            </div>
          `).join('')}
        </div>`;
      el('addGuideBtn').onclick = () => {
        content.guides.unshift({ slug: 'guide-' + Date.now(), title: 'New Guide', summary: 'Summary...', body: 'Guide content...' });
        renderWorkspace();
      };
    } else {
      body.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h2 style="margin:0;">Manage Events</h2>
          <button type="button" id="addEventBtn" class="btn btn-primary">+ Add Event</button>
        </div>
        <div style="display:grid;gap:0.75rem;">
          ${(content.events || []).map((ev, i) => `
            <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.5rem;align-items:center;">
              <input data-arr="events" data-idx="${i}" data-key="title" value="${esc(ev.title)}" placeholder="Event Title" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="events" data-idx="${i}" data-key="date" value="${esc(ev.date)}" placeholder="YYYY-MM-DD" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <input data-arr="events" data-idx="${i}" data-key="type" value="${esc(ev.type)}" placeholder="Snapshot / TGE" style="padding:0.5rem;border:1px solid var(--border);border-radius:0.5rem;" />
              <button type="button" data-del="events" data-idx="${i}" class="btn" style="color:#dc2626;">Delete</button>
            </div>
          `).join('')}
        </div>`;
      el('addEventBtn').onclick = () => {
        content.events.unshift({ id: 'ev-' + Date.now(), title: 'New Event', date: '2026-12-31', type: 'Snapshot', project: 'Protocol' });
        renderWorkspace();
      };
    }

    body.querySelectorAll('[data-arr]').forEach(inp => {
      inp.addEventListener('input', () => {
        const arr = inp.getAttribute('data-arr');
        const idx = Number(inp.getAttribute('data-idx'));
        const key = inp.getAttribute('data-key');
        content[arr][idx][key] = inp.value;
      });
    });
    body.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const arr = btn.getAttribute('data-del');
        const idx = Number(btn.getAttribute('data-idx'));
        content[arr].splice(idx, 1);
        renderWorkspace();
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const cfg = loadCfg();
    if (cfg.owner) el('ghOwner').value = cfg.owner;
    if (cfg.repo) el('ghRepo').value = cfg.repo;
    if (cfg.branch) el('ghBranch').value = cfg.branch;
    if (cfg.token) el('ghToken').value = cfg.token;
    el('connectBtn')?.addEventListener('click', connectAndLoad);
    el('publishBtn')?.addEventListener('click', publishLive);
    el('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem(CFG_KEY);
      el('ghToken').value = '';
      el('workspaceBox').style.display = 'none';
      el('loginBox').style.display = 'block';
      toast('Disconnected token from this browser.');
    });
  });
})();
