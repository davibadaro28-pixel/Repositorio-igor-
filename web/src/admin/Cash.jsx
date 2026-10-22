import { useState } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Banknote } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, dateTimeBR, methodLabel } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Spinner, Stat, Table, Textarea, useToast, ErrorBox, Empty, cx } from '../components/ui.jsx';
import { useLive } from './AdminApp.jsx';

function SessionSummary({ s }) {
  const methods = s.methods || [];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Fundo de troco" value={brl(s.opening_cents)} icon={Wallet} />
        <Stat label="Vendas no caixa" value={brl(s.sales_cents)} sub={`${s.orders} pedidos`} icon={Banknote} tone="green" />
        <Stat label="Sangrias" value={brl(s.sangrias_cents)} icon={ArrowUpCircle} tone="red" />
        <Stat label="Dinheiro esperado na gaveta" value={brl(s.expected.dinheiro)} icon={Wallet} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="border-b border-stone-100 px-4 py-3 font-semibold">Recebido por forma de pagamento</h3>
          {!s.by_method.length ? <p className="p-4 text-sm text-stone-500">Nenhum recebimento ainda.</p> : (
            <Table>
              <thead><tr><th>Forma</th><th className="text-right">Qtd</th><th className="text-right">Taxas</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {s.by_method.map((m) => (
                  <tr key={m.method}><td>{methodLabel(methods, m.method)}</td><td className="text-right">{m.count}</td><td className="text-right text-stone-500">{brl(m.fee_cents)}</td><td className="text-right font-medium">{brl(m.amount_cents)}</td></tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <h3 className="border-b border-stone-100 px-4 py-3 font-semibold">Sangrias e suprimentos</h3>
          {!s.movements.length ? <p className="p-4 text-sm text-stone-500">Nenhuma movimentação.</p> : (
            <Table>
              <thead><tr><th>Hora</th><th>Tipo</th><th>Motivo</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {s.movements.map((m) => (
                  <tr key={m.id}><td>{dateTimeBR(m.created_at).slice(11)}</td><td className="capitalize">{m.type}</td><td>{m.note}<span className="block text-xs text-stone-400">{m.user_name}</span></td><td className={cx('text-right font-medium', m.type === 'sangria' ? 'text-red-600' : 'text-emerald-600')}>{m.type === 'sangria' ? '−' : '+'} {brl(m.amount_cents)}</td></tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function Cash() {
  const { tick } = useLive();
  const current = useApi('/cash/current', [tick]);
  const sessions = useApi('/cash/sessions', [tick]);
  const toast = useToast();
  const [opening, setOpening] = useState(10000);
  const [mov, setMov] = useState(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const open = async () => {
    try {
      await api.post('/cash/open', { opening_cents: opening });
      toast('Caixa aberto');
      current.reload();
      sessions.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (current.loading && !current.data) return <Spinner />;
  const s = current.data;

  return (
    <>
      <PageHeader title="Caixa" subtitle={s ? `Aberto por ${s.opened_by_name} em ${dateTimeBR(s.opened_at)}` : 'Abertura, sangria, suprimento e fechamento'}>
        {s && (
          <>
            <Button variant="secondary" icon={ArrowUpCircle} onClick={() => setMov('sangria')}>Sangria</Button>
            <Button variant="secondary" icon={ArrowDownCircle} onClick={() => setMov('suprimento')}>Suprimento</Button>
            <Button variant="dark" icon={Lock} onClick={() => setCloseOpen(true)}>Fechar caixa</Button>
          </>
        )}
      </PageHeader>

      {s ? <SessionSummary s={s} /> : (
        <Card className="mx-auto max-w-md p-6 text-center">
          <Unlock className="mx-auto size-10 text-brand-500" />
          <h2 className="mt-2 text-lg font-semibold">Caixa fechado</h2>
          <p className="mb-4 text-sm text-stone-500">Informe o valor em dinheiro que está na gaveta para começar o dia.</p>
          <Field label="Fundo de troco"><MoneyInput value={opening} onChange={setOpening} /></Field>
          <Button size="lg" className="mt-4 w-full" onClick={open}>Abrir caixa</Button>
        </Card>
      )}

      <h2 className="mb-3 mt-8 font-semibold text-stone-800">Histórico de caixas</h2>
      <Card>
        {!sessions.data?.length ? <Empty title="Nenhum caixa registrado" /> : (
          <Table>
            <thead><tr><th>#</th><th>Abertura</th><th>Fechamento</th><th>Responsável</th><th className="text-right">Vendas</th><th className="text-right">Diferença (dinheiro)</th></tr></thead>
            <tbody>
              {sessions.data.map((c) => {
                const diff = c.counted && c.expected ? (c.counted.dinheiro || 0) - (c.expected.dinheiro || 0) : null;
                return (
                  <tr key={c.id} className="cursor-pointer hover:bg-stone-50" onClick={() => setDetail(c.id)}>
                    <td>{c.id}</td>
                    <td>{dateTimeBR(c.opened_at)}</td>
                    <td>{c.closed_at ? dateTimeBR(c.closed_at) : <span className="font-medium text-emerald-700">aberto</span>}</td>
                    <td>{c.opened_by_name}</td>
                    <td className="text-right">{brl(c.sales_cents)}</td>
                    <td className={cx('text-right font-medium', diff == null ? '' : diff < 0 ? 'text-red-600' : diff > 0 ? 'text-amber-600' : 'text-emerald-600')}>{diff == null ? '—' : `${diff > 0 ? '+' : ''}${brl(diff)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <MovementModal type={mov} onClose={() => setMov(null)} onDone={() => { setMov(null); current.reload(); }} />
      {closeOpen && s && <CloseModal s={s} onClose={() => setCloseOpen(false)} onDone={() => { setCloseOpen(false); current.reload(); sessions.reload(); toast('Caixa fechado'); }} />}
      {detail && <DetailModal id={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function MovementModal({ type, onClose, onDone }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  if (!type) return null;
  const save = async () => {
    try {
      await api.post('/cash/movement', { type, amount_cents: amount, note });
      setAmount(0);
      setNote('');
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={type === 'sangria' ? 'Sangria (retirada de dinheiro)' : 'Suprimento (entrada de dinheiro)'} footer={<Button onClick={save}>Confirmar</Button>}>
      <div className="space-y-3">
        <Field label="Valor"><MoneyInput value={amount} onChange={setAmount} /></Field>
        <Field label="Motivo"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'sangria' ? 'Ex.: pagamento de fornecedor, depósito' : 'Ex.: troco extra'} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function CloseModal({ s, onClose, onDone }) {
  const methods = Object.keys(s.expected);
  const [counted, setCounted] = useState(() => Object.fromEntries(methods.map((m) => [m, s.expected[m]])));
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const save = async () => {
    try {
      await api.post('/cash/close', { counted, notes });
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} title="Fechar caixa" footer={<Button variant="dark" icon={Lock} onClick={save}>Confirmar fechamento</Button>}>
      <p className="mb-3 text-sm text-stone-600">Conte o dinheiro da gaveta e confira os comprovantes de cartão/Pix. Ajuste os valores contados.</p>
      <div className="space-y-2">
        {methods.map((m) => {
          const diff = (counted[m] || 0) - s.expected[m];
          return (
            <div key={m} className="grid grid-cols-[1fr_auto_8rem] items-center gap-3 text-sm">
              <span className="font-medium">{methodLabel(s.methods, m)}<span className="block text-xs font-normal text-stone-500">esperado {brl(s.expected[m])}</span></span>
              <span className={cx('text-xs font-medium', diff < 0 ? 'text-red-600' : diff > 0 ? 'text-amber-600' : 'text-emerald-600')}>{diff === 0 ? 'ok' : `${diff > 0 ? '+' : ''}${brl(diff)}`}</span>
              <MoneyInput value={counted[m]} onChange={(v) => setCounted((c) => ({ ...c, [m]: v }))} />
            </div>
          );
        })}
      </div>
      <Field label="Observações" className="mt-4"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

function DetailModal({ id, onClose }) {
  const { data } = useApi(`/cash/sessions/${id}`);
  return (
    <Modal open onClose={onClose} size="xl" title={`Caixa #${id}`}>
      {!data ? <Spinner /> : (
        <>
          <p className="mb-3 text-sm text-stone-500">{dateTimeBR(data.opened_at)} → {data.closed_at ? dateTimeBR(data.closed_at) : 'aberto'}{data.notes ? ` · ${data.notes}` : ''}</p>
          <SessionSummary s={data} />
          {data.counted && (
            <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
              <p className="mb-1 font-medium">Conferência no fechamento</p>
              {Object.entries(data.counted).map(([m, v]) => (
                <p key={m} className="flex justify-between"><span>{methodLabel(data.methods, m)}</span><span>contado {brl(v)} · esperado {brl(data.expected_saved?.[m] || 0)}</span></p>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
