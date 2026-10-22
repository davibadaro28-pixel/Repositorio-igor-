import { useEffect, useState } from 'react';
import { MapPin, Phone, Navigation, CheckCircle2, LogOut, RefreshCw, Bike, Banknote } from 'lucide-react';
import { api, getToken, setToken, useApi, useLiveEvents } from '../lib/api.js';
import { brl, phone, addressLine, timeBR } from '../lib/format.js';
import { Button, Card, Field, Input, Spinner, ErrorBox, useToast, cx } from '../components/ui.jsx';

/** App do entregador: lista de entregas atribuídas, rota no Maps e confirmação */
export default function Courier() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setChecking(false));
  }, []);
  if (checking) return <Spinner className="min-h-dvh" />;
  if (!user) return <Login onLogin={setUser} />;
  return <Deliveries user={user} onLogout={() => { api.post('/auth/logout').catch(() => {}); setToken(null); setUser(null); }} />;
}

function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/login', { login, password });
      setToken(r.token);
      onLogin(r.user);
    } catch (e2) {
      setErr(e2.message);
    }
  };
  return (
    <div className="grid min-h-dvh place-items-center bg-brand-700 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-6">
        <div className="text-center"><Bike className="mx-auto size-10 text-brand-600" /><h1 className="mt-2 text-lg font-semibold">Entregas · Laços de Mãe</h1></div>
        <Field label="Login"><Input value={login} onChange={(e) => setLogin(e.target.value)} autoCapitalize="none" /></Field>
        <Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <ErrorBox>{err}</ErrorBox>
        <Button type="submit" size="lg" className="w-full">Entrar</Button>
      </form>
    </div>
  );
}

function Deliveries({ user, onLogout }) {
  const list = useApi('/courier/orders');
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  useLiveEvents(() => list.reload());

  const move = async (o, status) => {
    setBusy(o.id);
    try {
      await api.post(`/courier/orders/${o.id}/status`, { status });
      toast(status === 'concluido' ? 'Entrega confirmada!' : 'Boa entrega! 🛵');
      list.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const active = (list.data || []).filter((o) => o.status !== 'concluido');
  const done = (list.data || []).filter((o) => o.status === 'concluido');
  const cash = done.filter((o) => o.payment_method === 'dinheiro').reduce((s, o) => s + o.total_cents, 0);

  return (
    <div className="min-h-dvh bg-cream pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
        <div><p className="text-xs text-brand-200">Entregador</p><p className="font-semibold">{user.name}</p></div>
        <div className="flex gap-1">
          <button onClick={() => list.reload()} className="rounded-full p-2 hover:bg-white/10" aria-label="Atualizar"><RefreshCw className="size-5" /></button>
          <button onClick={onLogout} className="rounded-full p-2 hover:bg-white/10" aria-label="Sair"><LogOut className="size-5" /></button>
        </div>
      </header>
      <main className="mx-auto max-w-lg space-y-3 p-4">
        {!list.data ? <Spinner /> : !active.length ? (
          <Card className="p-8 text-center text-stone-500">Nenhuma entrega atribuída agora.</Card>
        ) : active.map((o) => {
          const addr = addressLine(o.address);
          const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr + ', São Paulo - SP')}`;
          return (
            <Card key={o.id} className={cx('overflow-hidden', o.status === 'entrega' && 'ring-2 ring-blue-400')}>
              <div className={cx('flex items-center justify-between px-4 py-2 text-white', o.status === 'entrega' ? 'bg-blue-600' : 'bg-emerald-600')}>
                <span className="font-semibold">#{o.id} · {o.status === 'entrega' ? 'Em rota' : 'Pronto para sair'}</span>
                <span className="text-sm">{timeBR(o.ready_at || o.created_at)}</span>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <p className="text-base font-semibold">{o.customer_name}</p>
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" /> <span>{addr}{o.address?.reference && <span className="block text-stone-500">Ref.: {o.address.reference}</span>}</span></p>
                {o.customer_phone && <a href={`tel:${o.customer_phone}`} className="flex items-center gap-2 text-brand-700"><Phone className="size-4" /> {phone(o.customer_phone)}</a>}
                <p className="flex items-center gap-2"><Banknote className="size-4 text-emerald-600" /> {o.paid ? <b className="text-emerald-700">Já pago</b> : <span>Cobrar <b>{brl(o.total_cents)}</b> ({o.payment_method}){o.change_for_cents ? ` · troco p/ ${brl(o.change_for_cents)} → levar ${brl(o.change_for_cents - o.total_cents)}` : ''}</span>}</p>
                <p className="text-xs text-stone-500">{o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</p>
                {o.notes && <p className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">{o.notes}</p>}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a href={maps} target="_blank" rel="noreferrer"><Button variant="secondary" className="w-full" icon={Navigation}>Rota</Button></a>
                  {o.status === 'pronto'
                    ? <Button loading={busy === o.id} onClick={() => move(o, 'entrega')} icon={Bike}>Saí p/ entrega</Button>
                    : <Button variant="success" loading={busy === o.id} onClick={() => move(o, 'concluido')} icon={CheckCircle2}>Entreguei</Button>}
                </div>
              </div>
            </Card>
          );
        })}
        {done.length > 0 && (
          <Card className="p-4 text-sm">
            <p className="font-semibold">Hoje: {done.length} entregas concluídas</p>
            <p className="text-stone-600">Dinheiro recebido de clientes: <b>{brl(cash)}</b></p>
          </Card>
        )}
      </main>
    </div>
  );
}
