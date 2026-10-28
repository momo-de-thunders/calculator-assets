
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAMP = ['#e5f0ff','#ccdfff','#94bdff','#5797ff','#005bf0','#0047bb','#00368f','#002766'];
  const HOT = ['#005bf0','#005bf0','#0047bb','#5797ff','#ccdfff','#00368f'];

  /* Poster mosaic, counted in cells from the band's right edge (col) and top (row). */
  const MOSAIC = {
    hero: [],
    close: [[1,0,'#005bf0'],[3,1,'#ccdfff'],[2,2,'#0047bb'],[0,3,'#e5f0ff'],
            [-1,1,'#00368f'],[-3,0,'#ccdfff'],[-2,3,'#005bf0'],[-4,4,'#e5f0ff'],[-1,5,'#0047bb']],
    reg: [[-1,1,'#005bf0'],[-2,0,'#ccdfff'],[-1,3,'#e5f0ff'],[-3,2,'#94bdff'],
          [1,-3,'#005bf0'],[0,-2,'#94bdff'],[2,-1,'#e5f0ff'],[3,-3,'#ccdfff'],[1,-6,'#e5f0ff']]
  };


  /* ── Isometric pixel objects (Aeye "how it works" icons, drawn from the Thunders mark and poster squares) ── */
  const MARK_A = 'M0.610107 27.9991L0.711641 27.6141L1.85707 23.322L1.95861 22.937L3.10404 18.6448L3.20874 18.2598L4.35735 13.9676L4.45888 13.5826L5.61066 9.29045L5.71219 8.90546L6.85762 4.61328H16.516L15.3674 8.90546L15.2659 9.29045H10.4335L9.28492 13.5826L9.18339 13.9676L8.03796 18.2598L7.93325 18.6448L6.78782 22.937L6.68628 23.322H11.5155L10.3669 27.6141L10.2654 27.9991H0.610107Z';
  const MARK_B = 'M27.3764 0L27.2749 0.384991L26.1294 4.67717L26.0279 5.06216L24.8825 9.35433L24.7778 9.73933L23.6292 14.0315L23.5276 14.4165L22.3758 18.7087L22.2743 19.0937L21.1289 23.3858H11.4705L12.6191 19.0937L12.7206 18.7087H17.553L18.7016 14.4165L18.8031 14.0315L19.9485 9.73933L20.0533 9.35433L21.1987 5.06216L21.3002 4.67717H16.471L17.6196 0.384991L17.7211 0H27.3796H27.3764Z';
  /* box = [x, y, z, w, d, h, 'w'?]  ('w' = wireframe cubes that fill in on hover) */
  const ICONS = {
    bars:    [[0,0,0,1,2,2],[2,0,0,1,2,3],[4,0,0,1,2,5],[6,0,0,1,2,7,'w']],
    path:    [[0,0,0,1,2,3],[1,0,0,2,2,1],[2,2,0,2,1,1],[3,3,0,2,1,1],[5,3,0,2,1,1,'w']],
    talk:    [[0,0,0,4,3,1],[0,0,1,1,1,1],[2,0,3,4,3,1],[4,0,2,1,1,1,'w']],
    stack:   [[0,0,0,5,3,1],[0,0,2,5,3,1],[0,0,4,5,3,1,'w']],
    cluster: [[0,0,0,3,3,3],[3,0,0,2,3,3,'w']],
    frame:   [[0,0,0,5,2,1],[0,0,1,1,2,4],[4,0,1,1,2,4],[0,0,5,5,2,1,'w']],
    plus:    [[1,0,0,1,2,3],[0,0,1,3,2,1],[0,0,0,1,2,1,'w'],[2,0,0,1,2,1,'w'],[0,0,2,1,2,1,'w'],[2,0,2,1,2,1,'w']],
    flag:    [[0,0,0,1,1,6],[1,0,3,3,1,3],[4,0,4,2,1,1,'w']],
    mic:     [[0,0,0,4,3,1],[1,1,1,2,1,3],[0,0,4,4,3,1,'w']],
    table:   [[0,0,0,3,1,1],[0,2,0,3,1,1],[0,1,0,1,1,1],[2,1,0,1,1,1],[1,1,0,1,1,1,'w'],[0,0,1,1,1,1],[2,2,1,1,1,1]],
    scatter: [[0,0,0,1,1,1],[2,1,0,1,1,1,'w'],[1,2,1,1,1,1],[3,0,2,1,1,1,'w'],[0,2,3,1,1,1],[3,2,4,1,1,1]]
  };
  const C30 = Math.cos(Math.PI / 6);
  function expand(boxes) {
    const v = [];
    boxes.forEach(b => { for (let x = 0; x < b[3]; x++) for (let y = 0; y < b[4]; y++) for (let z = 0; z < b[5]; z++)
      v.push({ x: b[0] + x, y: b[1] + y, z: b[2] + z, w: b[6] === 'w' }); });
    return v;
  }
  /* Thunders mark → voxel wall (16x16 sample), right edge dissolves into wireframe + loose cubes. */
  function markVoxels() {
    const N = 16, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.scale(N / 28, N / 28);
    x.fillStyle = '#000'; x.fill(new Path2D(MARK_A)); x.fill(new Path2D(MARK_B));
    const d = x.getImageData(0, 0, N, N).data, v = [];
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if (d[(j * N + i) * 4 + 3] < 110) continue;
      const e = i / (N - 1);
      for (let y = 0; y < 2; y++) v.push({ x: i, y, z: N - 1 - j, w: e > .55 && r() < (e - .45) * 1.1 });
    }
    for (let n = 0; n < 14; n++) v.push({ x: N + 1 + Math.floor(r() * 5), y: Math.floor(r() * 2), z: Math.floor(r() * N), w: r() < .5 });
    return v;
  }
  /* Frontal view for the hero mark: front faces square-on to the viewer, depth recedes up-right
     (DX, DY per voxel of depth), so the mark reads like the logo instead of lying on its side. */
  const DX = .46, DY = -.3;
  function frontDraw(cv, vox, o) {
    const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (!vox.ffit) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      vox.forEach(q => { x0 = Math.min(x0, q.x + q.y * DX); x1 = Math.max(x1, q.x + 1 + (q.y + 1) * DX);
        y0 = Math.min(y0, -(q.z + 1) + (q.y + 1) * DY); y1 = Math.max(y1, -q.z + q.y * DY); });
      vox.ffit = { x0, x1, y0, y1 };
      vox.forder = vox.slice().sort((a, b) => b.y - a.y || a.x - b.x || a.z - b.z);
      let k = 0; vox.forder.forEach(q => { if (q.w) q.fk = k++; }); vox.fnw = k;
    }
    const f = vox.ffit, rx = o.rx || 0, rw = o.rw || W, pad = o.pad == null ? .08 : o.pad;
    const s = Math.min(rw * (1 - 2 * pad) / (f.x1 - f.x0), H * (1 - 2 * pad) / (f.y1 - f.y0));
    const ox = rx + rw / 2 - (f.x0 + f.x1) / 2 * s, oy = H / 2 - (f.y0 + f.y1) / 2 * s;
    const lw = Math.max(.75, s * .06), p = o.p || 0;
    vox.forder.forEach(q => {
      let lift = 0;
      const bx = (q.x + q.y * DX) * s + ox, by = (-q.z + q.y * DY) * s + oy;
      if (o.mx != null) { const d = Math.hypot(bx - o.mx, by - o.my); lift = Math.max(0, 1 - d / (s * 5)) * s * 1.4; }
      const P = (dx, dy, dz) => [bx + (dx + dy * DX) * s, by - lift + (-dz + dy * DY) * s];
      const poly = pts => { x.beginPath(); pts.forEach((pt, i) => i ? x.lineTo(...pt) : x.moveTo(...pt)); x.closePath(); };
      const front = () => poly([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)]);
      const top = () => poly([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)]);
      const side = () => poly([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)]);
      const solid = !q.w || q.fk < p * vox.fnw;
      const face = (fn, col) => { x.fillStyle = x.strokeStyle = col; x.lineWidth = .9; fn(); x.fill(); x.stroke(); };
      if (solid) { face(side, '#0047bb'); face(top, '#94bdff'); face(front, '#005bf0'); }
      else { x.strokeStyle = 'rgba(148,189,255,.8)'; x.lineWidth = lw; side(); x.stroke(); top(); x.stroke(); front(); x.stroke(); }
    });
  }
  function isoDraw(cv, vox, o) {
    o = o || {};
    const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (!vox.fit) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      vox.forEach(q => { const X = (q.x - q.y) * C30, Y = (q.x + q.y) * .5 - q.z;
        x0 = Math.min(x0, X - C30); x1 = Math.max(x1, X + C30); y0 = Math.min(y0, Y - .5); y1 = Math.max(y1, Y + 1.5); });
      vox.fit = { x0, x1, y0, y1 };
      vox.order = vox.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.z - b.z);
      let k = 0; vox.order.forEach(q => { if (q.w) q.k = k++; }); vox.nw = k;
    }
    const f = vox.fit, rx = o.rx || 0, rw = o.rw || W, pad = o.pad == null ? .08 : o.pad;
    const s = Math.min(rw * (1 - 2 * pad) / (f.x1 - f.x0), H * (1 - 2 * pad) / (f.y1 - f.y0));
    const ox = rx + rw / 2 - (f.x0 + f.x1) / 2 * s, oy = H / 2 - (f.y0 + f.y1) / 2 * s;
    const T = o.dark ? '#94bdff' : '#5797ff', L = '#005bf0', R = o.dark ? '#0047bb' : '#0047bb';
    const wire = o.dark ? 'rgba(148,189,255,.8)' : 'rgba(0,91,240,.5)', p = o.p || 0;
    const lw = Math.max(.75, s * .06);
    vox.order.forEach(q => {
      let lift = 0, X = (q.x - q.y) * C30 * s + ox, Y = (q.x + q.y) * .5 * s - q.z * s + oy;
      if (o.mx != null) { const d = Math.hypot(X - o.mx, Y - o.my); lift = Math.max(0, 1 - d / (s * 5)) * s * 1.4; Y -= lift; }
      const solid = !q.w || q.k < p * vox.nw;
      const top = () => { x.beginPath(); x.moveTo(X, Y - .5 * s); x.lineTo(X + C30 * s, Y); x.lineTo(X, Y + .5 * s); x.lineTo(X - C30 * s, Y); x.closePath(); };
      const lf = () => { x.beginPath(); x.moveTo(X - C30 * s, Y); x.lineTo(X, Y + .5 * s); x.lineTo(X, Y + 1.5 * s); x.lineTo(X - C30 * s, Y + s); x.closePath(); };
      const rt = () => { x.beginPath(); x.moveTo(X + C30 * s, Y); x.lineTo(X, Y + .5 * s); x.lineTo(X, Y + 1.5 * s); x.lineTo(X + C30 * s, Y + s); x.closePath(); };
      if (solid) { x.fillStyle = T; top(); x.fill(); x.fillStyle = L; lf(); x.fill(); x.fillStyle = R; rt(); x.fill(); }
      else { x.strokeStyle = wire; x.lineWidth = lw; top(); x.stroke(); lf(); x.stroke(); rt(); x.stroke(); }
    });
  }
  function isoIcons() {
    const items = [...document.querySelectorAll('canvas.iso')].map(cv => ({ cv, vox: expand(ICONS[cv.dataset.i] || ICONS.bars), p: 0, raf: 0 }));
    const paint = it => isoDraw(it.cv, it.vox, { p: it.p, pad: .04 });
    items.forEach(it => {
      const host = it.cv.closest('.row,.tl-r,.cell') || it.cv.parentElement;
      const go = to => {
        if (RM) { it.p = to; paint(it); return; }
        cancelAnimationFrame(it.raf);
        const from = it.p, t0 = performance.now(), dur = 420;
        const step = t => { const k = Math.min(1, (t - t0) / dur); it.p = from + (to - from) * k; paint(it); if (k < 1) it.raf = requestAnimationFrame(step); };
        it.raf = requestAnimationFrame(step);
      };
      host.addEventListener('pointerenter', () => go(1));
      host.addEventListener('pointerleave', () => go(0));
    });
    const all = () => items.forEach(paint);
    all(); addEventListener('resize', all);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  }
  function isoHero() {
    const cv = document.querySelector('.iso-hero'); if (!cv) return;
    const vox = markVoxels(), band = cv.parentElement; let mx = null, my = null, raf = 0;
    const opts = () => { const W = cv.clientWidth, wide = W > 820;
      return { dark: true, mx, my, rx: wide ? W * .42 : 0, rw: wide ? W * .58 : W, pad: .06 }; };
    const paint = () => { raf = 0; frontDraw(cv, vox, opts()); };
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
    if (!RM) band.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; queue(); });
    band.addEventListener('pointerleave', () => { mx = my = null; queue(); });
    paint(); new ResizeObserver(queue).observe(cv);
  }

  function grid(cv) {
    const ctx = cv.getContext('2d');
    const kind = cv.dataset.grid, onLight = cv.dataset.theme === 'light';
    const hot = onLight ? ['#ccdfff','#94bdff','#e5f0ff','#005bf0','#5797ff'] : HOT;
    let W = 0, H = 0, cell = 64, cols = 0, rows = 0, dpr = 1, raf = 0, last = '', ox = 0, oy = 0;
    const pn = kind === 'reg' ? cv.parentElement.querySelector('.panel-reg') : null;
    const lit = new Map();   // "c,r" -> {t0, col}
    function size() {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cell = parseFloat(getComputedStyle(cv).getPropertyValue('--cell')) || 32;
      cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      if (pn) snap();
      bounds(); draw(performance.now());
    }
    /* registration: the form panel is snapped to whole squares and the grid is offset so its lines
       run exactly along the panel's edges */
    function snap() {
      pn.style.width = pn.style.minHeight = pn.style.marginLeft = '';
      const r0 = pn.getBoundingClientRect();
      const w = Math.floor(r0.width / cell) * cell, h = Math.ceil(r0.height / cell) * cell;
      pn.style.width = w + 'px'; pn.style.minHeight = h + 'px';
      const frac = r0.left % 1; if (frac) pn.style.marginLeft = -frac + 'px';
      const c = cv.getBoundingClientRect(), r = pn.getBoundingClientRect();
      ox = ((r.left - c.left) % cell + cell) % cell; oy = ((r.top - c.top) % cell + cell) % cell;
    }
    /* keep the poster squares between the header and the caption line */
    let minR = 0, maxR = 99;
    function bounds() {
      const foot = cv.parentElement.querySelector('.band-foot');
      if (!foot) { minR = 0; maxR = 99; return; }
      const top = cv.getBoundingClientRect().top;
      const txt = foot.firstElementChild.getBoundingClientRect().top - top;
      minR = Math.ceil(64 / cell); maxR = Math.floor((txt - 8) / cell) - 1;
    }
    function stat() {
      const out = [], shift = 0;
      for (const [c, r0, col] of MOSAIC[kind] || []) {
        const r = r0 < 0 ? Math.floor(H / cell) + r0 : r0 + shift;
        const x = kind !== 'hero' ? (c >= 0 ? cols - 2 - c : -c - 1) : cols - 2 - c;
        if (x < 0 || x >= cols || r >= rows || r < minR || r > maxR) continue;
        if (W < 600 && kind === 'hero' && x < cols * 0.45) continue;
        out.push([x, r, col]);
      }
      return out;
    }
    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(ox - (ox ? cell : 0), oy - (oy ? cell : 0));
      for (const [x, y, col] of stat()) { ctx.fillStyle = col; ctx.fillRect(x * cell, y * cell, cell, cell); }
      let alive = false;
      for (const [k, v] of lit) {
        const t = now - v.t0;
        if (t < 0) { alive = true; continue; }
        const a = t < 90 ? t / 90 : t < 420 ? 1 : 1 - (t - 420) / 800;
        if (a <= 0) { lit.delete(k); continue; }
        alive = true;
        const [x, y] = k.split(',').map(Number);
        ctx.globalAlpha = a; ctx.fillStyle = v.col;
        ctx.fillRect(x * cell, y * cell, cell, cell);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = onLight ? 'rgba(11,13,18,' + (kind === 'reg' ? .038 : .07) + ')' : 'rgba(255,255,255,0.085)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= cols + 1; i++) { const x = Math.round(i * cell) + .5; ctx.moveTo(x, 0); ctx.lineTo(x, H + cell); }
      for (let j = 0; j <= rows + 1; j++) { const y = Math.round(j * cell) + .5; ctx.moveTo(0, y); ctx.lineTo(W + cell, y); }
      ctx.stroke();
      raf = alive ? requestAnimationFrame(draw) : 0;
    }
    function light(x, y, delay) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      lit.set(x + ',' + y, { t0: performance.now() + delay, col: hot[(Math.random() * hot.length) | 0] });
      if (!raf) raf = requestAnimationFrame(draw);
    }
    const STEPS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    function at(e) {
      const r = cv.getBoundingClientRect();
      const sx = ox ? ox - cell : 0, sy = oy ? oy - cell : 0;
      return [Math.floor((e.clientX - r.left - sx) / cell), Math.floor((e.clientY - r.top - sy) / cell)];
    }
    function trail(x, y, n) {
      light(x, y, 0);
      let cx = x, cy = y;
      for (let i = 1; i <= n; i++) {
        const s = STEPS[(Math.random() * STEPS.length) | 0];
        cx += s[0]; cy += s[1];
        light(cx, cy, i * 80);
      }
    }
    if (!RM) {
      const host = cv.parentElement;
      host.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const [x, y] = at(e), k = x + ',' + y;
        if (k === last) return;
        last = k; trail(x, y, 2);
      });
      host.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        const [x, y] = at(e); trail(x, y, 5);
      });
      /* ambient: one square blinks now and then, only while the band is on screen */
      let vis = false;
      new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(cv);
      setInterval(() => {
        if (!vis || document.hidden) return;
        light((Math.random() * cols) | 0, (Math.random() * rows) | 0, 0);
      }, 1400);
    }
    new ResizeObserver(size).observe(cv);
    size();
  }

  /* scramble: text stays readable, unresolved tail cycles through glyphs */
  const GL = '!<>-_\\/[]{}=+*^?#';
  function scramble(el, dur = 650) {
    if (RM || el.dataset.busy) return;
    const orig = el.dataset.orig || (el.dataset.orig = el.textContent);
    if (!el.dataset.sr) {
      el.dataset.sr = 1;
      const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = orig;
      el.after(sr); el.setAttribute('aria-hidden', 'true');
    }
    el.dataset.busy = 1;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur), n = Math.floor(p * orig.length);
      let s = orig.slice(0, n);
      for (let i = n; i < orig.length; i++) s += orig[i] === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0];
      el.textContent = s;
      if (p < 1) requestAnimationFrame(step); else { el.textContent = orig; delete el.dataset.busy; }
    })(t0);
  }

  /* split headings into word-wrapped char spans for the stagger */
  function split(h) {
    let i = 0;
    const walk = node => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of n.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.append(' '); continue; }
            const w = document.createElement('span'); w.className = 'w';
            for (const ch of part) {
              const c = document.createElement('span'); c.className = 'c';
              c.style.setProperty('--dl', Math.min(i++, 48) * 9 + 'ms'); c.textContent = ch; w.append(c);
            }
            frag.append(w);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('px')) walk(n);
      }
    };
    h.setAttribute('aria-label', h.textContent.replace(/[\/\[\]]/g, ' ').replace(/\s+/g, ' ').trim());
    walk(h);
    for (const c of h.querySelectorAll('.w')) c.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('canvas[data-grid]').forEach(grid);

  /* dither: each tone-map pixel is one square cell with a 1px gap (halftone screen);
     tone 0 is the faint dot field, 4 the brightest highlight. Cells sweep in once. */
  const TONES = [null, '#1a1c21', '#3b3f47', '#7b808b', '#dadde3'];  /* greys only; 0 = black shows through */
  function dither(cv) {
    const img = (function(){var i=new Image();i.crossOrigin='anonymous';return i})();
    img.onload = () => {
      const cols = img.width, rows = img.height, off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      const o = off.getContext('2d'); o.drawImage(img, 0, 0);
      const d = o.getImageData(0, 0, cols, rows).data, t = new Uint8Array(cols * rows);
      for (let i = 0; i < t.length; i++) t[i] = Math.round(d[i * 4] / 60);
      const ctx = cv.getContext('2d');
      let p = RM ? 1 : 0, started = RM;
      /* data-fit="cover": fill the canvas box (sized by CSS), anchored at data-ax / data-ay (0..1);
         data-glow: cells near the pointer step up a tone and empty cells near it show as faint dots */
      const cover = cv.dataset.fit === 'cover', ax = +(cv.dataset.ax || .5), ay = +(cv.dataset.ay || 1);
      let mx = -1e4, my = -1e4, graf = 0;
      function draw() {
        const W = cv.clientWidth, dpr = Math.min(devicePixelRatio || 1, 2);
        let c, H, x0 = 0, y0 = 0;
        if (cover) { H = cv.clientHeight; c = Math.max(W / cols, H / rows); x0 = (W - cols * c) * ax; y0 = (H - rows * c) * ay; }
        else { c = W / cols; H = Math.round(c * rows); }
        if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
          cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if (!cover) cv.style.height = H + 'px'; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        const g = c > 4 ? 1 : 0.6, R2 = (c * 7) ** 2;
        const xa = Math.max(0, Math.floor(-x0 / c)), xb = Math.min(cols, Math.ceil((W - x0) / c));
        const ya = Math.max(0, Math.floor(-y0 / c)), yb = Math.min(rows, Math.ceil((H - y0) / c));
        for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) {
          let k = t[y * cols + x];
          const at = (x / cols * .6 + (1 - y / rows) * .4);
          if (at > p * 1.15) continue;
          const px = x0 + x * c, py = y0 + y * c;
          const d2 = (px + c / 2 - mx) ** 2 + (py + c / 2 - my) ** 2;
          if (d2 < R2) { const f = 1 - d2 / R2; k = Math.min(4, k + (f > .45 ? 2 : 1)); }
          if (!k) continue;
          ctx.fillStyle = TONES[k];
          ctx.fillRect(px, py, c - g, c - g);
        }
      }
      if (cv.dataset.glow && !RM) {
        const host = cv.closest('section') || cv;
        const queue = () => { if (!graf) graf = requestAnimationFrame(() => { graf = 0; draw(); }); };
        host.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; queue(); });
        host.addEventListener('pointerleave', () => { mx = my = -1e4; queue(); });
      }
      draw();
      new ResizeObserver(() => { cv.width = 0; draw(); }).observe(cv);
      if (!RM) new IntersectionObserver((es, ob) => {
        if (!es[0].isIntersecting || started) return;
        started = true; ob.disconnect();
        const t0 = performance.now();
        (function step(now) { p = Math.min(1, (now - t0) / 900); draw(); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: .2 }).observe(cv);
    };
    img.src = cv.dataset.map;
  }
  document.querySelectorAll('canvas.dith:not([data-photo])').forEach(dither);

  /* speaker portraits: real photo → dither cells sweep in top to bottom (with a bright leading
     edge) → hold → sweep back to the photo, looping. Hovering the card runs the cycle 3x faster.
     Tiles start offset so they don't flip together; frames only run while on screen. */
  const PHASES = [2.4, 1.1, 2.6, 1.1];               // photo, to dither, dither, to photo (s)
  const CYCLE = PHASES.reduce((a, b) => a + b, 0);
  function phaseP(t) {
    t %= CYCLE;
    if (t < PHASES[0]) return 0; t -= PHASES[0];
    if (t < PHASES[1]) return t / PHASES[1]; t -= PHASES[1];
    if (t < PHASES[2]) return 1; t -= PHASES[2];
    return 1 - t / PHASES[3];
  }
  function portraitLoop(cv, idx) {
    const map = (function(){var i=new Image();i.crossOrigin='anonymous';return i})(), photo = (function(){var i=new Image();i.crossOrigin='anonymous';return i})();
    let loaded = 0;
    const ready = () => { if (++loaded === 2) init(); };
    map.onload = ready; photo.onload = ready;
    map.src = cv.dataset.map; photo.src = cv.dataset.photo;
    function init() {
      const cols = map.width, rows = map.height, off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      const o = off.getContext('2d'); o.drawImage(map, 0, 0);
      const d = o.getImageData(0, 0, cols, rows).data, tone = new Uint8Array(cols * rows), order = new Float32Array(cols * rows);
      let seed = 11 + idx * 97; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < tone.length; i++) {
        tone[i] = Math.round(d[i * 4] / 60);
        order[i] = .7 * (Math.floor(i / cols) / rows) + .3 * rnd();
      }
      const ctx = cv.getContext('2d');
      let W = 0, dpr = 1, p = RM ? 1 : 0;
      function size() { W = cv.clientWidth; dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = cv.width; }
      function draw() {
        if (!W) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
        const e = p * p * (3 - 2 * p);                      // smoothstep for the photo fade
        if (e < 1) { ctx.globalAlpha = 1 - e; ctx.drawImage(photo, 0, 0, W, W); ctx.globalAlpha = 1; }
        if (p <= 0) return;
        const c = W / cols, g = c > 4 ? 1 : .6, front = p * 1.08;
        for (let i = 0; i < tone.length; i++) {
          const k = tone[i], ord = order[i];
          if (ord > front) continue;
          const edge = front - ord < .07 && p < 1;          // leading edge of the sweep glints
          if (!k && !edge) continue;
          ctx.fillStyle = edge ? '#dadde3' : TONES[k];
          const x = i % cols, y = (i / cols) | 0;
          if (!k) { ctx.globalAlpha = .35; ctx.fillRect(x * c, y * c, c - g, c - g); ctx.globalAlpha = 1; }
          else ctx.fillRect(x * c, y * c, c - g, c - g);
        }
      }
      size(); draw();
      new ResizeObserver(() => { size(); draw(); }).observe(cv);
      if (RM) return;
      let t = idx * 1.9, speed = 1, last = null, raf = 0, vis = false;
      const host = cv.closest('.spk') || cv;
      host.addEventListener('pointerenter', () => { speed = 3; });
      host.addEventListener('pointerleave', () => { speed = 1; });
      function loop(now) {
        if (last != null) t += Math.min(.1, (now - last) / 1000) * speed;
        last = now; p = phaseP(t); draw();
        if (vis && !document.hidden) raf = requestAnimationFrame(loop); else { raf = 0; last = null; }
      }
      const kick = () => { if (!raf && vis && !document.hidden) raf = requestAnimationFrame(loop); };
      new IntersectionObserver(es => { vis = es[0].isIntersecting; kick(); }).observe(cv);
      document.addEventListener('visibilitychange', kick);
    }
  }
  document.querySelectorAll('canvas.dith[data-photo]').forEach(portraitLoop);

  /* speakers carousel: arrows scroll one card; disabled at either end (both, while all fit) */
  (function carousel() {
    const tr = document.getElementById('spks'); if (!tr) return;
    const prev = document.querySelector('.car-b[data-dir="-1"]'), next = document.querySelector('.car-b[data-dir="1"]');
    const upd = () => { prev.disabled = tr.scrollLeft < 4; next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4; };
    [prev, next].forEach(b => b.addEventListener('click', () => {
      const card = tr.querySelector('.spk'), gap = parseFloat(getComputedStyle(tr).columnGap) || 0;
      tr.scrollBy({ left: +b.dataset.dir * (card.getBoundingClientRect().width + gap), behavior: RM ? 'auto' : 'smooth' });
    }));
    tr.addEventListener('scroll', upd, { passive: true });
    new ResizeObserver(upd).observe(tr); upd();
    tr.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!next.disabled) next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (!prev.disabled) prev.click(); }
    });
  })();
  isoHero(); isoIcons();
  const pre = document.querySelector('.pre');
  if (pre) setTimeout(() => pre.remove(), 1200);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    if (e.target.classList.contains('st')) e.target.classList.remove('pre-st');
    e.target.querySelectorAll('[data-scr]').forEach(s => scramble(s, 800));
    if (e.target.matches('[data-scr]')) scramble(e.target, 800);
  }), { rootMargin: '0px 0px -12% 0px' });

  if (!RM) {
    for (const h of document.querySelectorAll('.st')) {
      split(h);
      if (h.getBoundingClientRect().top > innerHeight) h.classList.add('pre-st');
      io.observe(h);
    }
    document.querySelectorAll('[data-scr]').forEach(s => { if (!s.closest('.st')) io.observe(s); });
    document.querySelectorAll('[data-scr-hover]').forEach(el => {
      const t = el.querySelector('.t') || el;
      el.addEventListener('mouseenter', () => scramble(t, 500));
    });
    /* speaker mosaics reshuffle on hover */
    document.querySelectorAll('.spk .mo i').forEach(i => i.style.setProperty('--h', RAMP[(Math.random() * RAMP.length) | 0]));
    document.querySelectorAll('.spk').forEach(s => s.addEventListener('mouseleave', () =>
      s.querySelectorAll('.mo i').forEach(i => i.style.setProperty('--h', RAMP[(Math.random() * RAMP.length) | 0]))));
  }

  /* countdown to 19 Jan 2027 14:00 CET */
  const T = Date.parse('2027-01-19T14:00:00+01:00');
  const cd = Object.fromEntries([...document.querySelectorAll('.cd-n')].map(e => [e.dataset.u, e]));
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    let s = Math.max(0, Math.floor((T - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s %= 86400;
    const v = { Days: d, Hours: Math.floor(s / 3600), Min: Math.floor(s % 3600 / 60), Sec: s % 60 };
    for (const k in cd) cd[k].textContent = k === 'Days' ? String(v[k]) : pad(v[k]);
  }
  tick(); setInterval(tick, 1000);

  /* compact menu (phones/tablets) */
  const mb = document.querySelector('.menu-b'), mn = document.getElementById('mnav');
  const setMenu = open => { mb.setAttribute('aria-expanded', String(open)); mn.hidden = !open; };
  mb.addEventListener('click', () => setMenu(mn.hidden));
  mn.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mn.hidden) { setMenu(false); mb.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1024 && !mn.hidden) setMenu(false); });

  /* mobile sticky CTA */
  const sticky = document.getElementById('sticky'), reg = document.getElementById('register');
  let pastHero = false, atReg = false;
  new IntersectionObserver(es => { pastHero = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd(); })
    .observe(document.querySelector('.ctas'));
  new IntersectionObserver(es => { atReg = es[0].isIntersecting; upd(); }).observe(reg);
  function upd() { sticky.classList.toggle('on', pastHero && !atReg); }

  /* footer newsletter: page-only in step 1 */
  const nf = document.getElementById('news-form');
  if (nf) nf.addEventListener('submit', e => {
    e.preventDefault();
    const em = document.getElementById('news-email');
    if (!em.checkValidity()) { em.focus(); em.setAttribute('aria-invalid', 'true'); return; }
    nf.querySelector('.news-row').hidden = true; document.getElementById('news-ok').hidden = false;
  });

  /* form: page-only in step 1 */
  const MSG = (document.documentElement.lang||'').slice(0,2)==='fr'?{"err": "Certains champs sont à vérifier. Lisez le message sous chacun d’eux.", "req": "Obligatoire", "email": "Saisissez une adresse email valide, par exemple nom@entreprise.com", "consent": "Cochez la case pour vous inscrire"}:{"err": "Some fields need attention. Check the messages under each one.", "req": "Required", "email": "Enter a valid email address, e.g. name@company.com", "consent": "Tick the box to register"};
  const form = document.getElementById('reg-form') || document.createElement('form'), err = document.getElementById('f-err');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    form.querySelectorAll('input,textarea').forEach(el => {
      const ok = el.checkValidity();
      el.closest('.f').classList.toggle('bad', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      const m = document.getElementById(el.id + '-msg');
      if (m) { m.hidden = ok; m.textContent = ok ? '' : el.type === 'checkbox' ? MSG.consent : el.validity.typeMismatch ? MSG.email : MSG.req; }
      if (!ok && !first) first = el;
    });
    if (first) { err.textContent = ''; requestAnimationFrame(() => { err.textContent = MSG.err; }); first.focus(); return; }
    err.textContent = '';
    form.hidden = true;
    const done = document.getElementById('reg-done'); done.hidden = false; done.focus();
  });
  form.addEventListener('input', e => {
    const f = e.target.closest('.f');
    if (f && f.classList.contains('bad') && e.target.checkValidity()) {
      f.classList.remove('bad'); e.target.removeAttribute('aria-invalid');
      const m = document.getElementById(e.target.id + '-msg'); if (m) { m.hidden = true; m.textContent = ''; }
      if (!form.querySelector('.f.bad')) err.textContent = '';
    }
  });
})();

