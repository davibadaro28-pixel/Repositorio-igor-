// Biblioteca comum da campanha: quadro 1080x1920, celular, tela de computador, recortes das telas reais,
// títulos cinéticos, legendas palavra a palavra, toques, contadores e o render quadro a quadro.
// Cada vídeo chama L.init() e monta a sua linha do tempo; window.renderAt(t) desenha o quadro do tempo t.
(() => {
  const L = {};
  window.L = L;
  const px = (v) => `${v}px`;
  L.px = px;
  L.urls = new Set();
  L.updaters = [];
  L.CUES = [];
  L.heads = [];

  L.$ = (tag, cls, parent, style) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  };
  L.cue = (t, type, extra = {}) => L.CUES.push({ t: Math.round(t * 1000) / 1000, type, ...extra });
  L.rng = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  L.onFrame = (fn) => L.updaters.push(fn);
  L.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  L.ease = { out: (x) => 1 - Math.pow(1 - x, 3), inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) };

  // caminhos dos arquivos (pasta assets da campanha)
  const A = () => window.ASSETS || '../assets/';
  L.P = (n) => { const u = `${A()}painel/${n}.webp`; L.urls.add(u); return u; };
  L.M = (n) => { const u = `${A()}menu/${n}.webp`; L.urls.add(u); return u; };
  L.F = (n) => { const u = `${A()}fotos/${n}.webp`; L.urls.add(u); return u; };

  L.init = (o) => {
    L.D = o.duration ?? window.NARR.duracao;
    L.FPS = 30;
    L.N = window.NARR.falas; // tempos reais de cada frase da narração
    L.W = window.WORDS; // tempos de cada palavra
    L.frame = document.getElementById('frame');
    L.frame.style.background = o.bg || '#000';
    L.bg = L.$('div', 'full', L.frame);
    L.layers = L.$('div', 'full', L.frame);
    L.tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    if (o.grain !== false) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const d = g.createImageData(256, 256);
      const r = L.rng(11);
      for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      g.putImageData(d, 0, 0);
      L.grain = L.$('div', null, L.frame, { position: 'absolute', inset: '0', opacity: o.grain ?? 0.06, mixBlendMode: 'overlay', pointerEvents: 'none', backgroundImage: `url(${c.toDataURL()})`, backgroundSize: '256px 256px' });
      L.onFrame((t) => { const r2 = L.rng(Math.round(t * L.FPS) * 7919 + 3); L.grain.style.backgroundPosition = `${Math.floor(r2() * 256)}px ${Math.floor(r2() * 256)}px`; });
    }
    if (o.vignette !== false) L.$('div', null, L.frame, { position: 'absolute', inset: '0', pointerEvents: 'none', background: `radial-gradient(120% 85% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${o.vignette ?? 0.5}) 100%)` });
    return L;
  };
  L.n = (k) => L.N[k].inicio; // início da frase k
  L.nEnd = (k) => L.N[k].fim;
  // início (ou fim) da palavra da frase k que começa com "pre" (sem acento, minúsculas); n = ocorrência
  const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  L.wt = (k, pre, n = 0, end = false) => {
    const ws = L.W.filter((w) => w.frase === k && norm(w.w).startsWith(norm(pre)));
    if (!ws[n]) throw new Error(`palavra "${pre}" não encontrada na frase ${k}`);
    return end ? ws[n].e : ws[n].s;
  };
  // cena: aparece em a e some em b (corte seco); o conteúdo anima por dentro
  L.scene = (a, b, parent, style) => {
    const el = L.$('div', 'full', parent || L.layers, style);
    L.onFrame((t) => { el.style.visibility = t >= a && (b == null || t < b) ? 'visible' : 'hidden'; });
    return el;
  };

  L.img = (parent, src, w, h, style = {}) => { const e = L.$('img', null, parent, { width: px(w), height: px(h), display: 'block', ...style }); e.src = src; return e; };
  // recorte de uma captura; base = tamanho lógico da captura (CSS px); k = escala
  L.crop = (parent, src, x, y, w, h, o = {}) => {
    const [bw, bh] = o.base || [1440, 900];
    const k = o.k || 1;
    return L.$('div', o.cls || 'crop', parent, {
      left: px(o.left ?? 0), top: px(o.top ?? 0), width: px(w * k), height: px(h * k),
      backgroundImage: `url(${src})`, backgroundSize: `${bw * k}px ${bh * k}px`, backgroundPosition: `${-x * k}px ${-y * k}px`, ...(o.style || {}),
    });
  };
  // painel flutuante: recorte de um cartão real, centrado em (cx, cy)
  L.panel = (parent, src, r, k, cx, cy, o = {}) => {
    const pad = o.pad ?? 0;
    const el = L.crop(parent, src, r.x - pad, r.y - pad, r.w + 2 * pad, r.h + 2 * pad, { base: o.base, k, cls: 'panel', left: cx - ((r.w + 2 * pad) * k) / 2, top: cy - ((r.h + 2 * pad) * k) / 2, style: { borderRadius: px(o.radius ?? 22), ...(o.style || {}) } });
    return el;
  };

  const SB = '<svg width="78" height="14" viewBox="0 0 78 14" fill="#fff"><rect x="0" y="9" width="3.2" height="5" rx="1"/><rect x="4.8" y="6.5" width="3.2" height="7.5" rx="1"/><rect x="9.6" y="4" width="3.2" height="10" rx="1"/><rect x="14.4" y="1.5" width="3.2" height="12.5" rx="1"/><path d="M31 3.2c2.6 0 5 1 6.8 2.7l1.3-1.3C36.9 2.5 34.1 1.4 31 1.4s-5.9 1.1-8.1 3.2l1.3 1.3C26 4.2 28.4 3.2 31 3.2zm0 3.6c1.6 0 3.1.6 4.2 1.7l1.3-1.3c-1.5-1.4-3.4-2.2-5.5-2.2s-4 .8-5.5 2.2l1.3 1.3c1.1-1.1 2.6-1.7 4.2-1.7zm0 3.6c.6 0 1.1.2 1.6.6L31 12.6l-1.6-1.6c.5-.4 1-.6 1.6-.6z"/><rect x="48" y="1.5" width="25" height="11.5" rx="3.6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><rect x="50" y="3.5" width="20" height="7.5" rx="2"/></svg>';
  L.phone = (parent, sbColor = '#7d2949') => {
    const el = L.$('div', 'phone', parent);
    for (const z of [-10, -7, -4]) L.$('div', 'ph-edge', el, { transform: `translateZ(${z}px)` });
    L.$('div', 'ph-body', el);
    for (const [x, y, h] of [[-3, 186, 32], [-3, 246, 62], [-3, 322, 62], [416, 270, 100]]) L.$('div', 'ph-btn', el, { left: px(x), top: px(y), height: px(h) });
    const scr = L.$('div', 'ph-screen', el);
    const sb = L.$('div', 'sb', scr, { background: sbColor });
    L.$('div', 'sb-time', sb).textContent = '9:41';
    L.$('div', 'sb-icons', sb).innerHTML = SB;
    const view = L.$('div', 'view', scr);
    L.$('div', 'island', scr);
    const shade = L.$('div', null, scr, { position: 'absolute', inset: '0', background: '#000', opacity: 0 });
    L.$('div', 'home', scr);
    const glare = L.$('div', 'glare', el);
    const sweep = L.$('div', 'sweep', glare);
    return { el, view, sb, shade, sweep };
  };
  // tela de computador; a imagem do painel (1440 x 900 CSS) preenche a tela
  L.monitor = (parent, w, src, o = {}) => {
    const sw = w - 28;
    const sh = Math.round((sw * 900) / 1440);
    const h = sh + 28;
    const el = L.$('div', 'monitor', parent, { width: px(w), height: px(h), left: px(540 - w / 2), top: px(960 - h / 2) });
    L.$('div', 'mon-body', el);
    const screen = L.$('div', 'mon-screen', el);
    const k = sw / 1440;
    const layer = (s) => L.crop(screen, s, 0, 0, 1440, 900, { k });
    const base = layer(src);
    L.$('div', 'mon-glare', el);
    return { el, screen, k, layer, base, w, h };
  };

  L.tap = (parent, x, y, t, color) => {
    const d = L.$('div', 'tap-dot', parent, { left: px(x), top: px(y), ...(color ? { background: color } : {}) });
    const r = L.$('div', 'tap-ring', parent, { left: px(x), top: px(y) });
    L.tl.fromTo(d, { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power2.out', immediateRender: false }, t)
      .to(d, { opacity: 0, scale: 0.85, duration: 0.34, ease: 'power2.in' }, t + 0.16)
      .fromTo(r, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 2.2, duration: 0.6, ease: 'power2.out', immediateRender: false }, t + 0.04);
    L.cue(t, 'tap');
  };
  // seta do mouse para as telas de computador
  L.cursor = (parent) => {
    const c = L.$('div', 'cursor', parent);
    c.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.6-6.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    return c;
  };

  // títulos: palavras sobem de trás de uma máscara
  L.headline = (parent, lines, o = {}) => {
    const box = L.$('div', `hl ${o.center === false ? '' : 'center'}`, parent, { top: px(o.top ?? 260), ...(o.style || {}) });
    const words = [];
    for (const [text, cls, st] of lines) {
      const ln = L.$('div', `ln ${cls || ''}`, box, st || {});
      text.split(' ').forEach((w, i, arr) => { const outer = L.$('span', 'w', ln); const inner = L.$('span', 'w', outer); inner.textContent = w + (i < arr.length - 1 ? ' ' : ''); words.push(inner); });
    }
    const h = { box, words, max: o.max ?? 960 };
    L.heads.push(h);
    return h;
  };
  L.showHL = (h, t, o = {}) => L.tl.fromTo(h.words, { yPercent: 118, opacity: 0, filter: 'blur(12px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: o.dur ?? 0.8, ease: o.ease ?? 'expo.out', stagger: o.stagger ?? 0.06 }, t);
  L.hideHL = (h, t, o = {}) => L.tl.to(h.words, { yPercent: o.down ? 110 : -108, opacity: 0, filter: 'blur(10px)', duration: o.dur ?? 0.38, ease: 'power2.in', stagger: o.stagger ?? 0.02 }, t);

  // legendas palavra a palavra, sincronizadas com a narração
  L.captions = (parent, o = {}) => {
    const max = o.maxWords ?? 3;
    const chunks = [];
    let cur = null;
    for (const w of L.W) {
      const brk = !cur || cur.frase !== w.frase || cur.words.length >= max || /[.,?!…:;]$/.test(cur.words[cur.words.length - 1].w);
      if (brk) { cur = { frase: w.frase, words: [] }; chunks.push(cur); }
      cur.words.push(w);
    }
    chunks.forEach((c, i) => { c.s = c.words[0].s; c.e = c.words[c.words.length - 1].e; c.next = chunks[i + 1] ? chunks[i + 1].words[0].s : Infinity; });
    const box = L.$('div', `caps ${o.cls || ''}`, parent, { top: px(o.top ?? 1380) });
    const els = chunks.map((c) => {
      const ch = L.$('div', 'chunk', box, { display: 'none' });
      c.spans = c.words.map((w) => { const sp = L.$('span', 'cw', ch); sp.textContent = o.upper ? w.w.toUpperCase() : w.w; return sp; });
      return ch;
    });
    L.onFrame((t) => {
      chunks.forEach((c, i) => {
        const on = t >= c.s - 0.06 && t < Math.min(c.e + 0.5, c.next - 0.02) && !(o.hideAfter && t > o.hideAfter) && !(o.hideIn || []).some(([a, b]) => t >= a && t < b);
        const el = els[i];
        el.style.display = on ? 'inline-flex' : 'none';
        if (!on) return;
        const k = L.ease.out(L.clamp((t - c.s + 0.06) / 0.16));
        el.style.transform = `translateY(${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`;
        el.style.opacity = String(k);
        c.words.forEach((w, j) => c.spans[j].classList.toggle('on', t >= w.s - 0.02 && t < Math.max(w.e, w.s + 0.12) + 0.04));
        c.words.forEach((w, j) => c.spans[j].classList.toggle('said', t >= w.s - 0.02));
      });
    });
    return box;
  };

  // contador: escreve no elemento o valor do objeto animado, formatado
  L.counter = (el, obj, key, fmt) => L.onFrame(() => { el.textContent = fmt(obj[key]); });
  L.brl = (c) => `R$ ${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  L.tag = (parent, text, o = {}) => {
    const el = L.$('div', 'tag', parent, { left: px(o.left ?? 60), top: px(o.top ?? 210), background: o.bg ?? 'rgba(255,255,255,.12)', color: o.color ?? '#fff', ...(o.style || {}) });
    L.$('i', null, el, { background: o.dot ?? '#4ade80' });
    L.$('span', null, el).textContent = text;
    L.tl.set(el, { opacity: 0 }, 0);
    return el;
  };
  L.show = (el, t, d = 0.4, v = {}) => L.tl.fromTo(el, { autoAlpha: 0, y: 14, ...(v.from || {}) }, { autoAlpha: 1, y: 0, duration: d, immediateRender: false, ...(v.to || {}) }, t);
  L.hide = (el, t, d = 0.3) => L.tl.to(el, { autoAlpha: 0, duration: d }, t);

  // câmera viva: deriva lenta (sem parar) e aproximação contínua entre a e b
  L.drift = (el, o = {}) => {
    const amp = o.amp ?? 8;
    const sc = o.scale ?? 0.012;
    const k0 = o.from ?? 0;
    L.onFrame((t) => {
      const u = t - k0;
      const segs = (o.pushes || []).concat(o.push ? [o.push] : []);
      const push = segs.reduce((p, [a, b, k]) => p * (1 + k * L.ease.inOut(L.clamp((t - a) / (b - a)))), 1);
      el.style.transform = `translate(${Math.sin(u * 0.55) * amp}px, ${Math.cos(u * 0.41) * amp * 0.8}px) scale(${(1 + Math.sin(u * 0.29) * sc) * push})`;
    });
  };

  // linhas de título cinéticas: cada linha entra no seu tempo (palavra da fala)
  L.linhas = (parent, lines, o = {}) => {
    const box = L.$('div', null, parent, { position: 'absolute', left: L.px(o.left ?? 60), top: L.px(o.top ?? 420), width: L.px(o.width ?? 960), textAlign: o.align ?? 'center', ...(o.style || {}) });
    const els = lines.map(([t, html, st]) => {
      const e = L.$('div', o.cls || null, box, { ...(o.line || {}), ...(st || {}) });
      e.innerHTML = html;
      L.tl.set(e, { autoAlpha: 0 }, 0);
      L.tl.fromTo(e, { autoAlpha: 0, y: o.dy ?? 30, scale: o.scale ?? 1.15 }, { autoAlpha: 1, y: 0, scale: 1, duration: o.dur ?? 0.32, ease: o.ease ?? 'expo.out', immediateRender: false }, t);
      if (o.cue !== false) L.cue(t, o.cue || 'hit');
      return e;
    });
    return { box, els };
  };

  // prova: "+30% de lucro" com contador e a ressalva (resultado informado pelo criador do sistema)
  L.prova = (parent, a, o = {}) => {
    const box = L.$('div', 'full', parent);
    const kick = L.$('div', null, box, { position: 'absolute', left: '60px', width: '960px', top: L.px(o.top ?? 430), textAlign: 'center', font: o.kickFont, color: o.kickColor, letterSpacing: '.14em', textTransform: 'uppercase' });
    kick.textContent = o.kick ?? 'Na doceria de quem criou o sistema';
    const num = L.$('div', null, box, { position: 'absolute', left: '0', width: '1080px', top: L.px((o.top ?? 430) + 70), textAlign: 'center', font: o.numFont, color: o.numColor, lineHeight: '1' });
    const lblTop = (o.top ?? 430) + 70 + (o.numSize ?? 300) * 1.08;
    const lbl = L.$('div', null, box, { position: 'absolute', left: '0', width: '1080px', top: L.px(lblTop), textAlign: 'center', font: o.lblFont, color: o.lblColor, lineHeight: '1' });
    lbl.textContent = o.label ?? 'de lucro';
    const note = L.$('div', null, box, { position: 'absolute', left: '120px', width: '840px', top: L.px(lblTop + (o.lblSize ?? 120) * 1.25), textAlign: 'center', font: o.noteFont, color: o.noteColor });
    note.textContent = o.note ?? 'Resultado informado pelo criador do sistema. Cada negócio tem o seu.';
    const c = { v: 0 };
    if (o.imediato) {
      // usado como gancho: tudo já aparece no primeiro quadro, com um leve assentamento
      num.textContent = '+30%';
      L.tl.fromTo([kick, lbl, note], { scale: 1.06 }, { scale: 1, duration: 0.8, ease: 'expo.out', immediateRender: false }, a);
      L.tl.fromTo(num, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'power2.out', immediateRender: false }, a);
      const bar = L.$('div', null, box, { position: 'absolute', left: '240px', width: '600px', height: '14px', borderRadius: '7px', top: L.px(lblTop - 18), background: o.numColor, transformOrigin: '0 50%' });
      L.tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power3.inOut', immediateRender: false }, a + 0.2);
      L.cue(a, 'impact');
      return { box, kick, num, lbl, note };
    }
    L.tl.set([kick, num, lbl, note], { autoAlpha: 0 }, 0);
    L.tl.fromTo(kick, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, a);
    L.tl.fromTo(num, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)', immediateRender: false }, a + 0.15);
    L.tl.fromTo(c, { v: 0 }, { v: 30, duration: 0.9, ease: 'power2.out', immediateRender: false }, a + 0.15);
    L.onFrame(() => { num.textContent = `+${Math.round(c.v)}%`; });
    L.tl.fromTo(lbl, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, o.tLabel ?? a + 0.7);
    L.tl.fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }, a + 1.0);
    L.cue(a + 0.15, 'count', { d: 0.9 });
    L.cue(a + 1.05, 'impact');
    return { box, kick, num, lbl, note };
  };

  // títulos que passam da largura diminuem para caber
  function fit() {
    for (const h of L.heads) {
      for (const ln of h.box.querySelectorAll('.ln')) {
        const w = [...ln.children].reduce((s, c) => s + c.getBoundingClientRect().width, 0);
        if (w > h.max) ln.style.fontSize = `${parseFloat(getComputedStyle(ln).fontSize) * (h.max / w)}px`;
      }
    }
  }

  L.finish = () => {
    L.tl.set({}, {}, L.D);
    window.DURATION = L.D;
    window.FPS = L.FPS;
    window.CUES = L.CUES.sort((a, b) => a.t - b.t);
    window.renderAt = (t) => { L.tl.time(Math.min(t, L.D)); for (const fn of L.updaters) fn(t); };
    window.READY = (async () => {
      await document.fonts.ready;
      await Promise.all([...L.urls].map((u) => new Promise((res) => { const i = new Image(); i.onload = () => i.decode().then(res, res); i.onerror = res; i.src = u; })));
      await Promise.all([...document.images].map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((res) => { i.onload = i.onerror = res; }))));
      fit();
      L.tl.time(L.D);
      L.tl.time(0.001);
      window.renderAt(0);
      return true;
    })();
  };
})();
