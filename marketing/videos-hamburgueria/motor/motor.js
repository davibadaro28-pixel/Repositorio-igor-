// Motor dos vídeos: lê roteiros/<id>.json, monta as cenas (HTML + GSAP e cenas 3D em three.js) numa linha do tempo
// e expõe window.renderAt(t), window.DURATION e window.CUES (marcas para os efeitos sonoros).
// Tudo é função do tempo: o render pode pedir qualquer quadro, em qualquer ordem.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const gsap = window.gsap;
const BASE = '/marketing/videos-hamburgueria/';
const FOTOS = '/lojas/sua-hamburgueria/public/img/produtos/';
const W = 1080, H = 1920;
const id = new URLSearchParams(location.search).get('v');
const SPEC = await (await fetch(`${BASE}roteiros/${id}.json`)).json();
document.body.className = 't-' + (SPEC.tema || 'brasa');

const $ = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const E = { out: (x) => 1 - Math.pow(1 - x, 3), inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); } };
const prog = (t, a, d) => clamp((t - a) / d);

const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
const CUES = [];
const cue = (t, tipo, extra = {}) => CUES.push({ t: Math.round(t * 1000) / 1000, tipo, ...extra });
const cenasEl = document.getElementById('cenas');
const ESC3D = [];   // cenas 3D: {t0, t1, grupo, update(t), cam}

await document.fonts.load('400 100px Anton');
await document.fonts.load('700 40px Poppins');
await document.fonts.load('600 40px Poppins');
await document.fonts.load('700 60px Caveat');
await document.fonts.ready;

// ---------------------------------------------------------------- texto
function palavras(txt, parent) {
  const ws = [];
  let ac = false;
  for (const seg of String(txt).split(/(\*|\n)/)) {
    if (seg === '*') { ac = !ac; continue; }
    if (seg === '\n') { $('br', null, parent); continue; }
    for (const w of seg.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { parent.appendChild(document.createTextNode(' ')); continue; }
      const s = $('span', 'w' + (ac ? ' ac' : ''), parent);
      s.textContent = w;
      ws.push(s);
    }
  }
  return ws;
}
function fit(node, maxW, maxH, max, min = 28) {
  let lo = min, hi = max;
  node.style.width = maxW + 'px';
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    node.style.fontSize = m + 'px';
    if (node.scrollWidth <= maxW + 1 && node.offsetHeight <= maxH) lo = m; else hi = m;
  }
  node.style.fontSize = lo + 'px';
  return lo;
}
function entraPalavras(ws, t, passo = 0.085, som = 'tick') {
  ws.forEach((w, i) => {
    tl.fromTo(w, { y: 70, opacity: 0, scale: 0.7 }, { y: 0, opacity: 1, scale: 1, duration: 0.34, ease: 'back.out(2.2)', immediateRender: false }, t + i * passo);
    if (som && i % 2 === 0) cue(t + i * passo, som);
  });
  return t + ws.length * passo + 0.3;
}
function rotulo(parent, txt) { return $('div', 'rot', parent, txt); }
// troca conteúdo/classe de um elemento num instante (funciona indo e voltando no tempo)
function muda(el, antes, depois, t) {
  const o = { k: 0 };
  const aplica = (v) => { if (v.html != null) el.innerHTML = v.html; if (v.cls != null) el.className = v.cls; if (v.txt != null) el.textContent = v.txt; };
  tl.fromTo(o, { k: 0 }, { k: 1, duration: 0.001, immediateRender: false, onUpdate: () => aplica(o.k >= 1 ? depois : antes), onReverseComplete: () => aplica(antes) }, t);
  aplica(antes);
}
const RT = 'Tela real do sistema · dados de demonstração';

// legenda (topo) das cenas 3D: várias, trocando no tempo
function legendas(L, itens, alto = 300) {
  // itens: [{t, ate, texto, rot}]
  for (const it of itens) {
    if (!it.texto) continue;
    const box = $('div', 'lgbox', L);
    box.style.height = alto + 'px';
    const h = $('div', 'lg', box);
    const ws = palavras(it.texto, h);
    fit(h, 960, it.rot ? alto - 60 : alto, it.max || 112);
    if (it.rot) rotulo(box, it.rot);
    tl.set(box, { autoAlpha: 0 }, 0);
    tl.set(box, { autoAlpha: 1 }, it.t);
    entraPalavras(ws, it.t + 0.02, 0.06, null);
    if (it.rot) tl.fromTo(box.querySelector('.rot'), { opacity: 0 }, { opacity: 0.9, duration: 0.3, immediateRender: false }, it.t + 0.3);
    tl.to(box, { autoAlpha: 0, y: -20, duration: 0.16 }, it.ate - 0.16);
  }
}

// ---------------------------------------------------------------- three.js
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const pmrem = new THREE.PMREMGenerator(renderer);
const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
const DIST = 14;
const UNIT = H / (2 * DIST * Math.tan(THREE.MathUtils.degToRad(15)));   // px por unidade a DIST
const pxY = (py) => -(py - H / 2) / UNIT;   // y em px (tela) -> y no mundo (plano z=0)

const loader = new THREE.TextureLoader();
const TEX = {};
const INFO = {};   // tamanho e cor do topo de cada tela
async function tex(nome) {
  if (TEX[nome]) return TEX[nome];
  const url = nome.startsWith('foto:') ? FOTOS + nome.slice(5) + '.webp' : `${BASE}telas/${nome}.jpg`;
  const t = await loader.loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.minFilter = THREE.LinearMipmapLinearFilter;
  const img = t.image;
  const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1;
  const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, img.width, 8, 0, 0, 1, 1);
  const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
  INFO[nome] = { w: img.width, h: img.height, topo: `rgb(${r},${g},${b})`, claro: 0.299 * r + 0.587 * g + 0.114 * b > 150 };
  TEX[nome] = t;
  return t;
}
function luzes(grupo) {
  grupo.add(new THREE.HemisphereLight(0xfff4e6, 0x2a1408, 1.1));
  const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(4, 6, 8); grupo.add(k);
  const rim = new THREE.DirectionalLight(0xffa060, 1.6); rim.position.set(-6, 2, -4); grupo.add(rim);
}
function retArredondado(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ShapeGeometry(s, 16);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
function canvasTex(w, h, desenha) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  desenha(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function barraStatus(cor, claro) {
  return canvasTex(780, 64, (c, w, h) => {
    c.fillStyle = cor; c.fillRect(0, 0, w, h);
    c.fillStyle = claro ? '#111' : '#fff';
    c.font = '600 30px Poppins'; c.textBaseline = 'middle'; c.fillText('20:47', 70, h / 2 + 4);
    const x0 = w - 150;
    for (let i = 0; i < 4; i++) c.fillRect(x0 + i * 11, h / 2 + 12 - (i + 1) * 6, 7, (i + 1) * 6);
    c.strokeStyle = c.fillStyle; c.lineWidth = 3; c.strokeRect(x0 + 60, h / 2 - 10, 46, 22); c.fillRect(x0 + 64, h / 2 - 6, 34, 14);
  });
}
// tela com troca suave: dois planos sobrepostos
function telaDupla(w, h) {
  const g = retArredondado(w, h, Math.min(w, h) * 0.07);
  const mk = (z) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true })); m.position.z = z; return m; };
  return { a: mk(0), b: mk(0.0015), w, h };
}
function aplicaTela(plano, nome, rolar = 0, aspecto) {
  const t = TEX[nome];
  if (plano.material.map !== t) { plano.material.map = t; plano.material.needsUpdate = true; }
  const i = INFO[nome];
  const vis = Math.min(1, (aspecto * i.w) / i.h);   // fração visível da altura da imagem
  t.repeat.set(1, vis);
  t.offset.set(0, 1 - vis - rolar * (1 - vis));
}
function anel() {
  const g = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.16, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, toneMapped: false }));
  const aro = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 64), new THREE.MeshBasicMaterial({ color: 0xff6a1f, transparent: true, toneMapped: false }));
  const onda = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.225, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }));
  g.add(disco, aro, onda); g.userData = { disco, aro, onda }; g.visible = false;
  return g;
}
function animaAnel(a, k) {   // k: 0..1
  if (k <= 0 || k >= 1) { a.visible = false; return; }
  a.visible = true;
  const { disco, aro, onda } = a.userData;
  const ent = E.out(clamp(k / 0.3)), aperto = k > 0.3 && k < 0.5 ? 0.85 : 1, sai = 1 - clamp((k - 0.6) / 0.4);
  disco.scale.setScalar(ent * aperto); aro.scale.setScalar(ent * aperto);
  disco.material.opacity = 0.55 * sai; aro.material.opacity = sai;
  const ok = clamp((k - 0.3) / 0.7);
  onda.scale.setScalar(1 + ok * 1.8); onda.material.opacity = (1 - ok) * (k > 0.3 ? 0.9 : 0);
}
function projeta(obj, local) {
  const v = local.clone(); obj.localToWorld(v); v.project(camera);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
}
function poeCamera(c) {
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(c.lx ?? c.x, c.ly ?? c.y, 0);
}

