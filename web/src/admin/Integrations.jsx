import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Plug, PlayCircle, Save, CheckCircle2, AlertTriangle, CircleOff, ChevronDown, Link2 } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, dateTimeBR } from '../lib/format.js';
import { IS_PREVIEW } from '../lib/env.js';
import { Badge, Button, Card, Field, ErrorBox, Input, PageHeader, Select, Spinner, Table, Toggle, cx, useToast, Empty } from '../components/ui.jsx';
import { useLive } from './AdminApp.jsx';
import PlatformBadge from './PlatformBadge.jsx';

const PLATFORMS = {
  ifood: {
    name: 'iFood',
    color: 'bg-[#ea1d2c]',
    fields: [
      ['client_id', 'Client ID'],
      ['client_secret', 'Client Secret', 'password'],
      ['merchant_id', 'Merchant ID (ID da loja no iFood)'],
    ],
    how: 'Os pedidos são buscados a cada 30 segundos. Enquanto o sistema estiver no ar, a loja aparece aberta no iFood.',
    steps: [
      'Crie uma conta no Portal do Desenvolvedor do iFood (developer.ifood.com.br) com os dados da loja.',
      'Crie um aplicativo para uso da própria loja (centralizado) e copie o Client ID e o Client Secret.',
      'No Portal do Parceiro, autorize esse aplicativo na loja e copie o ID da loja (Merchant ID).',
      'Cole os dados aqui, ligue a integração e clique em “Testar conexão”.',
      'No cardápio do iFood, preencha o “Código PDV” de cada item com o código do produto (ex.: V12). Ou vincule os itens abaixo quando chegarem os primeiros pedidos.',
    ],
    feeHint: 'Confira no contrato. Referência: Plano Básico 12%, Plano Entrega 23% (+3,2% quando o cliente paga pelo app).',
  },
  '99food': {
    name: '99Food',
    color: 'bg-[#ffdd00]',
    fields: [
      ['app_id', 'App ID'],
      ['app_secret', 'App Secret', 'password'],
      ['app_shop_id', 'Código da loja (app_shop_id)'],
      ['courier_phone', 'Telefone do entregador da loja (entrega própria)'],
    ],
    how: 'Os pedidos chegam na hora pelo webhook. A 99Food cancela o pedido se a loja não aceitar em 5 minutos: ligue o aceite automático se não houver alguém olhando o painel.',
    steps: [
      'Cadastre-se na plataforma aberta da 99Food (developer-food.99app.com) e peça acesso. A 99Food libera um ambiente de testes antes do uso real.',
      'Crie o aplicativo e informe o endereço de webhook mostrado abaixo. Copie o App ID e o App Secret.',
      'Gere o link de autorização, peça para a loja autorizar e vincule-a com um código da loja (ex.: lacos-de-mae). Use o mesmo código aqui.',
      'Cole os dados aqui, ligue a integração e clique em “Testar conexão”.',
      'Use como código externo dos itens o código do produto (ex.: V12), ou vincule os itens abaixo quando chegarem os primeiros pedidos.',
    ],
    feeHint: 'Confira a comissão no seu contrato com a 99Food.',
  },
};

