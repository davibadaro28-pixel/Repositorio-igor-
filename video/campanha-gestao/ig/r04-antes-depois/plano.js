// R04 · Antes × depois em tela dividida: quatro rodadas no mesmo ritmo, o "depois" é sempre tela real.
(() => {
  const MINT = '#2ee6a6';
  const { T, W, D } = IG.init({
    bg: '#0f1417', fg: '#fff', accent: MINT, font: "'Archivo Black', sans-serif", fontText: "'Inter Tight', sans-serif",
    antesFont: "'Caveat', cursive", antesCor: '#2a2a2a', antesSize: 70, antesTitulo: '#8a7d66', capCls: 'r04', grain: 0.05, vignette: 0.4, mov: 'soco',
  });
  const { $, px } = L;
  const P = L.P;
  const DRE = [1440, 1134];
  const dreRows = [];
  // linha do DRE: rótulo + valor (pula a coluna vazia do meio)
  const linhaDRE = (box, y, h, top, k) => {
    const segs = [[284, 520], [880, 994]];
    const w = segs.reduce((s, [a, b]) => s + b - a, 0);
    const c = $('div', 'panel', box, { left: px(270 - (w * k) / 2), top: px(top), width: px(w * k), height: px(h * k), backgroundColor: '#fff', overflow: 'hidden', borderRadius: '14px' });
    let off = 0;
    for (const [a, b] of segs) { L.crop(c, P('d-fin-dre-full'), a, y, b - a, h, { k, base: DRE, left: off * k }); off += b - a; }
    return c;
  };
  IG.divisao(0, T(5) - 0.1, [
    {
      t: T(1) - 0.05, rotulo: 'PEDIDO', td: W(1, 'agora') - 0.05,
      antes: '<span class="bolha">oi</span><span class="bolha">tem de morango?</span><span class="bolha d">tem sim!</span><span class="bolha">quanto fica?</span><span class="bolha">oi??</span>',
      depois: { src: P('d-pedidos-novo'), r: { x: 280, y: 150, w: 215, h: 370 }, k: 2.2, top: 560 },
    },
    {
      t: T(2) - 0.05, rotulo: 'ENCOMENDA', td: W(2, 'agora') - 0.05,
      antes: 'sáb: bolo de ninho<br><span class="rasura">15h</span> 16h?<br><span class="rasura">2 kg</span> 1,5 kg??<br>entrega ou retira?',
      depois: {
        build: (R1) => {
          const box = $('div', null, R1, { position: 'absolute', left: '0', top: '0', width: '540px', height: '1920px' });
          const k = 1.5, fade = 'linear-gradient(90deg, #000 80%, transparent 100%)';
          const c = $('div', 'panel', box, { left: px(30), top: '560px', width: px(330 * k), height: px((44 + 284) * k), backgroundColor: '#fff', overflow: 'hidden', borderRadius: '18px', webkitMaskImage: fade, maskImage: fade });
          L.crop(c, P('d-encomendas'), 285, 152, 330, 44, { k });
          L.crop(c, P('d-encomendas'), 285, 262, 330, 284, { k, top: 44 * k });
          return box;
        },
      },
    },
    {
      t: T(3) - 0.05, rotulo: 'ESTOQUE', td: W(3, 'agora') - 0.05,
      antes: 'acho que<br>ainda tem…<br><span style="font-size:52px">(leite condensado?)</span>',
      depois: {
        build: (R1) => {
          const box = $('div', null, R1, { position: 'absolute', left: '0', top: '0', width: '540px', height: '1920px' });
          L.crop(box, P('d-estoque-baixo'), 820, 239, 156, 25, { k: 2.9, cls: 'panel', left: 270 - (156 * 2.9) / 2, top: 600, style: { borderRadius: '40px', backgroundColor: '#fff' } });
          L.crop(box, P('d-inicio-full'), 1048, 700, 368, 122, { k: 1.28, base: [1440, 1197], cls: 'panel', left: 270 - (368 * 1.28) / 2, top: 720, style: { borderRadius: '18px', backgroundColor: '#fff' } });
          return box;
        },
      },
    },
    {
      t: T(4) - 0.05, rotulo: 'LUCRO', td: W(4, 'agora') - 0.05,
      antes: 'sobrou?<br><span style="font-size:110px">R$ ???</span>',
      depois: {
        build: (R1) => {
          const box = $('div', null, R1, { position: 'absolute', left: '0', top: '0', width: '540px', height: '1920px' });
          const k = 1.36;
          [[428, 40], [617, 38], [1026, 38], [1068, 42]].forEach(([y, h], i) => dreRows.push(linhaDRE(box, y, h, 600 + i * 78, k)));
          return box;
        },
      },
    },
  ], { bgAntes: 'repeating-linear-gradient(180deg, #f1ebdd 0 62px, #c9d3e0 62px 64px)', bgDepois: '#0f1417' });
  // balões do "antes" entram um a um (o WhatsApp bagunçado)
  const { tl } = L;
  document.querySelectorAll('.bolha').forEach((b, i) => {
    IG.hid(b);
    const t = W(1, 'antes') + 0.05 + i * 0.5;
    tl.fromTo(b, { autoAlpha: 0, scale: 0.5, rotate: i % 2 ? 6 : -6 }, { autoAlpha: 1, scale: 1, rotate: i % 2 ? 2 : -2, duration: 0.28, ease: 'back.out(2.2)', immediateRender: false }, t);
    L.cue(t, 'bubble', { n: i });
  });
  // linhas do DRE entram em sequência e o resultado do período pulsa
  dreRows.forEach((r, i) => {
    IG.hid(r);
    tl.fromTo(r, { autoAlpha: 0, x: 120 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'expo.out', immediateRender: false }, W(4, 'agora') + 0.1 + i * 0.28);
    L.cue(W(4, 'agora') + 0.1 + i * 0.28, 'tick');
  });
  const ult = dreRows[dreRows.length - 1];
  tl.to(ult, { scale: 1.08, boxShadow: '0 0 0 6px #2ee6a6, 0 20px 50px -10px rgba(46,230,166,.6)', duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 3 }, W(4, 'mes') - 0.1);
  L.cue(W(4, 'mes') - 0.1, 'ding');
  // abertura por cima da divisão
  IG.texto(0, T(1) - 0.1, [[W(0, 'mesma') - 0.05, 'A MESMA DOCERIA', { fontSize: '96px' }], [W(0, 'antes') - 0.05, 'ANTES', { fontSize: '120px', color: '#2a2a2a', background: '#f1ebdd' }], [W(0, 'depois') - 0.05, 'DEPOIS', { fontSize: '120px', color: '#0f1417', background: MINT }]], {
    top: 700, lineStyle: { display: 'table', margin: '0 auto 22px', padding: '14px 34px', background: '#0f1417', borderRadius: '20px' },
  });
  IG.real(T(1) + 0.6, T(5) - 0.15);
  IG.prova(T(5) - 0.1, T(6) - 0.05, { fundo: '#0f1417' });
  IG.cta(T(6) - 0.05, {
    linhas: [[W(6, 'qual') - 0.05, 'QUAL LADO', { fontSize: '130px' }], [W(6, 'seu') - 0.05, 'É O SEU?', { fontSize: '150px', color: MINT }]],
    top: 520, botao: [W(6, 'fala') - 0.1, 'Quero o lado direito'], botaoCor: MINT, botaoTexto: '#0f1417', toque: W(6, 'gente') + 0.3, sub: 'Fala com a gente',
    fundo: 'linear-gradient(90deg, #2a2a2a 0 50%, #0f1417 50% 100%)',
  });
  IG.fim({ hideIn: [[0, T(1) - 0.1], [T(5) - 0.15, D + 1]], top: 1500 });
})();
