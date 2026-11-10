// v05b-contraria: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const MG = '#ff2e7e';
  TEMA.gancho(0, T(3) - 0.1, {
    linhas: [[0, 'Você não precisa', 500, 74], [W(0, 'mais') - 0.03, 'de mais um app.', 600, 74], [W(0, 'precisa', 1) - 0.03, `Precisa de <span style="color:${MG}">menos.</span>`, 740, 84]],
    recua: T(1) - 0.1, faixa: 'CADERNO · PLANILHA · PAPEL · CALCULADORA · ',
    notas: [[W(1, 'caderno'), 'Caderno de encomendas'], [W(1, 'planilha'), 'Planilha de estoque'], [W(1, 'pedido'), 'Pedido anotado no papel'], [W(1, 'calculadora'), 'Calculadora no fim do mês'], [W(2, 'cada'), 'O caixa não bate'], [W(2, 'lugar'), 'Cadê a encomenda?'], [W(2, 'meio'), 'Acabou o leite condensado']],
    fogo: [W(2, 'voce') - 0.05, 'você no meio de tudo'], tremer: W(2, 'tudo') - 0.05, empurra: W(1, 'caderno'),
  });
  TEMA.plataforma(T(3) - 0.05, T(4) - 0.05, { titulo: [W(3, 'tudo') - 0.05, `TUDO NUMA<br><span style="color:${MG}">PLATAFORMA</span>`], celular: W(3, 'plataforma') });
  TEMA.montagem(T(4) - 0.05, T(5) - 0.05, [[T(4) - 0.05, 'd-pedidos', 'PEDIDOS'], [W(4, 'caixa') - 0.05, 'd-caixa', 'CAIXA'], [W(4, 'encomendas') - 0.05, 'd-encomendas', 'ENCOMENDAS'], [W(4, 'cozinha') - 0.05, 'd-cozinha', 'COZINHA'], [W(4, 'estoque') - 0.05, 'd-estoque', 'ESTOQUE'], [W(4, 'clientes') - 0.05, 'd-clientes', 'CLIENTES'], [W(4, 'financeiro') - 0.05, 'd-fin-dre', 'FINANCEIRO']]);
  TEMA.plataforma(T(5) - 0.05, T(6) - 0.05, { computador: W(5, 'computador'), celular: W(5, 'celular') });
  TEMA.prova(T(6) - 0.05, T(7) - 0.05);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'gestao') - 0.05, 'GESTÃO'], [W(7, 'verdade') - 0.05, 'DE VERDADE'], [W(7, 'docerias') - 0.1, `<span style="color:${MG}">PARA DOCERIAS.</span>`, { fontSize: '84px' }]],
    botao: [W(7, 'fale') - 0.1, 'Fale com a gente →'], toque: W(7, 'gente') + 0.45,
  });
  TEMA.fim([[0, T(3) - 0.1], [T(4) - 0.05, T(5) - 0.05], [T(6) - 0.1, D + 1]]);
})();
