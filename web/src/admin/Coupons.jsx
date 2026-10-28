import { useState } from 'react';
import { Plus, Pencil, Trash2, TicketPercent, Copy } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, dateBR } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Select, Spinner, Table, Toggle, useToast, ErrorBox, Empty, Badge } from '../components/ui.jsx';
import { segmentCopy } from '../lib/segment.js';
import { useSettings } from './AdminApp.jsx';

const describe = (c) => (c.type === 'percent' ? `${c.value}% de desconto` : c.type === 'fixed' ? `${brl(c.value)} de desconto` : 'Entrega grátis');

export default function Coupons() {
  const list = useApi('/coupons');
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  return (
    <>
      <PageHeader title="Cupons de desconto" subtitle="Divulgue no Instagram e no WhatsApp; o cliente digita no cardápio">
        <Button icon={Plus} onClick={() => setEdit({ code: '', type: 'percent', value: 10, min_order_cents: 0, active: 1, first_order_only: 0 })}>Novo cupom</Button>
      </PageHeader>
      <Card>
        {!list.data ? <Spinner /> : !list.data.length ? (
          <Empty icon={TicketPercent} title="Nenhum cupom criado">Ex.: <b>PRIMEIRACOMPRA</b> com 10% só no primeiro pedido, ou <b>FRETEGRATIS</b> acima de R$ 80.</Empty>
        ) : (
          <Table>
            <thead><tr><th>Código</th><th>Benefício</th><th>Pedido mínimo</th><th>Validade</th><th className="text-right">Usos</th><th /></tr></thead>
            <tbody>
              {list.data.map((c) => (
                <tr key={c.id} className={c.active ? '' : 'opacity-50'}>
                  <td>
                    <button className="inline-flex items-center gap-1.5 font-mono font-semibold text-brand-700" onClick={() => { navigator.clipboard?.writeText(c.code); toast('Código copiado'); }} title="Copiar"><Copy className="size-3.5" />{c.code}</button>
                    {c.first_order_only ? <Badge className="ml-2 bg-sky-50 text-sky-700 ring-sky-100">1ª compra</Badge> : null}
                  </td>
                  <td>{describe(c)}</td>
                  <td>{c.min_order_cents ? brl(c.min_order_cents) : '—'}</td>
                  <td>{c.starts_at || c.ends_at ? `${c.starts_at ? dateBR(c.starts_at) : '…'} até ${c.ends_at ? dateBR(c.ends_at) : '…'}` : 'sem prazo'}</td>
                  <td className="text-right">{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="text-right"><Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(c)} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {edit && <CouponModal coupon={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} />}
    </>
  );
}

function CouponModal({ coupon, onClose, onSaved }) {
  const { settings } = useSettings();
  const [f, setF] = useState({ ...coupon, starts_at: coupon.starts_at || '', ends_at: coupon.ends_at || '', max_uses: coupon.max_uses || '' });
  const [err, setErr] = useState('');
  const save = async () => {
    try {
      if (f.id) await api.put(`/coupons/${f.id}`, f);
      else await api.post('/coupons', f);
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const del = async () => {
    await api.del(`/coupons/${f.id}`);
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar cupom' : 'Novo cupom'} footer={
      <>
        {f.id && <Button variant="ghost" className="mr-auto text-red-600" icon={Trash2} onClick={del}>Excluir</Button>}
        <Button onClick={save}>Salvar</Button>
      </>
    }>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Código"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder={segmentCopy(settings?.store).couponEx} /></Field>
        <Field label="Tipo">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, value: e.target.value === 'percent' ? 10 : 0 })}>
            <option value="percent">Porcentagem</option>
            <option value="fixed">Valor fixo (R$)</option>
            <option value="frete">Entrega grátis</option>
          </Select>
        </Field>
        {f.type === 'percent' && <Field label="Desconto (%)"><Input type="number" min="1" max="100" value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></Field>}
        {f.type === 'fixed' && <Field label="Desconto (R$)"><MoneyInput value={f.value} onChange={(v) => setF({ ...f, value: v })} /></Field>}
        <Field label="Pedido mínimo"><MoneyInput value={f.min_order_cents} onChange={(v) => setF({ ...f, min_order_cents: v })} /></Field>
        <Field label="Válido de"><Input type="date" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></Field>
        <Field label="Válido até"><Input type="date" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></Field>
        <Field label="Limite de usos" hint="Em branco = ilimitado"><Input type="number" min="1" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} /></Field>
        <div className="flex flex-col justify-end gap-2">
          <Toggle checked={!!f.first_order_only} onChange={(v) => setF({ ...f, first_order_only: v ? 1 : 0 })} label="Só na primeira compra" />
          <Toggle checked={!!f.active} onChange={(v) => setF({ ...f, active: v ? 1 : 0 })} label="Ativo" />
        </div>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}