// ---------------------------------------------------------------- cenas HTML
const CENA = {};

CENA.texto = (c, t0, d, L) => {
  const z = $('div', 'zona' + (c.foto ? ' topo' : ''), L);
  if (c.etiqueta) { const tg = $('div', 'tag', z, c.etiqueta); tl.fromTo(tg, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, immediateRender: false }, t0 + 0.02); }
  const h = $('h1', 'hk', z);
  const ws = palavras(c.texto, h);
  fit(h, 960, c.foto ? 400 : (c.sub ? 640 : 820), c.max || 190);
  let sub;
  if (c.sub) { sub = $('p', 'sub', z, c.sub); }
  let t = t0 + 0.08;
  if (c.modo === 'bate') {   // tudo de uma vez, com impacto
    tl.fromTo(h, { scale: 1.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.32, ease: 'power4.out', immediateRender: false }, t);
    cue(t + 0.12, 'impact');
    t += 0.5;
  } else t = entraPalavras(ws, t, c.passo || 0.085);
  if (sub) tl.fromTo(sub, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, Math.min(t, t0 + d - 1));
  if (c.foto) {
    const f = $('div', 'foto', z); const im = $('img', null, f); im.src = FOTOS + c.foto + '.webp';
    tl.fromTo(f, { y: 500, rotation: 8, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.7, ease: 'back.out(1.3)', immediateRender: false }, t0 + 0.15);
    tl.fromTo(im, { scale: 1.12 }, { scale: 1, duration: d, ease: 'none', immediateRender: false }, t0);
    cue(t0 + 0.15, 'whoosh');
  }
  // respiração leve
  tl.fromTo(z, { scale: 1 }, { scale: 1.04, duration: d, ease: 'none', immediateRender: false }, t0);
};

CENA.chat = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  if (c.texto) { const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 260, 110); h.style.marginBottom = '34px'; entraPalavras(ws, t0 + 0.05, 0.07); }
  const ch = $('div', 'chat', z);
  const hd = $('div', 'hd', ch); $('div', 'av', hd); const nm = $('div', null, hd); $('div', 'nm', nm, c.nome || 'cliente.novo'); $('div', 'st', nm, 'Mensagem direta');
  const bd = $('div', 'bd', ch);
  const r = $('div', 'rot', z, 'Ilustração'); r.style.marginTop = '20px'; r.style.alignSelf = 'center';
  tl.fromTo(ch, { y: 300, opacity: 0, rotation: 3 }, { y: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, t0 + 0.1);
  cue(t0 + 0.1, 'whoosh');
  const gap = c.gap || 0.55;
  c.msgs.forEach(([q, txt], i) => {
    const b = $('div', 'bub' + (q === 'l' ? ' l' : ''), bd, txt);
    const t = t0 + 0.55 + i * gap;
    tl.fromTo(b, { scale: 0.4, opacity: 0, transformOrigin: q === 'l' ? '100% 100%' : '0% 100%' }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, t);
    cue(t, q === 'l' ? 'send' : 'bubble');
  });
  if (c.selo) {
    const s = $('div', 'selo', L, c.selo);
    const t = t0 + 0.55 + c.msgs.length * gap + 0.1;
    tl.fromTo(s, { xPercent: -50, yPercent: -50, scale: 2.4, opacity: 0, rotation: -14 }, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1, rotation: -8, duration: 0.28, ease: 'power4.in', immediateRender: false }, t);
    cue(t + 0.26, 'stamp');
  }
};

CENA.nota = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const p = $('div', 'postit', z, c.nota);
  fit(p, 820, c.texto ? 420 : 640, 104, 50);
  p.style.width = '820px';
  tl.fromTo(p, { scale: 1.6, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -3, duration: 0.3, ease: 'power3.in', immediateRender: false }, t0 + 0.08);
  cue(t0 + 0.36, 'slap');
  if (c.texto) {
    const h = $('h1', 'hk', z); h.style.marginTop = '70px';
    const ws = palavras(c.texto, h); fit(h, 960, 360, 130);
    entraPalavras(ws, t0 + (c.atraso || 0.9), 0.08);
  }
  const r = $('div', 'rot', z, 'Ilustração'); r.style.marginTop = '26px';
};

CENA.lista = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 260, 130);
  entraPalavras(ws, t0 + 0.05, 0.07);
  const ls = $('div', 'lst', z);
  const gap = c.gap || 0.42;
  c.itens.forEach((it, i) => {
    const [a, b] = Array.isArray(it) ? it : [it, null];
    const row = $('div', 'it', ls);
    const ic = $('div', 'ic ' + (c.icone || 'x'), row, (c.icone || 'x') === 'x' ? '✕' : '✓');
    const tx = $('div', 'tx', row); const s1 = $('span', null, tx, a);
    const t = t0 + 0.55 + i * gap;
    tl.fromTo(row, { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, immediateRender: false }, t);
    cue(t, 'pop');
    if (b) {   // vira solução
      const s2 = $('span', 'tx2', tx, b);
      const tv = t0 + 0.55 + c.itens.length * gap + 0.35 + i * 0.22;
      tl.to(s1, { opacity: 0, y: -16, duration: 0.18 }, tv);
      tl.fromTo(s2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2, immediateRender: false }, tv + 0.08);
      tl.to(ic, { rotationY: 90, duration: 0.1 }, tv);
      muda(ic, { cls: 'ic x', html: '✕' }, { cls: 'ic ok', html: '✓' }, tv + 0.1);
      tl.to(ic, { rotationY: 0, duration: 0.12 }, tv + 0.1);
      cue(tv + 0.08, 'success', { i });
    }
  });
};

