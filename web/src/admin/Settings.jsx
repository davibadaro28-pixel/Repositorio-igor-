import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, Trash2, Receipt, Plug, QrCode, Copy, DatabaseBackup, ImagePlus } from 'lucide-react';
import { api, getToken } from '../lib/api.js';
import { IS_PREVIEW } from '../lib/env.js';
import { Button, Card, Field, Input, MoneyInput, PageHeader, Select, Spinner, Table, Tabs, Textarea, Toggle, useToast, ErrorBox } from '../components/ui.jsx';
import { useSettings } from './AdminApp.jsx';
import { uploadImage } from './Products.jsx';
import { BrandLogo } from '../components/Brand.jsx';

const DAYS = [['monday', 'Segunda'], ['tuesday', 'Terça'], ['wednesday', 'Quarta'], ['thursday', 'Quinta'], ['friday', 'Sexta'], ['saturday', 'Sábado'], ['sunday', 'Domingo']];

export default function SettingsPage() {
  const { settings, reload } = useSettings();
  const [tab, setTab] = useState('loja');
  if (!settings) return <Spinner />;
  return (
    <>
      <PageHeader title="Configurações">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'loja', label: 'Loja e horários' }, { value: 'pag', label: 'Pagamentos' }, { value: 'fid', label: 'Fidelidade' }, { value: 'fiscal', label: 'Fiscal e integrações' }, { value: 'divulgar', label: 'Divulgar cardápio' }]} />
      </PageHeader>
      {tab === 'loja' && <Store value={settings.store} onSaved={reload} />}
      {tab === 'pag' && <Payments value={settings.payment_methods} onSaved={reload} />}
      {tab === 'fid' && <Loyalty value={settings.loyalty} onSaved={reload} />}
      {tab === 'fiscal' && <Fiscal value={settings.fiscal} onSaved={reload} />}
      {tab === 'divulgar' && <Share />}
    </>
  );
}

