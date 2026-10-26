import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, ShoppingCart, ChefHat, CalendarDays, Wallet, Landmark, Package, Cake, Users, Bike,
  TicketPercent, BarChart3, Settings, UserCog, LogOut, Menu as MenuIcon, X, ExternalLink, Bell, Plug, Receipt,
} from 'lucide-react';
import { api, getToken, setToken, useLiveEvents } from '../lib/api.js';
import { newTab } from '../lib/env.js';
import { BrandLogo, useStoreBrand } from '../components/Brand.jsx';
import { Button, Field, Input, Modal, Spinner, Toggle, cx, useToast, ErrorBox } from '../components/ui.jsx';
import Dashboard from './Dashboard.jsx';
import Orders from './Orders.jsx';
import PDV from './PDV.jsx';
import Kitchen from './Kitchen.jsx';
import Encomendas from './Encomendas.jsx';
import Cash from './Cash.jsx';
import Finance from './Finance.jsx';
import Stock from './Stock.jsx';
import Products from './Products.jsx';
import Customers from './Customers.jsx';
import Delivery from './Delivery.jsx';
import Coupons from './Coupons.jsx';
import Reports from './Reports.jsx';
import SettingsPage from './Settings.jsx';
import UsersPage from './Users.jsx';
import PrintOrder from './PrintOrder.jsx';
import Integrations from './Integrations.jsx';
import Fiscal from './Fiscal.jsx';
import FiscalReceipt from './FiscalReceipt.jsx';

// ---------- Sessão ----------

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const LiveCtx = createContext({ tick: 0, pending: 0 });
/** Número que muda a cada evento de pedido — use como dependência para recarregar dados */
export const useLive = () => useContext(LiveCtx);

const SettingsCtx = createContext(null);
export const useSettings = () => useContext(SettingsCtx);

export const NAV = [
  { group: 'Operação' },
  { to: '/admin', label: 'Início', icon: LayoutDashboard, module: 'dashboard', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList, module: 'pedidos', badge: true },
  { to: '/admin/pdv', label: 'PDV (balcão)', icon: ShoppingCart, module: 'pdv' },
  { to: '/admin/cozinha', label: 'Cozinha (KDS)', icon: ChefHat, module: 'cozinha' },
  { to: '/admin/encomendas', label: 'Encomendas', icon: CalendarDays, module: 'encomendas' },
  { to: '/admin/caixa', label: 'Caixa', icon: Wallet, module: 'caixa' },
  { group: 'Gestão' },
  { to: '/admin/produtos', label: 'Cardápio e produtos', icon: Cake, module: 'produtos' },
  { to: '/admin/estoque', label: 'Estoque e CMV', icon: Package, module: 'estoque' },
  { to: '/admin/financeiro', label: 'Financeiro', icon: Landmark, module: 'financeiro' },
  { to: '/admin/fiscal', label: 'Notas fiscais', icon: Receipt, module: 'fiscal' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, module: 'clientes' },
  { to: '/admin/entregas', label: 'Entregas', icon: Bike, module: 'entregas' },
  { to: '/admin/cupons', label: 'Cupons', icon: TicketPercent, module: 'cupons' },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, module: 'relatorios' },
  { group: 'Sistema' },
  { to: '/admin/integracoes', label: 'iFood e 99Food', icon: Plug, module: 'configuracoes' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings, module: 'configuracoes' },
  { to: '/admin/usuarios', label: 'Usuários', icon: UserCog, module: 'usuarios' },
];

export const canAccess = (user, module) => user?.permissions?.includes('*') || user?.permissions?.includes(module);

// Toque curto para avisar de pedido novo (sem arquivo de áudio)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.22);
    });
  } catch {
    /* navegador sem áudio */
  }
}

