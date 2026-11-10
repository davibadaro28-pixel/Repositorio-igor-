// R01 · Carta do fundador: o texto dele, em primeira pessoa, escrito à mão na tela. Sem locução de IA.
(() => {
  const INK = '#1f3a6b', RED = '#c0392b';
  const { D } = IG.init({
    bg: '#f6efe1', fg: INK, accent: RED, danger: RED, marker: RED, font: "'Caveat', cursive", fontText: "'Inter Tight', sans-serif", duracao: 27.0,
    grain: 0.07, vignette: 0.22, mov: 'maquina', upper: false, weight: '700', nota: '#5b5446', tagBg: 'rgba(31,58,107,.85)', ilustracao: 'Ilustração',
    fundo: (bg) => {
      const papel = L.$('div', null, bg, { position: 'absolute', left: '-60px', top: '-60px', width: '1200px', height: '2040px', background: 'repeating-linear-gradient(180deg, transparent 0 92px, rgba(70,110,170,.28) 92px 95px), #f6efe1' });
      L.$('div', null, papel, { position: 'absolute', left: '170px', top: '0', width: '4px', height: '100%', background: 'rgba(192,57,43,.45)' });
      L.drift(papel, { amp: 14, scale: 0.02, pushes: [[0, 27, 0.08]] });
      L.tl.fromTo(bg, { y: 520, rotate: 4 }, { y: 0, rotate: 0, duration: 1.1, ease: 'expo.out', immediateRender: false }, 0);
    },
  });
  const { tl, $, px } = L;
  const carta = (a, b, linhas, o = {}) => IG.texto(a, b, linhas, { top: o.top ?? 380, left: 200, width: 820, align: 'left', size: o.size || '96px', lh: '1.0', k: o.k ?? 0.06, lineStyle: { marginBottom: '6px' } });
  // virada de página entre os blocos da carta
  const virar = (t) => {
    const f = $('div', null, IG.ui(), { position: 'absolute', left: '0', top: '0', width: '1080px', height: '1920px', background: 'repeating-linear-gradient(180deg, transparent 0 92px, rgba(70,110,170,.28) 92px 95px), #f3ead8', boxShadow: '-40px 0 60px rgba(0,0,0,.25)' });
    IG.hid(f);
    tl.fromTo(f, { autoAlpha: 1, xPercent: 105 }, { autoAlpha: 1, xPercent: -110, duration: 0.6, ease: 'power2.inOut', immediateRender: false }, t - 0.3);
    tl.set(f, { autoAlpha: 0 }, t + 0.32);
    L.cue(t - 0.3, 'flip');
  };
  [4.4, 7.6, 12.55].forEach(virar);
  const sub = (parent, t, shape, o = {}) => IG.anotar(parent || L.layers, t, shape, { color: RED, largura: 8, ...o });
  // 1
  const s1 = carta(0.3, 4.3, [[0.3, 'Eu paguei comissão'], [1.3, 'por anos pra vender'], [2.3, 'bolo pro <b>meu</b> cliente.']]);
  sub(s1, 3.3, { tipo: 'sublinhado', x: 380, y: 668, w: 130 });
  // 2
  carta(4.4, 7.6, [[4.5, 'Cliente que pedia'], [5.4, 'toda semana.'], [6.4, 'Já era meu.', { color: RED }]]);
  // 3 · o meu cardápio, com a minha marca (tela real)
  carta(7.7, 12.5, [[7.8, 'Então eu fiz o meu'], [8.7, 'cardápio. Com a'], [9.6, 'minha marca.']], { top: 300, size: '88px' });
  IG.celular(8.15, 12.5, [[8.15, 'menu-top'], [10.4, 'menu-premium']], { y: 300, k: 0.78, deslizar: false, sb: '#7d2949' });
  // 4 · o pedido cai no painel, sem comissão por pedido
  carta(12.6, 17.6, [[12.7, 'O pedido cai direto'], [13.6, 'no meu painel.']], { top: 300, size: '88px' });
  const s4 = L.scene(12.6, 17.6, IG.world());
  IG.peca(s4, 13.9, 'd-pedidos-novo', { x: 280, y: 150, w: 680, h: 450 }, { k: 1.25, top: 560, radius: 18, rot: -1.5 });
  IG.peca(s4, 14.6, 'd-pedidos-novo', { x: 560, y: 843, w: 320, h: 42 }, { k: 2.4, top: 1140, radius: 40, cue: 'ding', de: { autoAlpha: 0, y: 60, scale: 0.6 } });
  IG.real(13.9, 17.55);
  carta(15.6, 17.6, [[15.7, 'E sem comissão por pedido.', { fontSize: '76px', color: RED }]], { top: 1290, k: 0 });
  // 5 · o resultado dele (+30%)
  IG.prova(17.7, 21.4, { prova: { kick: 'Na minha doceria', kickColor: INK, lblColor: INK, noteColor: '#5b5446', kickFont: "800 34px/1.25 'Inter Tight', sans-serif" } });
  // 6 · convite e assinatura
  IG.cta(21.5, {
    linhas: [[21.6, 'Se você tem doceria,', { fontSize: '96px' }], [22.5, 'me chama.', { fontSize: '130px', color: RED }]],
    top: 460, botao: [23.4, 'Enviar mensagem'], botaoCor: INK, botaoTexto: '#f6efe1', toque: 24.4, sub: 'Eu te mostro funcionando.', subCor: INK, mov: 'maquina', cor: INK,
  });
  const ass = $('div', 'assina', L.scene(24.6, null), { left: '520px', top: '1440px', transform: 'rotate(-4deg)' });
  ass.textContent = '— criador do sistema';
  IG.hid(ass);
  tl.fromTo(ass, { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)' }, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power1.inOut', immediateRender: false }, 24.6);
  L.cue(24.6, 'scribble');
  IG.fim({ legendas: false });
})();