/* registration: HubSpot v2 form, restyled inside its same-origin iframe */
(() => {
  const host = document.getElementById('hbspt-tf27-reg'); if (!host) return;
  const lang = (document.documentElement.lang || '').slice(0, 2) === 'fr' ? 'fr' : 'en';
  const T = {"en": {"labels": {"firstname": "First name", "lastname": "Last name", "email": "Work email", "company": "Company", "jobtitle": "Job title", "message": "A question you’d like the speakers to answer (optional)"}, "consent": "I agree that Thunders uses my details to manage my registration and send me information about this event.", "submit": "Register now", "required": "Required", "email": "Enter a valid email address, e.g. name@company.com", "success_h": "You’re registered.", "success_p": "We’ll email you before the event with the full agenda.", "recaptcha": "This site is protected by reCAPTCHA and the Google <a href=\"https://policies.google.com/privacy\" target=\"_blank\" rel=\"noopener\">Privacy Policy</a> and <a href=\"https://policies.google.com/terms\" target=\"_blank\" rel=\"noopener\">Terms of Service</a> apply."}, "fr": {"labels": {"firstname": "Prénom", "lastname": "Nom", "email": "Email professionnel", "company": "Entreprise", "jobtitle": "Poste", "message": "Une question à poser aux intervenants (facultatif)"}, "consent": "J’accepte que Thunders utilise mes informations pour gérer mon inscription et m’envoyer des informations sur cet événement.", "submit": "Je m’inscris", "required": "Obligatoire", "email": "Saisissez une adresse email valide, par exemple nom@entreprise.com", "success_h": "Vous êtes inscrit·e.", "success_p": "Nous vous enverrons le programme complet par email avant l’événement.", "recaptcha": "Ce site est protégé par reCAPTCHA. Les <a href=\"https://policies.google.com/privacy?hl=fr\" target=\"_blank\" rel=\"noopener\">règles de confidentialité</a> et les <a href=\"https://policies.google.com/terms?hl=fr\" target=\"_blank\" rel=\"noopener\">conditions d’utilisation</a> de Google s’appliquent."}}[lang], CSS = "@font-face{font-family:Geist;font-weight:400;font-display:swap;src:url(https://cdn.prod.website-files.com/68a3440e1b48f58abea46a9b/6abd0d2d59183a0f934b9adb_Geist-400-Regular.woff2) format('woff2')}@font-face{font-family:Geist;font-weight:500;font-display:swap;src:url(https://cdn.prod.website-files.com/68a3440e1b48f58abea46a9b/6abd0d2d59183a0f934b9adf_Geist-500-Medium.woff2) format('woff2')}@font-face{font-family:'Geist Mono';font-weight:400;font-display:swap;src:url(https://cdn.prod.website-files.com/68a3440e1b48f58abea46a9b/6abd0aafb81b49be8f1b6e36_GeistMono-400-Regular.woff2) format('woff2')}@font-face{font-family:'Geist Mono';font-weight:500;font-display:swap;src:url(https://cdn.prod.website-files.com/68a3440e1b48f58abea46a9b/6abd0ae3a2c3f0b909a24b75_GeistMono-500-Medium.woff2) format('woff2')}:root{--ink:#0b0d12;--mute:#596071;--line:#dcdfe6;--g50:#f3f4f7;--b500:#005bf0;--b600:#0047bb;--paper:#fff;--sans:Geist,ui-sans-serif,system-ui,sans-serif;--mono:'Geist Mono',ui-monospace,Menlo,monospace}html,body{margin:0;padding:0;background:transparent;font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased}form.hs-form{display:grid;grid-template-columns:1fr 1fr;gap:18px 16px;margin:0;padding:0;max-width:none;font-family:var(--sans)}form.hs-form>*{grid-column:1/-1;min-width:0;margin:0!important;float:none!important;width:auto!important}form.hs-form>.hs_firstname,form.hs-form>.hs_lastname{grid-column:auto}form.hs-form fieldset{max-width:none!important;margin:0;padding:0;border:0}form.hs-form .hs-form-field{display:grid;gap:7px}form.hs-form .hs-form-field>label{display:block;margin:0;padding:0;font-family:var(--mono);font-size:11px;line-height:1.4;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}form.hs-form .hs-form-required{display:none}form.hs-form .input{margin:0!important}form.hs-form input.hs-input:not([type=checkbox]),form.hs-form textarea.hs-input{display:block;width:100%!important;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;color:var(--ink);background:var(--g50);border:1px solid var(--line);border-radius:0;padding:12px 14px;box-shadow:none;caret-color:var(--b500);-webkit-appearance:none;appearance:none;transition:border-color .2s,background-color .2s}form.hs-form textarea.hs-input{min-height:84px;resize:vertical}form.hs-form ::placeholder{color:#8b92a3;opacity:1}form.hs-form input.hs-input:not([type=checkbox]):focus,form.hs-form textarea.hs-input:focus{outline:0;border-color:var(--b500);background:var(--paper);box-shadow:0 0 0 2px var(--b500)}form.hs-form input.hs-input.error,form.hs-form textarea.hs-input.error,form.hs-form input.hs-input.invalid{border:1px dashed var(--ink);background:var(--g50)}form.hs-form ul.hs-error-msgs{list-style:none;margin:2px 0 0;padding:0}form.hs-form ul.hs-error-msgs label,form.hs-form .hs-error-msg{display:flex!important;align-items:center;gap:8px;margin:0;font-family:var(--mono);font-size:12px;line-height:1.4;font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink)}form.hs-form ul.hs-error-msgs label::before,form.hs-form .hs-error-msg::before{content:'';width:8px;height:8px;background:var(--b500);flex:none}form.hs-form .hs_error_rollup{display:none}form.hs-form .legal-consent-container{font-size:13px;line-height:1.5;color:var(--mute)}form.hs-form .legal-consent-container p{margin:0}form.hs-form .legal-consent-container ul.inputs-list{list-style:none;margin:0;padding:0}form.hs-form .legal-consent-container .hs-form-booleancheckbox-display{display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:start;cursor:pointer;margin:0;font-family:var(--sans);font-size:13px;line-height:1.5;letter-spacing:0;text-transform:none;color:var(--mute)}form.hs-form .legal-consent-container .hs-form-booleancheckbox-display>span{margin:0!important;display:block}form.hs-form input[type=checkbox]{width:18px;height:18px;margin:2px 0 0;accent-color:var(--b500)}form.hs-form input[type=checkbox]:focus-visible{outline:2px solid var(--b500);outline-offset:2px}form.hs-form .hs_recaptcha{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden;margin:0}.grecaptcha-badge{visibility:hidden!important}.tf27-rc{grid-column:1/-1;margin:0;font-size:12px;line-height:1.5;color:var(--mute)}.tf27-rc a,.tf27-rc a:link,.tf27-rc a:visited{color:var(--mute)!important;text-underline-offset:2px}.tf27-rc a:hover,.tf27-rc a:focus{color:var(--b600)!important}form.hs-form{position:relative}form.hs-form .hs_submit .actions{margin:0;padding:0;position:relative}form.hs-form .hs_submit .actions::after{content:'';position:absolute;z-index:1;left:22px;top:50%;width:8px;height:8px;margin-top:-4px;background:var(--b500);pointer-events:none;transition:transform .25s cubic-bezier(.2,.7,.2,1),background-color .2s}form.hs-form .hs_submit .actions:hover::after{transform:rotate(90deg) scale(1.25);background:#fff}form.hs-form input.hs-button,form.hs-form input.hs-button.primary,form.hs-form input.hs-button.large{display:block!important;width:100%!important;min-height:52px!important;box-sizing:border-box!important;margin:0!important;padding:0 22px!important;border:0!important;border-radius:0!important;background:var(--ink)!important;background-image:none!important;color:#fff!important;font-family:var(--mono)!important;font-size:13px!important;line-height:1!important;font-weight:500!important;letter-spacing:.06em!important;text-transform:uppercase!important;text-shadow:none!important;box-shadow:none!important;cursor:pointer;transition:background-color .2s!important}form.hs-form input.hs-button:hover,form.hs-form input.hs-button:focus,form.hs-form input.hs-button:active{background:var(--b500)!important;color:#fff!important;border:0!important;box-shadow:none!important}form.hs-form input.hs-button:focus-visible{outline:2px solid var(--b500);outline-offset:2px}form.hs-form input.hs-button[disabled]{opacity:.7;cursor:not-allowed}.submitted-message{display:grid;gap:12px;margin:0;padding:8px 0;font-family:var(--sans);color:var(--ink)}.submitted-message p{margin:0}.done-sq{display:grid;grid-template-columns:repeat(3,14px);gap:4px;margin-bottom:8px}.done-sq i{width:14px;height:14px;background:var(--b500);animation:pop .4s calc(var(--i)*50ms) both cubic-bezier(.2,.7,.2,1)}@keyframes pop{from{transform:scale(0)}}.done-h{margin:0;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-.04em;color:var(--ink)}.done-p{margin:0;font-size:16px;line-height:1.55;color:var(--mute)}form.hs-form .hs-form-field>label,form.hs-form .hs-form-field>label span{font-family:var(--mono)!important;font-size:11px!important;line-height:1.4!important;font-weight:400!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:var(--mute)!important}form.hs-form .legal-consent-container,form.hs-form .legal-consent-container *,form.hs-form .hs-form-booleancheckbox-display span{font-family:var(--sans)!important;font-size:13px!important;line-height:1.5!important;font-weight:400!important;letter-spacing:0!important;text-transform:none!important;color:var(--mute)!important}form.hs-form ul.hs-error-msgs label,form.hs-form .hs-error-msg{font-family:var(--mono)!important;font-size:12px!important;line-height:1.4!important;font-weight:400!important;letter-spacing:0!important;text-transform:none!important;color:var(--ink)!important}form.hs-form input.hs-input:not([type=checkbox]),form.hs-form textarea.hs-input{font-family:var(--sans)!important;font-size:16px!important;line-height:1.5!important;color:var(--ink)!important}.tf27-rc{font-family:var(--sans)!important;font-size:12px!important}@media (max-width:400px){form.hs-form{grid-template-columns:minmax(0,1fr)}form.hs-form>.hs_firstname,form.hs-form>.hs_lastname{grid-column:1/-1}}@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}";
  const sq = Array.from({length: 9}, (_, n) => '<i style="--i:' + n + '"></i>').join('');
  const ok = '<span class="done-sq" aria-hidden="true">' + sq + '</span><h3 class="done-h">' + T.success_h + '</h3><p class="done-p">' + T.success_p + '</p>';
  const reveal = () => host.classList.add('is-ready');
  setTimeout(reveal, 5000);                          /* never leave the space empty */
  function fit(ifr, d) { try { const h = d.documentElement.scrollHeight; if (h) ifr.style.height = h + 'px'; } catch (e) {} }
  function dress(ifr) {
    let d; try { d = ifr.contentDocument; } catch (e) { return; }
    if (!d || !d.head) return;
    if (!d.getElementById('tf27-css')) { const s = d.createElement('style'); s.id = 'tf27-css'; s.textContent = CSS; d.head.appendChild(s); }
    const f = d.querySelector('form.hs-form');
    if (f) {
      Object.keys(T.labels).forEach(n => {
        const fl = f.querySelector('.hs_' + n); if (!fl) return;
        const l = fl.querySelector('label > span:first-child'); if (l && l.textContent !== T.labels[n]) l.textContent = T.labels[n];
      });
      const c = f.querySelector('.legal-consent-container .hs-form-booleancheckbox-display > span');
      if (c && T.consent && c.textContent.trim() !== T.consent) c.textContent = T.consent;
      const b = f.querySelector('input.hs-button'); if (b && b.value !== T.submit) b.value = T.submit;
      /* the reCAPTCHA badge is hidden, so Google's required notice is shown as text under the button */
      const sb = f.querySelector('.hs_submit');
      if (sb && !f.querySelector('.tf27-rc')) sb.insertAdjacentHTML('afterend', '<p class="tf27-rc">' + T.recaptcha + '</p>');
    }
    fit(ifr, d);
  }
  function go() {
    hbspt.forms.create({
      portalId: '145896847', formId: 'eafb1d3a-e312-4029-a357-655e7db2f94f', region: 'eu1', target: '#hbspt-tf27-reg', locale: lang,
      inlineMessage: ok,
      translations: { [lang]: { submitText: T.submit, required: T.required, invalidEmail: T.email, invalidEmailFormat: T.email } },
      onFormReady: () => {
        const ifr = host.querySelector('iframe'); if (!ifr) return;
        const run = () => dress(ifr);
        run(); setTimeout(reveal, 120); setTimeout(run, 250); setTimeout(run, 800);
        try {
          const d = ifr.contentDocument;
          new MutationObserver(run).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
          new ResizeObserver(() => fit(ifr, d)).observe(d.body);
        } catch (e) {}
      },
      onFormSubmitted: () => { try { window.dispatchEvent(new Event('hs-form-event:on-submission:success')); } catch (e) {} }
    });
  }
  (function wait(n) {
    if (window.hbspt && hbspt.forms) return go();
    if (n === 30 && !document.querySelector('script[src*="hsforms.net/forms/embed/v2.js"]')) {
      const s = document.createElement('script'); s.src = 'https://js-eu1.hsforms.net/forms/embed/v2.js'; document.head.appendChild(s);
    }
    setTimeout(() => wait(n + 1), 100);
  })(0);
})();
