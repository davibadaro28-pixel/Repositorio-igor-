// v01b-contraria: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const OR = '#ff5a1f';
  TEMA.pontos(0, T(2) - 0.05, { acende: 0.05, titulo: `APP DE <span style="color:${OR}">DELIVERY</span>`, ok: [W(0, 'otimo') - 0.05, 'ÓTIMO PARA ACHAR CLIENTE'], fiel: W(1, 'pessimo') - 0.1, fielTexto: 'PÉSSIMO PARA<br>GUARDAR' });
  TEMA.fatia(T(2) - 0.05, T(3) - 0.02, { corte: W(2, 'parte'), sai: W(2, 'la') });
  TEMA.titulo(T(3), T(4) - 0.08, [[W(3, 'use') - 0.03, 'USE O APP'], [W(3, 'encontrado') - 0.05, 'PARA SER ENCONTRADO', { fontSize: '96px' }], [W(3, 'caminho') - 0.1, 'E DÊ UM CAMINHO', { fontSize: '120px' }], [W(3, 'direto') - 0.05, 'DIRETO', { fontSize: '200px', color: OR }]], { top: 470 });
  TEMA.celular(T(4) - 0.1, W(4, 'cai'), { marca: W(4, 'marca'), pedido: W(4, 'pedido') });
  TEMA.painel(W(4, 'cai') - 0.05, T(5) - 0.02, { hora: W(4, 'hora') - 0.05, zoom: W(4, 'painel') - 0.35 });
  TEMA.semComissao(T(5), T(6) - 0.05, [W(5, 'sem'), W(5, 'comissao'), W(5, 'por'), W(5, 'sistema')], { sub: 'do sistema' });
  TEMA.prova(T(6) - 0.05, T(7) - 0.02);
  TEMA.cta(T(7), {
    linhas: [[W(7, 'quer') - 0.03, 'QUER VER'], [W(7, 'sua') - 0.03, 'COM A SUA', { fontSize: '170px', color: '#fff' }], [W(7, 'marca') - 0.03, 'MARCA?', { fontSize: '196px', color: '#fff' }]],
    botao: [W(7, 'fale') - 0.1, 'Quero ver com a minha marca'], toque: W(7, 'gente') + 0.25,
  });
  TEMA.fim([[T(3) - 0.05, T(4) - 0.05], [T(5) - 0.05, T(6) - 0.05], [T(6) - 0.1, D + 1]]);
})();
