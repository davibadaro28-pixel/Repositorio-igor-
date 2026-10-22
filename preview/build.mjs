// Gera a prévia do sistema que roda inteira no navegador (para publicar como página estática).
// Uso: node preview/build.mjs [pasta-de-saída]   (padrão: preview-dist)
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] || join(root, 'preview-dist'));
const tmp = join(out, '.build');
const shims = join(root, 'preview', 'shims');
const SQLJS = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-asm.js';

rmSync(out, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

// 1) servidor (rotas, regras e banco) empacotado para o navegador
await build({
  configFile: false,
  logLevel: 'warn',
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
  plugins: [react(), tailwindcss()],
  define: { __PREVIEW__: 'true', 'process.env.NODE_ENV': JSON.stringify('production') },
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

const page = `<title>Sistema Laços de Mãe</title>
<meta name="description" content="Prévia do sistema de gestão da Laços de Mãe – Bolos e Doces">
<meta name="theme-color" content="#973358">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap">
<style>${safe(css, 'style')}
body{font-family:var(--font-sans);font-size:16px;line-height:1.5;background:#fff9f6}
#boot{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff9f6;color:#7d2949;font-family:Poppins,ui-sans-serif,system-ui,sans-serif}
#boot img{width:96px;height:96px;border-radius:50%;box-shadow:0 0 0 4px #fbe4ea}
#boot p{margin:0;font-size:15px}
#boot .bar{width:160px;height:4px;border-radius:4px;background:#fbe4ea;overflow:hidden}
#boot .bar i{display:block;width:40%;height:100%;background:#c24d6d;border-radius:4px;animation:boot 1.1s ease-in-out infinite}
@keyframes boot{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@media (prefers-reduced-motion: reduce){#boot .bar i{animation:none;width:100%}}
</style>
<div id="root"><div id="boot"><img src="img/logo.jpg" alt=""><p>Preparando a demonstração…</p><div class="bar"><i></i></div></div></div>
<script src="${SQLJS}"></script>
<script>${safe(backend, 'script')}</script>
<script>${safe(app, 'script')}</script>
`;
writeFileSync(join(out, 'index.html'), page);

// fotos dos produtos e logo
mkdirSync(join(out, 'img', 'produtos'), { recursive: true });
cpSync(join(root, 'web', 'public', 'img', 'logo.jpg'), join(out, 'img', 'logo.jpg'));
cpSync(join(root, 'web', 'public', 'img', 'produtos'), join(out, 'img', 'produtos'), { recursive: true });
rmSync(tmp, { recursive: true, force: true });

console.log(`Prévia gerada em ${out} (${(page.length / 1024).toFixed(0)} KB + ${readdirSync(join(out, 'img', 'produtos')).length} fotos)`);
