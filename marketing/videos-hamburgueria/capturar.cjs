// Captura as telas e os fluxos reais do sistema (loja de demonstração "Sua Hamburgueria") para os vídeos.
// O servidor de demonstração precisa estar rodando:  LOJA=sua-hamburgueria npm run demo
// Uso: node capturar.cjs <pasta-saida> [url]
// Gera <pasta>/<nome>.jpg e <pasta>/fluxos.json (sequências de telas com o ponto de cada toque, em 0..1).
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const OUT = process.argv[2];
const U = process.argv[3] || 'http://localhost:3900';
fs.mkdirSync(OUT, { recursive: true });
const FLUXOS = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// itens do menu que não entram nos anúncios
const ESCONDE = 'a[href="/admin/integracoes"],a[href="/admin/fiscal"]{display:none!important}';

async function shot(page, nome, opts = {}) {
  await sleep(opts.espera ?? 700);
  await page.screenshot({ path: path.join(OUT, nome + '.jpg'), type: 'jpeg', quality: 90, fullPage: !!opts.full });
  return nome;
}
async function centro(page, loc) {
  const b = await loc.boundingBox();
  const vp = page.viewportSize();
  return { x: +((b.x + b.width / 2) / vp.width).toFixed(4), y: +((b.y + b.height / 2) / vp.height).toFixed(4) };
}
// registra a tela atual e o toque que leva à próxima
async function passo(fluxo, page, nome, loc, opts = {}) {
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(300);
  await shot(page, nome, opts);
  const toque = await centro(page, loc);
  (FLUXOS[fluxo] ||= []).push({ tela: nome, toque });
  await loc.click();
  await sleep(opts.depois ?? 900);
}
async function fim(fluxo, page, nome, opts = {}) {
  await shot(page, nome, opts);
  (FLUXOS[fluxo] ||= []).push({ tela: nome });
}
async function login(page, user = 'admin', pass = 'demo1234') {
  await page.goto(U + '/admin', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: ESCONDE });
  const i = page.locator('input');
  await i.nth(0).fill(user);
  await i.nth(1).fill(pass);
  await page.keyboard.press('Enter');
  await sleep(2200);
}
async function vai(page, rota) {
  await page.goto(U + rota, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: ESCONDE });
  await sleep(1300);
}