function Login({ onLogin }) {
  const brand = useStoreBrand();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await api.post('/auth/login', { login, password });
      setToken(r.token);
      onLogin(r.user);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 text-center">
          <BrandLogo store={brand} className="mx-auto size-20 text-2xl ring-4 ring-brand-100" />
          <h1 className="mt-3 font-script text-4xl text-brand-700">{brand?.name || '\u00a0'}</h1>
          <p className="text-sm text-stone-500">Sistema de gestão</p>
        </div>
        <div className="space-y-3">
          <Field label="Login"><Input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus /></Field>
          <Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          <ErrorBox>{err}</ErrorBox>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Entrar</Button>
        </div>
      </form>
    </div>
  );
}

function StoreToggle() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const { user } = useAuth();
  if (!settings?.store || !canAccess(user, 'configuracoes')) return null;
  const on = settings.store.accepting_orders;
  return (
    <Toggle
      checked={on}
      label={on ? 'Recebendo pedidos' : 'Pedidos pausados'}
      onChange={async (v) => {
        await api.put('/settings/store', { ...settings.store, accepting_orders: v });
        toast(v ? 'Cardápio aberto para pedidos' : 'Pedidos online pausados');
        reload();
      }}
    />
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { pending } = useLive();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const items = NAV.filter((n) => n.group || canAccess(user, n.module));
  const groups = items.filter((n, i) => !n.group || (items[i + 1] && !items[i + 1].group));

  const nav = (
    <nav className="space-y-0.5 px-3 pb-6">
      {groups.map((n) =>
        n.group ? (
          <p key={n.group} className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-brand-200/80">{n.group}</p>
        ) : (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-white/85 hover:bg-white/10')}
          >
            <n.icon className="size-4.5 shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.badge && pending > 0 && <span className="rounded-full bg-gold px-1.5 text-xs font-bold text-brand-900">{pending}</span>}
          </NavLink>
        ),
      )}
    </nav>
  );

  const brand = (
    <Link to="/admin" className="flex items-center gap-3 px-5 py-5">
      <BrandLogo store={settings?.store} className="size-10 text-sm ring-2 ring-white/70" />
      <div>
        <p className="font-script text-2xl leading-none text-white">{settings?.store?.name}</p>
        <p className="text-[11px] uppercase tracking-widest text-brand-200">Gestão</p>
      </div>
    </Link>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto bg-gradient-to-b from-brand-800 to-brand-700 lg:block">
        {brand}
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-gradient-to-b from-brand-800 to-brand-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pr-3">{brand}<button onClick={() => setOpen(false)} className="text-white" aria-label="Fechar menu"><X /></button></div>
            {nav}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200/70 bg-white/90 px-4 py-2.5 backdrop-blur">
          <button className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><MenuIcon /></button>
          <div className="hidden sm:block"><StoreToggle /></div>
          <div className="flex-1" />
          {pending > 0 && canAccess(user, 'pedidos') && (
            <Link to="/admin/pedidos" className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              <Bell className="size-4" /> {pending} novo{pending > 1 ? 's' : ''}
            </Link>
          )}
          <Link to="/" {...newTab} className="hidden items-center gap-1 text-sm text-stone-500 hover:text-brand-700 md:flex"><ExternalLink className="size-4" /> Ver cardápio</Link>
          <button onClick={() => setPwOpen(true)} className="hidden text-sm text-stone-600 hover:text-brand-700 sm:inline" title="Trocar minha senha">{user.name}</button>
          <button onClick={logout} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" title="Sair" aria-label="Sair"><LogOut className="size-5" /></button>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">{children}</main>
      </div>
      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function PasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const toast = useToast();
  const save = async () => {
    try {
      await api.post('/auth/password', { current, password });
      toast('Senha alterada');
      onClose();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title="Trocar minha senha" footer={<Button onClick={save}>Salvar</Button>}>
      <div className="space-y-3">
        <Field label="Senha atual"><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="Nova senha" hint="Mínimo de 6 caracteres"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function Guard({ module, children }) {
  const { user } = useAuth();
  if (!canAccess(user, module)) {
    const first = NAV.find((n) => n.module && canAccess(user, n.module));
    if (user.role === 'entregador') return <Navigate to="/entregador" replace />;
    return first ? <Navigate to={first.to} replace /> : <p>Sem acesso.</p>;
  }
  return children;
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());
  const [settings, setSettings] = useState(null);
  const [tick, setTick] = useState(0);
  const [pending, setPending] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();
  const userRef = useRef(user);
  userRef.current = user;

  const loadSettings = useCallback(() => api.get('/settings').then(setSettings).catch(() => {}), []);
  const loadPending = useCallback(() => api.get('/orders?status=novo&limit=100').then((l) => setPending(l.length)).catch(() => {}), []);

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('lacos:logout', onLogout);
    return () => window.removeEventListener('lacos:logout', onLogout);
  }, []);
  useEffect(() => {
    if (user) {
      loadSettings();
      if (canAccess(user, 'pedidos')) loadPending();
    }
  }, [user, loadSettings, loadPending]);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
    navigate('/admin');
  };

  if (checking) return <Spinner className="min-h-dvh" />;
  if (!user) return <Login onLogin={setUser} />;
  if (user.role === 'entregador') return <Navigate to="/entregador" replace />;

  return (
    <AuthCtx.Provider value={{ user, logout }}>
      <SettingsCtx.Provider value={{ settings, reload: loadSettings }}>
        <LiveProvider user={user} tick={tick} setTick={setTick} pending={pending} loadPending={loadPending} toast={toast}>
          <Routes>
            <Route path="imprimir/:id" element={<PrintOrder />} />
            <Route path="nota/:id" element={<FiscalReceipt />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route index element={<Guard module="dashboard"><Dashboard /></Guard>} />
                  <Route path="pedidos" element={<Guard module="pedidos"><Orders /></Guard>} />
                  <Route path="pdv" element={<Guard module="pdv"><PDV /></Guard>} />
                  <Route path="cozinha" element={<Guard module="cozinha"><Kitchen /></Guard>} />
                  <Route path="encomendas" element={<Guard module="encomendas"><Encomendas /></Guard>} />
                  <Route path="caixa" element={<Guard module="caixa"><Cash /></Guard>} />
                  <Route path="financeiro" element={<Guard module="financeiro"><Finance /></Guard>} />
                  <Route path="fiscal" element={<Guard module="fiscal"><Fiscal /></Guard>} />
                  <Route path="estoque" element={<Guard module="estoque"><Stock /></Guard>} />
                  <Route path="produtos" element={<Guard module="produtos"><Products /></Guard>} />
                  <Route path="clientes" element={<Guard module="clientes"><Customers /></Guard>} />
                  <Route path="entregas" element={<Guard module="entregas"><Delivery /></Guard>} />
                  <Route path="cupons" element={<Guard module="cupons"><Coupons /></Guard>} />
                  <Route path="relatorios" element={<Guard module="relatorios"><Reports /></Guard>} />
                  <Route path="configuracoes" element={<Guard module="configuracoes"><SettingsPage /></Guard>} />
                  <Route path="integracoes" element={<Guard module="configuracoes"><Integrations /></Guard>} />
                  <Route path="usuarios" element={<Guard module="usuarios"><UsersPage /></Guard>} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </LiveProvider>
      </SettingsCtx.Provider>
    </AuthCtx.Provider>
  );
}

function LiveProvider({ user, tick, setTick, pending, loadPending, toast, children }) {
  const storeName = useSettings()?.settings?.store?.name;
  useLiveEvents((e) => {
    setTick((t) => t + 1);
    if (canAccess(user, 'pedidos')) loadPending();
    if (e.new && ['cardapio', 'ifood', '99food'].includes(e.channel)) {
      beep();
      toast(`Novo pedido #${e.id} ${e.channel === 'cardapio' ? 'pelo cardápio digital' : `do ${e.channel === 'ifood' ? 'iFood' : '99Food'}`}!`);
      try {
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(storeName || 'Novo pedido', { body: `Novo pedido #${e.id}`, icon: '/img/icon-192.png' });
        }
      } catch {
        /* notificações bloqueadas */
      }
    }
  });
  useEffect(() => {
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    } catch {
      /* notificações bloqueadas */
    }
  }, []);
  return <LiveCtx.Provider value={{ tick, pending }}>{children}</LiveCtx.Provider>;
}
