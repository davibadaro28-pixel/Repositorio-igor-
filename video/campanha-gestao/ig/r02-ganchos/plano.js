// R02 · Super gancho em sequência (ADHD): cinco dores em dez segundos e uma resposta só.
(() => {
  const LIME = '#d4ff00', RED = '#ff2d55';
  const { T, W, D } = IG.init({
    bg: '#060606', fg: '#fff', accent: LIME, danger: RED, font: "'Anton', sans-serif", fontText: "'Inter Tight', sans-serif",
    mov: 'glitch', grain: 0.09, vignette: 0.55, capCls: 'r02', glitchA: RED, glitchB: '#00e5ff', flash: '#fff',
    fundo: (bg, L) => {
      const g = L.$('div', 'full', bg, { backgroundImage: 'linear-gradient(rgba(212,255,0,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(212,255,0,.06) 2px, transparent 2px)', backgroundSize: '90px 90px' });
      L.onFrame((t) => { g.style.backgroundPosition = `0 ${(t * 60) % 90}px`; });
    },
  });
  const { tl, $, px } = L;
  const corte = (t, dir = 1) => { IG.whip(t + 0.2, dir); IG.flash(t, null); };

  // 1 · comissão no cliente que já é seu
  {
    const a = 0, b = T(1) - 0.02;
    const s = L.scene(a, b);
    IG.notificacao(s, 0.05, 'Novo pedido no app de delivery', 'de um cliente que já compra com você', { y: 330, icone: '#8a8f98', letra: '!' });
    IG.ilustra(0.05, b - 0.05);
    IG.texto(a, b, [[W(0, 'pagar') - 0.05, 'COMISSÃO', { fontSize: '210px', color: LIME }], [W(0, 'cliente') - 0.05, 'NO SEU<br>CLIENTE?', { fontSize: '150px' }]], { parent: s, top: 690, k: 0.1 });
  }
  // 2 · quanto custa o seu bolo
  {
    const a = T(1) - 0.02, b = T(2) - 0.02;
    corte(a, -1);
    const s = L.scene(a, b);
    IG.fotoEl(s, a, 'bolo-premium-brigadeiro-com-morango', { w: 900, h: 760, top: 300, radius: 40, zoomDur: 2.6 });
    IG.texto(a, b, [[W(1, 'quanto') - 0.05, 'QUANTO CUSTA', { fontSize: '140px' }], [W(1, 'bolo') - 0.05, 'O SEU BOLO?', { fontSize: '150px', color: LIME }]], { parent: s, top: 1080, k: 0.06 });
    IG.carimbo(s, W(1, 'vendido') - 0.05, 'R$ ???', { x: 330, y: 560, size: 140, rot: -10, cor: RED, bg: 'rgba(0,0,0,.35)' });
    L.drift(s, { amp: 0, scale: 0, pushes: [[a, b, 0.07]] });
  }
  // 3 · cardápio em PDF
  {
    const a = T(2) - 0.02, b = T(3) - 0.02;
    corte(a);
    const s = L.scene(a, b);
    const chat = $('div', null, s, { position: 'absolute', left: '90px', top: '330px', width: '900px', height: '560px', borderRadius: '40px', background: '#0b141a', boxShadow: '0 40px 90px -30px rgba(0,0,0,.8)', overflow: 'hidden' });
    const file = $('div', null, chat, { position: 'absolute', left: '40px', top: '50px', width: '620px', padding: '26px', borderRadius: '26px', background: '#202c33', display: 'flex', gap: '24px', alignItems: 'center' });
    file.innerHTML = `<div style="width:92px;height:112px;border-radius:12px;background:#e5484d;display:grid;place-items:center;font:900 30px 'Inter Tight';color:#fff">PDF</div><div><div style="font:700 36px/1.2 'Inter Tight';color:#e9edef">cardapio_2019_final(3).pdf</div><div style="font:500 28px 'Inter Tight';color:#8696a0">14 páginas · 18 MB</div></div>`;
    const q = $('div', null, chat, { position: 'absolute', right: '40px', top: '330px', padding: '22px 30px', borderRadius: '26px', background: '#005c4b', font: "600 38px 'Inter Tight'", color: '#e9edef' });
    q.textContent = 'não abre aqui…';
    for (const [e, t] of [[file, W(2, 'cardapio') - 0.1], [q, W(2, 'cansando')]]) { IG.hid(e); tl.fromTo(e, { autoAlpha: 0, scale: 0.7, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t); L.cue(t, 'bubble'); }
    tl.fromTo(file, { filter: 'blur(0px)' }, { filter: 'blur(5px)', duration: 0.6, immediateRender: false }, W(2, 'cansando'));
    IG.ilustra(a + 0.05, b - 0.05);
    IG.texto(a, b, [[W(2, 'cardapio') - 0.05, 'CARDÁPIO', { fontSize: '200px' }], [W(2, 'pdf') - 0.05, 'EM PDF?', { fontSize: '200px', color: LIME }]], { parent: s, top: 940, k: 0.08 });
  }
  // 4 · acabou o leite condensado na sexta
  {
    const a = T(3) - 0.02, b = T(4) - 0.02;
    corte(a, -1);
    const s = L.scene(a, b);
    const lata = $('div', 'lata', s, { left: '330px', top: '360px', width: '420px', height: '520px' });
    lata.innerHTML = '<b>LEITE<br>CONDENSADO</b>';
    IG.hid(lata);
    tl.fromTo(lata, { autoAlpha: 0, y: -300, rotate: -12 }, { autoAlpha: 1, y: 0, rotate: 4, duration: 0.45, ease: 'bounce.out', immediateRender: false }, a + 0.02);
    tl.to(lata, { rotate: -3, duration: 1.4, ease: 'sine.inOut' }, a + 0.5);
    IG.carimbo(s, W(3, 'acabou') + 0.2, 'ACABOU', { x: 230, y: 540, size: 170, rot: -14, cor: RED, bg: 'rgba(6,6,6,.55)' });
    IG.ilustra(a + 0.05, b - 0.05);
    IG.texto(a, b, [[W(3, 'sexta') - 0.05, 'NA SEXTA', { fontSize: '190px' }], [W(3, 'noite') - 0.05, 'À NOITE?', { fontSize: '190px', color: LIME }]], { parent: s, top: 950, k: 0.08 });
  }
  // 5 · doceria ou pronto-socorro
  {
    const a = T(4) - 0.02, b = T(5) - 0.1;
    corte(a);
    const s = L.scene(a, b);
    const alarme = $('div', 'full', s, { background: `radial-gradient(70% 50% at 50% 45%, ${RED}, transparent 70%)`, opacity: 0 });
    L.onFrame((t) => { alarme.style.opacity = t >= a && t < b ? String(0.25 + 0.3 * Math.max(0, Math.sin((t - a) * 14))) : '0'; });
    const notas = [['encomenda?', '#ffe14d', 120, 380, -12], ['acabou!', '#ff8fb1', 640, 330, 9], ['oi??', '#8ef0c6', 180, 1060, 7], ['troco pra 100?', '#9cc9ff', 520, 1120, -8], ['faz pra hoje?', '#ffd08a', 330, 820, 4]];
    notas.forEach(([txt, cor, x, y, r], i) => {
      const n = $('div', 'nota-voa', s, { left: px(x), top: px(y), background: cor });
      n.textContent = txt;
      IG.hid(n);
      const t0 = a + 0.08 + i * 0.22;
      tl.fromTo(n, { autoAlpha: 0, x: i % 2 ? 500 : -500, rotate: r * 4 }, { autoAlpha: 1, x: 0, rotate: r, duration: 0.35, ease: 'back.out(1.4)', immediateRender: false }, t0);
      tl.to(n, { y: -40 - i * 10, rotate: r * 1.6, duration: 2, ease: 'sine.inOut' }, t0 + 0.35);
      L.cue(t0, 'pop', { n: i });
    });
    IG.texto(a, b, [[W(4, 'doceria') - 0.05, 'DOCERIA', { fontSize: '200px' }], [W(4, 'ou') - 0.05, 'OU', { fontSize: '110px', color: LIME }], [W(4, 'pronto') - 0.05, 'PRONTO-<br>SOCORRO?', { fontSize: '170px', color: '#fff' }]], { parent: s, top: 520, k: 0.06 });
    IG.shake(W(4, 'pronto'), 0.5);
    L.cue(W(4, 'pronto'), 'alert');
  }
  // 6 · a mesma causa: tudo na cabeça da dona
  {
    const a = T(5) - 0.1, m = W(5, 'a', 1) - 0.08, b = T(6) - 0.02;
    IG.texto(a, m, [[W(5, 'tudo') - 0.05, 'TUDO ISSO', { fontSize: '170px' }], [W(5, 'mesma') - 0.05, 'TEM A MESMA<br>CAUSA', { fontSize: '150px', color: LIME }]], { top: 620, mov: 'soco', k: 0.1 });
    IG.texto(m, b, [[W(5, 'doceria') - 0.05, 'A DOCERIA RODA', { fontSize: '120px' }], [W(5, 'cabeca') - 0.05, 'NA CABEÇA', { fontSize: '210px', color: LIME }], [W(5, 'dona') - 0.05, 'DA DONA.', { fontSize: '210px' }]], { top: 560, mov: 'soco', k: 0.12 });
    L.cue(T(5) - 0.4, 'riser');
  }
  // 7 · telas reais, uma por função
  const tela = (a, b, rotulo, tr, fn) => {
    corte(a, a > T(7) ? -1 : 1);
    const s = L.scene(a, b, IG.world());
    IG.rotulo(s, tr, rotulo, { top: 290, color: '#060606' });
    fn(s, a, b);
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.4, b, 0.07]] });
    return s;
  };
  tela(T(6) - 0.02, W(6, 'pedido') - 0.08, 'Cardápio com a<br>sua marca', W(6, 'cardapio') - 0.05, (s, a, b) => {
    IG.celular(a, b, [[a, 'menu-top']], { parent: s, y: -20, k: 1.0, real: false, sb: '#7d2949' });
  });
  tela(W(6, 'pedido') - 0.08, T(7) - 0.05, 'O pedido cai<br>no painel', W(6, 'pedido') - 0.05, (s, a) => {
    IG.peca(s, a + 0.02, 'd-pedidos-novo', { x: 280, y: 150, w: 680, h: 450 }, { k: 1.38, top: 560 });
    IG.peca(s, W(6, 'cai'), 'd-pedidos-novo', { x: 560, y: 843, w: 320, h: 42 }, { k: 2.6, top: 1220, radius: 40, cue: 'ding', de: { autoAlpha: 0, y: 60, scale: 0.6 } });
  });
  tela(T(7) - 0.05, W(7, 'recebe') - 0.08, 'Custo de<br>cada bolo', W(7, 'custo') - 0.05, (s, a) => {
    const c = IG.colunas(s, a + 0.02, 'd-estoque-cmv-ficha', [[284, 640], [840, 1130]], 205, 315, { w: 960, top: 600 });
    const [x, y] = c.at(1078, 306);
    IG.anotar(s, W(7, 'bolo'), { tipo: 'circulo', x, y, w: 46 * c.k, h: 30 * c.k }, { color: RED, largura: 8 });
  });
  tela(W(7, 'recebe') - 0.08, W(7, 'organiza') - 0.08, 'Alerta de<br>estoque', W(7, 'alerta') - 0.05, (s, a) => {
    IG.peca(s, a + 0.02, 'd-inicio-full', { x: 1048, y: 700, w: 368, h: 122 }, { k: 2.5, base: [1440, 1197], top: 700, radius: 26, cue: 'alert' });
  });
  tela(W(7, 'organiza') - 0.08, T(8) - 0.05, 'Encomendas com<br>data e hora', W(7, 'encomendas') - 0.05, (s, a) => {
    IG.peca(s, a + 0.02, 'd-encomendas', { x: 285, y: 150, w: 560, h: 400 }, { k: 1.65, top: 600 });
  });
  tela(T(8) - 0.05, T(9) - 0.08, 'O resultado<br>do mês', W(8, 'dre') - 0.05, (s, a) => {
    const d = IG.dre(s, a + 0.02, { k: 1.12, top: 520 });
    IG.anotar(s, W(8, 'resultado'), { tipo: 'circulo', x: d.left + 6, y: d.rowY(1066) - 6, w: 800 * d.k - 12, h: 44 * d.k }, { color: LIME, largura: 9 });
  });
  // 8 · prova e chamada
  IG.prova(T(9) - 0.08, T(10) - 0.05, { fundo: '#060606' });
  IG.cta(T(10) - 0.05, {
    linhas: [[W(10, 'quer') - 0.05, 'QUER VER', { fontSize: '150px' }], [W(10, 'funcionando') - 0.05, 'FUNCIONANDO?', { fontSize: '140px', color: LIME }]],
    top: 520, botao: [W(10, 'fala') - 0.1, 'Fala com a gente'], botaoCor: LIME, botaoTexto: '#060606', toque: W(10, 'gente') + 0.3, mov: 'soco',
  });
  IG.fim({ hideIn: [[T(9) - 0.1, D + 1]] });
})();