CENA.numero = (c, t0, d, L) => {
  const z = $('div', 'zona', L); z.style.alignItems = 'center'; z.style.textAlign = 'center';
  if (c.antes) { const a = $('div', 'sub', z, c.antes); a.style.textAlign = 'center'; a.style.marginTop = '0'; a.style.marginBottom = '20px'; tl.fromTo(a, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 0.05); }
  const b = $('div', 'big', z);
  const fmt = (v) => (c.prefixo || '') + v.toLocaleString('pt-BR', { minimumFractionDigits: c.casas || 0, maximumFractionDigits: c.casas || 0 }) + (c.sufixo || '');
  b.textContent = fmt(c.para);
  fit(b, 960, 420, c.max || 400, 80);
  if (c.de != null) {
    const o = { v: c.de };
    tl.fromTo(o, { v: c.de }, { v: c.para, duration: c.conta || 1.0, ease: 'power2.inOut', immediateRender: false, onUpdate: () => { b.textContent = fmt(o.v); } }, t0 + 0.3);
    cue(t0 + 0.3, 'count'); cue(t0 + 0.3 + (c.conta || 1.0), 'impact');
    tl.fromTo(b, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, t0 + 0.3 + (c.conta || 1.0));
  } else {
    tl.fromTo(b, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power4.in', immediateRender: false }, t0 + 0.1);
    cue(t0 + 0.38, 'impact');
  }
  const r = $('h1', 'hk', z); r.style.textAlign = 'center'; r.style.marginTop = '20px';
  const ws = palavras(c.texto, r); fit(r, 960, 380, 120);
  entraPalavras(ws, t0 + (c.de != null ? 0.5 + (c.conta || 1.0) : 0.6), 0.07);
};

CENA.relogio = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const dia = $('div', 'dia', z, c.dia || 'SEXTA-FEIRA');
  const ck = $('div', 'clock', z);
  const [h1, m1] = (c.de || '20:59').split(':'), [h2, m2] = (c.para || '21:00').split(':');
  const H1 = $('div', 'dg', ck, h1); $('div', 'sep', ck, ':'); const M1 = $('div', 'dg', ck, m1);
  tl.fromTo(ck, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.6)', immediateRender: false }, t0 + 0.05);
  tl.fromTo(dia, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 0.1);
  const tf = t0 + 0.8;
  tl.to([H1, M1], { rotationX: 90, duration: 0.12, ease: 'power2.in' }, tf);
  muda(H1, { txt: h1 }, { txt: h2 }, tf + 0.12); muda(M1, { txt: m1 }, { txt: m2 }, tf + 0.12);
  tl.to([H1, M1], { rotationX: 0, duration: 0.14, ease: 'power2.out' }, tf + 0.12);
  cue(tf, 'flip');
  if (c.texto) { const h = $('h1', 'hk', z); h.style.marginTop = '60px'; h.style.textAlign = 'center'; const ws = palavras(c.texto, h); fit(h, 960, 420, 140); entraPalavras(ws, tf + 0.3, 0.08); }
};

CENA.split = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 200, 120);
  entraPalavras(ws, t0 + 0.05, 0.06, null);
  const sp = $('div', 'sp', z);
  const a = $('div', 'col a', sp, `<h3>${c.rotulos?.[0] || 'Antes'}</h3>`), b = $('div', 'col d', sp, `<h3>${c.rotulos?.[1] || 'Depois'}</h3>`);
  tl.fromTo([a, b], { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, immediateRender: false }, t0 + 0.25);
  cue(t0 + 0.25, 'whoosh');
  c.antes.forEach((txt, i) => {
    const p = $('p', null, a, txt); const rk = $('i', 'risco', p);
    const t = t0 + 0.6 + i * 0.3;
    tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, t);
    tl.fromTo(rk, { width: '0%' }, { width: '100%', duration: 0.25, immediateRender: false }, t + 0.25 + c.antes.length * 0.05);
    cue(t + 0.25, 'scribble');
  });
  const td = t0 + 0.7 + c.antes.length * 0.3;
  c.depois.forEach((txt, i) => {
    const p = $('p', null, b, txt);
    tl.fromTo(p, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.25, immediateRender: false }, td + i * 0.28);
    cue(td + i * 0.28, 'pop');
  });
  const r = $('div', 'rot', z, 'Ilustração'); r.style.marginTop = '22px';
};

CENA.preco = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  if (c.texto) { const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 240, 120); h.style.marginBottom = '40px'; entraPalavras(ws, t0 + 0.05, 0.07); }
  const p = $('div', 'pcard', z);
  $('div', 'pn', p, c.plano);
  const pv = $('div', 'pv', p, `<small>R$</small><b>0,00</b><small>/mês</small>`);
  const b = pv.querySelector('b');
  for (const it of c.itens) $('div', 'ck', p, it);
  if (c.nota) $('div', 'nt', p, c.nota);
  tl.fromTo(p, { y: 260, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.3)', immediateRender: false }, t0 + 0.25);
  cue(t0 + 0.25, 'whoosh');
  const alvo = parseFloat(c.valor.replace(',', '.'));
  const o = { v: 0 };
  tl.fromTo(o, { v: 0 }, { v: alvo, duration: 0.9, ease: 'power2.out', immediateRender: false, onUpdate: () => { b.textContent = o.v.toFixed(2).replace('.', ','); } }, t0 + 0.55);
  cue(t0 + 0.55, 'count'); cue(t0 + 1.45, 'cash');
  [...p.querySelectorAll('.ck')].forEach((e, i) => { tl.fromTo(e, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.25, immediateRender: false }, t0 + 1.4 + i * 0.22); cue(t0 + 1.4 + i * 0.22, 'tick'); });
  const nt = p.querySelector('.nt'); if (nt) tl.fromTo(nt, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 1.5 + c.itens.length * 0.22);
};

