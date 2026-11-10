// R05 · Esquete de humor: o caos da doceria em pessoa (três post-its) contra a dona com o sistema.
(() => {
  const PINK = '#ff3d7f', INK = '#111';
  const { T, W, E, D } = IG.init({
    bg: '#ffd23f', fg: INK, accent: PINK, danger: '#e5252a', font: "'Bangers', sans-serif", fontText: "'Nunito', sans-serif",
    grain: 0.05, vignette: 0.25, mov: 'soco', capCls: 'r05', nota: '#4a3800', tagBg: 'rgba(17,17,17,.85)', ls: '.03em', weight: '400',
    fundo: (bg) => { L.$('div', 'full', bg, { backgroundImage: 'radial-gradient(rgba(17,17,17,.13) 22%, transparent 24%)', backgroundSize: '26px 26px' }); },
  });
  const { tl, $, px } = L;
  const palco = L.scene(0, T(9) - 0.1);
  const onoma = (t, txt, x, y, rot = -8, cue = 'hit') => {
    const e = $('div', 'onoma', palco, { left: px(x), top: px(y), transform: `rotate(${rot}deg)` });
    e.textContent = txt;
    IG.hid(e);
    tl.fromTo(e, { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2)', immediateRender: false }, t);
    tl.to(e, { autoAlpha: 0, scale: 0.8, duration: 0.2 }, t + 0.9);
    L.cue(t, cue);
  };
  // os três "caos"
  const enc = IG.personagem(palco, T(0) - 0.05, { x: 70, y: 360, w: 420, h: 420, cor: '#ff8fb1', rot: -6, nome: 'A ENCOMENDA<br>DE SÁBADO', falas: [[T(0), E(0)], [T(7), E(7)]], bravo: true });
  const lei = IG.personagem(palco, T(1) - 0.05, { x: 590, y: 420, w: 420, h: 420, cor: '#8ec5ff', rot: 5, nome: 'O LEITE<br>CONDENSADO', falas: [[T(1), E(1)]] });
  const cli = IG.personagem(palco, T(2) - 0.05, { x: 330, y: 860, w: 420, h: 420, cor: '#8ef0c6', rot: -3, nome: 'O CLIENTE<br>DO "OI??"', falas: [[T(2), E(2)]], bravo: true });
  L.cue(T(0) - 0.12, 'door');
  IG.ilustra(0.1, T(3) - 0.1);
  IG.balao(palco, W(0, 'ninguem') - 0.05, T(1) - 0.15, 'Ninguém me anotou!', { x: 470, y: 250, w: 520 });
  IG.balao(palco, W(1, 'acabou') - 0.05, T(2) - 0.15, 'Acabei. Na sexta.', { x: 520, y: 300, w: 470 });
  [0, 1, 2].forEach((i) => {
    const t = W(2, 'oi', i) - 0.03;
    IG.balao(palco, t, T(3) - 0.2, ['oi', 'oi?', 'oi??'][i], { x: 720 + i * 30, y: 880 + i * 120, w: 280 });
    L.cue(t, 'bubble', { n: i });
  });
  // a dona responde: os três sobem para a borda e a tela real entra no meio
  const topo = T(3) + 0.25;
  tl.to(enc, { x: -10, y: -170, scale: 0.5, duration: 0.5, ease: 'power3.inOut' }, topo);
  tl.to(lei, { x: -230, y: -230, scale: 0.5, duration: 0.5, ease: 'power3.inOut' }, topo + 0.05);
  tl.to(cli, { x: 380, y: -670, scale: 0.5, duration: 0.5, ease: 'power3.inOut' }, topo + 0.1);
  L.cue(topo, 'whoosh');
  const q = $('div', 'quadro', palco, { left: '110px', top: '760px', transform: 'rotate(-2deg)', fontSize: '84px', padding: '26px 40px' });
  q.textContent = 'ENQUANTO ISSO, A DONA…';
  IG.hid(q);
  tl.fromTo(q, { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, T(3) + 0.05);
  tl.to(q, { autoAlpha: 0, duration: 0.15 }, T(4) - 0.15);
  L.cue(T(3) + 0.05, 'pop');
  // nocaute de cada caos quando a tela certa aparece
  const ko = (el, t) => {
    tl.to(el, { rotate: 28, y: '+=40', filter: 'grayscale(1) brightness(.8)', duration: 0.35, ease: 'power2.in' }, t);
    L.cue(t, 'boing');
  };
  const telaComic = (a, b, rotulo, fn) => {
    const s = L.scene(a, b, palco);
    const moldura = $('div', null, s, { position: 'absolute', left: '50px', top: '520px', width: '980px', height: '820px', background: '#fff', border: `8px solid ${INK}`, boxShadow: `14px 14px 0 ${INK}`, borderRadius: '10px' });
    IG.hid(moldura);
    tl.fromTo(moldura, { autoAlpha: 0, scale: 0.6, rotate: -4 }, { autoAlpha: 1, scale: 1, rotate: -1, duration: 0.35, ease: 'back.out(1.8)', immediateRender: false }, a);
    const ch = $('div', 'quadro', s, { left: '90px', top: '470px', transform: 'rotate(-3deg)', background: PINK, color: '#fff', zIndex: 2 });
    ch.innerHTML = rotulo;
    IG.hid(ch);
    tl.fromTo(ch, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power4.out', immediateRender: false }, a + 0.15);
    fn(s, a);
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.05]] });
    L.cue(a, 'whoosh');
  };
  telaComic(T(4) - 0.1, T(5) - 0.1, 'ENCOMENDA COM DATA E HORA', (s, a) => {
    IG.colunas(s, a + 0.1, 'd-encomendas', [[285, 560], [730, 830]], 150, 330, { w: 820, top: 590, cue: false, radius: 6 });
  });
  ko(enc, W(4, 'painel'));
  telaComic(T(5) - 0.1, T(6) - 0.1, 'ALERTA DE ESTOQUE MÍNIMO', (s, a) => {
    IG.peca(s, a + 0.1, 'd-estoque-baixo', { x: 820, y: 239, w: 156, h: 25 }, { k: 4.4, top: 690, radius: 60, cue: false });
    IG.peca(s, W(5, 'estoque'), 'd-inicio-full', { x: 1048, y: 700, w: 368, h: 122 }, { k: 2.35, base: [1440, 1197], top: 880, radius: 16, cue: 'alert' });
  });
  ko(lei, W(5, 'minimo'));
  telaComic(T(6) - 0.1, T(7) - 0.15, 'PEDIDO COMPLETO, SEM CONVERSA', (s, a) => {
    IG.peca(s, a + 0.1, 'd-pedido-custo', { x: 395, y: 180, w: 650, h: 335 }, { k: 1.38, top: 640, radius: 8, cue: 'ding' });
  });
  ko(cli, W(6, 'conversa'));
  // "então… a gente vai embora?" — "vão."
  const volta = T(7) - 0.1;
  [[enc, 70, 470], [lei, 590, 520], [cli, 330, 950]].forEach(([el], i) => tl.to(el, { x: 0, y: 0, scale: 0.85, rotate: [-6, 5, -3][i], filter: 'grayscale(.35)', duration: 0.45, ease: 'power3.out' }, volta + i * 0.06));
  L.cue(volta, 'whoosh');
  onoma(T(8) + 0.02, 'VÃO.', 300, 660, -6, 'hit');
  [enc, lei, cli].forEach((el, i) => tl.to(el, { x: 1400, rotate: 40, duration: 0.45, ease: 'power3.in' }, T(8) + 0.35 + i * 0.08));
  L.cue(T(8) + 0.5, 'whoosh');
  L.cue(T(8) + 0.82, 'slam');
  IG.shake(T(8) + 0.82, 0.3);
  // prova e chamada
  IG.prova(T(9) - 0.1, T(10) - 0.05, { prova: { kickColor: INK, lblColor: INK, noteColor: '#4a3800' } });
  IG.cta(T(10) - 0.05, {
    linhas: [[W(10, 'doceria') - 0.05, 'DOCERIA', { fontSize: '200px' }], [W(10, 'caos') - 0.05, 'SEM CAOS.', { fontSize: '200px', color: PINK, webkitTextStroke: '6px #111', paintOrder: 'stroke fill' }]],
    top: 470, botao: [W(10, 'fala') - 0.1, 'Fala com a gente'], botaoCor: INK, botaoTexto: '#ffd23f', toque: W(10, 'gente') + 0.3, cor: INK,
  });
  IG.fim({ hideIn: [[T(9) - 0.15, D + 1]], top: 1500 });
})();