function useSave(key, onSaved) {
  const toast = useToast();
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (value) => {
    setErr('');
    setSaving(true);
    try {
      await api.put(`/settings/${key}`, value);
      toast('Configurações salvas');
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  return { save, err, saving };
}

function Store({ value, onSaved }) {
  const [s, setS] = useState(value);
  useEffect(() => setS(value), [value]);
  const { save, err, saving } = useSave('store', onSaved);
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const setDay = (d, patch) => setS({ ...s, hours: { ...s.hours, [d]: { ...s.hours[d], ...patch } } });
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-semibold">Dados da loja</h3>
        <div className="flex items-center gap-4">
          <BrandLogo store={s} className="size-16 shrink-0 text-xl ring-2 ring-brand-100" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
              <ImagePlus className="size-4" /> {s.logo ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setS({ ...s, logo: await uploadImage(f) });
              }} />
            </label>
            {s.logo !== '' && <Button variant="ghost" size="sm" onClick={() => setS({ ...s, logo: '' })}>Usar iniciais</Button>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome"><Input value={s.name} onChange={set('name')} /></Field>
          <Field label="Subtítulo"><Input value={s.tagline} onChange={set('tagline')} /></Field>
          <Field label="Frase de destaque" className="sm:col-span-2"><Input value={s.slogan} onChange={set('slogan')} /></Field>
          <Field label="WhatsApp que recebe pedidos" hint="Com DDI e DDD, só números. Ex.: 5511912345678"><Input value={s.whatsapp} onChange={set('whatsapp')} /></Field>
          <Field label="Telefone exibido"><Input value={s.phone} onChange={set('phone')} /></Field>
          <Field label="Instagram (sem @)"><Input value={s.instagram} onChange={set('instagram')} /></Field>
          <Field label="Endereço" className="sm:col-span-2"><Input value={s.address} onChange={set('address')} /></Field>
          <Field label="Aviso no topo do cardápio" className="sm:col-span-2" hint="Ex.: “Encomendas de Natal abertas!” Deixe vazio para esconder."><Input value={s.notice} onChange={set('notice')} /></Field>
          <Field label="Chave Pix"><Input value={s.pix_key} onChange={set('pix_key')} /></Field>
          <Field label="Nome do recebedor Pix"><Input value={s.pix_name} onChange={set('pix_name')} /></Field>
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Pedidos online</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle checked={s.accepting_orders} onChange={(v) => setS({ ...s, accepting_orders: v })} label="Recebendo pedidos" />
            <Toggle checked={s.delivery_enabled} onChange={(v) => setS({ ...s, delivery_enabled: v })} label="Entrega (delivery)" />
            <Toggle checked={s.pickup_enabled} onChange={(v) => setS({ ...s, pickup_enabled: v })} label="Retirada na loja" />
            <Toggle checked={s.scheduling_enabled} onChange={(v) => setS({ ...s, scheduling_enabled: v })} label="Encomendas agendadas" />
            <Toggle checked={s.allow_out_of_zone} onChange={(v) => setS({ ...s, allow_out_of_zone: v })} label="Aceitar bairro fora da lista" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Pedido mínimo"><MoneyInput value={s.min_order_cents} onChange={(v) => setS({ ...s, min_order_cents: v })} /></Field>
            <Field label="Tempo de preparo (min)"><Input type="number" value={s.prep_time_min} onChange={set('prep_time_min')} /></Field>
            <Field label="Tempo de entrega (min)"><Input type="number" value={s.delivery_time_min} onChange={set('delivery_time_min')} /></Field>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Horário de funcionamento</h3>
          <div className="space-y-2">
            {DAYS.map(([k, label]) => (
              <div key={k} className="flex flex-wrap items-center gap-3">
                <span className="w-20 text-sm">{label}</span>
                <Toggle checked={s.hours[k].active} onChange={(v) => setDay(k, { active: v })} />
                <Input type="time" className="w-28" value={s.hours[k].open} disabled={!s.hours[k].active} onChange={(e) => setDay(k, { open: e.target.value })} />
                <span className="text-sm text-stone-400">às</span>
                <Input type="time" className="w-28" value={s.hours[k].close} disabled={!s.hours[k].active} onChange={(e) => setDay(k, { close: e.target.value })} />
              </div>
            ))}
          </div>
        </Card>
        <ErrorBox>{err}</ErrorBox>
        <Button size="lg" icon={Save} loading={saving} onClick={() => save(s)} className="w-full">Salvar</Button>
      </div>
    </div>
  );
}

function Payments({ value, onSaved }) {
  const [list, setList] = useState(value);
  const { save, err, saving } = useSave('payment_methods', onSaved);
  const set = (i, patch) => setList(list.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  return (
    <Card>
      <p className="border-b border-stone-100 px-4 py-3 text-sm text-stone-600">A <b>taxa (%)</b> da maquininha ou app é descontada no fluxo de caixa e na DRE para mostrar o lucro real.</p>
      <Table>
        <thead><tr><th>Forma de pagamento</th><th>Taxa (%)</th><th>Ativa</th><th>No cardápio online</th><th /></tr></thead>
        <tbody>
          {list.map((m, i) => (
            <tr key={i}>
              <td><Input value={m.label} onChange={(e) => set(i, { label: e.target.value, ...(m._new ? { id: e.target.value.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) } : {}) })} /></td>
              <td className="w-28"><Input type="number" step="0.01" min="0" value={m.fee_pct} onChange={(e) => set(i, { fee_pct: e.target.value })} /></td>
              <td><Toggle checked={m.active} onChange={(v) => set(i, { active: v })} /></td>
              <td><Toggle checked={m.online} onChange={(v) => set(i, { online: v })} /></td>
              <td>{!['pix', 'dinheiro'].includes(m.id) && <button className="text-stone-400 hover:text-red-600" onClick={() => setList(list.filter((_, k) => k !== i))} aria-label="Remover"><Trash2 className="size-4" /></button>}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="flex justify-between gap-2 border-t border-stone-100 p-3">
        <Button variant="secondary" icon={Plus} onClick={() => setList([...list, { id: '', label: '', fee_pct: 0, active: true, online: false, _new: true }])}>Forma de pagamento</Button>
        <Button icon={Save} loading={saving} onClick={() => save(list)}>Salvar</Button>
      </div>
      <div className="px-4 pb-3"><ErrorBox>{err}</ErrorBox></div>
    </Card>
  );
}

function Loyalty({ value, onSaved }) {
  const [l, setL] = useState(value);
  const { save, err, saving } = useSave('loyalty', onSaved);
  return (
    <Card className="max-w-xl space-y-4 p-5">
      <h3 className="font-semibold">Programa de fidelidade</h3>
      <p className="text-sm text-stone-600">O cliente ganha pontos a cada pedido concluído e troca por desconto no balcão (PDV).</p>
      <Toggle checked={l.enabled} onChange={(v) => setL({ ...l, enabled: v })} label="Programa ativo" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Pontos por R$ 1"><Input type="number" step="0.1" min="0" value={l.points_per_real} onChange={(e) => setL({ ...l, points_per_real: e.target.value })} /></Field>
        <Field label="Pontos para trocar"><Input type="number" min="1" value={l.redeem_points} onChange={(e) => setL({ ...l, redeem_points: e.target.value })} /></Field>
        <Field label="Vale de desconto"><MoneyInput value={l.redeem_value_cents} onChange={(v) => setL({ ...l, redeem_value_cents: v })} /></Field>
      </div>
      <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">Exemplo: gastando R$ 100 o cliente ganha {Math.floor(100 * (Number(l.points_per_real) || 0))} pontos. A cada {l.redeem_points} pontos, ganha R$ {(l.redeem_value_cents / 100).toFixed(2).replace('.', ',')} de desconto.</p>
      <ErrorBox>{err}</ErrorBox>
      <Button icon={Save} loading={saving} onClick={() => save(l)}>Salvar</Button>
    </Card>
  );
}

function Fiscal({ value }) {
  const env = value?.provider === 'simulado' ? 'modo treinamento' : value?.ambiente === 'producao' ? 'produção' : 'homologação';
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="h-fit space-y-3 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><Receipt className="size-5 text-brand-500" /> Nota fiscal (NFC-e)</h3>
        <p className={value?.enabled ? 'text-sm text-emerald-700' : 'text-sm text-stone-600'}>
          {value?.enabled ? `Emissão ligada (${env})${value.auto_emit ? ', com emissão automática' : ''}.` : 'Emissão desligada.'}
        </p>
        <p className="text-sm text-stone-600">Emissor, CNPJ, formas de pagamento na nota, NCM e perfis tributários dos produtos ficam na tela Notas fiscais.</p>
        <Link to="/admin/fiscal"><Button variant="secondary" icon={Receipt}>Abrir Notas fiscais</Button></Link>
      </Card>
      <Card className="h-fit space-y-3 p-5 text-sm">
        <h3 className="flex items-center gap-2 font-semibold"><Plug className="size-5 text-brand-500" /> Integrações</h3>
        <div className="rounded-xl p-3 ring-1 ring-stone-200">
          <p className="font-medium">iFood e 99Food</p>
          <p className="text-stone-600">Os pedidos dos apps entram sozinhos no quadro de pedidos, na cozinha, no estoque e nos relatórios. <Link to="/admin/integracoes" className="font-medium text-brand-700 underline">Configurar integrações</Link></p>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-stone-200">
          <p className="font-medium">WhatsApp</p>
          <p className="text-stone-600">Ativo: o cardápio envia o resumo do pedido para o WhatsApp da loja, e o painel abre mensagens prontas para o cliente a cada mudança de status.</p>
        </div>
        <div className="rounded-xl p-3 ring-1 ring-stone-200">
          <p className="font-medium">Backup</p>
          <p className="mb-2 text-stone-600">Baixe uma cópia completa dos dados (pedidos, clientes, produtos, financeiro). Faça pelo menos uma vez por semana e guarde no Google Drive.</p>
          {IS_PREVIEW
            ? <p className="text-xs text-stone-500">Disponível no sistema instalado.</p>
            : <a href={`/api/backup?token=${encodeURIComponent(getToken() || '')}`}><Button variant="secondary" size="sm" icon={DatabaseBackup}>Baixar backup agora</Button></a>}
        </div>
        <div className="rounded-xl p-3 ring-1 ring-stone-200">
          <p className="font-medium">Impressora térmica</p>
          <p className="text-stone-600">Ativo: o botão “Imprimir” gera a comanda em 80 mm. Configure a impressora térmica como padrão no computador do caixa.</p>
        </div>
      </Card>
    </div>
  );
}

function Share() {
  const { settings } = useSettings();
  const url = window.location.origin;
  const toast = useToast();
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(url)}`;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-semibold">Link do cardápio digital</h3>
        <div className="flex gap-2">
          <Input readOnly value={url} />
          <Button variant="secondary" icon={Copy} onClick={() => { navigator.clipboard?.writeText(url); toast('Link copiado'); }}>Copiar</Button>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
          <li>Coloque na bio do Instagram (no lugar do link atual do OlaClick).</li>
          <li>Configure como resposta automática / catálogo no WhatsApp Business.</li>
          <li>Imprima o QR Code e deixe no balcão, nas embalagens e nos panfletos.</li>
        </ul>
      </Card>
      <Card className="flex flex-col items-center gap-3 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><QrCode className="size-5" /> QR Code</h3>
        {IS_PREVIEW ? (
          <p className="max-w-xs text-center text-sm text-stone-500">O QR Code é gerado com o endereço definitivo do cardápio quando o sistema estiver no ar.</p>
        ) : (
          <>
            <img src={qr} alt="QR Code do cardápio" className="size-56 rounded-xl ring-1 ring-stone-200" />
            <a href={qr} target="_blank" rel="noreferrer"><Button variant="secondary">Abrir para imprimir</Button></a>
          </>
        )}
        <Textarea readOnly className="text-xs" value={`🎀 Peça seus bolos e doces da ${settings?.store?.name || 'nossa loja'} pelo nosso cardápio digital: ${url}`} />
      </Card>
    </div>
  );
}