CENA.planos = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 220, 120);
  entraPalavras(ws, t0 + 0.05, 0.07);
  const P = [['Cardápio digital', '199,90', 'Cardápio com fotos, pedidos no painel, link e QR Code', false],
    ['Sistema + cardápio em site', '299,90', '+ balcão, caixa, cozinha, estoque, financeiro e relatórios', true],
    ['Sistema + cardápio em app', '599,90', '+ app com o ícone da sua loja no celular do cliente', false]];
  P.forEach(([n, v, dsc, top], i) => {
    const row = $('div', 'plan' + (top ? ' top' : ''), z, `${top ? '<em class="sel">Mais escolhido</em>' : ''}<div><div class="n">${n}</div><div class="d">${dsc}</div></div><div class="v"><small>R$ </small>${v}<small>/mês</small></div>`);
    const t = t0 + 0.6 + i * 0.4;
    tl.fromTo(row, { x: 200, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', immediateRender: false }, t);
    cue(t, 'pop');
  });
  const nt = $('div', 'sub', z, 'Sem comissão por pedido. A gente monta o seu cardápio.'); nt.style.fontSize = '32px';
  tl.fromTo(nt, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 1.9);
};

CENA.pergunta = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  const s = $('div', 'stk', z, `<div class="h">Pergunta rápida</div><div class="q">${c.pergunta}</div><div class="a"><span class="tx"></span><span class="cur"></span></div>`);
  const tx = s.querySelector('.tx'), cur = s.querySelector('.cur');
  tl.fromTo(s, { scale: 0.5, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: -2, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, t0 + 0.05);
  cue(t0 + 0.05, 'pop');
  const resp = c.resposta || '';
  const ti = t0 + 0.6, dur = Math.min(1.4, resp.length * 0.055);
  const o = { n: 0 };
  tl.fromTo(o, { n: 0 }, { n: resp.length, duration: dur, ease: 'none', immediateRender: false, onUpdate: () => { tx.textContent = resp.slice(0, Math.round(o.n)); } }, ti);
  for (let k = 0; k < dur; k += 0.11) cue(ti + k, 'type');
  tl.to(cur, { opacity: 0, duration: 0.01, repeat: Math.floor(d / 0.5), yoyo: true, repeatDelay: 0.25 }, t0);
  if (c.texto) { const h = $('h1', 'hk', z); h.style.marginTop = '60px'; const ws = palavras(c.texto, h); fit(h, 960, 360, 130); entraPalavras(ws, ti + dur + 0.25, 0.08); }
};

CENA.perfil = (c, t0, d, L) => {
  const z = $('div', 'zona', L);
  if (c.texto) { const h = $('h1', 'hk', z); const ws = palavras(c.texto, h); fit(h, 960, 300, 120); h.style.marginBottom = '40px'; entraPalavras(ws, t0 + 0.05, 0.07); }
  const ig = $('div', 'ig', z, `<div class="top"><div class="av" style="background-image:url(/lojas/sua-hamburgueria/public/img/icon-512.png)"></div><div class="nums"><div><b>312</b><span>posts</span></div><div><b>8.420</b><span>seguidores</span></div><div><b>156</b><span>seguindo</span></div></div></div>
    <div class="nm">sua.hamburgueria</div><div class="bio">Smash e artesanal · Delivery e retirada<br>Ter a dom, das 18h às 23h</div><div class="lk">cardapio.sualoja.com.br</div>`);
  const r = $('div', 'rot', z, 'Ilustração'); r.style.marginTop = '22px';
  tl.fromTo(ig, { y: 260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.3)', immediateRender: false }, t0 + 0.2);
  const lk = ig.querySelector('.lk');
  const dd = $('div', 'dedo', L);
  tl.set(dd, { opacity: 0 }, 0);
  const tt = t0 + d - 0.8;
  tl.call(() => { const a = lk.getBoundingClientRect(); dd.style.left = (a.left + a.width / 2) + 'px'; dd.style.top = (a.top + a.height / 2) + 'px'; }, null, tt - 0.01);
  tl.fromTo(dd, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.25, immediateRender: false }, tt);
  tl.to(dd, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, tt + 0.3);
  tl.to(lk, { backgroundColor: '#ffd84d', duration: 0.1 }, tt + 0.3);
  cue(tt + 0.3, 'tap');
};

CENA.cta = (c, t0, d, L) => {
  const z = $('div', 'zona cta', L);
  const tg = $('div', 'tag', z, 'Para hamburguerias'); tg.style.alignSelf = 'center';
  const h = $('div', 'lg1', z); const ws = palavras(c.texto || 'Cardápio digital *+ sistema* de gestão', h); fit(h, 960, 360, 130);
  const s2 = $('div', 'lg2', z, c.sub || 'Sem comissão por pedido. A gente monta o seu cardápio.');
  const bt = $('div', 'btn', z, `<svg viewBox="0 0 32 32"><path d="M16 3C8.8 3 3 8.6 3 15.5c0 2.6.8 5 2.2 7L4 29l6.8-1.9c1.6.8 3.4 1.2 5.2 1.2 7.2 0 13-5.6 13-12.5S23.2 3 16 3z" fill="currentColor"/><path d="M11.6 10.4c.4 0 .7 0 .9.6l1.1 2.6c.1.3.1.6-.1.8l-.8 1c-.2.2-.2.5 0 .8.8 1.3 1.9 2.4 3.3 3.2.3.2.6.1.8-.1l.9-1.1c.2-.3.5-.3.8-.2l2.5 1.2c.3.1.5.4.4.8-.2 1.4-1.5 2.4-2.9 2.3-4.3-.4-8.4-4.4-8.8-8.6-.1-1.6.8-3.2 1.9-3.3z" fill="var(--ac)"/></svg><span>Chame no WhatsApp</span>`);
  let pr;
  if (c.preco) pr = $('div', 'preco', z, `A partir de <b>R$ ${c.preco}</b>/mês`);
  const s3 = $('div', 'lg3', z, c.rodape || 'Peça uma demonstração com o seu cardápio');
  tl.fromTo(tg, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, immediateRender: false }, t0 + 0.05);
  entraPalavras(ws, t0 + 0.1, 0.07, null);
  cue(t0 + 0.05, 'whoosh');
  tl.fromTo(s2, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, immediateRender: false }, t0 + 0.5);
  tl.fromTo(bt, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)', immediateRender: false }, t0 + 0.75);
  cue(t0 + 0.75, 'pop');
  if (pr) tl.fromTo(pr, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 1.0);
  tl.fromTo(s3, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 1.1);
  for (let t = t0 + 1.4; t < t0 + d - 0.3; t += 0.9) tl.to(bt, { scale: 1.07, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
  const dd = $('div', 'dedo', L);
  tl.set(dd, { opacity: 0 }, 0);
  const tt = t0 + Math.min(d - 0.7, 1.8);
  tl.call(() => { const a = bt.getBoundingClientRect(); dd.style.left = (a.left + a.width * 0.72) + 'px'; dd.style.top = (a.top + a.height * 0.62) + 'px'; }, null, tt - 0.01);
  tl.fromTo(dd, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.25, immediateRender: false }, tt);
  tl.to(dd, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, tt + 0.28);
  cue(tt + 0.28, 'tap');
  tl.to(dd, { opacity: 0, duration: 0.2 }, tt + 0.7);
};

