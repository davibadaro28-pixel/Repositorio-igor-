// Gera a prévia do sistema que roda inteira no navegador (para publicar como página estática).
// Uso: node preview/build.mjs [pasta-de-saída] [--loja=vs-burger] [--marca=generica] [--contato=5511999999999]
//   --loja            pasta em lojas/ (padrão: lacos-de-mae)
//   --marca=generica  demonstração de vendas com o nome "Sua Doceria Aqui" (sem dados da loja original)
//   --contato         WhatsApp de quem vende o sistema (botão "Quero para minha doceria")
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BRANDED_PHOTOS } from '../server/brand-photos.js';
import { fontHref, palette, themeColor, themeCss } from '../shared/theme.js';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] || '';
const marca = opt('marca') === 'generica' ? 'generica' : 'lacos';
// a demonstração genérica é feita a partir da Laços de Mãe
const loja = marca === 'generica' ? 'lacos-de-mae' : (opt('loja') || 'lacos-de-mae').replace(/[^a-z0-9-]/g, '');
const lojaDir = join(root, 'lojas', loja);
const lojaCfg = JSON.parse(readFileSync(join(lojaDir, 'loja.json'), 'utf8'));
const contato = opt('contato').replace(/\D/g, '');
const out = resolve(args.find((a) => !a.startsWith('--')) || join(root, 'preview-dist'));
const tmp = join(out, '.build');
const shims = join(root, 'preview', 'shims');
const SQLJS = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-asm.js';

