// v02a-curiosidade: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const EM = '#0e9f6e';
  TEMA.contador(0, T(1) - 0.02, { kick: 'Vendas do mês', inicio: W(0, 'vendeu'), nao: W(0, 'nao'), bolso: W(0, 'fecha') - 0.1, bolsoTexto: 'a conta não fecha?' });
  TEMA.titulo(T(1), T(2) - 0.05, [[W(1, 'resposta') - 0.1, 'A resposta pode estar', { fontSize: '64px', color: EM }], [W(1, 'numero') - 0.1, 'num número que'], [W(1, 'nunca') - 0.05, 'você nunca calculou:'], [W(1, 'custo') - 0.05, `<span style="color:${EM}">o custo de cada produto.</span>`]], { size: '84px', top: 560 });
  TEMA.cmv(T(2) - 0.02, T(4) - 0.02, { varre: [W(2, 'doce') - 0.1, W(2, 'vende') - 0.05, W(2, 'margem') - 0.2], custo: W(3, 'custo') - 0.05, lucro: W(3, 'lucro') - 0.05, margem: W(3, 'margem') - 0.1 });
  TEMA.pedido(T(4) - 0.02, T(5) - 0.02, { custo: W(4, 'custo') - 0.1 });
  TEMA.dre(T(5) - 0.02, T(6) - 0.02, { vendas: W(5, 'vendas'), custos: W(5, 'custos'), despesas: W(5, 'despesas'), resultado: W(5, 'resultado') });
  TEMA.prova(T(6) - 0.02, T(7) - 0.3);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'quer') - 0.05, 'Quer ver com', { fontSize: '100px' }], [W(7, 'seus') - 0.05, '<span style="color:#34d399">os seus produtos?</span>', { fontSize: '100px' }]],
    sub: [W(7, 'fale'), 'Custo, lucro bruto e DRE da sua doceria num painel só.'], botao: [W(7, 'fale') + 0.1, 'Fale com a gente'], toque: W(7, 'gente') + 0.4,
  });
  TEMA.fim([[T(1) - 0.05, T(2) - 0.05], [T(6) - 0.05, D + 1]]);
})();