// ---------------------------------------------------------------- cenas 3D
// celular: telas reais, rolagem, toques e zoom
async function celular(c, t0, L) {
  const telas = c.telas;
  for (const s of telas) await tex(s.img);
  const g = new THREE.Group(); const raiz = new THREE.Group(); raiz.add(g);
  luzes(raiz);
  const SW = 1.86, IMG_H = SW * 1688 / 780, ST = 0.15;   // largura da tela, altura da imagem, barra de status
  const SH = IMG_H + ST, BW = SW + 0.14, BH = SH + 0.16;
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.2, 8, 0.24), new THREE.MeshPhysicalMaterial({ color: 0x15151a, metalness: 0.7, roughness: 0.28, clearcoat: 1, envMap: ENV, envMapIntensity: 1.2 }));
  g.add(corpo);
  const vidro = new THREE.Mesh(retArredondado(SW + 0.02, SH + 0.02, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  vidro.position.z = 0.1005; g.add(vidro);
  const T = telaDupla(SW, IMG_H); T.a.position.set(0, -ST / 2, 0.101); T.b.position.set(0, -ST / 2, 0.1025); g.add(T.a, T.b);
  const sb = new THREE.Mesh(new THREE.PlaneGeometry(SW - 0.12, ST), new THREE.MeshBasicMaterial({ toneMapped: false }));
  sb.position.set(0, SH / 2 - ST / 2, 0.101); g.add(sb);
  const ilha = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.13, 0.01, 4, 0.06), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  ilha.position.set(0, SH / 2 - 0.09, 0.106); g.add(ilha);
  const toque = anel(); toque.position.z = 0.11; g.add(toque);
  const sbTex = {};
  for (const s of telas) { const i = INFO[s.img]; sbTex[s.img] = barraStatus(i.topo, i.claro); }
  // linha do tempo
  const ENT = 0.6;
  let t = t0 + ENT;
  const seq = telas.map((s) => { const a = t; t += s.dur; return { ...s, a, b: t }; });
  const t1 = t + 0.35;
  const baseY = pxY(c.centroY || 1165);
  const escala = c.escala || 1.02;
  const lg = seq.filter((s) => s.legenda).map((s, i, arr) => ({ t: s.a - (i === 0 ? ENT - 0.05 : 0.05), ate: (arr[i + 1]?.a ?? t1) - 0.05, texto: s.legenda, rot: i === 0 ? RT : null }));
  if (c.legenda) lg.unshift({ t: t0 + 0.05, ate: (lg[0]?.t ?? t1) - 0.02, texto: c.legenda, rot: RT });
  if (!lg.some((x) => x.rot) && lg.length) lg[0].rot = RT;
  legendas(L, lg, c.alturaLegenda || 260);
  for (const s of seq) {
    if (s.toque) { const tq = s.b - 0.5; cue(tq + 0.13, 'tap'); }
    if (s.rolar) cue(s.a + 0.1, 'swipe');
    if (s.zoom) cue(s.a + 0.05, 'zoom');
  }
  cue(t0 + 0.05, 'whoosh');
  const lado = c.lado || 1;
  const update = (tt) => {
    const lt = tt - t0;
    const ent = E.out(prog(lt, 0, 0.75)), sai = E.inOut(prog(tt, t1 - 0.35, 0.35));
    raiz.position.set(0, baseY + lerp(-7, 0, ent) + sai * 9, 0);
    raiz.scale.setScalar(escala);
    // tela atual
    let k = seq.findIndex((s) => tt < s.b); if (k < 0) k = seq.length - 1;
    const cur = seq[k], prev = seq[k - 1];
    const fade = prev ? clamp((tt - cur.a) / 0.14) : 1;
    const rol = (s, x) => (s.rolar ? lerp(s.rolar[0], s.rolar[1], E.inOut(prog(x, s.a + 0.15, Math.max(0.3, s.b - s.a - 0.5)))) : 0);
    if (prev && fade < 1) { aplicaTela(T.a, prev.img, rol(prev, tt), IMG_H / SW); T.a.material.opacity = 1; T.b.visible = true; aplicaTela(T.b, cur.img, rol(cur, tt), IMG_H / SW); T.b.material.opacity = fade; }
    else { aplicaTela(T.a, cur.img, rol(cur, tt), IMG_H / SW); T.a.material.opacity = 1; T.b.visible = false; }
    sb.material.map = sbTex[fade < 0.5 && prev ? prev.img : cur.img]; sb.material.needsUpdate = true;
    // toque no fim da tela
    toque.visible = false;
    for (const s of seq) if (s.toque) {
      const kk = (tt - (s.b - 0.5)) / 0.6;
      if (kk > 0 && kk < 1) { toque.position.x = (s.toque.x - 0.5) * SW; toque.position.y = -ST / 2 + (0.5 - s.toque.y) * IMG_H; animaAnel(toque, kk); }
    }
    // zoom (aproxima a câmera de um ponto da tela)
    let zk = 0, zp = null;
    for (const s of seq) if (s.zoom) {
      const zi = E.inOut(prog(tt, s.a + 0.05, 0.55)) * (1 - E.inOut(prog(tt, s.b - 0.45, 0.4)));
      if (zi > zk) { zk = zi; zp = s.zoom; }
    }
    const sway = (1 - zk) * (1 - sai);
    g.rotation.set(-0.06 * sway + lerp(0.5, 0, ent) * 0.3, lado * (0.22 * Math.sin(lt * 0.9) * 0.6 + 0.12) * sway + lerp(1.3 * lado, 0, ent), 0);
    const cam = { x: 0, y: 0, z: DIST };
    if (zp) {
      const p = new THREE.Vector3((zp.x - 0.5) * SW, -ST / 2 + (0.5 - zp.y) * IMG_H, 0.1); g.localToWorld(p);
      const dz = DIST / (zp.s || 2.2);
      cam.x = lerp(0, p.x, zk);
      cam.y = lerp(0, p.y - pxY(zp.py || 1150) * (dz / DIST), zk);
      cam.z = lerp(DIST, dz + p.z, zk);
    }
    poeCamera(cam);
  };
  ESC3D.push({ t0, t1, raiz, update });
  return t1 - t0;
}