rmSync(out, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

// Demonstração de vendas: os dados da loja original não entram no arquivo publicado (nem no código-fonte)
const GENERIC_REPLACE = [
  ['Laços de Mãe Bolos e Doces', 'Sua Doceria Aqui Ltda'],
  ['Laços de Mãe', 'Sua Doceria Aqui'],
  ['Delicia da Laços', 'Delícia da Casa'],
  ['da Laços', 'da Casa'],
  ['delicia-da-lacos', 'delicia-da-casa'],
  ['Há 10 anos espalhando o sabor que traz lembranças', 'Bolos, doces e encomendas feitos com carinho'],
  ['5511963406419', ''],
  ['(11) 96340-6419', ''],
  ['lacos_de_mae', ''],
  ['Av. Boturussu, 1785 – Parque Boturussu, São Paulo – SP, 03801-000', 'Rua Exemplo, 100 – São Paulo – SP'],
  // o que sobrar (padrões de busca da troca de marca, chaves internas do navegador)
  ['Laços', 'Casa'],
  ['lacos', 'doceria'],
];
const genericData = {
  name: 'marca-generica',
  transform(code) {
    if (marca !== 'generica') return null;
    let out = code;
    for (const [from, to] of GENERIC_REPLACE) out = out.split(from).join(to);
    return out === code ? null : { code: out, map: null };
  },
};

// 1) servidor (rotas, regras e banco) empacotado para o navegador
await build({
  configFile: false,
  logLevel: 'warn',
  plugins: [genericData],
  resolve: {
    alias: {
      'node:sqlite': join(shims, 'sqlite.js'),
      'node:fs': join(shims, 'node.js'),
      'node:path': join(shims, 'node.js'),
      'node:url': join(shims, 'node.js'),
      'node:os': join(shims, 'node.js'),
      'node:crypto': join(shims, 'node.js'),
      express: join(shims, 'express.js'),
      '@loja': lojaDir,
    },
  },
  define: {
    'process.env.LOJA': JSON.stringify(loja),
    'process.env.DB_PATH': JSON.stringify(':memory:'),
    'process.env.ADMIN_PASSWORD': JSON.stringify('demo1234'),
    'process.env.UPLOAD_DIR': JSON.stringify('/uploads'),
    __MARCA__: JSON.stringify(marca),
  },
  build: {
    outDir: join(tmp, 'backend'),
    emptyOutDir: true,
    minify: true,
    lib: { entry: join(root, 'preview', 'backend.js'), formats: ['iife'], name: 'LacosBackend', fileName: () => 'backend.js' },
    // só executa depois que o SQLite do navegador estiver pronto
    rollupOptions: { output: { banner: 'window.__startBackend = function () {', footer: '};' } },
  },
});

// 2) telas (cardápio, painel, entregador) com rotas em memória
await build({
  configFile: false,
  logLevel: 'warn',
  root: join(root, 'web'),
  plugins: [react(), tailwindcss(), genericData],
  define: { __PREVIEW__: 'true', __MARCA__: JSON.stringify(marca), __CONTATO__: JSON.stringify(contato), __LOJA__: JSON.stringify(loja), 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: join(tmp, 'app'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: join(root, 'web', 'src', 'preview', 'main.jsx'), formats: ['iife'], name: 'LacosApp', fileName: () => 'app.js', cssFileName: 'app' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});

const safe = (code, tag) => code.replaceAll(`</${tag}`, `<\\/${tag}`);
const backend = readFileSync(join(tmp, 'backend', 'backend.js'), 'utf8');
const app = readFileSync(join(tmp, 'app', 'app.js'), 'utf8');
const css = readFileSync(join(tmp, 'app', readdirSync(join(tmp, 'app')).find((f) => f.endsWith('.css'))), 'utf8');

const generica = marca === 'generica';
const store = lojaCfg.store || {};
const theme = store.theme || {};
const lacos = theme.color === undefined || theme.color.toLowerCase() === '#973358';
const tone = lacos ? { 50: '#fdf2f5', 100: '#fbe4ea', 500: '#c24d6d', 700: '#7d2949' } : palette(theme.color);
const bg = theme.bg || (lacos ? '#fff9f6' : tone[50]);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const font = fontHref(theme);
const page = `<title>${generica ? 'Sistema para Docerias' : esc(`Sistema ${store.name}`)}</title>
<meta name="description" content="${generica ? 'Demonstração: cardápio digital, pedidos, PDV, delivery, iFood, 99Food e nota fiscal para docerias' : esc(`Prévia do sistema de gestão da ${[store.name, store.tagline].filter(Boolean).join(' – ')}`)}">
<meta name="theme-color" content="${themeColor(theme)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
${font ? `<link rel="stylesheet" href="${font}">` : ''}
<style>${safe(css, 'style')}
${themeCss(theme)}
body{font-family:var(--font-sans);font-size:16px;line-height:1.5;background:${bg}}
#boot{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:${bg};color:${tone[700]};font-family:Poppins,ui-sans-serif,system-ui,sans-serif}
#boot img{width:96px;height:96px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 4px ${tone[100]}}
#boot p{margin:0;font-size:15px}
#boot .mark{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;font-size:44px;background:linear-gradient(135deg,${tone[500]},${tone[700]});box-shadow:0 0 0 4px ${tone[100]}}
#boot .bar{width:160px;height:4px;border-radius:4px;background:${tone[100]};overflow:hidden}
#boot .bar i{display:block;width:40%;height:100%;background:${tone[500]};border-radius:4px;animation:boot 1.1s ease-in-out infinite}
@keyframes boot{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@media (prefers-reduced-motion: reduce){#boot .bar i{animation:none;width:100%}}
</style>
<div id="root"><div id="boot">${generica || !store.logo ? '<div class="mark">🎂</div>' : `<img src="${esc(store.logo.replace(/^\//, ''))}" alt="">`}<p>Preparando a demonstração…</p><div class="bar"><i></i></div></div></div>
<script src="${SQLJS}"></script>
<script>${safe(backend, 'script')}</script>
<script>${safe(app, 'script')}</script>
`;
writeFileSync(join(out, 'index.html'), page);

// fotos dos produtos, logo e ícones da loja
mkdirSync(join(out, 'img', 'produtos'), { recursive: true });
cpSync(join(lojaDir, 'public', 'img'), join(out, 'img'), { recursive: true });
if (generica) {
  for (const f of readdirSync(join(out, 'img')).filter((x) => x.startsWith('logo.'))) rmSync(join(out, 'img', f), { force: true });
  for (const f of BRANDED_PHOTOS) rmSync(join(out, 'img', 'produtos', f), { force: true });
  for (const f of readdirSync(join(out, 'img', 'produtos')).filter((x) => x.includes('delicia-da-lacos'))) {
    renameSync(join(out, 'img', 'produtos', f), join(out, 'img', 'produtos', f.replace('delicia-da-lacos', 'delicia-da-casa')));
  }
}
rmSync(tmp, { recursive: true, force: true });

console.log(`Prévia (${generica ? 'Sua Doceria Aqui' : store.name}) gerada em ${out} (${(page.length / 1024).toFixed(0)} KB + ${readdirSync(join(out, 'img', 'produtos')).length} fotos)`);
