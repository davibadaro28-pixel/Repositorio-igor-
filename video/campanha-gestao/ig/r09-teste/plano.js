// R09 · Teste rápido (quiz): três perguntas de 3 segundos que quase ninguém responde de cabeça; as respostas estão na tela.
(() => {
  const CY = '#00e1ff', ROSA = '#ff3b6b';
  const { T, W, E, D } = IG.init({
    bg: '#1a0640', fg: '#fff', accent: CY, danger: ROSA, font: "'Fredoka', sans-serif", fontText: "'Fredoka', sans-serif", grain: 0.05, vignette: 0.5,
    mov: 'soco', capCls: 'r09', capUpper: false, weight: '700', upper: false,
    fundo: (bg) => {
      L.$('div', 'full', bg, { background: 'radial-gradient(90% 60% at 50% 35%, #4a1aa0 0%, #1a0640 70%)' });
      const raios = L.$('div', null, bg, { position: 'absolute', left: '-460px', top: '-500px', width: '2000px', height: '2000px', background: 'repeating-conic-gradient(rgba(255,255,255,.05) 0 8deg, transparent 8deg 20deg)' });
      L.onFrame((t) => { raios.style.transform = `rotate(${t * 6}deg)`; });
    },
  });
  const { tl, $, px } = L;
  const chip = (parent, t, txt, top = 290) => {
    const c = $('div', 'chip9', parent, { top: px(top) });
    c.innerHTML = `<span>${txt}</span>`;
    IG.hid(c);
    tl.fromTo(c, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)', immediateRender: false }, t);
    L.cue(t, 'pop');
    return c;
  };
  // abertura
  {
    const a = 0, b = T(1) - 0.1;
    const s = L.scene(a, b);
    IG.texto(a, b, [[W(0, 'teste') - 0.05, 'TESTE', { fontSize: '240px', color: CY, textShadow: '0 0 60px rgba(0,225,255,.6)' }], [W(0, 'rapido') - 0.05, 'RÁPIDO', { fontSize: '240px' }]], { parent: s, top: 460, k: 0.06 });
    chip(s, W(0, 'responde') - 0.05, 'responde de cabeça', 1060);
    L.cue(0.05, 'swell');
  }
  // as três perguntas: cada uma com cronômetro de 3 s entre o fim da pergunta e a próxima
  const pergunta = (k, n, linhas, visual) => {
    const a = T(k) - 0.1, b = (k < 3 ? T(k + 1) : T(4)) - 0.1;
    const s = L.scene(a, b, IG.world());
    chip(s, a, `PERGUNTA ${n} DE 3`);
    IG.texto(a, b, linhas, { parent: s, top: 400, size: '84px', k: 0.03, lh: '1.05' });
    visual(s, a);
    IG.cronometro(s, E(k) + 0.05, { dur: Math.min(3, b - E(k) - 0.2), top: 1170 });
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.3, b, 0.04]] });
    L.cue(a, 'whoosh');
  };
  pergunta(1, 1, [[W(1, 'quanto') - 0.05, 'quanto custa fazer'], [W(1, 'bolo') - 0.05, 'o seu bolo<br>mais vendido?', { color: CY }]], (s, a) => {
    IG.fotoEl(s, W(1, 'bolo') - 0.1, 'bolo-premium-brigadeiro-com-morango', { w: 500, h: 400, top: 720, radius: 30, rot: -3 });
  });
  pergunta(2, 2, [[W(2, 'quanto') - 0.05, 'quanto dinheiro tá'], [W(2, 'parado') - 0.05, 'parado no seu<br>estoque agora?', { color: CY }]], (s, a) => {
    const box = $('div', null, s, { position: 'absolute', left: '0', top: '0', width: '1080px', height: '1920px' });
    [[880, ['#ff8fb1', '#ffd166', '#8ef0c6', '#9cc9ff', '#ff8fb1']], [1080, ['#ffd166', '#9cc9ff', '#ff8fb1', '#8ef0c6']]].forEach(([y, cores], r) => {
      $('div', 'prat', box, { top: px(y) });
      cores.forEach((c, i) => {
        const p = $('div', 'pote', box, { left: px(180 + i * (r ? 175 : 140) + r * 30), top: px(y - 150), width: '120px', height: '150px', background: c });
        p.textContent = 'R$ ?';
      });
    });
    IG.hid(box);
    tl.fromTo(box, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)', immediateRender: false }, W(2, 'parado') - 0.1);
    IG.ilustra(W(2, 'parado') - 0.1, T(3) - 0.15);
  });
  pergunta(3, 3, [[W(3, 'quanto') - 0.05, 'quanto sobrou'], [W(3, 'mes') - 0.05, 'no mês passado?', { color: CY }]], (s, a) => {
    const cal = $('div', 'cal', s);
    cal.innerHTML = `<div class="topo">OUTUBRO</div><div class="g">${Array.from({ length: 31 }, (_, i) => `<i${i === 30 ? ' style="background:#ff3b6b;color:#fff"' : ''}>${i === 30 ? '?' : i + 1}</i>`).join('')}</div>`;
    IG.hid(cal);
    tl.fromTo(cal, { autoAlpha: 0, rotate: -8, scale: 0.7 }, { autoAlpha: 1, rotate: -3, scale: 0.84, y: 40, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false }, W(3, 'sobrou') - 0.1);
    IG.ilustra(W(3, 'sobrou') - 0.1, T(4) - 0.15);
  });
  // "não soube alguma? normal."
  {
    const a = T(4) - 0.1, b = T(5) - 0.1;
    const s = L.scene(a, b);
    IG.texto(a, b, [[W(4, 'nao') - 0.05, 'não soube<br>alguma?', { fontSize: '130px' }], [W(4, 'normal') - 0.05, 'NORMAL.', { fontSize: '210px', color: CY }]], { parent: s, top: 420, k: 0.05 });
    IG.texto(a, b, [[W(4, 'isso') - 0.05, 'isso não dá pra fazer de cabeça', { fontSize: '50px', color: 'rgba(255,255,255,.8)' }]], { parent: s, top: 1120, empurra: false, mov: 'sobe' });
  }
  // as três respostas, na tela real
  {
    const a = T(5) - 0.1, b = T(6) - 0.08;
    const s = L.scene(a, b, IG.world());
    chip(s, a, 'AS RESPOSTAS');
    const linha = (t, i, src, segs, y, h, o = {}) => {
      const top = 450 + i * 250;
      const r = $('div', 'resp', s, { top: px(top + (o.dy || 0)) });
      r.textContent = String(i + 1);
      IG.hid(r);
      tl.fromTo(r, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)', immediateRender: false }, t);
      const c = IG.colunas(s, t + 0.05, src, segs, y, h, { left: 240, top: top + 20, k: o.k || 1.6, base: o.base, cue: 'ding', radius: 16, de: { autoAlpha: 0, x: 200 } });
      const lg = $('div', null, s, { position: 'absolute', left: '244px', top: px(top + 30 + h * c.k), font: "600 34px 'Fredoka', sans-serif", color: 'rgba(255,255,255,.75)' });
      lg.textContent = o.legenda;
      IG.hid(lg);
      tl.fromTo(lg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, immediateRender: false }, t + 0.25);
    };
    linha(W(5, 'sistema') - 0.1, 0, 'd-estoque-cmv-ficha', [[284, 590], [960, 1040]], 302, 40, { k: 2.05, legenda: 'quanto custa o bolo' });
    linha(W(5, 'tres') - 0.05, 1, 'd-estoque-baixo', [[605, 818]], 238, 26, { k: 3.6, legenda: 'quanto está parado no estoque' });
    linha(W(5, 'respostas') + 0.1, 2, 'd-fin-dre-full', [[284, 520], [880, 994]], 1068, 42, { k: 2.2, base: [1440, 1134], legenda: 'quanto sobrou no mês' });
    IG.real(a, b - 0.05);
    L.drift(s, { amp: 0, scale: 0, pushes: [[a + 0.3, b, 0.04]] });
  }
  IG.prova(T(6) - 0.08, T(7) - 0.05);
  IG.cta(T(7) - 0.05, {
    linhas: [[W(7, 'quer') - 0.05, 'quer ver', { fontSize: '150px' }], [W(7, 'suas') - 0.05, 'as suas?', { fontSize: '170px', color: CY }]],
    top: 500, botao: [W(7, 'fala') - 0.1, 'Fala com a gente'], botaoCor: CY, botaoTexto: '#1a0640', toque: W(7, 'gente') + 0.3,
  });
  IG.fim({ hideIn: [[T(6) - 0.12, D + 1]] });
})();
