// Mede, no sistema rodando, a caixa (x, y, largura, altura em 0..1 da tela 1440x900) de elementos usados
// como foco e destaque nos vídeos. Grava telas/caixas.json. O demo precisa estar no ar (porta 3900).
// Uso: node medir.cjs [url]
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const U = process.argv[2] || 'http://localhost:3900';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ESCONDE = 'a[href="/admin/integracoes"],a[href="/admin/fiscal"]{display:none!important}';

// [nome, rota, aba (botão a clicar antes) ou null, função que devolve o elemento]
const ALVOS = [
  ['inicio_vendas', '/admin', null, (p) => p.locator('text=Vendas hoje').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['inicio_ticket', '/admin', null, (p) => p.locator('text=Ticket médio').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['inicio_maisvendidos', '/admin', null, (p) => p.locator('text=Mais vendidos').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['inicio_estoque', '/admin', null, (p) => p.locator('text=Estoque baixo').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['inicio_grafico', '/admin', null, (p) => p.locator('text=Faturamento dos últimos 30 dias').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['caixa_gaveta', '/admin/caixa', null, (p) => p.locator('text=Dinheiro esperado').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['caixa_formas', '/admin/caixa', null, (p) => p.locator('text=Recebido por forma de pagamento').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['caixa_botoes', '/admin/caixa', null, (p) => p.locator('button:has-text("Sangria")').first()],
  ['cmv_tabela', '/admin/estoque', 'Custo dos produtos', (p) => p.locator('table').first()],
  ['cmv_th', '/admin/estoque', 'Custo dos produtos', (p) => p.locator('th:has-text("CMV")').first()],
  ['estoque_tabela', '/admin/estoque', null, (p) => p.locator('table').first()],
  ['clientes_tabela', '/admin/clientes', null, (p) => p.locator('table').first()],
  ['clientes_abas', '/admin/clientes', null, (p) => p.locator('button:has-text("Sumidos")').first().locator('xpath=..')],
  ['clientes_sumidos', '/admin/clientes', null, (p) => p.locator('button:has-text("Sumidos")').first()],
  ['clientes_pontos_th', '/admin/clientes', null, (p) => p.locator('th:has-text("Pontos")').first()],
  ['aniv_tabela', '/admin/clientes', 'Aniversariantes', (p) => p.locator('table').first()],
  ['cupons_tabela', '/admin/cupons', null, (p) => p.locator('table').first()],
  ['bairros_tabela', '/admin/entregas', 'Bairros e taxas', (p) => p.locator('table').first()],
  ['acerto_tabela', '/admin/entregas', 'Acerto', (p) => p.locator('table').first()],
  ['usuarios_perfis', '/admin/usuarios', null, (p) => p.locator('text=Perfis').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['usuarios_tabela', '/admin/usuarios', null, (p) => p.locator('table').first()],
  ['contas_cards', '/admin/financeiro', null, (p) => p.locator('text=A pagar').first().locator('xpath=ancestor::div[contains(@class,"grid")][1]')],
  ['contas_tabela', '/admin/financeiro', null, (p) => p.locator('table').first()],
  ['fluxo_grafico', '/admin/financeiro', 'Fluxo de caixa', (p) => p.locator('text=Saldo de cada dia').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['fluxo_cards', '/admin/financeiro', 'Fluxo de caixa', (p) => p.locator('text=Entradas no período').first().locator('xpath=ancestor::div[contains(@class,"grid")][1]')],
  ['produtos_lista', '/admin/produtos', null, (p) => p.locator('text=Smash Clássico').first().locator('xpath=ancestor::div[contains(@class,"rounded")][2]')],
  ['produtos_triplo', '/admin/produtos', null, (p) => p.locator('div,li').filter({ hasText: 'Smash Triplo' }).filter({ has: p.locator('button:has-text("Editar")') }).last()],
  ['pedidos_toggle', '/admin/pedidos', null, (p) => p.locator('text=Recebendo pedidos').first().locator('xpath=..')],
  ['cozinha_cards', '/admin/cozinha', null, (p) => p.locator('text=Total a produzir').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]')],
  ['pdv_carrinho', '/admin/pdv', null, (p) => p.locator('button:has-text("Finalizar")').first().locator('xpath=ancestor::div[contains(@class,"flex-col")][1]')],
];
const SECOES = [   // posição (0..1) de títulos na página longa de relatórios
  ['/admin/relatorios', ['Faturamento por dia', 'Pedidos por horário', 'dia da semana', 'Produtos mais vendidos', 'Bairros', 'Formas de pagamento', 'Categorias']],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(U + '/admin', { waitUntil: 'networkidle' });
  const i = p.locator('input'); await i.nth(0).fill('admin'); await i.nth(1).fill('demo1234'); await p.keyboard.press('Enter'); await sleep(2000);
  const out = {};
  for (const [nome, rota, aba, fn] of ALVOS) {
    try {
      await p.goto(U + rota, { waitUntil: 'networkidle' }); await p.addStyleTag({ content: ESCONDE }); await sleep(1000);
      if (aba) { await p.locator(`button:has-text("${aba}")`).first().click(); await sleep(1200); }
      const bb = await fn(p).boundingBox();
      out[nome] = [bb.x / 1440, bb.y / 900, bb.width / 1440, bb.height / 900].map((v) => +v.toFixed(4));
    } catch (e) { console.log('não achou', nome, e.message.split('\n')[0]); }
  }
  for (const [rota, titulos] of SECOES) {
    await p.goto(U + rota, { waitUntil: 'networkidle' }); await sleep(1500);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (const t of titulos) {
      const loc = p.locator(`text=${t}`).first();
      if (await loc.count()) { const y = await loc.evaluate((e) => e.getBoundingClientRect().top + window.scrollY); out['rel_' + t] = +(y / H).toFixed(4); }
    }
    out.rel_altura = H;
  }
  // celular: relatórios longo
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(U + '/admin', { waitUntil: 'networkidle' });
  await m.evaluate((t) => localStorage.setItem('lacos_token', t), await p.evaluate(() => localStorage.getItem('lacos_token')));
  await m.goto(U + '/admin/relatorios', { waitUntil: 'networkidle' }); await sleep(1500);
  const Hm = await m.evaluate(() => document.documentElement.scrollHeight);
  for (const t of SECOES[0][1]) {
    const loc = m.locator(`text=${t}`).first();
    if (await loc.count()) { const y = await loc.evaluate((e) => e.getBoundingClientRect().top + window.scrollY); out['mrel_' + t] = +(y / Hm).toFixed(4); }
  }
  out.mrel_altura = Hm;
  fs.writeFileSync(path.join(__dirname, 'telas', 'caixas.json'), JSON.stringify(out, null, 1));
  console.log(Object.keys(out).length, 'medidas');
  await b.close();
})();