// painel no computador: tela real flutuando, com foco e destaque
async function painel(c, t0, L) {
  const telas = c.telas;
  for (const s of telas) await tex(s.img);
  const raiz = new THREE.Group(); const g = new THREE.Group(); raiz.add(g); luzes(raiz);
  const SW = 3.1, SH = SW * 1800 / 2880;
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(SW + 0.12, SH + 0.12, 0.08, 6, 0.06), new THREE.MeshPhysicalMaterial({ color: 0x1b1b20, metalness: 0.6, roughness: 0.3, envMap: ENV, clearcoat: 0.8 }));
  g.add(corpo);
  const T = telaDupla(SW, SH); T.a.position.z = 0.041; T.b.position.z = 0.0425; g.add(T.a, T.b);
  T.a.geometry = T.b.geometry = retArredondado(SW, SH, 0.03);
  const toque = anel(); toque.scale.setScalar(0.6); toque.position.z = 0.05; g.add(toque);
  // destaque: moldura com 4 barras na cor de destaque
  const corAc = new THREE.Color(getComputedStyle(document.body).getPropertyValue('--ac').trim() || '#ff6a1f');
  const hlMat = new THREE.MeshBasicMaterial({ color: corAc, transparent: true, toneMapped: false });
  const hl = new THREE.Group(); hl.position.z = 0.046; g.add(hl);
  const barras = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hlMat); hl.add(m); return m; });
  const veu = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, toneMapped: false }));
  veu.position.z = 0.044; g.add(veu);
  const moldura = (w, h, e) => {
    const [t, b, l, r] = barras;
    t.scale.set(w + e, e, 1); t.position.set(0, h / 2, 0); b.scale.set(w + e, e, 1); b.position.set(0, -h / 2, 0);
    l.scale.set(e, h + e, 1); l.position.set(-w / 2, 0, 0); r.scale.set(e, h + e, 1); r.position.set(w / 2, 0, 0);
  };
  const pill = $('div', 'pill3d', L); pill.style.opacity = 0;
  const ENT = 0.6;
  let t = t0 + ENT;
  const seq = telas.map((s) => { const a = t; t += s.dur; return { ...s, a, b: t }; });
  const t1 = t + 0.35;
  const baseY = pxY(c.centroY || 1150);
  const lg = seq.filter((s) => s.legenda).map((s, i, arr) => ({ t: s.a - (i === 0 ? ENT - 0.05 : 0.05), ate: (arr[i + 1]?.a ?? t1) - 0.05, texto: s.legenda, rot: i === 0 ? RT : null }));
  legendas(L, lg, c.alturaLegenda || 280);
  for (const s of seq) {
    if (s.destaque) cue(s.a + 0.75, 'ding');
    if (s.toque) cue(s.b - 0.5 + 0.13, 'tap');
    if (s.som) cue(s.a + (s.somT || 0.1), s.som);
  }
  cue(t0 + 0.05, 'whoosh');
  const update = (tt) => {
    const lt = tt - t0;
    const ent = E.out(prog(lt, 0, 0.75)), sai = E.inOut(prog(tt, t1 - 0.35, 0.35));
    raiz.position.set(0, baseY + lerp(-6, 0, ent) + sai * 8, 0);
    let k = seq.findIndex((s) => tt < s.b); if (k < 0) k = seq.length - 1;
    const cur = seq[k], prev = seq[k - 1];
    const fade = prev && prev.img !== cur.img ? clamp((tt - cur.a) / (cur.troca || 0.2)) : 1;
    const rol = (s, x) => (s.rolar ? lerp(s.rolar[0], s.rolar[1], E.inOut(prog(x, s.a + 0.2, Math.max(0.3, s.b - s.a - 0.5)))) : 0);
    if (prev && fade < 1) { aplicaTela(T.a, prev.img, rol(prev, tt), SH / SW); T.b.visible = true; aplicaTela(T.b, cur.img, rol(cur, tt), SH / SW); T.b.material.opacity = fade; }
    else { aplicaTela(T.a, cur.img, rol(cur, tt), SH / SW); T.b.visible = false; }
    // foco: interpola entre focos das telas (x,y,w normalizados)
    const foco = (s) => s?.foco || [0, 0, 1, 1];
    const fprev = prev ? foco(prev) : [0, 0, 1, 1], fcur = foco(cur);
    const fk = E.inOut(prog(tt, cur.a + (cur.focoAtraso || 0), 0.6));
    const f = fprev.map((v, i) => lerp(v, fcur[i], fk));
    const zoomed = (1 - f[2]);
    g.rotation.set(-0.05 * (1 - zoomed) + lerp(0.6, 0, ent) * 0.4, (0.16 * Math.sin(lt * 0.7) - 0.12) * (1 - Math.min(1, zoomed * 1.6)) + lerp(-1.1, 0, ent), 0);
    // câmera: centra o foco e aproxima para ele caber em ~92% da largura
    const cxw = (f[0] + f[2] / 2 - 0.5) * SW, cyw = (0.5 - (f[1] + f[3] / 2)) * SH;
    const p = new THREE.Vector3(cxw, cyw + baseY, 0.05);   // posição de repouso (a câmera não segue a entrada)
    const vwAt = (d) => 2 * d * Math.tan(THREE.MathUtils.degToRad(15)) * (W / H);
    const vhAt = (d) => 2 * d * Math.tan(THREE.MathUtils.degToRad(15));
    const wantW = (f[2] * SW) / 0.94, wantH = (f[3] * SH) / (c.alturaFoco || 0.44);
    let dz = Math.max(wantW / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * (W / H)), wantH / (2 * Math.tan(THREE.MathUtils.degToRad(15))));
    dz = Math.min(dz, DIST);
    const off = (pxY(c.centroY || 1150)) * (dz / DIST);   // mantém o objeto na mesma altura da tela
    poeCamera({ x: p.x, y: p.y - off, z: p.z + dz, lx: p.x, ly: p.y - off });
    void vwAt; void vhAt;
    // destaque
    hl.visible = false; pill.style.opacity = 0; veu.material.opacity = 0;
    if (cur.destaque) {
      const [bx, by, bw, bh] = cur.destaque.caixa;
      const k2 = E.back(clamp((tt - cur.a - 0.6) / 0.35));
      if (tt > cur.a + 0.6) {
        hl.visible = true;
        const sc = 1.25 - 0.25 * k2;
        moldura(bw * SW * sc, bh * SH * sc, Math.max(0.012, f[2] * 0.03));
        hl.position.x = (bx + bw / 2 - 0.5) * SW; hl.position.y = (0.5 - (by + bh / 2)) * SH;
        hlMat.opacity = clamp(k2 * 1.4) * (1 - prog(tt, cur.b - 0.2, 0.2));
        if (cur.destaque.rotulo) {
          pill.textContent = cur.destaque.rotulo;
          const topo = projeta(g, new THREE.Vector3(hl.position.x, hl.position.y + (bh * SH) / 2, 0.05));
          const baixo = projeta(g, new THREE.Vector3(hl.position.x, hl.position.y - (bh * SH) / 2, 0.05));
          const emBaixo = cur.destaque.embaixo || topo.y < 640;
          const px = Math.max(220, Math.min(860, topo.x));
          pill.style.left = px + 'px'; pill.style.top = (emBaixo ? baixo.y + 90 : topo.y - 18) + 'px';
          pill.style.opacity = hlMat.opacity;
        }
      }
    }
    toque.visible = false;
    if (cur.toque) {
      const kk = (tt - (cur.b - 0.5)) / 0.6;
      if (kk > 0 && kk < 1) { toque.position.x = (cur.toque.x - 0.5) * SW; toque.position.y = (0.5 - cur.toque.y) * SH; animaAnel(toque, kk); }
    }
  };
  ESC3D.push({ t0, t1, raiz, update });
  return t1 - t0;
}

