// v02c-pergunta: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const EM = '#0e9f6e';
  const RED = '#e0503f';
  TEMA.titulo(0, T(1) - 0.05, [[0.03, 'Pergunta rápida:', { fontSize: '64px', color: EM }], [W(0, 'quanto') - 0.05, 'quanto custa fazer'], [W(0, 'bolo') - 0.05, 'o seu bolo mais vendido?']], { size: '88px', top: 300, foto: 'bolo-premium-brigadeiro-com-morango', fotoTop: 900, tFoto: 0.45 });
  TEMA.titulo(T(1), T(2) - 0.05, [[W(1, 'precisou') - 0.05, 'Precisou pensar?'], [W(1, 'video') - 0.05, `<span style="color:${EM}">Este vídeo é para você.</span>`]], { size: '92px', top: 640 });
  TEMA.titulo(T(2), T(3) - 0.05, [[W(2, 'sabe') - 0.1, 'Sabe o custo:'], [W(2, 'define') - 0.05, `<span style="color:${EM}">define o preço.</span>`], [W(2, 'nao') - 0.05, 'Não sabe:'], [W(2, 'chuta') - 0.15, `<span style="color:${RED}">chuta.</span>`]], { size: '96px', top: 480 });
  TEMA.cmv(T(3) - 0.02, T(4) - 0.02, { custo: W(3, 'custo') - 0.05, lucro: W(3, 'lucro') - 0.05, margem: W(3, 'vermelho') - 0.1 });
  TEMA.dre(T(4) - 0.02, T(5) - 0.02, { vendas: W(4, 'dre'), custos: W(4, 'mostra'), resultado: W(4, 'sobrou') - 0.1 });
  TEMA.prova(T(5) - 0.02, T(6) - 0.3);
  TEMA.cta(T(6), {
    linhas: [[W(6, 'fale') - 0.05, 'Veja com os', { fontSize: '110px' }], [W(6, 'seus') - 0.05, '<span style="color:#34d399">seus produtos.</span>', { fontSize: '110px' }]],
    sub: [W(6, 'veja'), 'Custo, lucro bruto e DRE da sua doceria.'], botao: [W(6, 'veja') + 0.2, 'Fale com a gente'], toque: W(6, 'produtos') + 0.4,
  });
  TEMA.fim([[0, T(3) - 0.05], [T(5) - 0.05, D + 1]]);
})();
