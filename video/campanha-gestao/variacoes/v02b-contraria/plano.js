// v02b-contraria: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const RED = '#e0503f';
  TEMA.contador(0, T(1) - 0.02, { kick: 'Vendas do mês', inicio: 0.1, nao: W(0, 'nem') });
  TEMA.cascata(T(1) - 0.05, T(2) - 0.02, { tempos: [T(1), W(1, 'preco'), W(1, 'abaixo'), W(1, 'custo'), W(1, 'venda')], negativo: true, sobra: W(1, 'prejuizo') - 0.1, titulo: [W(1, 'aumenta') - 0.15, `Cada venda a mais, <span style="color:${RED}">mais prejuízo.</span>`] });
  TEMA.titulo(T(2), T(3) - 0.05, [[W(2, 'produto') - 0.1, 'O que mais vende'], [W(2, 'menos') - 0.1, `<span style="color:${RED}">pode ser o que menos</span>`], [W(2, 'dinheiro') - 0.15, 'deixa dinheiro.']], { size: '84px', top: 380, foto: 'bolo-de-cenoura-com-calda', fotoTop: 820, tFoto: W(2, 'vende') - 0.1 });
  TEMA.cmv(T(3) - 0.02, T(4) - 0.02, { custo: W(3, 'custo') - 0.05, lucro: W(3, 'lucro') - 0.05, margem: W(3, 'produto') - 0.2 });
  TEMA.pedido(T(4) - 0.02, W(4, 'dre') - 0.35, { custo: W(4, 'custo') - 0.1 });
  TEMA.dre(W(4, 'dre') - 0.35, T(5) - 0.02, { vendas: W(4, 'mes'), resultado: W(4, 'resultado') });
  TEMA.prova(T(5) - 0.02, T(6) - 0.3);
  TEMA.cta(T(6), {
    linhas: [[W(6, 'pare') - 0.05, 'Pare de'], [W(6, 'adivinhar') - 0.05, '<span style="color:#34d399">adivinhar.</span>']],
    sub: [W(6, 'adivinhar') + 0.4, 'Veja custo, lucro e resultado da sua doceria num painel só.'], botao: [W(6, 'peca') - 0.1, 'Peça uma demonstração'], toque: W(6, 'demonstracao') + 0.5,
  });
  TEMA.fim([[W(1, 'aumenta') - 0.2, T(3) - 0.05], [T(5) - 0.05, D + 1]]);
})();
