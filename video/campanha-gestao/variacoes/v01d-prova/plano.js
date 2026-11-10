// v01d-prova: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const OR = '#ff5a1f';
  TEMA.prova(0, T(1) - 0.05, { whip: false });
  TEMA.fiel(T(1) - 0.05, T(2) - 0.05, { em: W(1, 'clientes') - 0.15, titulo: `CLIENTES FIÉIS<br><span style="color:${OR}">PEDINDO DIRETO</span>`, tTitulo: W(1, 'direto') - 0.1 });
  TEMA.fatia(T(2) - 0.05, T(3) - 0.02, { corte: W(2, 'parte'), sai: W(2, 'caminho'), titulo: `ANTES: UMA PARTE<br><span style="color:${OR}">FICAVA</span> NO CAMINHO` });
  TEMA.celular(T(3) - 0.1, W(3, 'cai'), { marca: W(3, 'marca'), marcaTexto: 'COM A MARCA DA LOJA', pedido: W(3, 'pedido') });
  TEMA.painel(W(3, 'cai') - 0.05, T(4) - 0.02, { hora: W(3, 'hora') - 0.05, zoom: W(3, 'painel') - 0.35 });
  TEMA.clientes(T(4) - 0.02, W(4, 'ganha') - 0.1, { historico: W(4, 'historico') - 0.1, whatsapp: W(4, 'whatsapp') - 0.1 });
  TEMA.cupons(W(4, 'ganha') - 0.1, T(5) - 0.05, { destaque: W(4, 'cupom') - 0.05, digita: W(4, 'pedir') });
  TEMA.semComissao(T(5), T(6) - 0.05, [W(5, 'sem'), W(5, 'comissao'), W(5, 'por'), W(5, 'sistema')], { sub: 'do sistema' });
  TEMA.titulo(T(6), T(7) - 0.08, [[W(6, 'resultado') - 0.05, 'RESULTADO DE'], [W(6, 'uma') - 0.03, 'UMA DOCERIA', { color: OR }], [W(6, 'cada') - 0.05, 'CADA NEGÓCIO', { fontSize: '110px' }], [W(6, 'tem') - 0.03, 'TEM O SEU', { fontSize: '110px' }]], { top: 480 });
  TEMA.cta(T(7), {
    linhas: [[W(7, 'quer') - 0.03, 'QUER VER'], [W(7, 'como') - 0.03, 'COMO', { fontSize: '196px', color: '#fff' }], [W(7, 'funciona') - 0.03, 'FUNCIONA?', { fontSize: '186px', color: '#fff' }]],
    botao: [W(7, 'fale') - 0.1, 'Quero ver funcionando'], toque: W(7, 'gente') + 0.25,
  });
  TEMA.fim([[0, T(2) - 0.05], [T(5) - 0.05, D + 1]]);
})();
