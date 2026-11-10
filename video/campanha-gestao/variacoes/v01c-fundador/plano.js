// v01c-fundador: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const OR = '#ff5a1f';
  TEMA.cortes(0, T(1), [
    [0, 'bolo-premium-ninho-com-morango', 'QUEM CRIOU'],
    [W(0, 'sistema') - 0.03, 'brownie-ninho-com-nutella', 'ESTE SISTEMA'],
    [W(0, 'tem') - 0.03, 'bombom-de-morango-leite-ninho', 'TEM DOCERIA', OR],
  ]);
  TEMA.fatia(T(1) - 0.05, T(2) - 0.02, { corte: W(1, 'parte'), sai: W(1, 'aplicativo') });
  TEMA.fiel(T(2) - 0.05, T(3) - 0.05, { em: W(2, 'cliente') - 0.15, titulo: `COMISSÃO ATÉ EM<br><span style="color:${OR}">CLIENTE FIEL</span>`, tTitulo: W(2, 'comissao') - 0.05 });
  TEMA.titulo(T(3), T(4) - 0.08, [[W(3, 'cardapios') - 0.05, 'CARDÁPIO'], [W(3, 'mal') - 0.05, 'SEM A CARA', { color: OR }], [W(3, 'loja') - 0.15, 'DA LOJA']]);
  TEMA.celular(T(4) - 0.1, W(4, 'caindo'), { marca: W(4, 'marca'), marcaTexto: 'COM A MARCA DA LOJA', pedido: W(4, 'pedido') });
  TEMA.painel(W(4, 'caindo') - 0.05, T(5) - 0.02, { hora: W(4, 'hora') - 0.05, zoom: W(4, 'painel') - 0.35 });
  TEMA.clientes(T(5) - 0.02, W(5, 'sem') - 0.1, { historico: W(5, 'historico') - 0.1, whatsapp: W(5, 'whatsapp') - 0.1 });
  TEMA.semComissao(W(5, 'sem') - 0.1, T(6) - 0.05, [W(5, 'sem'), W(5, 'comissao'), W(5, 'por')], { sub: 'do sistema' });
  TEMA.prova(T(6) - 0.05, T(7) - 0.02);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'feito') - 0.03, 'FEITO POR'], [W(7, 'quem') - 0.03, 'QUEM TEM', { fontSize: '180px', color: '#fff' }], [W(7, 'doceria') - 0.03, 'DOCERIA.', { fontSize: '196px', color: '#fff' }]],
    botao: [W(7, 'fale') - 0.1, 'Quero ver funcionando'], toque: W(7, 'gente') + 0.25,
  });
  TEMA.fim([[0, T(1) - 0.05], [T(3) - 0.05, T(4) - 0.05], [W(5, 'sem') - 0.15, T(6) - 0.05], [T(6) - 0.1, D + 1]]);
})();
