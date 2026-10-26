// Gera a prévia do sistema que roda inteira no navegador (para publicar como página estática).
// Uso: node preview/build.mjs [pasta-de-saída] [--marca=generica] [--contato=5511999999999]
//   --marca=generica  demonstração de vendas com o nome "Sua Doceria Aqui" (sem dados da loja original)
//   --contato         WhatsApp de quem vende o sistema (botão "Quero para minha doceria")
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BRANDED_PHOTOS } from '../server/brand-photos.js';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] || '';
const marca = opt('marca') === 'generica' ? 'generica' : 'lacos';
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
    },
  },
  define: {
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
  define: { __PREVIEW__: 'true', __MARCA__: JSON.stringify(marca), __CONTATO__: JSON.stringify(contato), 'process.env.NODE_ENV': JSON.stringify('production') },
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
const page = `<title>${generica ? 'Sistema para Docerias' : 'Sistema Laços de Mãe'}</title>
<meta name="description" content="${generica ? 'Demonstração: cardápio digital, pedidos, PDV, delivery, iFood, 99Food e nota fiscal para docerias' : 'Prévia do sistema de gestão da Laços de Mãe – Bolos e Doces'}">
<meta name="theme-color" content="#973358">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap">
<style>${safe(css, 'style')}
body{font-family:var(--font-sans);font-size:16px;line-height:1.5;background:#fff9f6}
#boot{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff9f6;color:#7d2949;font-family:Poppins,ui-sans-serif,system-ui,sans-serif}
#boot img{width:96px;height:96px;border-radius:50%;box-shadow:0 0 0 4px #fbe4ea}
#boot p{margin:0;font-size:15px}
#boot .mark{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;font-size:44px;background:linear-gradient(135deg,#c24d6d,#7d2949);box-shadow:0 0 0 4px #fbe4ea}
#boot .bar{width:160px;height:4px;border-radius:4px;background:#fbe4ea;overflow:hidden}
#boot .bar i{display:block;width:40%;height:100%;background:#c24d6d;border-radius:4px;animation:boot 1.1s ease-in-out infinite}
@keyframes boot{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@media (prefers-reduced-motion: reduce){#boot .bar i{animation:none;width:100%}}
</style>
<div id="root"><div id="boot">${generica ? '<div class="mark">🎂</div>' : '<img src="img/logo.jpg" alt="">'}<p>Preparando a demonstração…</p><div class="bar"><i></i></div></div></div>
<script src="${SQLJS}"></script>
<script>${safe(backend, 'script')}</script>
<script>${safe(app, 'script')}</script>
`;
writeFileSync(join(out, 'index.html'), page);

// fotos dos produtos e logo
mkdirSync(join(out, 'img', 'produtos'), { recursive: true });
if (!generica) cpSync(join(root, 'web', 'public', 'img', 'logo.jpg'), join(out, 'img', 'logo.jpg'));
cpSync(join(root, 'web', 'public', 'img', 'produtos'), join(out, 'img', 'produtos'), { recursive: true });
if (generica) {
  for (const f of BRANDED_PHOTOS) rmSync(join(out, 'img', 'produtos', f), { force: true });
  for (const f of readdirSync(join(out, 'img', 'produtos')).filter((x) => x.includes('delicia-da-lacos'))) {
    renameSync(join(out, 'img', 'produtos', f), join(out, 'img', 'produtos', f.replace('delicia-da-lacos', 'delicia-da-casa')));
  }
}
rmSync(tmp, { recursive: true, force: true });

console.log(`Prévia (${generica ? 'Sua Doceria Aqui' : 'Laços de Mãe'}) gerada em ${out} (${(page.length / 1024).toFixed(0)} KB + ${readdirSync(join(out, 'img', 'produtos')).length} fotos)`);
