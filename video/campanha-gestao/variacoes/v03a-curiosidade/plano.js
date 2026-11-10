// v03a-curiosidade: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const AM = '#ffb020';
  TEMA.prateleira(0, T(1) - 0.05, { titulo: [W(0, 'dinheiro') - 0.05, `DINHEIRO<br><span style="color:${AM}">PARADO?</span>`] });
  TEMA.fichas(T(1) - 0.05, T(2) - 0.02, { tempos: [W(1, 'leite'), W(1, 'chocolate'), W(1, 'morango'), W(1, 'embalagem')], dinheiro: W(1, 'tudo') });
  TEMA.valor(T(2), T(3) - 0.05, { valor: W(2, 'valor'), hora: W(2, 'hora') - 0.1 });
  TEMA.alerta(T(3), T(4) - 0.05, { avisa: W(3, 'avisa') - 0.1, cartao: W(3, 'insumo') - 0.1, minimo: W(3, 'abaixo') - 0.05 });
  TEMA.baixa(T(4), T(5) - 0.05, { ficha: W(4, 'ficha') - 0.15, venda: W(4, 'venda') - 0.1, baixa: W(4, 'baixa') });
  TEMA.acoes(T(5), W(5, 'custo') - 0.4, { compras: W(5, 'compras') - 0.08, perdas: W(5, 'perdas') - 0.08, inventario: W(5, 'inventario') - 0.08 });
  TEMA.custo(W(5, 'custo') - 0.4, T(6) - 0.05, { custo: W(5, 'custo') - 0.1 });
  TEMA.prova(T(6) - 0.05, T(7) - 0.05);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'estoque') - 0.05, 'ESTOQUE'], [W(7, 'organizado') - 0.05, `<span style="color:${AM}">ORGANIZADO</span>`]],
    itens: [[W(7, 'menos'), '−', 'surpresa'], [W(7, 'mais'), '+', 'controle']],
    botao: [W(7, 'fale') - 0.1, 'FALE COM A GENTE'], toque: W(7, 'gente') + 0.5,
  });
  TEMA.fim([[T(6) - 0.1, D + 1]]);
})();
