// v03c-contraria: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const AM = '#ffb020';
  const RED = '#ff5b5b';
  TEMA.titulo(0, T(1) - 0.05, [[0.03, 'PLANILHA'], [W(0, 'estoque') - 0.05, 'DE ESTOQUE'], [W(0, 'nao') - 0.05, `<span style="color:${AM}">NÃO FALHA</span>`], [W(0, 'preguica') - 0.1, 'POR PREGUIÇA.']], { scan: false, size: '110px', top: 470 });
  TEMA.prateleira(T(1) - 0.05, T(2) - 0.05, { titulo: [W(1, 'falha') - 0.05, `FALHA PORQUE NINGUÉM<br><span style="color:${AM}">DÁ BAIXA</span>`], tamanho: '84px', scan: W(1, 'baixa') - 0.3 });
  TEMA.titulo(T(2), T(3) - 0.05, [[W(2, 'domingo') - 0.15, 'DOMINGO: ✓'], [W(2, 'quarta') - 0.1, `<span style="color:${RED}">QUARTA: ✗</span>`]], { size: '140px', top: 600 });
  TEMA.baixa(T(3), T(4) - 0.05, { ficha: T(3) + 0.05, venda: W(3, 'venda') - 0.1, baixa: W(3, 'baixa') });
  TEMA.acoes(T(4), T(5) - 0.05, { compras: W(4, 'compras') - 0.08, perdas: W(4, 'perdas') - 0.08, inventario: W(4, 'inventario') - 0.08 });
  TEMA.valor(T(5), W(5, 'alerta') - 0.2, { valor: W(5, 'valor'), hora: W(5, 'hora') - 0.1 });
  TEMA.alerta(W(5, 'alerta') - 0.2, T(6) - 0.05, { avisa: W(5, 'alerta'), cartao: W(5, 'avisa'), minimo: W(5, 'abaixo') });
  TEMA.prova(T(6) - 0.05, T(7) - 0.05);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'fale') - 0.05, 'VEJA COM OS'], [W(7, 'seus') - 0.05, `<span style="color:${AM}">SEUS INSUMOS</span>`]],
    botao: [W(7, 'veja'), 'FALE COM A GENTE'], toque: W(7, 'insumos') + 0.4,
  });
  TEMA.fim([[0, T(1) - 0.05], [T(2) - 0.05, T(3) - 0.05], [T(6) - 0.1, D + 1]]);
})();
