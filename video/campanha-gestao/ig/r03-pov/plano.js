// R03 · POV com texto na tela (sem locução): sexta, 22h, as mensagens não param; depois o pedido chega pronto.
(() => {
  const { D } = IG.init({
    bg: '#0b1230', fg: '#fff', accent: '#ff5fa2', font: "'Inter Tight', sans-serif", fontText: "'Inter Tight', sans-serif", duracao: 19.5,
    grain: 0.06, vignette: 0.5, mov: 'sobe', upper: false, weight: '700', tagBg: 'rgba(0,0,0,.6)',
    fundo: (bg) => { L.$('div', 'full', bg, { background: 'radial-gradient(70% 50% at 50% 30%, #1d2b6b, #0b1230 70%)' }); },
  });
  const { tl, $, px } = L;
  const pov = (a, b, linhas, o = {}) => IG.texto(a, b, linhas.map(([t, h, cls]) => [t, `<span class="pov ${cls || ''}">${h}</span>`]), { top: o.top ?? 250, size: '66px', lh: '1.42', k: 0, empurra: false, upper: false, mov: 'sobe', cue: 'tick' });
  // 1 · sexta, 22h: o celular não para
  pov(0.2, 8.0, [[0.25, 'POV: você é dona de doceria'], [1.1, 'e é sexta, 22h']]);
  const s1 = L.scene(0, 8.0, IG.world());
  const ph = L.phone(s1, 'transparent');
  ph.view.style.background = 'linear-gradient(170deg, #3b2a6b, #1a1440 60%, #0d0b22)';
  const hh = $('div', 'lock-h', ph.view, { top: '60px' }); hh.textContent = '22:00';
  const dd = $('div', 'lock-d', ph.view, { top: '40px' }); dd.textContent = 'sexta-feira';
  tl.fromTo(ph.el, { y: 900, rotateX: 25, scale: 1.05 }, { y: 120, rotateX: 4, scale: 1.12, duration: 0.8, ease: 'expo.out', immediateRender: false }, 0.15);
  tl.to(ph.el, { rotateY: -6, rotateX: 2, duration: 7, ease: 'sine.inOut' }, 0.95);
  L.cue(0.15, 'whoosh');
  const msgs = ['tem de morango?', 'aceita pix?', 'faz pra amanhã?', 'oi??', 'quanto fica o de 2 kg?', 'entrega no centro?', 'oi', 'tem foto?', '???', 'alô?', 'ainda tá aberto?', 'oi oi', 'e de chocolate?', 'responde pfv', 'tem pra hoje?', 'oiii', 'quanto é a fatia?', '??'];
  const nts = [];
  let t = 1.6;
  msgs.forEach((m, i) => {
    const n = $('div', 'nt3', ph.view, { top: '200px' });
    n.innerHTML = `<i></i><div><b>WhatsApp · cliente</b><span>${m}</span></div>`;
    IG.hid(n);
    tl.fromTo(n, { autoAlpha: 0, y: -40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.8)', immediateRender: false }, t);
    nts.forEach((o2, j) => tl.to(o2, { y: `+=${78}`, duration: 0.2, ease: 'power2.out' }, t));
    nts.unshift(n);
    L.cue(t, 'plim', { n: i });
    t += Math.max(0.2, 0.8 * Math.pow(0.85, i));
  });
  IG.ilustra(0.3, 7.95);
  L.drift(s1, { amp: 0, scale: 0, pushes: [[2.4, 8.0, 0.1]] });
  IG.shake(7.4, 0.5);
  // 2 · corte seco: silêncio
  pov(8.1, 8.95, [[8.15, '…', 'esc']], { top: 880 });
  // 3 · agora: o cliente escolhe, agenda e o pedido cai pronto no painel
  pov(9.0, 15.0, [[9.05, 'POV: agora o cliente escolhe,'], [10.1, 'marca data e hora'], [11.6, 'e o pedido cai pronto no painel']], { top: 210 });
  IG.flash(9.0, 'impact');
  IG.celular(9.1, 13.5, [[9.1, 'menu-premium'], [9.95, 'product-2'], [10.9, 'checkout-1'], [12.35, 'track']], { y: 140, k: 1.0, toques: [[9.75, 288, 465], [10.6, 255, 759], [11.4, 295, 453], [12.1, 195, 759]] });
  L.cue(12.4, 'success');
  const s3 = L.scene(13.5, 15.0, IG.world());
  IG.peca(s3, 13.5, 'd-pedidos-novo', { x: 280, y: 150, w: 680, h: 450 }, { k: 1.38, top: 640, radius: 22 });
  IG.peca(s3, 13.95, 'd-pedidos-novo', { x: 560, y: 843, w: 320, h: 42 }, { k: 2.6, top: 1300, radius: 40, cue: 'ding', de: { autoAlpha: 0, y: 60, scale: 0.6 } });
  IG.real(13.5, 14.95);
  L.drift(s3, { amp: 0, scale: 0, pushes: [[13.6, 15.0, 0.06]] });
  // 4 · fecho
  IG.celular(15.05, D, [[15.05, 'theme-1'], [15.8, 'theme-2'], [16.5, 'theme-3'], [17.2, 'theme-4']], { y: 260, k: 0.82, deslizar: false });
  pov(15.05, D, [[15.1, 'Cardápio com a sua marca'], [15.9, '+ gestão da doceria.'], [17.6, 'Me chama ↓', 'esc']], { top: 230 });
  IG.fim({ legendas: false });
})();
