// v03b-cena: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const AM = '#ffb020';
  TEMA.prateleira(0, T(2) - 0.05, { titulo: [0.03, `SEXTA À NOITE.<br><span style="color:${AM}">ENCOMENDA</span><br>PARA SÁBADO`], tamanho: '96px', scan: 0.4, falta: W(1, 'acabou') - 0.05 });
  TEMA.titulo(T(2), T(3) - 0.05, [[W(2, 'passou') - 0.1, 'JÁ PASSOU'], [W(2, 'isso') - 0.1, 'POR ISSO?'], [W(2, 'susto') - 0.1, `<span style="color:${AM}">O SUSTO.</span>`]]);
  TEMA.titulo(T(3), T(4) - 0.05, [[W(3, 'falta') - 0.05, 'NÃO É FALTA', { fontSize: '108px' }], [W(3, 'cuidado') - 0.05, 'DE CUIDADO.', { fontSize: '108px' }], [W(3, 'baixa') - 0.1, `<span style="color:${AM}">É BAIXA DE CABEÇA</span>`, { fontSize: '80px' }], [W(3, 'venda') - 0.1, 'EM CADA VENDA.', { fontSize: '80px' }]], { top: 500 });
  TEMA.baixa(T(4), T(5) - 0.05, { ficha: W(4, 'ficha') - 0.15, venda: W(4, 'vendeu') - 0.1, baixa: W(4, 'ingredientes') - 0.2 });
  TEMA.alerta(T(5), T(6) - 0.05, { avisa: W(5, 'insumo') - 0.1, cartao: W(5, 'minimo') - 0.4, minimo: W(5, 'alerta') - 0.05 });
  TEMA.prova(T(6) - 0.05, T(7) - 0.05);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'chega') - 0.05, 'CHEGA DE'], [W(7, 'faltar') - 0.05, `<span style="color:${AM}">FALTAR</span>`], [W(7, 'insumo') - 0.05, 'INSUMO.']],
    botao: [W(7, 'fale') - 0.1, 'FALE COM A GENTE'], toque: W(7, 'gente') + 0.4,
  });
  TEMA.fim([[0, T(1) - 0.05], [T(2) - 0.05, T(4) - 0.05], [T(6) - 0.1, D + 1]]);
})();
