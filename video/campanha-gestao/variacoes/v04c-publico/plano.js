// v04c-publico: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const ROSE = '#c25b74';
  TEMA.arco(0, T(2) - 0.1, { fotos: [[0, 'bolo-premium-ninho-com-morango'], [W(1, 'acabamento') - 0.1, 'bombom-de-morango-chocolate'], [W(1, 'foto') - 0.1, 'brownie-ninho-com-nutella'], [W(1, 'embalagem') - 0.1, 'bolo-no-pote-ninho-com-morango']], linhas: [[0.1, 'Para quem faz'], [W(0, 'doce') - 0.1, `<span class="ital" style="font-size:120px;color:${ROSE}">doce bonito</span>`], [W(1, 'cardapio') - 0.1, 'o cardápio precisa acompanhar.', { fontSize: '52px' }]] });
  TEMA.vitrine(T(2) - 0.1, W(2, 'logo') - 0.15, { brilho: W(2, 'digital') });
  TEMA.temas(W(2, 'logo') - 0.15, T(3) - 0.1, { leque: W(2, 'logo') - 0.15, cores: W(2, 'cores') - 0.1, fotos: W(2, 'fotos') });
  TEMA.fluxo(T(3) - 0.1, T(5) - 0.05, { categorias: W(3, 'categorias'), tamanhos: W(3, 'tamanhos'), encomenda: W(3, 'encomenda'), data: W(3, 'data'), chega: W(4, 'cai'), rotulos: { chega: 'Pedido organizado.' } });
  TEMA.prova(T(5) - 0.05, T(6) - 0.3);
  TEMA.cta(T(6), { frase: [W(6, 'quem') - 0.05, `Quem vê, <span style="color:${ROSE}">tem vontade.</span>`], botao: [W(6, 'crie') - 0.1, 'Crie o seu cardápio personalizado'], toque: W(6, 'personalizado') + 0.4 });
  TEMA.fim([[0, T(2) - 0.1], [T(3) - 0.1, T(4) - 0.1], [T(5) - 0.1, D + 1]]);
})();
