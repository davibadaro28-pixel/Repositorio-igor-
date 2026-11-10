// v04a-curiosidade: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const ROSE = '#c25b74';
  TEMA.arco(0, T(1) + 0.2, { fotos: [[0, 'bombom-de-morango-leite-ninho'], [W(0, 'lindo') - 0.3, 'bolo-premium-ninho-com-morango']], linhas: [[0.1, 'Seu doce é'], [W(0, 'lindo') - 0.1, `<span class="ital" style="font-size:150px;color:${ROSE}">lindo.</span>`]] });
  TEMA.conversa(T(1) - 0.2, T(3) - 0.02, {
    x: 140, centro: W(2, 'foto') - 0.6,
    bolhas: [[W(1, 'foto') - 0.1, 'in', 'Oi! Tem foto do bolo?'], [W(1, 'whatsapp'), 'out', '@foto'], [W(1, 'decide') - 0.2, 'in', 'Hmm… não deu pra ver direito'], [W(2, 'lista') - 0.1, 'out', '@lista'], [W(2, 'pedido') - 0.5, 'in', 'Quero encomendar 1 bolo pra sábado!'], [W(2, 'perdido') - 0.1, 'in', 'Tem de morango?'], [W(2, 'perdido') + 0.12, 'in', 'Aceita pix?'], [W(2, 'meio'), 'in', 'Oi??'], [W(2, 'conversa') - 0.1, 'in', 'Alguém aí?']],
    borrada: W(2, 'borrada') - 0.2,
    notas: [[W(2, 'foto') - 0.05, 'foto borrada', 40, 640, -6], [W(2, 'lista') - 0.05, 'lista de preços', 775, 900, 4], [W(2, 'perdido') - 0.05, 'pedido perdido…', 40, 1150, -3]],
    perdido: [W(2, 'perdido'), 'Quero encomendar 1 bolo pra sábado!'], rolagem: [[W(2, 'lista') + 0.3, -260, 0.6], [W(2, 'perdido'), -560, 1.4]],
  });
  TEMA.vitrine(T(3), T(4) - 0.05, { brilho: W(3, 'vitrine'), titulo: [W(3, 'agora') - 0.1, `Agora, imagine<br><span style="color:${ROSE}">a sua vitrine assim.</span>`] });
  TEMA.temas(T(4) - 0.05, T(5) - 0.1, { leque: W(4, 'marca') - 0.25, cores: W(4, 'cores') - 0.1, fotos: W(4, 'fotos') });
  TEMA.fluxo(T(5) - 0.1, T(7) - 0.05, { categorias: W(5, 'categorias'), tamanhos: W(5, 'tamanhos'), encomenda: W(5, 'encomenda'), data: W(5, 'data') - 0.05, chega: W(6, 'chega') });
  TEMA.prova(T(7) - 0.05, T(8) - 0.3);
  TEMA.cta(T(8), { frase: [W(8, 'quem') - 0.05, `Quem vê, <span style="color:${ROSE}">tem vontade.</span>`], botao: [W(8, 'fale') - 0.1, 'Quero ver o meu cardápio'], toque: W(8, 'cardapio') + 0.4 });
  TEMA.fim([[0, T(1) - 0.05], [T(5) - 0.1, T(6) - 0.1], [T(7) - 0.1, D + 1]]);
})();
