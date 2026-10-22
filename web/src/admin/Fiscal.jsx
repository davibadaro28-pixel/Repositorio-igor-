import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileCode2, PlugZap, Receipt, RefreshCw, Save, Search, XCircle, AlertTriangle, CheckCircle2, Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import { api, getToken, useApi } from '../lib/api.js';
import { IS_PREVIEW } from '../lib/env.js';
import { brl, dateTimeBR, todayISO, addDaysISO, CHANNEL } from '../lib/format.js';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Select, Spinner, Stat, Table, Tabs, Textarea, Toggle, cx, useToast } from '../components/ui.jsx';
import { useLive, useSettings } from './AdminApp.jsx';
import OrderDrawer from './OrderDrawer.jsx';
import { CancelNoteModal, DanfeButton, FISCAL_STATUS, canCancelNow, formatDoc, maskDoc } from './FiscalBox.jsx';

const PAY_CODES = [
  ['01', 'Dinheiro'], ['03', 'Cartão de crédito'], ['04', 'Cartão de débito'], ['17', 'PIX dinâmico (maquininha / QR gerado na hora)'],
  ['20', 'PIX estático (chave ou QR fixo)'], ['10', 'Vale-alimentação'], ['11', 'Vale-refeição'], ['12', 'Vale-presente'],
  ['18', 'Transferência / carteira digital'], ['05', 'Cartão da loja'], ['15', 'Boleto'], ['16', 'Depósito bancário'],
  ['19', 'Fidelidade / cashback'], ['99', 'Outros (usa o nome da forma)'],
];
const AUTO_CHANNELS = ['pdv', 'cardapio', 'whatsapp', 'telefone', 'ifood', '99food', 'outro'];

export default function Fiscal() {
  const [tab, setTab] = useState('notas');
  const cfg = useApi('/fiscal/config');
  const { reload: reloadSettings } = useSettings();
  if (!cfg.data) return cfg.error ? <ErrorBox>{cfg.error}</ErrorBox> : <Spinner />;
  const { config, environment } = cfg.data;
  const onSaved = () => { cfg.reload(); reloadSettings?.(); };
  return (
    <>
      <PageHeader title="Notas fiscais (NFC-e)" subtitle="Emissão da nota do consumidor para vendas no balcão, delivery, iFood e 99Food">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'notas', label: 'Notas emitidas' },
          { value: 'config', label: 'Configuração' },
          { value: 'trib', label: 'Tributação', count: cfg.data.missing_ncm || null },
        ]} />
      </PageHeader>
      <EnvBanner config={config} environment={environment} onSetup={() => setTab('config')} />
      {tab === 'notas' && <Docs environment={environment} enabled={config.enabled} />}
      {tab === 'config' && <Config data={cfg.data} onSaved={onSaved} />}
      {tab === 'trib' && <Taxes data={cfg.data} onSaved={onSaved} />}
    </>
  );
}

function EnvBanner({ config, environment, onSetup }) {
  if (!config.enabled) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
        <span className="flex items-center gap-2"><XCircle className="size-4" /> A emissão de NFC-e está desligada.</span>
        <Button size="sm" onClick={onSetup}>Configurar</Button>
      </div>
    );
  }
  const tone = environment === 'producao' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-900 ring-amber-200';
  const text = environment === 'producao'
    ? 'Produção: as notas emitidas têm valor fiscal e vão para a SEFAZ-SP.'
    : environment === 'homologacao'
      ? 'Homologação: as notas vão para o ambiente de testes da SEFAZ e não têm valor fiscal.'
      : 'Treinamento: o sistema simula as notas para a equipe aprender. Nada é enviado à SEFAZ e não há valor fiscal.';
  return <p className={cx('mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ring-1', tone)}>{environment === 'producao' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}{text}{config.auto_emit ? ' Emissão automática ligada.' : ''}</p>;
}

// ---------- Notas emitidas ----------

