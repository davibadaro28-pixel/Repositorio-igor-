// Biblioteca dos 10 anúncios de Instagram: cenas parametrizadas pelo estilo de cada vídeo (cores, fontes, movimento).
// Cada vídeo (ig/<id>/plano.js) chama IG.init(estilo) e monta as cenas nos tempos das palavras da narração.
window.IG = (() => {
  const M = {};
  let S, tl, $, px, world, ui;
  const flashes = [];
  const shakes = [];
  const whips = [];
  const hid = (el, t = 0) => tl.set(el, { autoAlpha: 0 }, t);
  const push = (s, segs) => L.drift(s, { amp: 0, scale: 0, pushes: segs });
  M.hid = (el, t) => hid(el, t);

  M.init = (estilo) => {
    S = { bg: '#111', fg: '#fff', accent: '#ff2e7e', grain: 0.06, vignette: 0.45, font: 'sans-serif', fontText: 'sans-serif', ...estilo };
    L.init({ bg: S.bg, grain: S.grain, vignette: S.vignette, duration: S.duracao });
    ({ tl, $, px } = L);
    if (S.fundo) S.fundo(L.bg, L);
    world = $('div', 'world', L.layers);
    ui = $('div', 'full', L.frame, { pointerEvents: 'none' });
    const flash = $('div', 'full', ui, { background: S.flash || '#fff', opacity: 0 });
    L.onFrame((t) => { const f = flashes.find((a) => t >= a && t < a + 0.16); flash.style.opacity = f != null ? String(0.6 * (1 - (t - f) / 0.16)) : '0'; });
    const wipe = $('div', null, ui, { position: 'absolute', left: '0', top: '-10%', width: '1080px', height: '120%', background: S.accent, visibility: 'hidden' });
    L.onFrame((t) => {
      const w = whips.find(([a]) => t >= a && t < a + 0.4);
      wipe.style.visibility = w ? 'visible' : 'hidden';
      if (w) wipe.style.transform = `translateX(${w[1] * (-140 + 280 * L.ease.inOut((t - w[0]) / 0.4))}%) skewX(-12deg)`;
    });
    L.onFrame((t) => {
      const s = shakes.find(([a, d]) => t >= a && t < a + d);
      L.layers.style.transform = s ? `translate(${Math.sin(t * 90) * 12 * (1 - (t - s[0]) / s[1])}px, ${Math.cos(t * 77) * 9 * (1 - (t - s[0]) / s[1])}px)` : '';
    });
    M.tagReal = L.tag(ui, 'Tela real · dados de demonstração', { left: 60, top: 150, bg: S.tagBg || 'rgba(0,0,0,.6)', color: S.tagColor || '#fff', dot: S.accent, style: { fontSize: '20px', fontFamily: S.fontText, ...(S.tagStyle || {}) } });
    M.tagIl = L.tag(ui, S.ilustracao || 'Ilustração', { left: 60, top: 150, bg: S.tagBg || 'rgba(0,0,0,.6)', color: S.tagColor || '#fff', dot: '#f5a524', style: { fontSize: '20px', fontFamily: S.fontText, ...(S.tagStyle || {}) } });
    return { T: L.n, W: L.wt, E: L.nEnd, D: L.D, S };
  };
  const tagOn = (tag, a, b) => tl.to(tag, { autoAlpha: 1, duration: 0.2 }, a).to(tag, { autoAlpha: 0, duration: 0.15 }, b);
  M.real = (a, b) => tagOn(M.tagReal, a, b);
  M.ilustra = (a, b) => tagOn(M.tagIl, a, b);
  M.flash = (t, cue = 'impact') => { flashes.push(t); if (cue) L.cue(t, cue); };
  M.whip = (t, dir = 1) => { whips.push([t - 0.2, dir]); L.cue(t - 0.2, 'whoosh'); };
  M.shake = (t, d = 0.35) => { shakes.push([t, d]); };

  // texto cinético: linhas [[t, html, estilo?]], movimento: soco | sobe | glitch | maquina
  M.texto = (a, b, lines, o = {}) => {
    const s = L.scene(a, b, o.parent);
    const mov = o.mov || S.mov || 'soco';
    const base = { fontFamily: o.font || S.font, fontSize: o.size || '110px', lineHeight: o.lh || '1', color: o.color || S.fg, textTransform: o.upper === false ? 'none' : (S.upper ?? 'uppercase'), fontWeight: o.weight || S.weight || '800', letterSpacing: o.ls || S.ls || '0' };
    const box = $('div', null, s, { position: 'absolute', left: px(o.left ?? 60), top: px(o.top ?? 560), width: px(o.width ?? 960), textAlign: o.align || 'center' });
    lines.forEach(([t, html, st]) => {
      const e = $('div', null, box, { ...base, ...(o.lineStyle || {}), ...(st || {}) });
      e.innerHTML = html;
      hid(e);
      if (mov === 'maquina') {
        const full = e.textContent;
        e.textContent = '';
        tl.set(e, { autoAlpha: 1 }, t);
        const n = full.length;
        const dur = Math.min(1.2, n * 0.035);
        L.onFrame((tt) => { if (tt >= t) { const k = Math.round(L.clamp((tt - t) / dur) * n); if (e.dataset.k !== String(k)) { e.dataset.k = String(k); e.textContent = full.slice(0, k); } } });
        L.cue(t, 'type', { d: dur });
      } else if (mov === 'sobe') {
        tl.fromTo(e, { autoAlpha: 0, y: 60, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', immediateRender: false }, t);
        L.cue(t, o.cue || 'tick');
      } else if (mov === 'glitch') {
        tl.fromTo(e, { autoAlpha: 0, x: -30, skewX: 20 }, { autoAlpha: 1, x: 0, skewX: 0, duration: 0.18, ease: 'steps(4)', immediateRender: false }, t);
        L.onFrame((tt) => { const d = tt - t; e.style.textShadow = d > 0 && d < 0.35 ? `${6 * Math.sin(tt * 90)}px 0 ${S.glitchA || '#ff004c'}, ${-6 * Math.sin(tt * 77)}px 0 ${S.glitchB || '#00e5ff'}` : (st && st.textShadow) || 'none'; });
        L.cue(t, o.cue || 'hit');
      } else {
        tl.fromTo(e, { autoAlpha: 0, scale: 1.45 }, { autoAlpha: 1, scale: 1, duration: 0.24, ease: 'power4.out', immediateRender: false }, t);
        L.cue(t, o.cue || 'hit');
      }
    });
    if (o.empurra !== false) push(s, [[a + 0.2, b, o.k ?? 0.08]]);
    return s;
  };

  // foto real de produto: cartão, polaroid ou tela cheia, com movimento de câmera
  M.foto = (a, b, foto, o = {}) => {
    const s = L.scene(a, b, o.parent);
    const w = o.w || 860, h = o.h || 860;
    const card = $('div', null, s, { position: 'absolute', left: px(o.left ?? (1080 - w) / 2), top: px(o.top ?? 300), width: px(w), height: px(h), borderRadius: px(o.radius ?? 36), overflow: 'hidden', boxShadow: '0 50px 100px -30px rgba(0,0,0,.7)', ...(o.polaroid ? { padding: '26px 26px 120px', background: '#fff', borderRadius: '6px' } : {}) });
    const im = L.img(card, L.F(foto), o.polaroid ? w - 52 : w, o.polaroid ? h - 146 : h, { objectFit: 'cover', display: 'block' });
    if (o.legenda) { const lg = $('div', null, card, { position: 'absolute', left: '0', bottom: '30px', width: '100%', textAlign: 'center', font: o.legendaFont || `700 44px ${S.fontText}`, color: '#222' }); lg.textContent = o.legenda; }
    tl.fromTo(im, { scale: 1.22 }, { scale: 1.05, duration: b - a + 0.3, ease: 'none', immediateRender: false }, a);
    tl.fromTo(card, { autoAlpha: 0, scale: 1.12, rotate: o.rot ?? 0 }, { autoAlpha: 1, scale: 1, rotate: o.rot ? o.rot * 0.4 : 0, duration: o.entra ?? 0.3, ease: 'expo.out', immediateRender: false }, a);
    if (o.sai) tl.to(card, { autoAlpha: 0, y: -120, duration: 0.3, ease: 'power2.in' }, b - 0.3);
    return s;
  };

  // celular com telas reais do cardápio trocando nos tempos: telas [[t, nome]], toques [[t, x, y]]
  M.celular = (a, b, telas, o = {}) => {
    const s = L.scene(a, b, o.parent || world);
    const ph = L.phone(s, o.sb || '#7d2949');
    telas.forEach(([t, nome], i) => {
      const im = L.img(ph.view, L.M(nome), 390, 797);
      if (i) { hid(im); tl.fromTo(im, { autoAlpha: 1, y: o.deslizar === false ? 0 : 797 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, t); }
    });
    (o.toques || []).forEach(([t, x, y]) => L.tap(ph.view, x, y, t));
    const x0 = o.x ?? 0, y0 = o.y ?? 40, k = o.k ?? 1;
    tl.fromTo(ph.el, { y: 1200, rotateX: 30, rotateY: o.ry ?? -10, scale: k * 0.9, x: x0 }, { y: y0, rotateX: 6, rotateY: o.ry ?? -10, scale: k, x: x0, duration: 0.7, ease: 'expo.out', immediateRender: false }, a);
    tl.to(ph.el, { rotateY: -(o.ry ?? -10), rotateX: 2, duration: Math.max(0.5, b - a - 0.7), ease: 'sine.inOut' }, a + 0.7);
    if (o.brilho) tl.fromTo(ph.sweep, { x: 0 }, { x: 900, duration: 0.9, ease: 'power2.inOut', immediateRender: false }, o.brilho);
    L.cue(a, 'whoosh');
    if (o.real !== false) M.real(a, b - 0.05);
    push(s, [[a + 0.7, b, o.zoom ?? 0.08]]);
    return { s, ph };
  };

  // tela de computador com captura real; camadas [[t, src]] e aproximação {t, x, y, k} (coordenadas da captura)
  M.monitor = (a, b, src, o = {}) => {
    const s = L.scene(a, b, o.parent || world);
    const m = L.monitor(s, o.w || 1000, L.P(src));
    if (o.top) m.el.style.top = px(o.top);
    (o.camadas || []).forEach(([t, src2]) => { const l = m.layer(L.P(src2)); hid(l); tl.set(l, { autoAlpha: 1 }, t); L.cue(t, 'ding'); });
    tl.fromTo(m.el, { y: 700, rotateX: -25, autoAlpha: 0 }, { y: 0, rotateX: 6, autoAlpha: 1, duration: 0.55, ease: 'expo.out', immediateRender: false }, a);
    tl.to(m.el, { rotateX: 0, duration: 0.5 }, a + 0.55);
    L.cue(a, 'whoosh');
    if (o.zoom) {
      const z = o.zoom;
      m.el.style.transformOrigin = '0 0';
      const top = parseFloat(m.el.style.top) || 960 - m.h / 2;
      const left = 540 - (o.w || 1000) / 2;
      tl.to(m.el, { scale: z.k, x: 540 - left - z.k * (14 + z.x * m.k), y: (z.cy ?? 900) - top - z.k * (14 + z.y * m.k), duration: 0.8, ease: 'expo.inOut' }, z.t);
      L.cue(z.t, 'zoom');
    }
    if (o.real !== false) M.real(a, b - 0.05);
    push(s, [[a + 0.6, b, 0.05]]);
    return { s, m };
  };

  // recorte flutuante de uma tela real; anel de destaque opcional
  M.recorte = (a, b, src, r, o = {}) => {
    const s = L.scene(a, b, o.parent || world);
    const k = o.k || 1.2;
    const el = L.crop(s, src, r.x, r.y, r.w, r.h, { k, base: o.base, cls: 'panel', left: o.left ?? 540 - (r.w * k) / 2, top: o.top ?? 600, style: { borderRadius: px(o.radius ?? 22), backgroundColor: '#fff', ...(o.style || {}) } });
    hid(el);
    tl.fromTo(el, { autoAlpha: 0, y: 160, rotateX: 25, scale: 0.92 }, { autoAlpha: 1, y: 0, rotateX: 0, scale: 1, duration: 0.55, ease: 'back.out(1.3)', immediateRender: false }, o.entra ?? a);
    L.cue(o.entra ?? a, 'whoosh');
    if (o.real !== false) M.real(a, b - 0.05);
    push(s, [[(o.entra ?? a) + 0.5, b, o.zoom ?? 0.07]]);
    return { s, el, k, left: parseFloat(el.style.left), top: parseFloat(el.style.top), r };
  };

  // anotações desenhadas à mão sobre a tela: círculo, sublinhado ou seta (coordenadas do quadro 1080x1920)
  M.anotar = (parent, t, shape, o = {}) => {
    const color = o.color || S.marker || '#ff3b30';
    const svgNS = 'http://www.w3.org/2000/svg';
    const box = $('div', null, parent, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '1920px', pointerEvents: 'none' });
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '1080'); svg.setAttribute('height', '1920');
    box.appendChild(svg);
    const p = document.createElementNS(svgNS, 'path');
    let d;
    if (shape.tipo === 'circulo') {
      const { x, y, w, h } = shape;
      const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + 18, ry = h / 2 + 14;
      d = `M${cx - rx} ${cy}`;
      for (let i = 1; i <= 40; i++) { const an = Math.PI + (i / 36) * Math.PI * 2; d += ` L${cx + Math.cos(an) * rx * (1 + 0.03 * Math.sin(i))} ${cy + Math.sin(an) * ry * (1 + 0.04 * Math.cos(i * 1.3))}`; }
    } else if (shape.tipo === 'sublinhado') {
      const { x, y, w } = shape;
      d = `M${x} ${y} Q${x + w * 0.5} ${y + 10} ${x + w} ${y - 4}`;
    } else if (shape.tipo === 'check') {
      const { x, y, s: k = 1 } = shape;
      d = `M${x} ${y} L${x + 28 * k} ${y + 30 * k} L${x + 80 * k} ${y - 40 * k}`;
    } else if (shape.tipo === 'risco') {
      const { x, y, w } = shape;
      d = `M${x} ${y + 6} L${x + w} ${y - 6}`;
    } else {
      const { x1, y1, x2, y2 } = shape;
      const an = Math.atan2(y2 - y1, x2 - x1);
      d = `M${x1} ${y1} Q${(x1 + x2) / 2 + 40} ${(y1 + y2) / 2 - 40} ${x2} ${y2} M${x2} ${y2} L${x2 - 40 * Math.cos(an - 0.5)} ${y2 - 40 * Math.sin(an - 0.5)} M${x2} ${y2} L${x2 - 40 * Math.cos(an + 0.5)} ${y2 - 40 * Math.sin(an + 0.5)}`;
    }
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', String(o.largura || 9));
    p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
    const len = 3000;
    p.style.strokeDasharray = len;
    tl.set(p, { strokeDashoffset: len }, 0);
    tl.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: o.dur || 0.45, ease: 'power2.inOut', immediateRender: false }, t);
    L.cue(t, 'scribble');
    if (o.texto) {
      const n = $('div', null, box, { position: 'absolute', left: px(o.tx), top: px(o.ty), font: o.font || `800 46px ${S.marcador || S.font}`, color, transform: `rotate(${o.rot ?? -4}deg)`, whiteSpace: 'nowrap' });
      n.textContent = o.texto;
      hid(n);
      tl.fromTo(n, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t + 0.25);
    }
    return box;
  };

  // notificações / mensagens que empilham (ilustração): msgs [[t, texto, 'in'|'out']]
  M.mensagens = (a, b, msgs, o = {}) => {
    const s = L.scene(a, b, o.parent);
    const col = $('div', null, s, { position: 'absolute', left: '60px', top: px(o.top ?? 330), width: '960px' });
    let y = 0;
    msgs.forEach(([t, txt, lado], i) => {
      const e = $('div', null, col, { position: 'absolute', top: px(y), ...(lado === 'out' ? { right: '0' } : { left: '0' }), maxWidth: '760px', padding: '22px 30px', borderRadius: '30px', font: `600 38px/1.25 ${S.fontText}`, color: '#111', background: lado === 'out' ? (o.corOut || '#dcf8c6') : '#fff', boxShadow: '0 10px 30px rgba(0,0,0,.25)' });
      e.textContent = txt;
      y += txt.length > 30 ? 150 : 104;
      hid(e);
      tl.fromTo(e, { autoAlpha: 0, scale: 0.7, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t);
      L.cue(t, 'bubble', { n: i });
    });
    const sc = { v: 0 };
    if (o.rolar) tl.to(sc, { v: o.rolar[1], duration: o.rolar[2] || 1.2, ease: 'power2.inOut' }, o.rolar[0]);
    L.onFrame(() => { col.style.transform = `translateY(${sc.v}px)`; });
    M.ilustra(a + 0.1, b - 0.1);
    push(s, [[a + 0.3, b, 0.06]]);
    return s;
  };

  // tela dividida antes × depois: rodadas [{t, rotulo, antes: html, depois: {src, r, k, base} | html}]
  M.divisao = (a, b, rodadas, o = {}) => {
    const s = L.scene(a, b);
    const L1 = $('div', null, s, { position: 'absolute', left: '0', top: '0', width: '540px', height: '1920px', background: o.bgAntes || '#2b2b2b', overflow: 'hidden' });
    const R1 = $('div', null, s, { position: 'absolute', left: '540px', top: '0', width: '540px', height: '1920px', background: o.bgDepois || S.bg, overflow: 'hidden' });
    $('div', null, s, { position: 'absolute', left: '536px', top: '0', width: '8px', height: '1920px', background: S.accent, boxShadow: `0 0 30px ${S.accent}` });
    const hA = $('div', null, L1, { position: 'absolute', left: '0', top: '250px', width: '540px', textAlign: 'center', font: `900 46px ${S.font}`, color: S.antesTitulo || 'rgba(255,255,255,.55)', letterSpacing: '.1em' });
    hA.textContent = 'ANTES';
    const hD = $('div', null, R1, { position: 'absolute', left: '0', top: '250px', width: '540px', textAlign: 'center', font: `900 46px ${S.font}`, color: S.accent, letterSpacing: '.1em' });
    hD.textContent = 'DEPOIS';
    tl.fromTo([L1, R1], { yPercent: (i) => (i ? 100 : -100) }, { yPercent: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, a);
    L.cue(a, 'whoosh');
    rodadas.forEach((rd, i) => {
      const t1 = rodadas[i + 1] ? rodadas[i + 1].t : b;
      const lab = $('div', null, s, { position: 'absolute', left: '0', top: '360px', width: '1080px', textAlign: 'center', font: `900 92px ${S.font}`, color: S.fg, textShadow: '0 6px 30px rgba(0,0,0,.6)' });
      lab.textContent = rd.rotulo;
      hid(lab);
      tl.fromTo(lab, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power4.out', immediateRender: false }, rd.t);
      tl.to(lab, { autoAlpha: 0, duration: 0.15 }, t1 - 0.15);
      L.cue(rd.t, 'hit');
      const ea = $('div', null, L1, { position: 'absolute', left: '40px', top: '620px', width: '460px', textAlign: 'center', font: `700 ${S.antesSize || 52}px/1.15 ${S.antesFont || S.fontText}`, color: S.antesCor || '#e8e8e8', filter: 'grayscale(1)' });
      ea.innerHTML = rd.antes;
      hid(ea);
      tl.fromTo(ea, { autoAlpha: 0, rotate: -6, y: 40 }, { autoAlpha: 1, rotate: -2, y: 0, duration: 0.35, ease: 'back.out(1.6)', immediateRender: false }, rd.t + 0.1);
      tl.to(ea, { autoAlpha: 0, duration: 0.15 }, t1 - 0.15);
      let ed;
      if (rd.depois.build) {
        ed = rd.depois.build(R1);
      } else if (rd.depois.src) {
        const d = rd.depois;
        const k = d.k || 0.9;
        ed = L.crop(R1, d.src, d.r.x, d.r.y, d.r.w, d.r.h, { k, base: d.base, cls: 'panel', left: 270 - (d.r.w * k) / 2, top: d.top ?? 620, style: { borderRadius: '18px', backgroundColor: '#fff' } });
      } else {
        ed = $('div', null, R1, { position: 'absolute', left: '40px', top: '620px', width: '460px', textAlign: 'center', font: `800 52px/1.15 ${S.fontText}`, color: S.fg });
        ed.innerHTML = rd.depois;
      }
      hid(ed);
      tl.fromTo(ed, { autoAlpha: 0, scale: 0.8, y: 60 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)', immediateRender: false }, rd.td ?? rd.t + 0.7);
      tl.to(ed, { autoAlpha: 0, duration: 0.15 }, t1 - 0.15);
      L.cue(rd.td ?? rd.t + 0.7, 'ding');
    });
    push(s, [[a + 0.5, b, 0.05]]);
    return s;
  };

  // cronômetro de 3 s em anel (quiz)
  M.cronometro = (parent, t, o = {}) => {
    const dur = o.dur || 3;
    const box = $('div', null, parent, { position: 'absolute', left: px(540 - 150), top: px(o.top ?? 1060), width: '300px', height: '300px' });
    box.innerHTML = `<svg width="300" height="300"><circle cx="150" cy="150" r="130" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="18"/><circle class="ring" cx="150" cy="150" r="130" fill="none" stroke="${S.accent}" stroke-width="18" stroke-linecap="round" transform="rotate(-90 150 150)" stroke-dasharray="817" stroke-dashoffset="0"/></svg>`;
    const num = $('div', null, box, { position: 'absolute', inset: '0', display: 'grid', placeItems: 'center', font: `900 150px ${S.font}`, color: S.fg });
    const ring = box.querySelector('.ring');
    hid(box);
    tl.fromTo(box, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t);
    L.onFrame((tt) => {
      const d = L.clamp((tt - t) / dur);
      ring.setAttribute('stroke-dashoffset', String(817 * d));
      ring.setAttribute('stroke', d > 0.66 ? (S.danger || '#ff3b30') : S.accent);
      num.textContent = String(Math.max(0, Math.ceil(3 * (1 - (tt - t) / dur))));
    });
    for (let i = 0; i < 3; i++) L.cue(t + (i * dur) / 3, 'tick');
    L.cue(t + dur, 'alert');
    tl.to(box, { autoAlpha: 0, duration: 0.2 }, t + dur + 0.1);
    return box;
  };

  // personagem "post-it" com rosto que fala nos tempos da sua fala
  M.personagem = (parent, a, o) => {
    const box = $('div', null, parent, { position: 'absolute', left: px(o.x), top: px(o.y), width: px(o.w || 380), height: px(o.h || 380), background: o.cor, borderRadius: '18px', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)', transform: `rotate(${o.rot || 0}deg)` });
    const face = $('div', null, box, { position: 'absolute', left: '0', top: '70px', width: '100%', height: '200px' });
    face.innerHTML = `<svg width="${o.w || 380}" height="200" viewBox="0 0 380 200"><circle cx="120" cy="70" r="30" fill="#fff"/><circle cx="260" cy="70" r="30" fill="#fff"/><circle class="p1" cx="126" cy="74" r="13" fill="#111"/><circle class="p2" cx="266" cy="74" r="13" fill="#111"/><path class="sob" d="M95 30 L150 40 M285 40 L235 30" stroke="#111" stroke-width="8" stroke-linecap="round" opacity="${o.bravo ? 1 : 0}"/><ellipse class="boca" cx="190" cy="150" rx="46" ry="10" fill="#3a0d0d"/></svg>`;
    const nome = $('div', null, box, { position: 'absolute', left: '0', bottom: '26px', width: '100%', textAlign: 'center', font: `900 34px/1.05 ${S.font}`, color: '#111', padding: '0 18px' });
    nome.innerHTML = o.nome;
    const boca = face.querySelector('.boca');
    const falas = o.falas || [];
    L.onFrame((t) => {
      const fala = falas.some(([s0, s1]) => t >= s0 && t <= s1);
      const open = fala ? 10 + 26 * Math.abs(Math.sin(t * 22)) : 10;
      boca.setAttribute('ry', String(open));
      const bl = Math.floor(t * 0.8) % 4 === 0 && (t * 0.8) % 1 < 0.08;
      face.querySelectorAll('.p1,.p2').forEach((e) => e.setAttribute('r', bl ? '3' : '13'));
    });
    hid(box);
    tl.fromTo(box, { autoAlpha: 0, scale: 0.2, rotate: (o.rot || 0) - 30 }, { autoAlpha: 1, scale: 1, rotate: o.rot || 0, duration: 0.45, ease: 'back.out(2.2)', immediateRender: false }, a);
    L.cue(a, 'pop');
    return box;
  };

  // balão de fala
  M.balao = (parent, t0, t1, html, o) => {
    const b = $('div', null, parent, { position: 'absolute', left: px(o.x), top: px(o.y), maxWidth: px(o.w || 620), padding: '24px 30px', background: '#fff', color: '#111', borderRadius: '30px', font: `800 40px/1.2 ${S.fontText}`, boxShadow: '0 16px 40px rgba(0,0,0,.35)' });
    b.innerHTML = html;
    hid(b);
    tl.fromTo(b, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t0);
    tl.to(b, { autoAlpha: 0, duration: 0.15 }, t1);
    return b;
  };

  // capítulo de lista (1/3, 2/3…) com barra de progresso no topo
  M.capitulo = (parent, t, n, total, html, o = {}) => {
    const c = $('div', null, parent, { position: 'absolute', left: '0', top: px(o.top ?? 300), width: '1080px', textAlign: 'center' });
    c.innerHTML = `<div style="font:900 300px/0.9 ${S.font};color:${S.accent}">${n}</div><div style="font:900 72px/1.05 ${S.font};color:${S.fg};text-transform:uppercase;margin-top:10px">${html}</div>`;
    hid(c);
    tl.fromTo(c, { autoAlpha: 0, scale: 1.4 }, { autoAlpha: 1, scale: 1, duration: 0.28, ease: 'power4.out', immediateRender: false }, t);
    L.cue(t, 'impact');
    return c;
  };
  M.progresso = (a, b, marcas) => {
    const bar = $('div', null, ui, { position: 'absolute', left: '60px', top: '110px', width: '960px', height: '12px', borderRadius: '6px', background: S.trilho || 'rgba(255,255,255,.18)' });
    const fill = $('div', null, bar, { position: 'absolute', left: '0', top: '0', height: '12px', width: '0', borderRadius: '6px', background: S.accent });
    hid(bar);
    tl.to(bar, { autoAlpha: 1, duration: 0.2 }, a).to(bar, { autoAlpha: 0, duration: 0.2 }, b);
    marcas.forEach(([t, k]) => tl.to(fill, { width: 960 * k, duration: 0.4, ease: 'power3.out' }, t));
  };

  // relógio de vlog (canto superior), troca nos tempos
  M.relogio = (horas) => {
    horas.forEach(([t0, t1, txt]) => {
      const c = $('div', null, ui, { position: 'absolute', right: '60px', top: '120px', padding: '14px 26px', borderRadius: '999px', background: 'rgba(0,0,0,.45)', font: `700 44px ${S.marcador || S.fontText}`, color: '#fff' });
      c.textContent = txt;
      hid(c);
      tl.fromTo(c, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, t0);
      tl.to(c, { autoAlpha: 0, duration: 0.2 }, t1);
      L.cue(t0, 'flip');
    });
  };

  // prova: +30% de lucro (resultado informado pelo criador do sistema)
  M.prova = (a, b, o = {}) => {
    const s = L.scene(a, b);
    if (o.fundo) $('div', 'full', s, { background: o.fundo });
    L.prova(s, a + 0.05, { top: 470, numSize: o.numSize || 290, kickFont: `800 32px/1.25 ${S.fontText}`, kickColor: S.fg, numFont: `900 ${o.numSize || 290}px/1 ${S.font}`, numColor: S.accent, lblFont: `900 110px/1 ${S.font}`, lblSize: 110, lblColor: S.fg, noteFont: `600 28px/1.4 ${S.fontText}`, noteColor: S.nota || 'rgba(255,255,255,.65)', ...(o.prova || {}) });
    M.flash(a, 'impact');
    push(s, [[a + 1, b, 0.12]]);
    return s;
  };

  // chamada final: linhas + botão + toque
  M.cta = (a, o) => {
    const s = L.scene(a, null);
    if (o.fundo) { const f = $('div', 'full', s, { background: o.fundo }); tl.fromTo(f, { clipPath: 'circle(0% at 50% 60%)' }, { clipPath: 'circle(150% at 50% 60%)', duration: 0.5, ease: 'power3.inOut', immediateRender: false }, a - 0.2); L.cue(a - 0.2, 'swell'); }
    M.texto(a, null, o.linhas, { parent: s, top: o.top ?? 470, size: o.size || '120px', color: o.cor || S.fg, empurra: false, mov: o.mov });
    const btn = $('div', null, s, { position: 'absolute', left: '140px', top: px(o.botaoTop ?? 1130), width: '800px', padding: '34px 30px', borderRadius: '999px', background: o.botaoCor || S.accent, color: o.botaoTexto || '#111', textAlign: 'center', font: `900 46px ${S.fontText}`, boxShadow: '0 30px 60px -20px rgba(0,0,0,.55)' });
    btn.textContent = o.botao[1];
    hid(btn);
    tl.fromTo(btn, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, o.botao[0]);
    L.cue(o.botao[0], 'pop');
    L.tap(s, 660, (o.botaoTop ?? 1130) + 50, o.toque);
    tl.to(btn, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1 }, o.toque);
    tl.to(btn, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 5, ease: 'sine.inOut' }, o.toque + 0.3);
    if (o.sub) { const sb = $('div', null, s, { position: 'absolute', left: '90px', width: '900px', top: px((o.botaoTop ?? 1130) + 170), textAlign: 'center', font: `700 34px/1.3 ${S.fontText}`, color: o.subCor || S.fg, opacity: 0.85 }); sb.textContent = o.sub; hid(sb); tl.to(sb, { autoAlpha: 0.85, duration: 0.4 }, o.botao[0] + 0.3); }
    push(s, [[a, o.botao[0], 0.06], [o.toque, L.D, 0.05]]);
    return s;
  };

  // peça de tela real (sem cena própria): recorte com entrada, para montar telas compostas
  M.peca = (parent, t, src, r, o = {}) => {
    const k = o.k || Math.min(1.8, (o.w || 940) / r.w);
    const el = L.crop(parent, L.P(src), r.x, r.y, r.w, r.h, { k, base: o.base, cls: 'panel', left: o.left ?? 540 - (r.w * k) / 2, top: o.top ?? 620, style: { borderRadius: px(o.radius ?? 20), backgroundColor: '#fff', ...(o.style || {}) } });
    hid(el);
    const de = o.de || { autoAlpha: 0, y: 140, scale: 0.9, rotateX: 18 };
    tl.fromTo(el, de, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotateX: 0, rotate: o.rot || 0, duration: o.dur || 0.5, ease: o.ease || 'back.out(1.3)', immediateRender: false }, t);
    if (o.cue !== false) L.cue(t, o.cue || 'whoosh');
    return el;
  };
  // DRE real em um cartão, sem a linha de comissão de app (dois recortes da mesma captura)
  M.dre = (parent, t, o = {}) => {
    const k = o.k || 1.15, B = [1440, 1134];
    const w = 800 * k;
    const card = $('div', 'panel', parent, { left: px(o.left ?? 540 - w / 2), top: px(o.top ?? 420), width: px(w), height: px((270 + 537) * k), backgroundColor: '#fff', overflow: 'hidden', borderRadius: '22px' });
    L.crop(card, L.P('d-fin-dre-full'), 280, 247, 800, 270, { k, base: B });
    L.crop(card, L.P('d-fin-dre-full'), 280, 574, 800, 537, { k, base: B, top: 270 * k });
    hid(card);
    tl.fromTo(card, { autoAlpha: 0, y: 200, rotateX: 20 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, t);
    L.cue(t, 'whoosh');
    // posição (no quadro) de uma linha da captura original
    const rowY = (y) => (o.top ?? 420) + (y < 517 ? (y - 247) : (y - 574 + 270)) * k;
    return { card, k, rowY, left: o.left ?? 540 - w / 2 };
  };
  // cartão com colunas escolhidas de uma tela real (pula colunas vazias ou irrelevantes): segs [[x0, x1]]
  M.colunas = (parent, t, src, segs, y, h, o = {}) => {
    const wsum = segs.reduce((acc, [x0, x1]) => acc + x1 - x0, 0);
    const k = o.k || (o.w || 940) / wsum;
    const card = $('div', 'panel', parent, { left: px(o.left ?? 540 - (wsum * k) / 2), top: px(o.top ?? 620), width: px(wsum * k), height: px(h * k), backgroundColor: '#fff', overflow: 'hidden', borderRadius: px(o.radius ?? 20) });
    let off = 0;
    const xmap = [];
    for (const [x0, x1] of segs) { L.crop(card, L.P(src), x0, y, x1 - x0, h, { k, base: o.base, left: off * k }); xmap.push([x0, x1, off]); off += x1 - x0; }
    hid(card);
    tl.fromTo(card, o.de || { autoAlpha: 0, y: 140, scale: 0.9, rotateX: 18 }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.5, ease: 'back.out(1.3)', immediateRender: false }, t);
    if (o.cue !== false) L.cue(t, o.cue || 'whoosh');
    const left = o.left ?? 540 - (wsum * k) / 2, top = o.top ?? 620;
    // posição no quadro de um ponto (x, y) da captura
    const at = (x, yy) => { const m = xmap.find(([x0, x1]) => x >= x0 && x <= x1) || xmap[0]; return [left + (m[2] + x - m[0]) * k, top + (yy - y) * k]; };
    return { card, k, at, left, top, w: wsum * k };
  };
  // rótulo em pílula (função mostrada)
  M.rotulo = (parent, t, html, o = {}) => {
    const e = $('div', null, parent, { position: 'absolute', left: '0', top: px(o.top ?? 300), width: '1080px', textAlign: 'center' });
    const pill = $('span', null, e, { display: 'inline-block', padding: o.pad || '18px 34px', borderRadius: o.radius || '999px', background: o.bg || S.accent, color: o.color || '#111', font: o.font || `900 50px/1.05 ${S.font}`, textTransform: S.upper === false ? 'none' : 'uppercase', letterSpacing: o.ls || '.01em', boxShadow: '0 20px 40px -16px rgba(0,0,0,.5)', transform: `rotate(${o.rot ?? -2}deg)` });
    pill.innerHTML = html;
    hid(e);
    tl.fromTo(e, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power4.out', immediateRender: false }, t);
    if (o.ate) tl.to(e, { autoAlpha: 0, duration: 0.12 }, o.ate);
    if (o.cue !== false) L.cue(t, o.cue || 'tick');
    return e;
  };
  // carimbo (ACABOU, R$ ???)
  M.carimbo = (parent, t, txt, o = {}) => {
    const e = $('div', null, parent, { position: 'absolute', left: px(o.x ?? 240), top: px(o.y ?? 760), padding: '10px 34px', border: `10px solid ${o.cor || S.danger || '#ff3b30'}`, borderRadius: '18px', color: o.cor || S.danger || '#ff3b30', font: o.font || `900 ${o.size || 130}px/1 ${S.font}`, textTransform: 'uppercase', transform: `rotate(${o.rot ?? -12}deg)`, mixBlendMode: o.blend || 'normal', whiteSpace: 'nowrap', background: o.bg || 'transparent' });
    e.textContent = txt;
    hid(e);
    tl.fromTo(e, { autoAlpha: 0, scale: 2.6 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power4.in', immediateRender: false }, t);
    L.cue(t + 0.17, o.cue || 'stamp');
    M.shake(t + 0.17, 0.25);
    return e;
  };
  // notificação de celular (ilustração)
  M.notificacao = (parent, t, titulo, texto, o = {}) => {
    const e = $('div', null, parent, { position: 'absolute', left: px(o.x ?? 90), top: px(o.y ?? 420), width: px(o.w ?? 900), padding: '26px 30px', borderRadius: '36px', background: o.bg || 'rgba(245,245,247,.94)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)', display: 'flex', gap: '24px', alignItems: 'center' });
    e.innerHTML = `<div style="width:96px;height:96px;border-radius:24px;flex:none;background:${o.icone || '#888'};display:grid;place-items:center;font:900 54px ${S.fontText};color:#fff">${o.letra || '!'}</div><div style="flex:1;min-width:0"><div style="font:800 34px/1.2 ${S.fontText};color:#111">${titulo}</div><div style="font:500 32px/1.25 ${S.fontText};color:#444">${texto}</div></div><div style="font:500 26px ${S.fontText};color:#888;align-self:flex-start">${o.hora || 'agora'}</div>`;
    hid(e);
    tl.fromTo(e, { autoAlpha: 0, y: -120, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.6)', immediateRender: false }, t);
    L.cue(t, o.cue || 'bubble');
    return e;
  };
  // foto sem cena própria
  M.fotoEl = (parent, t, foto, o = {}) => {
    const w = o.w || 700, h = o.h || 700;
    const card = $('div', null, parent, { position: 'absolute', left: px(o.left ?? (1080 - w) / 2), top: px(o.top ?? 420), width: px(w), height: px(h), borderRadius: px(o.radius ?? 30), overflow: 'hidden', boxShadow: '0 40px 90px -30px rgba(0,0,0,.7)', ...(o.polaroid ? { padding: '22px 22px 100px', background: '#fff', borderRadius: '6px' } : {}) });
    const im = L.img(card, L.F(foto), o.polaroid ? w - 44 : w, o.polaroid ? h - 122 : h, { objectFit: 'cover', display: 'block' });
    if (o.legenda) { const lg = $('div', null, card, { position: 'absolute', left: '0', bottom: '26px', width: '100%', textAlign: 'center', font: o.legendaFont || `700 44px ${S.marcador || S.fontText}`, color: '#222' }); lg.textContent = o.legenda; }
    hid(card);
    tl.fromTo(card, { autoAlpha: 0, scale: 1.2, rotate: (o.rot || 0) * 2, y: o.dy ?? 0 }, { autoAlpha: 1, scale: 1, rotate: o.rot || 0, y: 0, duration: o.dur || 0.35, ease: 'expo.out', immediateRender: false }, t);
    tl.fromTo(im, { scale: 1.18 }, { scale: 1.02, duration: o.zoomDur || 3, ease: 'none', immediateRender: false }, t);
    if (o.cue !== false) L.cue(t, o.cue || 'whoosh');
    return card;
  };
  M.ui = () => ui;
  M.world = () => world;

  M.fim = (o = {}) => {
    if (o.legendas !== false) {
      const capLayer = $('div', 'full', ui);
      L.captions(capLayer, { maxWords: o.max || 3, top: o.top || 1480, cls: S.capCls || 'ig', upper: S.capUpper ?? true, hideIn: o.hideIn || [] });
    }
    L.cue(L.D - 2.2, 'tail');
    L.finish();
  };
  return M;
})();
