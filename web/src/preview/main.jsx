import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { Store, LayoutDashboard, Bike, RotateCcw, KeyRound } from 'lucide-react';
import '../index.css';
import { ToastProvider, useToast, cx } from '../components/ui.jsx';
import { api, setToken } from '../lib/api.js';
import { todayISO } from '../lib/format.js';
import App from '../App.jsx';

// Prévia: o sistema inteiro roda no navegador, com dados de demonstração guardados neste aparelho.
const SAVE_KEY = 'lacos_preview_db_v4';

if (!Map.groupBy) {
  Map.groupBy = (list, fn) => list.reduce((m, x) => m.set(fn(x), [...(m.get(fn(x)) || []), x]), new Map());
}

const toBase64 = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    // dados de outro dia ficam desatualizados (pedidos "de hoje" viram antigos): começa de novo
    if (saved?.day === todayISO()) return fromBase64(saved.db);
  } catch {
    /* armazenamento indisponível */
  }
  return null;
}

window.__lacosSave = (bytes) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ day: todayISO(), db: toBase64(bytes) }));
  } catch {
    /* sem espaço ou bloqueado: a prévia continua só nesta aba */
  }
};

function installLocalApi() {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('/api/')) return realFetch(input, init);
    await new Promise((r) => setTimeout(r, 25));
    const body = init.body ? JSON.parse(init.body) : undefined;
    const out = await window.__lacosBackend.request((init.method || 'GET').toUpperCase(), url, init.headers || {}, body);
    return new Response(out.body, { status: out.status, headers: out.headers });
  };

  const RealEventSource = window.EventSource;
  class LocalEventSource {
    constructor(url) {
      this.listeners = {};
      this.readyState = 1;
      this.stop = window.__lacosBackend.stream(url, (event, data) => (this.listeners[event] || []).forEach((fn) => fn({ data })));
    }
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    }
    removeEventListener(type, fn) {
      this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn);
    }
    close() {
      this.readyState = 2;
      this.stop?.();
    }
  }
  window.EventSource = function EventSourceShim(url, opts) {
    return String(url).startsWith('/api/') ? new LocalEventSource(url) : new RealEventSource(url, opts);
  };
}

const VIEWS = [
  { key: 'cliente', label: 'Cardápio do cliente', short: 'Cliente', icon: Store, path: '/' },
  { key: 'loja', label: 'Painel da loja', short: 'Loja', icon: LayoutDashboard, path: '/admin', login: ['admin', 'demo1234'] },
  { key: 'entregador', label: 'App do entregador', short: 'Entregador', icon: Bike, path: '/entregador', login: ['motoboy', 'moto123'] },
];

function DemoBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showLogins, setShowLogins] = useState(false);
  const current = pathname.startsWith('/admin') ? 'loja' : pathname.startsWith('/entregador') ? 'entregador' : 'cliente';

  const go = async (v) => {
    if (v.login) {
      const r = await api.post('/auth/login', { login: v.login[0], password: v.login[1] });
      setToken(r.token);
    }
    navigate(v.path);
  };

  const reset = () => {
    if (!confirmReset) return setConfirmReset(true);
    window.__lacosBackend.reset();
    setToken(null);
    setConfirmReset(false);
    navigate('/');
    toast('Dados de demonstração restaurados');
  };

  return (
    <div className="relative z-[45] bg-stone-900 text-stone-100">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5 pl-[max(12px,env(safe-area-inset-left,0px))] pr-[max(12px,env(safe-area-inset-right,0px))] text-xs">
        <span className="hidden font-semibold uppercase tracking-wider text-brand-200 sm:inline">Prévia</span>
        <div className="flex rounded-lg bg-stone-800 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => go(v)}
              className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition cursor-pointer', current === v.key ? 'bg-white text-stone-900' : 'text-stone-300 hover:text-white')}
            >
              <v.icon className="size-3.5" />
              <span className="sm:hidden">{v.short}</span>
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowLogins(!showLogins)} aria-label="Logins de demonstração" className="flex items-center gap-1 text-stone-300 hover:text-white cursor-pointer"><KeyRound className="size-3.5" /> <span className="hidden sm:inline">Logins</span></button>
        <button onClick={reset} onBlur={() => setConfirmReset(false)} aria-label="Reiniciar dados de demonstração" className={cx('flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer', confirmReset ? 'bg-red-600 text-white' : 'text-stone-300 hover:text-white')}>
          <RotateCcw className="size-3.5" /> {confirmReset ? 'Confirmar: apagar o que fiz' : <span className="hidden sm:inline">Reiniciar dados</span>}
        </button>
      </div>
      {showLogins && (
        <div className="border-t border-stone-800 px-3 py-2 text-xs text-stone-300">
          <div className="mx-auto max-w-[1600px]">
            Dados fictícios de demonstração, salvos só neste aparelho. Logins: <b className="text-white">admin / demo1234</b> · <b className="text-white">caixa / caixa123</b> · <b className="text-white">cozinha / cozinha123</b> · <b className="text-white">motoboy / moto123</b>
          </div>
        </div>
      )}
    </div>
  );
}

function fail(message) {
  document.getElementById('root').innerHTML = `<div style="padding:24px;font-family:sans-serif;color:#7d2949">Não foi possível iniciar a prévia: ${message}</div>`;
}

async function boot() {
  try {
    const SQL = await window.initSqlJs();
    window.__lacosSQL = SQL;
    window.__lacosDB = new SQL.Database(loadSaved() || undefined);
    window.__startBackend();
    installLocalApi();
  } catch (e) {
    console.error(e);
    return fail(e.message);
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ToastProvider>
        <MemoryRouter initialEntries={['/']}>
          <DemoBar />
          <App />
        </MemoryRouter>
      </ToastProvider>
    </StrictMode>,
  );
}

boot();
