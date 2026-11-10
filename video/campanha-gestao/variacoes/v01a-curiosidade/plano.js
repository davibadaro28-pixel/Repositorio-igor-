// V01a · Curiosidade: "Tem um cliente que você paga para atender."
(() => {
  const { T, W, D } = TEMA.init();
  const OR = '#ff5a1f';
  TEMA.cortes(0, T(1), [
    [0, 'bolo-premium-brigadeiro-com-morango', 'TEM UM'],
    [W(0, 'cliente') - 0.03, 'bombom-de-morango-leite-ninho', 'CLIENTE'],
    [W(0, 'paga') - 0.03, 'celular', 'QUE VOCÊ PAGA', OR],
    [W(0, 'atender') - 0.03, null, 'PARA<br>ATENDER'],
  ]);
  TEMA.fiel(T(1) - 0.1, T(2) - 0.05, { em: T(1), titulo: `E ELE JÁ<br>É <span style="color:${OR}">SEU</span>`, tTitulo: W(1, 'seu') - 0.05 });
  TEMA.fatia(T(2) - 0.05, T(3) - 0.02, { corte: W(2, 'parte'), sai: W(2, 'caminho') });
  TEMA.pontos(T(3) - 0.02, T(4) - 0.1, { acende: W(3, 'trazem') - 0.2, fiel: W(3, 'mas') - 0.05, fielTexto: 'PAGAR DE NOVO?' });
  TEMA.celular(T(4) - 0.1, W(4, 'cai'), { marca: W(4, 'marca'), pedido: W(4, 'pedido') });
  TEMA.painel(W(4, 'cai') - 0.05, T(5) - 0.02, { hora: W(4, 'hora') - 0.05, zoom: W(4, 'painel') - 0.35 });
  TEMA.semComissao(T(5), W(5, 'e') - 0.02, [W(5, 'sem'), W(5, 'comissao'), W(5, 'por')], { sub: 'do sistema' });
  TEMA.clientes(W(5, 'e') - 0.02, T(6) - 0.05, { historico: W(5, 'historico') - 0.1, whatsapp: W(5, 'whatsapp') - 0.1 });
  TEMA.prova(T(6) - 0.05, T(7) - 0.02);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'tenha') - 0.03, 'TENHA O SEU'], [W(7, 'canal') - 0.03, 'CANAL', { fontSize: '196px', color: '#fff' }], [W(7, 'proprio') - 0.03, 'PRÓPRIO.', { fontSize: '196px', color: '#fff' }]],
    botao: [W(7, 'fale') - 0.1, 'Quero meu canal próprio'], toque: W(7, 'gente') + 0.25,
  });
  TEMA.fim([[0, T(1) - 0.05], [T(1) - 0.05, T(2) - 0.05], [T(5) - 0.05, W(5, 'e') - 0.05], [T(6) - 0.1, D + 1]]);
})();
