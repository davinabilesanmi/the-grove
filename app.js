(() => {
  const STORE_KEY = 'grove.notes.v1';
  const THEME_KEY = 'grove.theme';
  const CHECKS_KEY = 'grove.checks.v1';
  const WIKI = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const STAGES = {
    seedling: { icon: '🌱', label: 'Seedling' },
    budding: { icon: '🌿', label: 'Budding' },
    evergreen: { icon: '🌳', label: 'Evergreen' },
  };

  const app = document.getElementById('app');
  const peek = document.getElementById('peek');

  const slugify = s => String(s).toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  // ---------- Storage ----------
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  };

  const baseNotes = (window.GARDEN_NOTES || []).map(n => ({ ...n, slug: n.slug || slugify(n.title) }));
  const baseSlugs = new Set(baseNotes.map(n => n.slug));
  let user = store.get(STORE_KEY, {}); // slug -> note, or { deleted: true } to hide a base note

  // ---------- Garden index ----------
  let notes = [], bySlug = new Map(), outlinks = new Map(), backlinks = new Map(), seeds = new Map(), linkCount = 0;

  function build() {
    bySlug = new Map();
    for (const n of baseNotes) bySlug.set(n.slug, { ...n, source: 'seed' });
    for (const [slug, n] of Object.entries(user)) {
      if (n.deleted) bySlug.delete(slug);
      else bySlug.set(slug, { ...n, slug, source: baseSlugs.has(slug) ? 'edited' : 'mine' });
    }
    notes = [...bySlug.values()];
    for (const n of notes) {
      if (!STAGES[n.stage]) n.stage = 'seedling';
      n.tags = n.tags || [];
      n.body = n.body || '';
    }

    outlinks = new Map(); backlinks = new Map(); seeds = new Map(); linkCount = 0;
    for (const n of notes) {
      const outs = new Set();
      for (const m of n.body.matchAll(WIKI)) {
        const title = m[1].trim(), s = slugify(title);
        if (!s || s === n.slug) continue;
        outs.add(s);
        if (!bySlug.has(s)) {
          if (!seeds.has(s)) seeds.set(s, { title, from: new Set() });
          seeds.get(s).from.add(n.slug);
        }
      }
      outlinks.set(n.slug, outs);
      for (const s of outs) {
        if (!backlinks.has(s)) backlinks.set(s, new Set());
        backlinks.get(s).add(n.slug);
        if (bySlug.has(s)) linkCount++;
      }
    }
  }

  // ---------- Markdown ----------
  function inline(text) {
    return text.split(/(`[^`]+`|\[\[[^\]]+\]\])/g).map((part, i) => {
      if (i % 2) {
        if (part[0] === '`') return `<code>${esc(part.slice(1, -1))}</code>`;
        const [, t, label] = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/) || [, part.slice(2, -2)];
        const slug = slugify(t);
        return `<a href="#/n/${slug}" class="wikilink${bySlug.has(slug) ? '' : ' is-seed'}" data-slug="${slug}">${esc((label || t).trim())}</a>`;
      }
      return esc(part)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
          /^https?:|^mailto:/.test(u) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>`
          : /^#/.test(u) ? `<a href="${u}">${t}</a>` : t);
    }).join('');
  }

  function md(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    let html = '', para = [], list = null;
    const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    const flush = () => { flushPara(); closeList(); };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      if (line.startsWith('```')) {
        flush();
        const buf = [];
        while (++i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i]);
        html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
      } else if (!line.trim()) {
        flush();
      } else if ((m = line.match(/^(#{1,4})\s+(.*)/))) {
        flush();
        const l = m[1].length + 1;
        html += `<h${l}>${inline(m[2])}</h${l}>`;
      } else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
        flush(); html += '<hr>';
      } else if ((m = line.match(/^>\s?(.*)/))) {
        flush(); html += `<blockquote>${inline(m[1])}</blockquote>`;
      } else if ((m = line.match(/^\s*(?:[-*]|(\d+)\.)\s+(.*)/))) {
        flushPara();
        const tag = m[1] ? 'ol' : 'ul';
        if (list !== tag) { closeList(); html += `<${tag}>`; list = tag; }
        const task = m[2].match(/^\[( |x)\]\s+(.*)/i);
        html += task
          ? `<li class="task"><label><input type="checkbox" data-key="${esc(task[2].trim())}"${task[1].trim() ? ' checked' : ''}><span>${inline(task[2])}</span></label></li>`
          : `<li>${inline(m[2])}</li>`;
      } else {
        closeList(); para.push(line.trim());
      }
    }
    flush();
    return html;
  }

  const excerpt = (body, len = 150) => {
    const t = body.replace(/```[\s\S]*?```/g, '')
      .replace(WIKI, (_, t, l) => l || t)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*]\s+\[[ x]\]\s+/gim, '')
      .replace(/[#>*`_]/g, '').replace(/\s+/g, ' ').trim();
    return t.length > len ? t.slice(0, len).replace(/\s+\S*$/, '') + '…' : t;
  };

  // ---------- Views ----------
  const filter = { q: '', stage: 'all', tag: null };

  const card = n => `
    <a class="card stage-${n.stage}" href="#/n/${n.slug}">
      <span class="stage-pill">${STAGES[n.stage].icon} ${STAGES[n.stage].label}</span>
      <h3>${esc(n.title)}</h3>
      <p>${esc(excerpt(n.body))}</p>
      <footer><span>Tended ${fmt(n.tended)}</span><span title="Notes linking here">↩ ${backlinks.get(n.slug)?.size || 0}</span></footer>
    </a>`;

  function renderHome() {
    const tags = [...new Set(notes.flatMap(n => n.tags))].sort();
    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">A digital garden</p>
        <h1>Notes that grow<br>in the open.</h1>
        <p class="lede">This isn't a blog. Ideas here start as seedlings, get tended over time, and link into each other like roots under a forest floor. Wander anywhere.</p>
        <p class="stats"><b>${notes.length}</b> notes · <b>${linkCount}</b> connections · <b>${seeds.size}</b> seeds waiting to be planted</p>
      </section>
      <section class="toolbar">
        <input type="search" id="q" placeholder="Search the garden…" value="${esc(filter.q)}" aria-label="Search notes">
        <div class="chips">${['all', ...Object.keys(STAGES)].map(s =>
          `<button class="chip${filter.stage === s ? ' on' : ''}" data-stage="${s}">${s === 'all' ? 'All notes' : STAGES[s].icon + ' ' + STAGES[s].label}</button>`).join('')}</div>
        ${tags.length ? `<div class="chips">${tags.map(t =>
          `<button class="chip tag${filter.tag === t ? ' on' : ''}" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
      </section>
      <section class="grid" id="grid"></section>
      ${seeds.size ? `
      <section class="seeds">
        <h2>🌰 Seeds waiting to be planted</h2>
        <p>Ideas other notes mention that haven't been written yet.</p>
        <div class="chips">${[...seeds].map(([s, v]) => `<a class="chip" href="#/n/${s}">${esc(v.title)}</a>`).join('')}</div>
      </section>` : ''}`;

    drawGrid();
    app.querySelector('#q').addEventListener('input', e => { filter.q = e.target.value; drawGrid(); });
    app.querySelectorAll('[data-stage]').forEach(b => b.addEventListener('click', () => { filter.stage = b.dataset.stage; renderHome(); }));
    app.querySelectorAll('[data-tag]').forEach(b => b.addEventListener('click', () => { filter.tag = filter.tag === b.dataset.tag ? null : b.dataset.tag; renderHome(); }));
  }

  function drawGrid() {
    const q = filter.q.trim().toLowerCase();
    const list = notes
      .filter(n => (filter.stage === 'all' || n.stage === filter.stage)
        && (!filter.tag || n.tags.includes(filter.tag))
        && (!q || `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase().includes(q)))
      .sort((a, b) => (b.tended || '').localeCompare(a.tended || '') || a.title.localeCompare(b.title));
    app.querySelector('#grid').innerHTML = list.length ? list.map(card).join('')
      : `<p class="empty">Nothing growing here yet. <a href="#/plant">Plant a note?</a></p>`;
  }

  const linkItem = slug => {
    const n = bySlug.get(slug);
    if (!n) return `<li><a href="#/n/${slug}"><strong>🌰 ${esc(seeds.get(slug)?.title || slug)}</strong><span>Not planted yet</span></a></li>`;
    return `<li><a href="#/n/${slug}"><strong>${STAGES[n.stage].icon} ${esc(n.title)}</strong><span>${esc(excerpt(n.body, 80))}</span></a></li>`;
  };

  function renderNote(slug) {
    const n = bySlug.get(slug);
    if (!n) {
      const seed = seeds.get(slug);
      app.innerHTML = `
        <article class="note seed-page">
          <a class="back" href="#/">← Back to the garden</a>
          <p class="eyebrow">🌰 Unplanted seed</p>
          <h1>${esc(seed ? seed.title : slug.replace(/-/g, ' '))}</h1>
          <p>${seed ? 'This idea has been mentioned, but nobody has written it yet.' : 'There’s no note here.'}</p>
          ${seed ? `<p>Mentioned in ${[...seed.from].map(s => `<a class="wikilink" href="#/n/${s}" data-slug="${s}">${esc(bySlug.get(s).title)}</a>`).join(', ')}.</p>` : ''}
          <div class="note-actions"><a class="btn" href="#/plant/${slug}">🌱 Plant this note</a></div>
        </article>`;
      return;
    }
    document.title = `${n.title} · The Grove`;
    const back = [...(backlinks.get(slug) || [])].filter(s => bySlug.has(s));
    const outs = [...(outlinks.get(slug) || [])];
    app.innerHTML = `
      <div class="note-layout">
        <article class="note">
          <a class="back" href="#/">← Back to the garden</a>
          <div class="meta">
            <span class="stage-pill">${STAGES[n.stage].icon} ${STAGES[n.stage].label}</span>
            <span>Planted ${fmt(n.planted)}</span>
            <span>Last tended ${fmt(n.tended)}</span>
          </div>
          <h1>${esc(n.title)}</h1>
          ${n.tags.length ? `<div class="tags">${n.tags.map(t => `<button class="chip tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
          <div class="checklist-bar" hidden>
            <div class="checklist-meter"><span></span></div>
            <p class="checklist-count"></p>
            <button type="button" class="btn ghost small" id="reset-checks">↺ Start fresh</button>
          </div>
          <div class="prose">${md(n.body)}</div>
          <div class="note-actions">
            <a class="btn ghost" href="#/plant/${slug}">✎ Tend this note</a>
          </div>
        </article>
        <aside class="side">
          <section>
            <h4>Linked from</h4>
            ${back.length ? `<ul>${back.map(linkItem).join('')}</ul>` : '<p class="none">No notes link here yet.</p>'}
          </section>
          <section>
            <h4>Links to</h4>
            ${outs.length ? `<ul>${outs.map(linkItem).join('')}</ul>` : '<p class="none">This note doesn’t link anywhere yet.</p>'}
          </section>
        </aside>
      </div>`;
    app.querySelectorAll('[data-tag]').forEach(b => b.addEventListener('click', () => {
      Object.assign(filter, { tag: b.dataset.tag, stage: 'all', q: '' });
      location.hash = '#/';
    }));
    setupChecklist(slug);
  }

  // Ticks are saved per note in this browser, keyed by each task's text.
  function setupChecklist(slug) {
    const boxes = [...app.querySelectorAll('.prose li.task input')];
    const bar = app.querySelector('.checklist-bar');
    if (!boxes.length) return;
    const all = store.get(CHECKS_KEY, {});
    const saved = all[slug] || {};
    const defaults = new Map(boxes.map(b => [b, b.checked]));
    boxes.forEach(b => { if (b.dataset.key in saved) b.checked = saved[b.dataset.key]; });

    const refresh = () => {
      const done = boxes.filter(b => b.checked).length;
      bar.querySelector('.checklist-meter span').style.width = `${(done / boxes.length) * 100}%`;
      bar.querySelector('.checklist-count').textContent = done === boxes.length
        ? `All ${boxes.length} done 🎉`
        : `${done} of ${boxes.length} done`;
    };
    const save = () => {
      all[slug] = Object.fromEntries(boxes.map(b => [b.dataset.key, b.checked]));
      store.set(CHECKS_KEY, all);
    };

    boxes.forEach(b => b.addEventListener('change', () => { save(); refresh(); }));
    bar.querySelector('#reset-checks').addEventListener('click', () => {
      boxes.forEach(b => { b.checked = defaults.get(b); });
      delete all[slug];
      store.set(CHECKS_KEY, all);
      refresh();
    });
    bar.hidden = false;
    refresh();
  }

  function renderEditor(slug) {
    const existing = slug ? bySlug.get(slug) : null;
    const seedTitle = slug && !existing ? (seeds.get(slug)?.title || slug.replace(/-/g, ' ')) : '';
    const n = existing || { title: seedTitle, stage: 'seedling', tags: [], body: '' };
    app.innerHTML = `
      <form class="editor" id="ed" autocomplete="off">
        <a class="back" href="${existing ? '#/n/' + slug : '#/'}">← Cancel</a>
        <h1>${existing ? 'Tend this note' : '🌱 Plant a new note'}</h1>
        <div class="editor-cols">
          <div class="editor">
            <label>Title<input name="title" required value="${esc(n.title)}" placeholder="What's the idea?"></label>
            <div class="row">
              <label>Growth stage
                <select name="stage">${Object.entries(STAGES).map(([k, v]) =>
                  `<option value="${k}"${n.stage === k ? ' selected' : ''}>${v.icon} ${v.label}</option>`).join('')}</select>
              </label>
              <label>Tags <small>comma separated</small><input name="tags" value="${esc(n.tags.join(', '))}" placeholder="ideas, nature"></label>
            </div>
            <label>Note <small>Markdown works. Link ideas with [[Another note]].</small>
              <textarea name="body" placeholder="Start small. A seedling can be a single sentence.">${esc(n.body)}</textarea>
            </label>
            <div class="actions">
              <button class="btn" type="submit">${existing ? 'Save changes' : '🌱 Plant it'}</button>
              ${existing ? '<button type="button" class="btn danger" id="del">Compost this note</button>' : ''}
            </div>
          </div>
          <div>
            <p class="preview-label">Preview</p>
            <div class="preview"><div class="prose" id="pv"></div></div>
          </div>
        </div>
      </form>`;

    const f = app.querySelector('#ed');
    const pv = app.querySelector('#pv');
    const update = () => { pv.innerHTML = f.body.value.trim() ? md(f.body.value) : '<p class="none" style="color:var(--muted)">Your note will appear here.</p>'; };
    f.body.addEventListener('input', update);
    update();
    if (!existing) f.title.focus();

    f.addEventListener('submit', e => {
      e.preventDefault();
      const title = f.title.value.trim();
      const newSlug = slugify(title);
      if (!newSlug) return;
      if (newSlug !== slug && bySlug.has(newSlug)) { alert('A note with that title already exists. Try another title.'); return; }
      if (existing && newSlug !== slug) removeNote(slug);
      user[newSlug] = {
        title,
        stage: f.stage.value,
        tags: f.tags.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        planted: existing?.planted || today(),
        tended: today(),
        body: f.body.value.trim(),
      };
      if (!store.set(STORE_KEY, user)) alert('Couldn’t save to this browser’s storage. Export the garden to keep your work.');
      build();
      location.hash = '#/n/' + newSlug;
    });

    app.querySelector('#del')?.addEventListener('click', () => {
      if (!confirm(`Compost "${existing.title}"? This removes it from the garden in this browser.`)) return;
      removeNote(slug);
      store.set(STORE_KEY, user);
      build();
      location.hash = '#/';
    });
  }

  function removeNote(slug) {
    if (baseSlugs.has(slug)) user[slug] = { deleted: true };
    else delete user[slug];
  }

  // ---------- Map ----------
  let raf = null, cleanupMap = null;

  function renderMap() {
    app.innerHTML = `
      <section>
        <div class="map-head">
          <h1>Garden map</h1>
          <p>Every note is a tree and every link is a root between them. Drag to rearrange, click to visit. Bigger trees have more connections.</p>
          <div class="legend">
            <span style="--c:var(--seedling)">Seedling</span>
            <span style="--c:var(--budding)">Budding</span>
            <span style="--c:var(--evergreen)">Evergreen</span>
            <span class="seed" style="--c:var(--seed)">Seed (not planted)</span>
          </div>
        </div>
        <canvas id="graph" aria-label="Graph of linked notes"></canvas>
      </section>`;

    const canvas = app.querySelector('#graph');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, alpha = 1, hover = null, drag = null, downAt = null;

    const nodes = [
      ...notes.map(n => ({ id: n.slug, title: n.title, stage: n.stage })),
      ...[...seeds].map(([id, s]) => ({ id, title: s.title, stage: 'seed' })),
    ];
    const byId = new Map(nodes.map(n => [n.id, n]));
    nodes.forEach(n => { n.deg = 0; n.links = new Set(); });
    const edges = [];
    for (const [s, outs] of outlinks) for (const t of outs) {
      const a = byId.get(s), b = byId.get(t);
      if (!a || !b) continue;
      edges.push([a, b]); a.deg++; b.deg++; a.links.add(b); b.links.add(a);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kick();
    };
    resize();
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      n.x = W / 2 + Math.cos(a) * W * 0.28; n.y = H / 2 + Math.sin(a) * H * 0.28; n.vx = n.vy = 0;
      n.r = 6 + Math.sqrt(n.deg) * 3.5;
    });

    const spring = Math.max(90, Math.min(W, H) / 4);

    function step() {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
        const f = (7000 / d2) * alpha, d = Math.sqrt(d2);
        a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f;
      }
      for (const [a, b] of edges) {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const k = (d - spring) * 0.03 * alpha;
        a.vx += dx / d * k; a.vy += dy / d * k; b.vx -= dx / d * k; b.vy -= dy / d * k;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.006 * alpha; n.vy += (H / 2 - n.y) * 0.006 * alpha;
        if (n === drag) { n.vx = n.vy = 0; continue; }
        n.vx *= 0.82; n.vy *= 0.82;
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x + n.vx));
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 18, n.y + n.vy));
      }
      alpha = Math.max(alpha * 0.985, drag ? 0.3 : 0);
    }

    function draw() {
      const css = getComputedStyle(document.documentElement);
      const c = k => css.getPropertyValue(k).trim();
      const color = { seedling: c('--seedling'), budding: c('--budding'), evergreen: c('--evergreen'), seed: c('--seed') };
      const focus = hover || drag;
      ctx.clearRect(0, 0, W, H);

      for (const [a, b] of edges) {
        const lit = focus && (a === focus || b === focus);
        ctx.strokeStyle = lit ? c('--moss') : c('--line');
        ctx.globalAlpha = focus && !lit ? 0.35 : 1;
        ctx.lineWidth = lit ? 2 : 1.2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const n of nodes) {
        const dim = focus && n !== focus && !focus.links.has(n);
        ctx.globalAlpha = dim ? 0.3 : 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        if (n.stage === 'seed') {
          ctx.fillStyle = c('--surface'); ctx.fill();
          ctx.setLineDash([3, 3]); ctx.strokeStyle = color.seed; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
        } else {
          ctx.fillStyle = color[n.stage]; ctx.fill();
        }
        if (n === focus) { ctx.strokeStyle = c('--ink'); ctx.lineWidth = 2; ctx.stroke(); }
        ctx.fillStyle = n.stage === 'seed' ? c('--muted') : c('--ink');
        ctx.fillText(n.title.length > 28 ? n.title.slice(0, 27) + '…' : n.title, n.x, n.y + n.r + 14);
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (alpha > 0.002) step();
      draw();
      raf = alpha > 0.002 || drag ? requestAnimationFrame(loop) : null;
    }
    function kick(a = 0.6) { alpha = Math.max(alpha, a); if (!raf) raf = requestAnimationFrame(loop); }

    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const hit = p => nodes.slice().reverse().find(n => Math.hypot(n.x - p.x, n.y - p.y) < n.r + 6);

    canvas.addEventListener('pointerdown', e => {
      const p = pos(e), n = hit(p);
      if (!n) return;
      drag = n; downAt = p; canvas.setPointerCapture(e.pointerId); kick(0.3);
    });
    canvas.addEventListener('pointermove', e => {
      const p = pos(e);
      if (drag) { drag.x = p.x; drag.y = p.y; kick(0.3); return; }
      const n = hit(p) || null;
      if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : 'default'; if (!raf) draw(); }
    });
    canvas.addEventListener('pointerup', e => {
      const p = pos(e);
      const n = drag; drag = null;
      if (n && downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) < 5) location.hash = '#/n/' + n.id;
      downAt = null;
    });
    canvas.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; if (!raf) draw(); } });

    window.addEventListener('resize', resize);
    const onTheme = () => { if (!raf) draw(); };
    document.addEventListener('themechange', onTheme);
    cleanupMap = () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('themechange', onTheme);
    };
    kick(1);
  }

  function stopMap() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (cleanupMap) cleanupMap();
    cleanupMap = null;
  }

  // ---------- Router ----------
  function route() {
    const [, view = '', arg = ''] = (location.hash.slice(1) || '/').split('/');
    const slug = decodeURIComponent(arg);
    stopMap();
    peek.hidden = true;
    document.title = 'The Grove';
    if (view === 'n') renderNote(slug);
    else if (view === 'map') renderMap();
    else if (view === 'plant') renderEditor(slug || null);
    else renderHome();
    const active = view === 'n' || view === '' ? 'home' : view;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === active));
    window.scrollTo(0, 0);
  }

  // ---------- Hover previews ----------
  document.addEventListener('mouseover', e => {
    const a = e.target.closest('.wikilink');
    if (!a) return;
    const n = bySlug.get(a.dataset.slug);
    peek.innerHTML = n
      ? `<strong>${STAGES[n.stage].icon} ${esc(n.title)}</strong><p>${esc(excerpt(n.body, 180))}</p>`
      : `<strong>🌰 ${esc(seeds.get(a.dataset.slug)?.title || a.textContent)}</strong><p>Not planted yet — click to start this note.</p>`;
    const r = a.getBoundingClientRect();
    peek.hidden = false;
    const left = Math.min(Math.max(16, r.left), window.innerWidth - peek.offsetWidth - 16);
    const below = r.bottom + 8 + peek.offsetHeight < window.innerHeight;
    peek.style.left = left + 'px';
    peek.style.top = (below ? r.bottom + 8 : r.top - peek.offsetHeight - 8) + 'px';
  });
  document.addEventListener('mouseout', e => { if (e.target.closest('.wikilink')) peek.hidden = true; });

  // ---------- Chrome ----------
  function drawTreeline() {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let d = 'M0 48 L0 40', x = 0;
    while (x < 1200) {
      const w = 14 + rand() * 22, h = 8 + rand() * 34;
      d += ` L${(x + w / 2).toFixed(1)} ${(46 - h).toFixed(1)} L${(x + w).toFixed(1)} ${(40 + rand() * 6).toFixed(1)}`;
      x += w * (0.55 + rand() * 0.3);
    }
    document.getElementById('treeline-path').setAttribute('d', d + ' L1200 48 Z');
  }

  function setTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    document.dispatchEvent(new Event('themechange'));
  }
  setTheme(store.get(THEME_KEY, null));
  document.getElementById('theme').addEventListener('click', () => {
    const dark = getComputedStyle(document.documentElement).colorScheme.includes('dark');
    const next = dark ? 'light' : 'dark';
    store.set(THEME_KEY, next);
    setTheme(next);
  });

  document.getElementById('wander').addEventListener('click', () => {
    const current = location.hash.match(/^#\/n\/(.+)/)?.[1];
    const pool = notes.filter(n => n.slug !== current);
    if (pool.length) location.hash = '#/n/' + pool[Math.floor(Math.random() * pool.length)].slug;
  });

  // ---------- Export / import (.txt) ----------
  // Each note is a header block, a dashed line, then its Markdown body.
  const NOTE_RULE = '='.repeat(50);
  const BODY_RULE = '-'.repeat(50);

  function toText(list) {
    const blocks = list.map(n => [
      NOTE_RULE,
      `Title: ${n.title}`,
      `Stage: ${n.stage}`,
      `Tags: ${n.tags.join(', ')}`,
      `Planted: ${n.planted || ''}`,
      `Tended: ${n.tended || ''}`,
      BODY_RULE,
      n.body,
    ].join('\n'));
    return `The Grove: notes exported ${today()}\n${list.length} notes. Import this file from the site footer to restore them.\n\n${blocks.join('\n\n')}\n`;
  }

  function fromText(text) {
    const parsed = [];
    for (const block of text.replace(/\r/g, '').split(new RegExp(`^${NOTE_RULE}$`, 'm')).slice(1)) {
      const split = block.indexOf(`\n${BODY_RULE}\n`);
      if (split < 0) continue;
      const head = Object.fromEntries(block.slice(0, split).split('\n')
        .map(l => l.match(/^(\w+):\s?(.*)$/)).filter(Boolean).map(([, k, v]) => [k.toLowerCase(), v.trim()]));
      if (!head.title || !slugify(head.title)) continue;
      parsed.push({
        title: head.title,
        stage: STAGES[head.stage] ? head.stage : 'seedling',
        tags: (head.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        planted: head.planted || today(),
        tended: head.tended || today(),
        body: block.slice(split + BODY_RULE.length + 2).trim(),
      });
    }
    return parsed;
  }

  document.getElementById('export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([toText(notes)], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `the-grove-notes-${today()}.txt` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const importInput = document.getElementById('import-file');
  document.getElementById('import').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    const incoming = fromText(await file.text());
    if (!incoming.length) { alert('No notes found in that file. Is it a .txt exported from The Grove?'); return; }
    const replacing = incoming.filter(n => bySlug.has(slugify(n.title))).length;
    if (!confirm(`Import ${incoming.length} notes?${replacing ? ` ${replacing} with the same title will be replaced.` : ''}`)) return;
    for (const n of incoming) user[slugify(n.title)] = n;
    if (!store.set(STORE_KEY, user)) alert('Couldn’t save to this browser’s storage.');
    build();
    route();
  });

  drawTreeline();
  build();
  window.addEventListener('hashchange', route);
  route();
})();