function Docs({ environment, enabled }) {
  const { tick } = useLive();
  const toast = useToast();
  const [from, setFrom] = useState(addDaysISO(todayISO(), -6));
  const [to, setTo] = useState(todayISO());
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [busy, setBusy] = useState(null);
  const list = useApi(`/fiscal/docs?from=${from}&to=${to}&status=${status}&q=${encodeURIComponent(query)}`, [tick]);
  const totals = Object.fromEntries((list.data?.totals || []).map((t) => [t.status, t]));
  const attention = (totals.rejeitado?.n || 0) + (totals.processando?.n || 0);
  const presets = [['Hoje', todayISO(), todayISO()], ['7 dias', addDaysISO(todayISO(), -6), todayISO()], ['Este mês', `${todayISO().slice(0, 8)}01`, todayISO()]];
  const token = encodeURIComponent(getToken() || '');

  const sync = async (d) => {
    setBusy(d.id);
    try {
      await api.post(`/fiscal/docs/${d.id}/sync`);
      list.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Autorizadas" value={totals.autorizado?.n || 0} sub={brl(totals.autorizado?.total_cents)} icon={CheckCircle2} tone="green" />
        <Stat label="Canceladas" value={totals.cancelado?.n || 0} sub={brl(totals.cancelado?.total_cents)} icon={XCircle} tone="amber" />
        <Stat label="Precisam de atenção" value={attention} sub="rejeitadas ou sem resposta" icon={AlertTriangle} tone="red" />
      </div>
      <Card className="flex flex-wrap items-end gap-2 p-3">
        <label className="text-xs text-stone-500">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-stone-500">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {presets.map(([l, f, t]) => <Button key={l} size="sm" variant="ghost" onClick={() => { setFrom(f); setTo(t); }}>{l}</Button>)}
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="flex min-w-60 flex-1 gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº da nota, pedido, CPF ou cliente" />
          <Button type="submit" variant="secondary" icon={Search}>Buscar</Button>
        </form>
        {IS_PREVIEW
          ? <Button variant="secondary" icon={Download} onClick={() => toast('Na prévia não dá para baixar arquivos. No sistema instalado, sai um .zip com os XMLs e o resumo.')}>XMLs para o contador</Button>
          : <a href={`/api/fiscal/export.zip?from=${from}&to=${to}&environment=${environment}&token=${token}`}><Button variant="secondary" icon={Download}>XMLs para o contador</Button></a>}
      </Card>
      <Tabs value={status} onChange={setStatus} tabs={[
        { value: '', label: 'Todas' }, { value: 'autorizado', label: 'Autorizadas' },
        { value: 'atencao', label: 'Com problema', count: attention || null }, { value: 'cancelado', label: 'Canceladas' },
      ]} />
      <Card>
        {!list.data ? <Spinner /> : !list.data.docs.length ? (
          <Empty icon={Receipt} title="Nenhuma nota no período">{enabled ? 'Emita pelo botão “Emitir NFC-e” no pedido ou ligue a emissão automática.' : 'Ligue a emissão em Configuração.'}</Empty>
        ) : (
          <Table>
            <thead><tr><th>Nota</th><th>Data</th><th>Pedido</th><th>Consumidor</th><th className="text-right">Valor</th><th>Situação</th><th /></tr></thead>
            <tbody>
              {list.data.docs.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="whitespace-nowrap font-medium">{d.number ? `${d.number}` : '—'}<span className="block text-xs font-normal text-stone-500">{d.series ? `série ${d.series}` : ''}</span></td>
                  <td className="whitespace-nowrap">{dateTimeBR(d.issued_at || d.created_at)}</td>
                  <td><button className="font-medium text-brand-700 hover:underline cursor-pointer" onClick={() => setOpen(d.order_id)}>#{d.order_id}</button><span className="block text-xs text-stone-500">{CHANNEL[d.channel]}{d.external_code ? ` #${d.external_code}` : ''}</span></td>
                  <td>{d.customer_name || '—'}<span className="block text-xs text-stone-500">{d.customer_doc ? formatDoc(d.customer_doc) : 'sem CPF'}</span></td>
                  <td className="text-right font-medium">{brl(d.total_cents)}</td>
                  <td className="max-w-72">
                    <Badge className={FISCAL_STATUS[d.status].color}>{FISCAL_STATUS[d.status].label.replace('NFC-e ', '')}</Badge>
                    {d.status !== 'autorizado' && d.message && <span className="mt-1 block text-xs text-stone-600">{d.message}</span>}
                    {d.alert && <span className="mt-1 block text-xs font-medium text-red-700">{d.alert}</span>}
                  </td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {d.status === 'autorizado' && <DanfeButton doc={d} />}
                      {d.has_xml && !IS_PREVIEW ? <a href={`/api/fiscal/docs/${d.id}/xml?token=${token}`}><Button size="sm" variant="ghost" icon={FileCode2}>XML</Button></a> : null}
                      {d.status === 'processando' && <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy === d.id} onClick={() => sync(d)}>Consultar</Button>}
                      {d.status === 'rejeitado' && <Button size="sm" onClick={() => setOpen(d.order_id)}>Corrigir</Button>}
                      {d.status === 'autorizado' && canCancelNow(d) && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancel(d)}>Cancelar</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChange={() => list.reload()} />}
      {cancel && <CancelNoteModal doc={cancel} onClose={() => setCancel(null)} onDone={() => { setCancel(null); list.reload(); toast('NFC-e cancelada'); }} />}
    </div>
  );
}

// ---------- Configuração ----------

function Config({ data, onSaved }) {
  const toast = useToast();
  const { settings } = useSettings();
  const [f, setF] = useState(data.config);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => setF(data.config), [data.config]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const methods = settings?.payment_methods || [];

  const save = async (test) => {
    setBusy(test ? 'test' : 'save');
    setErr('');
    setResult(null);
    try {
      await api.put('/fiscal/config', f);
      onSaved();
      if (test) setResult(await api.post('/fiscal/test'));
      else toast('Configuração fiscal salva');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };

  const focus = f.provider !== 'simulado';
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-semibold"><Receipt className="size-5 text-brand-500" /> Emissor da nota</h3>
            <Toggle checked={!!f.enabled} onChange={(v) => set('enabled', v)} label="Emitir NFC-e" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[['focusnfe', 'Focus NFe', 'Notas reais pela SEFAZ-SP (homologação para testes ou produção).'], ['simulado', 'Treinamento', 'Simula as notas para a equipe aprender. Sem valor fiscal.']].map(([v, l, d]) => (
              <button key={v} type="button" onClick={() => set('provider', v)} className={cx('rounded-2xl p-3 text-left ring-1 transition cursor-pointer', f.provider === v ? 'bg-brand-50 ring-2 ring-brand-400' : 'ring-stone-200 hover:bg-stone-50')}>
                <p className="font-medium">{l}</p><p className="text-xs text-stone-500">{d}</p>
              </button>
            ))}
          </div>
          {focus && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ambiente" className="sm:col-span-2">
                <Select value={f.ambiente} onChange={(e) => set('ambiente', e.target.value)}>
                  <option value="homologacao">Homologação – testes, sem valor fiscal</option>
                  <option value="producao">Produção – notas valendo</option>
                </Select>
              </Field>
              <Field label="Token de homologação" hint="Painel da Focus NFe → empresa → Tokens"><Input type="password" autoComplete="off" value={f.token_homologacao || ''} onChange={(e) => set('token_homologacao', e.target.value)} /></Field>
              <Field label="Token de produção"><Input type="password" autoComplete="off" value={f.token_producao || ''} onChange={(e) => set('token_producao', e.target.value)} /></Field>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CNPJ da loja"><Input value={maskDoc(f.cnpj)} inputMode="numeric" placeholder="00.000.000/0000-00" onChange={(e) => set('cnpj', e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label="Regime tributário">
              <Select value={f.regime} onChange={(e) => set('regime', e.target.value)}>
                <option value="simples_nacional">Simples Nacional</option>
                <option value="mei">MEI</option>
                <option value="normal">Regime normal (lucro presumido ou real)</option>
              </Select>
            </Field>
            <Field label="Razão social" className="sm:col-span-2" hint="Aparece no comprovante do treinamento. Nas notas reais vale o cadastro na Focus NFe."><Input value={f.razao_social || ''} onChange={(e) => set('razao_social', e.target.value)} /></Field>
          </div>
          {f.regime === 'normal' && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Regime normal: desde agosto de 2026 a SEFAZ exige o grupo IBS/CBS da reforma tributária em cada item. Preencha o CST e a classificação do IBS/CBS nos perfis em Tributação, com o contador.</p>}
          {result && <p className={cx('rounded-xl px-3 py-2 text-sm', result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>{result.message}</p>}
          <ErrorBox>{err}</ErrorBox>
          <div className="flex flex-wrap gap-2">
            <Button icon={Save} loading={busy === 'save'} onClick={() => save(false)}>Salvar</Button>
            <Button variant="secondary" icon={PlugZap} loading={busy === 'test'} onClick={() => save(true)}>Salvar e testar conexão</Button>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Emissão automática</h3>
            <Toggle checked={!!f.auto_emit} onChange={(v) => set('auto_emit', v)} label="Ligada" />
          </div>
          <p className="text-sm text-stone-600">A nota sai sozinha quando o pedido <b>sai para entrega</b> (a nota acompanha o pedido) ou é <b>concluído</b> (balcão e retirada). Se faltar algum dado, o pedido mostra o aviso para corrigir.</p>
          <div className="flex flex-wrap gap-2">
            {AUTO_CHANNELS.map((c) => {
              const on = (f.auto_channels || []).includes(c);
              return (
                <button key={c} type="button" disabled={!f.auto_emit} onClick={() => set('auto_channels', on ? f.auto_channels.filter((x) => x !== c) : [...(f.auto_channels || []), c])}
                  className={cx('rounded-full px-3 py-1 text-sm ring-1 transition cursor-pointer disabled:opacity-50', on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-stone-600 ring-stone-200')}>
                  {CHANNEL[c]}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Formas de pagamento na nota</h3>
          <p className="text-sm text-stone-500">Como cada forma de pagamento da loja aparece na NFC-e.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((m) => (
              <Field key={m.id} label={m.label}>
                <Select value={f.payment_codes?.[m.id] || '99'} onChange={(e) => set('payment_codes', { ...f.payment_codes, [m.id]: e.target.value })}>
                  {PAY_CODES.map(([c, l]) => <option key={c} value={c}>{c} – {l}</option>)}
                </Select>
              </Field>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Vendas pelo iFood e pela 99Food</h3>
          <p className="text-sm text-stone-500">Nas vendas pelos apps, a nota informa o app como intermediador. Os CNPJs já vêm preenchidos; o identificador da loja vem da tela iFood e 99Food quando fica em branco.</p>
          {[['ifood', 'iFood'], ['99food', '99Food']].map(([k, l]) => (
            <div key={k} className="grid gap-3 sm:grid-cols-2">
              <Field label={`CNPJ do ${l}`}><Input value={maskDoc(f.intermediarios?.[k]?.cnpj)} inputMode="numeric" onChange={(e) => set('intermediarios', { ...f.intermediarios, [k]: { ...f.intermediarios[k], cnpj: e.target.value.replace(/\D/g, '') } })} /></Field>
              <Field label={`Identificador da loja no ${l}`}><Input value={f.intermediarios?.[k]?.id || ''} placeholder={data.store_ids[k] || 'ID da loja no app'} onChange={(e) => set('intermediarios', { ...f.intermediarios, [k]: { ...f.intermediarios[k], id: e.target.value } })} /></Field>
            </div>
          ))}
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="font-semibold">Texto no rodapé da nota</h3>
          <Textarea value={f.info_adicional || ''} onChange={(e) => set('info_adicional', e.target.value)} placeholder="Ex.: Obrigada pela preferência! Siga @lacos_de_mae" />
          <Button icon={Save} loading={busy === 'save'} onClick={() => save(false)}>Salvar</Button>
        </Card>
      </div>

      <Card className="h-fit space-y-3 p-5 text-sm">
        <h3 className="flex items-center gap-2 font-semibold"><ListChecks className="size-5 text-brand-500" /> Como ligar a nota de verdade</h3>
        <ol className="list-decimal space-y-2 pl-5 text-stone-700">
          <li><b>Contador:</b> confirme o regime, o credenciamento da empresa para emitir NFC-e na SEFAZ-SP (o SAT não é mais aceito em SP desde 2026) e confira os NCM e perfis em <b>Tributação</b>.</li>
          <li><b>Certificado digital A1</b> (e-CNPJ, arquivo .pfx) e o <b>CSC</b> gerado no portal da SEFAZ-SP (ID e código) para homologação e produção.</li>
          <li>Contrate a <b>Focus NFe</b> (focusnfe.com.br), cadastre a empresa com o certificado e o CSC e habilite a NFC-e.</li>
          <li>Cole aqui o <b>token de homologação</b>, escolha Homologação, clique em <b>Salvar e testar conexão</b> e emita alguns pedidos de teste.</li>
          <li>Com tudo certo, cole o <b>token de produção</b> e mude para Produção. Ligue a emissão automática se quiser.</li>
        </ol>
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-stone-600">O DANFE (cupom com QR Code) sai pelo botão <b>DANFE</b> do pedido. A NFC-e pode ser cancelada em até 30 minutos. Todo mês, baixe os <b>XMLs para o contador</b> na aba Notas emitidas.</p>
        <p className="text-xs text-stone-500">Integração com a Focus NFe por um único CNPJ. Também é possível treinar a equipe no modo Treinamento antes de ter o certificado.</p>
        <Link to="/admin/integracoes" className="block text-xs font-medium text-brand-700 underline">Configurar iFood e 99Food</Link>
      </Card>
    </div>
  );
}

// ---------- Tributação ----------

function Taxes({ data, onSaved }) {
  const toast = useToast();
  const list = useApi('/fiscal/products');
  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState({});
  const [filter, setFilter] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState({ category: '', profile: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (list.data) { setRows(list.data); setDirty({}); } }, [list.data]);
  const profiles = data.profiles;
  const defaultProfile = profiles.find((p) => p.id === data.config.default_profile_id);
  const categories = useMemo(() => [...new Set((rows || []).map((r) => r.category_name))], [rows]);

  const change = (id, patch) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty((d) => ({ ...d, [id]: true }));
  };
  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      await api.put('/fiscal/products', { products: rows.filter((r) => dirty[r.id]).map(({ id, ncm, cest, tax_profile_id: p }) => ({ id, ncm, cest, tax_profile_id: p })) });
      toast('Tributação salva');
      list.reload();
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  const setDefault = async (id) => {
    try {
      await api.put('/fiscal/config', { default_profile_id: Number(id) });
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const removeProfile = async (p) => {
    try {
      await api.del(`/fiscal/profiles/${p.id}`);
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const shown = (rows || []).filter((r) => r.active && (!onlyMissing || String(r.ncm || '').length !== 8)
    && (!filter || `${r.name} ${r.category_name}`.toLowerCase().includes(filter.toLowerCase())));
  const changed = Object.keys(dirty).length;
  const regime = data.config.regime === 'normal' ? 'normal' : 'simples';
  const icmsLabel = (c) => data.codes.icms.simples[c] || data.codes.icms.normal[c] || '';

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        Os NCM e perfis abaixo foram sugeridos para confeitaria no Simples Nacional (bolos e doces: produção própria, CFOP 5101; bebidas: revenda com substituição tributária, CFOP 5405). Peça ao contador para conferir antes de emitir em produção. Bebidas com substituição tributária costumam exigir também o CEST.
      </p>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Perfis tributários</h3>
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditing({ name: '', cfop: '5101', icms_cst: regime === 'normal' ? '00' : '102', pis_cst: '49', cofins_cst: '49' })}>Novo perfil</Button>
        </div>
        <Table>
          <thead><tr><th>Perfil</th><th>CFOP</th><th>ICMS</th><th>PIS / COFINS</th><th>Padrão</th><th /></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td>{p.cfop}</td>
                <td>{p.icms_cst} <span className="block text-xs text-stone-500">{icmsLabel(p.icms_cst)}</span></td>
                <td>{p.pis_cst} / {p.cofins_cst}{p.ibs_cbs_cst ? <span className="block text-xs text-stone-500">IBS/CBS {p.ibs_cbs_cst} · {p.ibs_cbs_class}</span> : null}</td>
                <td><input type="radio" className="accent-brand-600" checked={defaultProfile?.id === p.id} onChange={() => setDefault(p.id)} aria-label="Perfil padrão" /></td>
                <td className="whitespace-nowrap text-right">
                  <button className="p-1 text-stone-400 hover:text-brand-700 cursor-pointer" onClick={() => setEditing(p)} aria-label="Editar"><Pencil className="size-4" /></button>
                  <button className="p-1 text-stone-400 hover:text-red-600 cursor-pointer" onClick={() => removeProfile(p)} aria-label="Excluir"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-stone-500">Produtos sem perfil usam o padrão{defaultProfile ? `: ${defaultProfile.name}` : ''}.</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-end gap-2 border-b border-stone-100 p-3">
          <div className="w-full max-w-xs"><Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar produto ou categoria" /></div>
          <Toggle checked={onlyMissing} onChange={setOnlyMissing} label={`Só sem NCM (${(rows || []).filter((r) => r.active && String(r.ncm || '').length !== 8).length})`} />
          <div className="ml-auto flex flex-wrap items-end gap-2">
            <div className="w-48">
              <Select value={bulk.category} onChange={(e) => setBulk({ ...bulk, category: e.target.value })}>
                <option value="">Categoria…</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div className="w-64">
              <Select value={bulk.profile} onChange={(e) => setBulk({ ...bulk, profile: e.target.value })}>
                <option value="">Perfil padrão</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <Button size="sm" variant="secondary" disabled={!bulk.category} onClick={() => rows.filter((r) => r.category_name === bulk.category).forEach((r) => change(r.id, { tax_profile_id: bulk.profile ? Number(bulk.profile) : null }))}>Aplicar à categoria</Button>
          </div>
        </div>
        {!rows ? <Spinner /> : (
          <Table>
            <thead><tr><th>Produto</th><th className="w-36">NCM</th><th className="w-32">CEST</th><th>Perfil tributário</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={dirty[r.id] ? 'bg-brand-50/50' : ''}>
                  <td>{r.name}<span className="block text-xs text-stone-500">{r.category_name}</span></td>
                  <td><Input className={cx('h-9 font-mono', String(r.ncm || '').length !== 8 && 'ring-red-300')} inputMode="numeric" maxLength={10} value={r.ncm || ''} placeholder="8 dígitos" onChange={(e) => change(r.id, { ncm: e.target.value.replace(/\D/g, '') })} /></td>
                  <td><Input className="h-9 font-mono" inputMode="numeric" maxLength={9} value={r.cest || ''} placeholder="—" onChange={(e) => change(r.id, { cest: e.target.value.replace(/\D/g, '') })} /></td>
                  <td>
                    <Select className="h-9" value={r.tax_profile_id || ''} onChange={(e) => change(r.id, { tax_profile_id: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Padrão ({defaultProfile?.name || '—'})</option>
                      {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 bg-white/95 p-3">
          <ErrorBox>{err}</ErrorBox>
          <span className="text-sm text-stone-500">{changed ? `${changed} produto(s) alterado(s)` : 'Nenhuma alteração'}</span>
          <Button icon={Save} loading={saving} disabled={!changed} onClick={save}>Salvar tributação</Button>
        </div>
      </Card>
      {editing && <ProfileModal profile={editing} regime={regime} codes={data.codes} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} />}
    </div>
  );
}

function ProfileModal({ profile, regime, codes, onClose, onSaved }) {
  const [p, setP] = useState(profile);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const icms = codes.icms[regime];
  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      if (p.id) await api.put(`/fiscal/profiles/${p.id}`, p);
      else await api.post('/fiscal/profiles', p);
      onSaved();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };
  const rateFor = (cst) => ['01', '02'].includes(cst);
  return (
    <Modal open onClose={onClose} title={p.id ? 'Editar perfil tributário' : 'Novo perfil tributário'} footer={<Button icon={Save} loading={saving} onClick={save}>Salvar perfil</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2"><Input value={p.name} onChange={set('name')} placeholder="Ex.: Produção própria" /></Field>
        <Field label="CFOP" hint="5101 produção própria · 5102 revenda · 5405 revenda com ST"><Input value={p.cfop} inputMode="numeric" maxLength={4} onChange={set('cfop')} /></Field>
        <Field label={regime === 'normal' ? 'CST do ICMS' : 'CSOSN (Simples Nacional)'}>
          <Select value={p.icms_cst} onChange={set('icms_cst')}>
            {Object.entries(icms).map(([c, l]) => <option key={c} value={c}>{c} – {l}</option>)}
          </Select>
        </Field>
        {regime === 'normal' && p.icms_cst === '00' && <Field label="Alíquota do ICMS (%)"><Input type="number" min="0" step="0.01" value={p.icms_aliquota ?? 0} onChange={set('icms_aliquota')} /></Field>}
        {[['pis', 'PIS'], ['cofins', 'COFINS']].map(([k, l]) => (
          <div key={k} className="contents">
            <Field label={`CST do ${l}`}>
              <Select value={p[`${k}_cst`]} onChange={set(`${k}_cst`)}>
                {Object.entries(codes.pis_cofins).map(([c, t]) => <option key={c} value={c}>{c} – {t}</option>)}
              </Select>
            </Field>
            {rateFor(p[`${k}_cst`]) && <Field label={`Alíquota do ${l} (%)`}><Input type="number" min="0" step="0.01" value={p[`${k}_aliquota`] ?? 0} onChange={set(`${k}_aliquota`)} /></Field>}
          </div>
        ))}
        {regime === 'normal' && (
          <>
            <Field label="CST do IBS/CBS" hint="Reforma tributária (ex.: 000)"><Input value={p.ibs_cbs_cst || ''} inputMode="numeric" maxLength={3} onChange={set('ibs_cbs_cst')} /></Field>
            <Field label="Classificação tributária (cClassTrib)" hint="6 dígitos (ex.: 000001)"><Input value={p.ibs_cbs_class || ''} inputMode="numeric" maxLength={6} onChange={set('ibs_cbs_class')} /></Field>
          </>
        )}
        <div className="sm:col-span-2"><ErrorBox>{err}</ErrorBox></div>
      </div>
    </Modal>
  );
}