function status(p) {
  if (!p.config.enabled) return { label: 'Desligado', icon: CircleOff, className: 'bg-stone-100 text-stone-600 ring-stone-200' };
  if (p.runtime?.last_error) return { label: 'Com erro', icon: AlertTriangle, className: 'bg-red-50 text-red-700 ring-red-200' };
  if (p.stats.last_order_at || p.runtime?.last_ok_at || p.runtime?.last_webhook_at) return { label: 'Conectado', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  return { label: 'Aguardando o primeiro contato', icon: Plug, className: 'bg-amber-50 text-amber-800 ring-amber-200' };
}

function PlatformCard({ id, data, onSaved }) {
  const meta = PLATFORMS[id];
  const toast = useToast();
  const [form, setForm] = useState(data.config);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [showSteps, setShowSteps] = useState(!data.config.enabled);
  useEffect(() => setForm(data.config), [data.config]);
  const st = status(data);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async (kind) => {
    setBusy(kind);
    setResult(null);
    try {
      if (kind === 'save') {
        await api.put(`/integrations/${id}`, form);
        toast(`${meta.name}: configurações salvas`);
      } else if (kind === 'test') {
        await api.put(`/integrations/${id}`, form);
        const r = await api.post(`/integrations/${id}/test`);
        setResult(r);
      } else {
        const o = await api.post(`/integrations/${id}/simulate`);
        toast(`Pedido de teste #${o.id} do ${meta.name} criado. Veja em Pedidos.`);
      }
      onSaved();
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cx('grid size-10 place-items-center rounded-xl text-sm font-black', meta.color, id === 'ifood' ? 'text-white' : 'text-stone-900')}>{id === 'ifood' ? 'iF' : '99'}</span>
          <div>
            <h2 className="font-semibold text-stone-900">{meta.name}</h2>
            <Badge className={st.className}><st.icon className="size-3" /> {st.label}</Badge>
          </div>
        </div>
        <Toggle checked={!!form.enabled} onChange={(v) => set('enabled', v)} label="Ligado" />
      </div>

      <div className="grid grid-cols-3 divide-x divide-stone-100 border-b border-stone-100 text-center">
        <div className="px-2 py-3"><p className="text-xs text-stone-500">Pedidos hoje</p><p className="text-lg font-semibold">{data.stats.orders}</p></div>
        <div className="px-2 py-3"><p className="text-xs text-stone-500">Faturamento hoje</p><p className="text-lg font-semibold">{brl(data.stats.revenue_cents)}</p></div>
        <div className="px-2 py-3"><p className="text-xs text-stone-500">Comissão estimada</p><p className="text-lg font-semibold text-red-700">{brl(data.stats.fee_cents)}</p></div>
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        <p className="text-sm text-stone-600">{meta.how}</p>
        {data.runtime?.last_error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{data.runtime.last_error}</p>}
        {data.stats.last_order_at && <p className="text-xs text-stone-500">Último pedido recebido: {dateTimeBR(data.stats.last_order_at)}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {meta.fields.map(([k, label, type]) => (
            <Field key={k} label={label} className={k === 'courier_phone' ? 'sm:col-span-2' : ''}>
              <Input type={type || 'text'} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} autoComplete="off" />
            </Field>
          ))}
          <Field label="Comissão do app (%)" hint={meta.feeHint}>
            <Input type="number" step="0.1" min="0" max="50" value={form.commission_pct ?? 0} onChange={(e) => set('commission_pct', e.target.value)} />
          </Field>
          <div className="flex items-end pb-6"><Toggle checked={!!form.auto_accept} onChange={(v) => set('auto_accept', v)} label="Aceitar pedidos automaticamente" /></div>
        </div>

        {id === '99food' && (
          <Field label="Endereço de webhook (informe no aplicativo da 99Food)">
            <div className="flex gap-2">
              <Input readOnly value={IS_PREVIEW ? 'https://seu-dominio.com.br/api/hooks/99food' : data.webhook_url} />
              <Button variant="secondary" icon={Copy} onClick={() => { navigator.clipboard?.writeText(data.webhook_url).catch(() => {}); toast('Endereço copiado'); }} aria-label="Copiar" />
            </div>
          </Field>
        )}

        {result && <p className={cx('rounded-xl px-3 py-2 text-sm', result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>{result.message}</p>}

        <div>
          <button onClick={() => setShowSteps(!showSteps)} className="flex items-center gap-1 text-sm font-medium text-brand-700 cursor-pointer">
            <ChevronDown className={cx('size-4 transition', showSteps && 'rotate-180')} /> Como conectar o {meta.name}
          </button>
          {showSteps && (
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-600">
              {meta.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-5 py-3">
        <Button variant="ghost" icon={PlayCircle} loading={busy === 'sim'} onClick={() => run('sim')}>Simular pedido de teste</Button>
        <Button variant="secondary" loading={busy === 'test'} onClick={() => run('test')} disabled={IS_PREVIEW}>Testar conexão</Button>
        <Button icon={Save} loading={busy === 'save'} onClick={() => run('save')}>Salvar</Button>
      </div>
    </Card>
  );
}

function ItemLinks() {
  const items = useApi('/integrations/items');
  const products = useApi('/products');
  const toast = useToast();
  const options = useMemo(() => (products.data || []).flatMap((p) => p.variants.map((v) => ({ id: v.id, label: `${p.name}${v.name ? ` · ${v.name}` : ''}`, code: `V${v.id}` }))), [products.data]);
  if (!items.data || !products.data) return <Spinner />;
  const pending = items.data.filter((i) => !i.variant_id).length;

  const link = async (item, variantId) => {
    const r = await api.put(`/integrations/items/${item.id}`, { variant_id: variantId || null });
    items.setData((list) => list.map((x) => (x.id === item.id ? { ...x, ...r, product_name: options.find((o) => o.id === r.variant_id)?.label } : x)));
    toast(variantId ? 'Item vinculado' : 'Vínculo removido');
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Link2 className="size-4 text-brand-500" /> Vincular produtos dos apps</h2>
          <p className="text-sm text-stone-500">Itens vinculados baixam o estoque e entram no custo (CMV). O preço continua sendo o do app.</p>
        </div>
        {pending > 0 && <Badge className="bg-amber-50 text-amber-800 ring-amber-200">{pending} sem vínculo</Badge>}
      </div>
      {!items.data.length ? (
        <Empty icon={Link2} title="Nenhum item recebido ainda">Os itens aparecem aqui quando chega o primeiro pedido de cada app. Faça um pedido de teste para ver como funciona.</Empty>
      ) : (
        <Table>
          <thead><tr><th>App</th><th>Item no app</th><th className="text-right">Pedidos</th><th>Produto da loja</th></tr></thead>
          <tbody>
            {items.data.map((i) => (
              <tr key={i.id} className={cx(!i.variant_id && 'bg-amber-50/40')}>
                <td><PlatformBadge order={{ external_platform: i.platform }} /></td>
                <td className="font-medium">{i.name}<span className="block text-xs font-normal text-stone-400">{i.external_key.startsWith('nome:') ? 'sem código no app' : `código ${i.external_key}`}</span></td>
                <td className="text-right">{i.seen}</td>
                <td className="min-w-64">
                  <Select value={i.variant_id || ''} onChange={(e) => link(i, Number(e.target.value))}>
                    <option value="">— não vinculado —</option>
                    {options.map((o) => <option key={o.id} value={o.id}>{o.label} ({o.code})</option>)}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export default function Integrations() {
  const { tick } = useLive();
  const data = useApi('/integrations', [tick]);
  if (data.error && !data.data) return <ErrorBox>{data.error}</ErrorBox>;
  if (!data.data) return <Spinner />;
  return (
    <>
      <PageHeader title="iFood e 99Food" subtitle="Pedidos dos apps no mesmo quadro, cozinha, caixa, estoque e relatórios da loja">
        <Link to="/admin/relatorios"><Button variant="secondary">Faturamento por canal</Button></Link>
      </PageHeader>
      {IS_PREVIEW && (
        <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-100">
          Na prévia não há conexão com os apps. Use <b>Simular pedido de teste</b> para ver um pedido do iFood ou da 99Food chegando no quadro de pedidos.
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {Object.keys(PLATFORMS).map((id) => <PlatformCard key={id} id={id} data={data.data[id]} onSaved={data.reload} />)}
      </div>
      <div className="mt-6"><ItemLinks /></div>
    </>
  );
}
