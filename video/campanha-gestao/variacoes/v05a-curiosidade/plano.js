// v05a-curiosidade: plano de cenas ligado às falas (tempos de cada palavra da narração)
(() => {
  const { T, W, D } = TEMA.init();
  const MG = '#ff2e7e';
  TEMA.gancho(0, T(2) - 0.12, {
    linhas: [[0, 'Você abriu', 520, 104], [W(0, 'uma') - 0.03, 'uma doceria', 650, 104], [W(0, 'para') - 0.03, 'para', 820, 80, 'rgba(255,255,255,.6)'], [W(0, 'empreender') - 0.03, 'empreender…', 930, 88, MG]],
    recua: T(1) - 0.15, notas: ['Pedido atrasado!', 'Acabou o leite condensado', 'Cadê a encomenda das 15h?', 'Quanto vendi hoje?', 'O caixa não bate', 'Cliente sem resposta', 'Faltou embalagem'].map((n, i) => [W(1, 'ou') + 0.1 + i * 0.22, n]),
    fogo: [W(1, 'apagar') - 0.03, 'apagar incêndio'], tremer: W(1, 'dia') - 0.05, empurra: W(0, 'empreender'),
  });
  TEMA.relogio(T(2) - 0.12, T(8) - 0.1);
  TEMA.hora('08<b>:</b>00', T(2) - 0.1, T(3), 8.05);
  TEMA.caixa(T(2) - 0.12, T(3) - 0.02, { caixa: W(2, 'caixa') - 0.12 });
  TEMA.hora('10<b>:</b>00', T(3) - 0.05, T(4), 10);
  TEMA.encomendas(T(3) - 0.05, T(4) - 0.02, { lista: W(3, 'encomendas') });
  TEMA.hora('12<b>:</b>00', T(4) - 0.05, T(5), 12);
  TEMA.pedidos(T(4) - 0.05, W(4, 'cozinha') - 0.35, { zoom: W(4, 'todos') - 0.25, fimPan: W(4, 'cozinha') - 0.4 });
  TEMA.cozinha(W(4, 'cozinha') - 0.35, T(5) - 0.02, { sino: W(4, 'cozinha'), zoom: W(4, 'tudo') - 0.2 });
  TEMA.hora('15<b>:</b>00', T(5) - 0.05, T(6), 15);
  TEMA.estoque(T(5) - 0.05, T(6) - 0.02, { alerta: W(5, 'alerta') - 0.05 });
  TEMA.hora('18<b>:</b>00', T(6) - 0.05, T(7), 18);
  TEMA.resultado(T(6) - 0.05, T(7) - 0.02, { resultado: W(6, 'resultado') });
  TEMA.hora('<span style="font-size:150px">FIM DO MÊS</span>', T(7) - 0.05, T(8), 'fim');
  TEMA.dre(T(7) - 0.05, T(8) - 0.02, { dre: W(7, 'dre'), sobrou: W(7, 'sobrou') - 0.05 });
  TEMA.prova(T(8) - 0.05, T(9) - 0.05);
  TEMA.plataforma(T(9) - 0.05, W(9, 'fale') - 0.12, { computador: W(9, 'computador'), celular: W(9, 'celular') });
  TEMA.cta(W(9, 'fale') - 0.12, {
    linhas: [[W(9, 'fale') - 0.05, 'GESTÃO'], [W(9, 'com') - 0.05, 'DE VERDADE'], [W(9, 'gente') - 0.1, `<span style="color:${MG}">PARA DOCERIAS.</span>`, { fontSize: '84px' }]],
    botao: [W(9, 'gente') + 0.1, 'Fale com a gente →'], toque: W(9, 'gente') + 0.6, tSub: W(9, 'gente') + 0.3,
  });
  TEMA.fim([[0, T(2) - 0.15], [T(8) - 0.1, T(9) - 0.1], [W(9, 'fale') - 0.15, D + 1]]);
})();