// carrossel (coverflow): a tela da vez de frente, as vizinhas inclinadas ao lado
async function carrossel(c, t0, L) {
  for (const s of c.telas) await tex(s.img);
  const raiz = new THREE.Group(); luzes(raiz);
  const n = c.telas.length;
  const cartas = c.telas.map((s) => {
    const i_ = INFO[s.img]; const ar = i_.w / i_.h;
    const h = ar < 1 ? 3.1 : 1.95, w = h * ar;
    const m = new THREE.Mesh(retArredondado(w, h, ar < 1 ? 0.14 : 0.05), new THREE.MeshBasicMaterial({ map: TEX[s.img], toneMapped: false, transparent: true }));
    const borda = new THREE.Mesh(new RoundedBoxGeometry(w + 0.08, h + 0.08, 0.05, 4, ar < 1 ? 0.16 : 0.06), new THREE.MeshPhysicalMaterial({ color: 0x15151a, metalness: 0.6, roughness: 0.3, envMap: ENV, clearcoat: 1 }));
    borda.position.z = -0.03;
    const gr = new THREE.Group(); gr.add(borda, m); m.position.z = 0.001;
    raiz.add(gr);
    return gr;
  });
  const passo = c.passo || 1.1;
  const t1 = t0 + 0.5 + n * passo + 0.3;
  const lg = c.telas.map((s, i) => ({ t: t0 + 0.4 + i * passo, ate: t0 + 0.4 + (i + 1) * passo, texto: s.legenda, rot: i === 0 ? RT : null }));
  legendas(L, lg, 220);
  c.telas.forEach((s, i) => { if (i) cue(t0 + 0.4 + i * passo - 0.25, 'whoosh'); });
  cue(t0 + 0.05, 'whoosh');
  const baseY = pxY(1170);
  const update = (tt) => {
    const lt = tt - t0;
    const ent = E.out(prog(lt, 0, 0.6)), sai = E.inOut(prog(tt, t1 - 0.3, 0.3));
    raiz.position.set(0, baseY + sai * 8 + lerp(-5, 0, ent), 0);
    // posição atual (float): segura cada tela e anda rápido para a próxima
    const q = clamp((lt - 0.4) / passo, 0, n - 1);
    const i0 = Math.floor(q), fr = q - i0;
    const p = i0 + E.inOut(clamp((fr - 0.72) / 0.28));
    cartas.forEach((cg, i) => {
      const d = i - p, ad = Math.abs(d);
      cg.position.set(Math.sign(d) * Math.min(ad, 1.6) * 2.6, 0, -Math.min(ad, 2) * 2.1);
      cg.rotation.set(0, -Math.sign(d) * Math.min(ad, 1) * 0.75 + 0.05 * Math.sin(lt * 0.8), 0);
      cg.visible = ad < 2.2;
    });
    poeCamera({ x: 0, y: 0, z: DIST - 2.5 });
  };
  ESC3D.push({ t0, t1, raiz, update });
  return t1 - t0;
}

// hambúrguer 3D (ilustração): gira e "desmonta" mostrando o custo de cada camada
function hamburguer() {
  const g = new THREE.Group();
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const mat = (cor, r = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: r, envMap: ENV, envMapIntensity: 0.5, ...extra });
  const lathe = (pts, m) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64), m);
  const camadas = [];
  const add = (obj, nome, h) => { camadas.push({ obj, nome, h }); g.add(obj); };
  // pão de baixo
  const pb = lathe([[0, 0], [1.25, 0.0], [1.42, 0.08], [1.46, 0.22], [1.4, 0.34], [0, 0.34]], mat(0xd98a3a, 0.55));
  add(pb, 'pao_baixo', 0.34);
  // carne (com relevo)
  const carneG = new THREE.CylinderGeometry(1.5, 1.52, 0.42, 72, 6);
  const pos = carneG.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i); const n = 1 + (rnd() - 0.5) * 0.035; pos.setXYZ(i, x * n, y + (Math.abs(y) > 0.2 ? (rnd() - 0.5) * 0.03 : 0), z * n); }
  carneG.computeVertexNormals();
  const carne = new THREE.Mesh(carneG, mat(0x4a2414, 0.92)); add(carne, 'carne', 0.42);
  // queijo (2 fatias) que escorre
  const queijo = (rot) => {
    const q = new THREE.PlaneGeometry(2.9, 2.9, 40, 40); q.rotateX(-Math.PI / 2);
    const p = q.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const r = Math.hypot(x, z), a = Math.atan2(z, x);
      if (r > 1.35) { const caida = (r - 1.35); p.setY(i, -caida * (0.55 + 0.35 * Math.max(0, Math.sin(a * 3 + 0.7)))); const enc = 1 - Math.min(0.35, caida * 0.25); p.setX(i, x * enc); p.setZ(i, z * enc); } }
    q.computeVertexNormals();
    const m = new THREE.Mesh(q, mat(0xf5a623, 0.4, { side: THREE.DoubleSide, emissive: 0x3a1a00, emissiveIntensity: 0.25 })); m.rotation.y = rot; return m;
  };
  const qj = new THREE.Group(); qj.add(queijo(0.3), queijo(0.95)); qj.children[1].position.y = 0.03; add(qj, 'queijo', 0.1);
  // bacon (tiras onduladas)
  const bacon = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const pts = []; for (let i = 0; i <= 20; i++) { const x = -1.5 + i * 0.15; pts.push(new THREE.Vector3(x, Math.sin(i * 0.9 + k) * 0.06, 0)); }
    const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.07, 8), mat(0x8e2a1c, 0.5));
    tb.scale.set(1, 1, 2.6); tb.position.z = (k - 1) * 0.55; tb.rotation.y = k * 0.25; bacon.add(tb);
  }
  add(bacon, 'bacon', 0.16);
  // maionese
  const mz = lathe([[0, 0], [1.25, 0], [1.3, 0.04], [1.2, 0.07], [0, 0.07]], mat(0xf7ecc8, 0.3)); add(mz, 'molho', 0.07);
  // pão de cima com gergelim
  const pc = lathe([[0, 0], [1.4, 0], [1.52, 0.1], ...Array.from({ length: 20 }, (_, i) => { const a = ((i + 1) / 21) * Math.PI / 2; return [Math.cos(a) * 1.52, 0.1 + Math.sin(a) * 1.0]; }), [0, 1.1]], mat(0xd9822c, 0.5));
  const gerg = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), mat(0xfff4d6, 0.6), 60);
  const mm = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 1.25; const y = 0.1 + Math.sqrt(Math.max(0, 1 - (r / 1.52) ** 2)) * 1.0; mm.compose(new THREE.Vector3(Math.cos(a) * r, y + 0.01, Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())), new THREE.Vector3(1, 0.55, 0.7)); gerg.setMatrixAt(i, mm); }
  const pcG = new THREE.Group(); pcG.add(pc, gerg); add(pcG, 'pao_cima', 1.1);
  return { g, camadas };
}
async function burger(c, t0, L) {
  const raiz = new THREE.Group(); luzes(raiz);
  const { g, camadas } = hamburguer(); raiz.add(g);
  const d = c.dur || 5;
  const t1 = t0 + d;
  const baseY = pxY(c.centroY || 1230);
  const labels = (c.camadas || []).map((cm) => { const e = $('div', 'camada', L, `<i></i><div><b>${cm.nome}</b><br><span>${cm.valor}</span></div>`); e.style.opacity = 0; return { e, ...cm }; });
  const tot = c.total ? $('div', 'pill3d', L, c.total) : null; if (tot) { tot.style.opacity = 0; tot.style.left = '540px'; tot.style.top = '1660px'; }
  if (c.texto) legendas(L, [{ t: t0 + 0.1, ate: t1, texto: c.texto, rot: c.rotulo || 'Ilustração 3D' + (c.camadas ? ' · custos da ficha técnica de demonstração' : '') }], c.alturaLegenda || 300);
  const te = t0 + (c.explode ?? 1.2);
  if (c.camadas) { cue(te, 'riser'); labels.forEach((l, i) => cue(te + 0.5 + i * 0.22, 'pop')); if (tot) cue(te + 0.6 + labels.length * 0.22, 'cash'); }
  cue(t0 + 0.1, 'whoosh');
  const update = (tt) => {
    const lt = tt - t0;
    const ent = E.back(prog(lt, 0, 0.7)), sai = E.inOut(prog(tt, t1 - 0.35, 0.35));
    raiz.position.set(0, baseY + sai * 9, 0);
    raiz.scale.setScalar(Math.max(0.001, ent) * (c.escala || 0.62));
    const ex = c.camadas ? E.inOut(prog(tt, te, 0.8)) : 0;
    let y = 0;
    camadas.forEach((cm, i) => { cm.obj.position.y = y + ex * i * 0.42 - (camadas.length - 1) * 0.21 * ex; y += cm.h * (cm.nome === 'pao_baixo' ? 1 : 0.92); });
    g.position.y = -1.1;
    g.rotation.set(0.42 - ex * 0.12, lt * (c.giro ?? 0.7) * (1 - ex * 0.85) + 0.4, 0);
    poeCamera({ x: c.camadas ? (c.desloca ?? 0.75) * ex : 0, y: 0, z: DIST - 3.5 + ex * 1.6 });
    labels.forEach((l, i) => {
      const cm = camadas.find((x) => x.nome === l.camada); if (!cm) return;
      const p = projeta(cm.obj, new THREE.Vector3(0, cm.h / 2, 0));
      const k = E.out(prog(tt, te + 0.5 + i * 0.22, 0.3)) * (1 - prog(tt, t1 - 0.3, 0.3));
      l.e.style.left = Math.min(p.x + (c.distRotulo || 230), 620) + 'px'; l.e.style.top = p.y + 'px'; l.e.style.opacity = k; l.e.style.transform = `translate(${(1 - k) * 40}px, -50%)`;
    });
    if (tot) { const k = E.back(prog(tt, te + 0.6 + labels.length * 0.22, 0.35)) * (1 - prog(tt, t1 - 0.3, 0.3)); tot.style.opacity = clamp(k); tot.style.transform = `translate(-50%, -100%) scale(${0.6 + 0.4 * k})`; }
  };
  ESC3D.push({ t0, t1, raiz, update });
  return d;
}

