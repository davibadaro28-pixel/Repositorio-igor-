// v05c-lista: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const MG = '#ff2e7e';
  TEMA.titulo(0, T(1) - 0.05, [[0.03, `<span style="color:${MG};font-size:260px;line-height:1">5</span>`], [W(0, 'coisas') - 0.05, 'COISAS QUE VOCÊ', { fontSize: '76px' }], [W(0, 'cabeca') - 0.1, 'FAZ DE CABEÇA', { fontSize: '76px' }], [W(0, 'tela') - 0.3, `<span style="color:${MG}">E PODIA VER NUMA TELA</span>`, { fontSize: '56px' }]], { top: 360 });
  TEMA.relogio(T(1) - 0.1, T(6) - 0.1, { barra: false });
  TEMA.hora('1<b>/</b>5', T(1) - 0.05, T(2));
  TEMA.encomendas(T(1) - 0.05, T(2) - 0.02, { lista: W(1, 'encomendas') });
  TEMA.hora('2<b>/</b>5', T(2) - 0.05, T(3));
  TEMA.pedidos(T(2) - 0.05, T(3) - 0.02, { zoom: W(2, 'todos') - 0.2 });
  TEMA.hora('3<b>/</b>5', T(3) - 0.05, T(4));
  TEMA.estoque(T(3) - 0.05, T(4) - 0.02, { alerta: W(3, 'abaixo') - 0.05 });
  TEMA.hora('4<b>/</b>5', T(4) - 0.05, T(5));
  TEMA.clientes(T(4) - 0.05, T(5) - 0.02, { historico: W(4, 'clientes') - 0.1, fidelidade: W(4, 'fieis') - 0.1 });
  TEMA.hora('5<b>/</b>5', T(5) - 0.05, T(6));
  TEMA.dre(T(5) - 0.05, T(6) - 0.02, { dre: W(5, 'quanto'), sobrou: W(5, 'sobrou') - 0.05 });
  TEMA.plataforma(T(6) - 0.05, T(7) - 0.05, { computador: W(6, 'computador'), celular: W(6, 'celular') });
  TEMA.prova(T(7) - 0.05, T(8) - 0.05);
  TEMA.cta(T(8), {
    linhas: [[W(8, 'quer') - 0.05, 'QUER VER'], [W(8, 'pratica') - 0.1, `<span style="color:${MG}">NA PRÁTICA?</span>`]],
    botao: [W(8, 'fale') - 0.1, 'Fale com a gente →'], toque: W(8, 'gente') + 0.45,
  });
  TEMA.fim([[0, T(1) - 0.05], [T(7) - 0.1, D + 1]]);
})();
