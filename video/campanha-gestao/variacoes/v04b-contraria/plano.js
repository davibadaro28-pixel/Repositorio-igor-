// v04b-contraria: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const ROSE = '#c25b74';
  TEMA.titulo(0, T(1) - 0.05, [[0.03, 'Cada passo'], [W(0, 'vontade') - 0.1, `entre a <span style="color:${ROSE}">vontade</span>`], [W(0, 'pedido') - 0.1, 'e o pedido'], [W(0, 'chance') - 0.1, 'é uma chance de', { fontSize: '64px' }], [W(0, 'desistir') - 0.1, '<span style="color:#c0392b">desistir.</span>', { fontSize: '110px' }]], { top: 460 });
  TEMA.conversa(T(1) - 0.1, T(2) - 0.02, {
    bolhas: [[W(1, 'pede') - 0.1, 'in', 'Oi! Me manda o cardápio?'], [W(1, 'espera') + 0.25, 'in', '…'], [W(1, 'le') - 0.1, 'out', '@lista'], [W(1, 'pergunta') - 0.1, 'in', 'Quanto é o de morango?'], [W(1, 'espera', 1), 'in', 'Oi??']],
    notas: [[W(1, 'espera') + 0.1, 'espera…', 40, 700, -6], [W(1, 'espera', 1) + 0.1, 'espera de novo…', 760, 1050, 4]],
    rolagem: [[W(1, 'pergunta'), -200, 0.6]],
  });
  TEMA.fluxo(T(2) - 0.1, T(4) - 0.05, { tamanhos: W(2, 'escolhe') - 0.1, encomenda: W(2, 'marca') - 0.2, data: W(2, 'data'), chega: W(3, 'chega'), semPerder: W(3, 'sem'), rotulos: { tamanhos: 'Vê a foto, escolhe o tamanho', encomenda: 'Data e hora', chega: 'Pedido completo.' } });
  TEMA.temas(T(4) - 0.05, T(5) - 0.1, { leque: W(4, 'marca') - 0.25, cores: W(4, 'cores') - 0.1, fotos: W(4, 'fotos') });
  TEMA.prova(T(5) - 0.05, T(6) - 0.3);
  TEMA.cta(T(6), { frase: [W(6, 'fale') - 0.05, `Veja <span style="color:${ROSE}">o seu.</span>`], botao: [W(6, 'veja') - 0.1, 'Quero ver o meu cardápio'], toque: W(6, 'seu') + 0.4 });
  TEMA.fim([[0, T(1) - 0.05], [T(5) - 0.1, D + 1]]);
})();