(async () => {
  const b = await chromium.launch();
  const mob = () => b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const desk = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await login(desk);

  // painel antes do pedido novo
  await vai(desk, '/admin/pedidos');
  await shot(desk, 'd_pedidos_antes');

  // ---------- pedido pelo cardápio (celular) ----------
  const m = await mob();
  await m.goto(U + '/', { waitUntil: 'networkidle' });
  await sleep(1200);
  await shot(m, 'm_menu_longo', { full: true });
  await m.evaluate(() => window.scrollTo(0, 0));
  await passo('pedido', m, 'p01_menu', m.locator('text=Smash Duplo').first());
  await passo('pedido', m, 'p02_produto', m.locator('text=Ao ponto').first(), { depois: 500 });
  const bacon = m.locator('[role=dialog] >> text=/^Bacon$/').first();
  await bacon.scrollIntoViewIfNeeded();
  const maisBacon = bacon.locator('xpath=ancestor::*[.//button][1]').locator('button').last();
  await passo('pedido', m, 'p03_adicionais', maisBacon, { depois: 600 });
  await passo('pedido', m, 'p04_bacon', m.locator('button:has-text("Adicionar")').last());
  // batata
  await passo('pedido', m, 'p05_menu_sacola', m.locator('text=Batata frita').first());
  const grande = m.locator('text=/Grande/').first();
  await passo('pedido', m, 'p06_batata', grande, { depois: 500 });
  await passo('pedido', m, 'p07_batata_grande', m.locator('button:has-text("Adicionar")').last());
  await passo('pedido', m, 'p08_sacola', m.locator('button:has-text("Ver sacola")').first());
  // finalizar
  const sel = m.locator('select').first();
  await sel.scrollIntoViewIfNeeded();
  await shot(m, 'p09_checkout');
  (FLUXOS.pedido ||= []).push({ tela: 'p09_checkout' });
  await m.getByLabel('Seu nome').fill('Rafael Souza');
  await m.getByLabel('WhatsApp').fill('11987654321');
  const opt = await sel.evaluate((s) => [...s.options].find((o) => o.text.includes('Jardim América'))?.value);
  await sel.selectOption(opt);
  await m.getByLabel('Rua / Avenida').fill('Rua das Palmeiras');
  await m.getByLabel('Número').fill('240');
  await sleep(500);
  await sel.evaluate((s) => s.scrollIntoView({ block: 'start' }));
  await sleep(500);
  await shot(m, 'p10_endereco');
  (FLUXOS.pedido ||= []).push({ tela: 'p10_endereco' });
  const pix = m.locator('label:has-text("Pix")').first();
  await pix.scrollIntoViewIfNeeded();
  await pix.click();
  await passo('pedido', m, 'p11_pagamento', m.locator('button:has-text("Enviar pedido")').first(), { depois: 2500 });
  await fim('pedido', m, 'p12_recebido');
  const code = m.url().split('/pedido/')[1].split('?')[0];
  console.log('pedido', code);

  // painel depois do pedido novo
  await vai(desk, '/admin/pedidos');
  await shot(desk, 'd_pedidos_depois');
  const token = await desk.evaluate(() => localStorage.getItem('lacos_token'));
  const api = (url, body) => desk.evaluate(async ([u, bd, t]) => {
    const r = await fetch(u, { method: bd ? 'POST' : 'GET', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t }, body: bd ? JSON.stringify(bd) : undefined });
    return r.json();
  }, [url, body, token]);
  const lista = await api('/api/orders?status=novo');
  const novo = (Array.isArray(lista) ? lista : lista.orders || lista.items || []).find((o) => o.code === code);
  const oid = novo?.id;
  console.log('id do pedido', oid);

  // acompanhamento: o cliente vê o status mudar
  for (const [st, nome] of [['preparo', 'p13_preparo'], ['pronto', 'p14_pronto'], ['entrega', 'p15_saiu']]) {
    if (oid) await api(`/api/orders/${oid}/status`, { status: st });
    await m.reload({ waitUntil: 'networkidle' });
    await shot(m, nome, { espera: 1200 });
  }

  // ---------- combo ----------
  await m.goto(U + '/', { waitUntil: 'networkidle' });
  await sleep(1000);
  await passo('combo', m, 'c01_menu', m.locator('text=Combo Casal').first());
  for (const [k, item] of [['c02_combo', 'Clássico da Casa'], ['c03_um', 'Cheese Bacon']]) {
    const row = m.locator(`[role=dialog] >> text="${item}"`).first();
    await passo('combo', m, k, row.locator('xpath=ancestor::*[.//button][1]').locator('button').last(), { depois: 500 });
  }
  for (const [k, item] of [['c04_lanches', 'Coca-Cola lata 350 ml'], ['c05_bebida1', 'Guaraná lata 350 ml']]) {
    const row = m.locator(`[role=dialog] >> text="${item}"`).first();
    await passo('combo', m, k, row.locator('xpath=ancestor::*[.//button][1]').locator('button').last(), { depois: 500 });
  }
  await fim('combo', m, 'c06_pronto');

  // ---------- painel (computador) ----------
  for (const [rota, nome, extra] of [
    ['/admin', 'd_inicio'], ['/admin/cozinha', 'd_cozinha'], ['/admin/caixa', 'd_caixa'],
    ['/admin/produtos', 'd_produtos'], ['/admin/clientes', 'd_clientes'], ['/admin/cupons', 'd_cupons'],
    ['/admin/entregas', 'd_entregas'], ['/admin/usuarios', 'd_usuarios'], ['/admin/financeiro', 'd_contas'],
    ['/admin/configuracoes', 'd_config'],
  ]) { await vai(desk, rota); await shot(desk, nome); }

  await vai(desk, '/admin/relatorios');
  await shot(desk, 'd_relatorios_longo', { full: true });
  await vai(desk, '/admin/financeiro');
  await desk.locator('button:has-text("Fluxo de caixa")').first().click();
  await shot(desk, 'd_fluxo', { espera: 1500 });
  await vai(desk, '/admin/estoque');
  await shot(desk, 'd_estoque');
  await desk.locator('button:has-text("Custo dos produtos")').first().click();
  await shot(desk, 'd_cmv', { espera: 1500 });
  await desk.locator('tr:has-text("Cheese Bacon") button:has-text("Ficha")').first().click();
  await shot(desk, 'd_ficha', { espera: 1500 });
  await desk.keyboard.press('Escape');
  await vai(desk, '/admin/clientes');
  await desk.locator('button:has-text("Sumidos")').first().click();
  await shot(desk, 'd_sumidos', { espera: 1500 });
  await desk.locator('button:has-text("Aniversariantes")').first().click();
  await shot(desk, 'd_aniversariantes', { espera: 1500 });
  await vai(desk, '/admin/entregas');
  await desk.locator('button:has-text("Bairros e taxas")').first().click();
  await shot(desk, 'd_bairros', { espera: 1500 });
  await desk.locator('button:has-text("Acerto")').first().click();
  await shot(desk, 'd_acerto', { espera: 1500 });
  await vai(desk, '/admin/cupons');
  await desk.locator('button:has-text("Novo cupom")').first().click();
  await shot(desk, 'd_cupom_novo', { espera: 1200 });
  await desk.keyboard.press('Escape');

  // divulgar: link e QR Code do cardápio
  await vai(desk, '/admin/configuracoes');
  await desk.locator('button:has-text("Divulgar cardápio")').first().click().catch(() => {});
  await shot(desk, 'd_divulgar', { espera: 1500 });

  // esgotado com um toque
  await vai(desk, '/admin/produtos');
  const linha = desk.locator('div,li,tr').filter({ hasText: 'Smash Triplo' }).filter({ has: desk.locator('button[role=switch], input[type=checkbox], button[aria-pressed]') }).last();
  const sw = linha.locator('button[role=switch], input[type=checkbox], button[aria-pressed]').first();
  if (await sw.count()) {
    const t = await centro(desk, sw);
    await shot(desk, 'g01_produtos');
    await sw.click();
    await shot(desk, 'g02_esgotado', { espera: 1200 });
    FLUXOS.esgotado = [{ tela: 'g01_produtos', toque: t }, { tela: 'g02_esgotado' }];
    await sw.click();
    await sleep(800);
  }

  // pausar pedidos (cozinha lotada)
  await vai(desk, '/admin/pedidos');
  const pausa = desk.locator('text=Recebendo pedidos').first();
  if (await pausa.count()) {
    const t = await centro(desk, pausa);
    await shot(desk, 'h01_recebendo');
    await pausa.click();
    await sleep(700);
    const ok = desk.locator('[role=dialog] button').filter({ hasText: /Pausar|Confirmar|Sim/ }).first();
    if (await ok.count()) await ok.click();
    await shot(desk, 'h02_pausado', { espera: 1200 });
    FLUXOS.pausa = [{ tela: 'h01_recebendo', toque: t }, { tela: 'h02_pausado' }];
    const volta = desk.locator('text=/Pausado|Pedidos pausados|Recebendo pedidos/').first();
    await volta.click().catch(() => {});
    await sleep(700);
    const ok2 = desk.locator('[role=dialog] button').filter({ hasText: /Retomar|Confirmar|Sim/ }).first();
    if (await ok2.count()) await ok2.click();
  }

  // cozinha: marca um pedido como pronto
  await vai(desk, '/admin/cozinha');
  const pronto = desk.locator('button:has-text("Pronto")').first();
  const tq = await centro(desk, pronto);
  await shot(desk, 'k01_cozinha');
  await pronto.click();
  await shot(desk, 'k02_cozinha_pronto', { espera: 1500 });
  FLUXOS.cozinha = [{ tela: 'k01_cozinha', toque: tq }, { tela: 'k02_cozinha_pronto' }];

  // balcão (PDV)
  await vai(desk, '/admin/pdv');
  await shot(desk, 'v01_pdv');
  FLUXOS.pdv = [];
  for (const [i, item] of ['Smash Duplo', 'Batata frita'].entries()) {
    const card = desk.locator(`text="${item}"`).first();
    const t = await centro(desk, card);
    if (i > 0) await shot(desk, `v0${i + 1}_pdv`);
    FLUXOS.pdv.push({ tela: i ? `v0${i + 1}_pdv` : 'v01_pdv', toque: t });
    await card.click();
    await sleep(900);
    const dlg = desk.locator('[role=dialog]');
    if (await dlg.count()) {
      const op = dlg.locator('text=/Ao ponto$|Grande/').first();
      if (await op.count()) await op.click();
      await sleep(300);
      await dlg.locator('button:has-text("Adicionar")').last().click().catch(() => {});
      await sleep(800);
    }
  }
  await shot(desk, 'v03_pdv');
  FLUXOS.pdv.push({ tela: 'v03_pdv' });

  // ---------- celular: painel e entregador ----------
  const pm = await mob();
  await pm.goto(U + '/admin', { waitUntil: 'networkidle' });
  await pm.evaluate((t) => localStorage.setItem('lacos_token', t), token);
  for (const [rota, nome, full] of [['/admin', 'm_inicio_longo', true], ['/admin', 'm_inicio'], ['/admin/pedidos', 'm_pedidos'], ['/admin/relatorios', 'm_relatorios_longo', true]]) {
    await pm.goto(U + rota, { waitUntil: 'networkidle' });
    await pm.addStyleTag({ content: ESCONDE });
    await sleep(1500);
    await shot(pm, nome, { full });
  }
  const ent = await mob();
  await ent.goto(U + '/entregador', { waitUntil: 'networkidle' });
  const ei = ent.locator('input');
  if (await ei.count()) { await ei.nth(0).fill('motoboy'); await ei.nth(1).fill('moto123'); await ent.keyboard.press('Enter'); }
  await sleep(2000);
  await shot(ent, 'e01_entregador');
  await shot(ent, 'e02_entregador_longo', { full: true });

  fs.writeFileSync(path.join(OUT, 'fluxos.json'), JSON.stringify(FLUXOS, null, 1));
  await b.close();
  console.log('ok', Object.keys(FLUXOS));
})().catch((e) => { console.error('FALHOU', e); process.exit(1); });