// ícone do app na tela inicial do celular (ilustração) -> abre o cardápio
async function appicone(c, t0, L) {
  await tex('p01_menu');
  const logo = await loader.loadAsync('/lojas/sua-hamburgueria/public/img/icon-512.png');
  const home = canvasTex(780, 1688, (cx, w, h) => {
    const gr = cx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ffb37a'); gr.addColorStop(0.45, '#ff6f61'); gr.addColorStop(1, '#7b5cff');
    cx.fillStyle = gr; cx.fillRect(0, 0, w, h);
    cx.fillStyle = '#fff'; cx.font = '600 150px Poppins'; cx.textAlign = 'center'; cx.fillText('20:47', w / 2, 330);
    cx.font = '500 36px Poppins'; cx.fillText('quarta-feira, 25 de novembro', w / 2, 400);
    const cores = ['#7aa7ff', '#ffb36b', '#7be0b0', '#c69cff', '#ff8f8f', '#6fd3e6', '#ffd56b', '#9bb0c9', '#b5e37a', '#f7a8d0', '#8fd0ff'];
    let k = 0;
    for (let r = 0; r < 3; r++) for (let col = 0; col < 4; col++) {
      const x = 80 + col * 170, y = 560 + r * 220;
      if (r === 1 && col === 2) { cx.save(); cx.beginPath(); cx.roundRect(x, y, 130, 130, 32); cx.clip(); cx.drawImage(logo.image, x, y, 130, 130); cx.restore(); cx.fillStyle = '#fff'; cx.font = '600 26px Poppins'; cx.fillText('Sua loja', x + 65, y + 170); continue; }
      cx.fillStyle = cores[k++ % cores.length]; cx.beginPath(); cx.roundRect(x, y, 130, 130, 32); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.7)'; cx.fillRect(x + 25, y + 158, 80, 12);
    }
  });
  TEX.__home = home; INFO.__home = { w: 780, h: 1688, topo: 'rgb(255,179,122)', claro: true };
  const sc = { ...c, telas: [{ img: '__home', dur: c.durHome || 1.6, toque: { x: (80 + 2 * 170 + 65) / 780, y: (560 + 220 + 65) / 1688 }, legenda: c.legenda1 }, { img: 'p01_menu', dur: c.durMenu || 1.8, legenda: c.legenda2 }] };
  return celular(sc, t0, L);
}

const CENA3D = { celular, painel, carrossel, burger, appicone };

// ---------------------------------------------------------------- montagem
const cenaInfo = [];
let t = 0;
for (const c of SPEC.cenas) {
  const L = $('div', 'cena', cenasEl);
  let d = c.dur;
  if (CENA3D[c.tipo]) d = await CENA3D[c.tipo](c, t, L);
  else CENA[c.tipo](c, t, d, L);
  tl.set(L, { visibility: 'visible' }, t);
  tl.set(L, { visibility: 'hidden' }, t + d);
  if (!CENA3D[c.tipo]) {
    tl.fromTo(L, { opacity: 1 }, { opacity: 0, duration: 0.18, immediateRender: false }, t + d - 0.18);
  }
  // corte com batida de cor
  if (t > 0 && c.corte !== false) {
    const fl = document.getElementById('flash');
    tl.fromTo(fl, { opacity: 0 }, { opacity: c.flash ?? 0.45, duration: 0.04, immediateRender: false }, t - 0.04);
    tl.to(fl, { opacity: 0, duration: 0.14 }, t);
  }
  cenaInfo.push({ tipo: c.tipo, t0: t, t1: t + d });
  t += d;
}
const DURATION = Math.round(t * 30) / 30;
// fundo vivo
tl.fromTo('#blob', { x: -120, y: -80, scale: 1 }, { x: 140, y: 120, scale: 1.25, duration: DURATION, ease: 'sine.inOut' }, 0);
tl.set({}, {}, DURATION);

function renderAt(tt) {
  tl.seek(tt, false);
  let ativa = null;
  for (const s of ESC3D) { const on = tt >= s.t0 && tt < s.t1; if (on) ativa = s; }
  if (ativa) {
    renderer.setClearColor(0x000000, 0);
    const cena = new THREE.Scene(); cena.environment = ENV; cena.add(ativa.raiz);
    ativa.update(tt);
    renderer.render(cena, camera);
    cena.remove(ativa.raiz);
    canvas.style.visibility = 'visible';
  } else canvas.style.visibility = 'hidden';
}
window.renderAt = renderAt;
window.DURATION = DURATION;
window.CUES = CUES.sort((a, b) => a.t - b.t);
window.CENAS = cenaInfo;
renderAt(0);
window.READY = true;
