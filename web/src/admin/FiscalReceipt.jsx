import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IS_PREVIEW } from '../lib/env.js';
import { useApi } from '../lib/api.js';
import { brl, dateTimeBR } from '../lib/format.js';
import { useSettings } from './AdminApp.jsx';
import { formatDoc } from './FiscalBox.jsx';

const PAY = { '01': 'Dinheiro', '03': 'Cartão de crédito', '04': 'Cartão de débito', 10: 'Vale-alimentação', 11: 'Vale-refeição', 17: 'PIX', 20: 'PIX' };
const cents = (v) => Math.round((v || 0) * 100);

/**
 * Comprovante da NFC-e do modo treinamento (80 mm). As notas reais usam o DANFE oficial gerado pela Focus NFe,
 * com QR Code e chave de acesso da SEFAZ.
 */
export default function FiscalReceipt() {
  const { id } = useParams();
  const { data: doc, error } = useApi(`/fiscal/docs/${id}`);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const store = settings?.store;

  useEffect(() => {
    if (doc && store && !IS_PREVIEW && doc.provider === 'simulado') setTimeout(() => window.print(), 300);
  }, [doc, store]);

  if (error) return <p className="p-4 text-sm text-red-700">{error}</p>;
  if (!doc || !store) return <p className="p-4 text-sm">Preparando…</p>;
  if (doc.provider !== 'simulado') {
    return (
      <div className="p-6 text-center text-sm">
        <p className="mb-3">O DANFE desta nota é gerado pelo emissor.</p>
        {doc.danfe_url && <a className="font-medium text-brand-700 underline" href={doc.danfe_url}>Abrir DANFE</a>}
      </div>
    );
  }
  const p = doc.payload || { items: [], formas_pagamento: [] };
  const line = <div className="my-1.5 border-t border-dashed border-black" />;
  const products = p.items.reduce((s, i) => s + cents(i.valor_bruto), 0);
  const discount = p.items.reduce((s, i) => s + cents(i.valor_desconto), 0);
  const others = p.items.reduce((s, i) => s + cents(i.valor_outras_despesas), 0);

  return (
    <div className="min-h-dvh bg-stone-200 py-6 print:bg-white print:py-0">
      <div className="print-area mx-auto w-[76mm] bg-white p-2 font-mono text-[11px] leading-tight text-black shadow print:shadow-none">
        <p className="mb-1 border-2 border-black p-1 text-center text-[13px] font-bold">SIMULAÇÃO – SEM VALOR FISCAL</p>
        <div className="text-center">
          <p className="text-[13px] font-bold">{(settings.fiscal?.razao_social || store.name).toUpperCase()}</p>
          <p className="text-[10px]">{store.address}</p>
        </div>
        {line}
        <p className="text-center font-bold">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
        <p className="text-center text-[10px]">(modo treinamento do sistema)</p>
        {line}
        <div className="flex justify-between font-bold"><span>Descrição</span><span>Total</span></div>
        {p.items.map((i) => (
          <div key={i.numero_item} className="mb-1">
            <p>{i.numero_item} {i.descricao}</p>
            <div className="flex justify-between pl-3"><span>{i.quantidade_comercial} UN x {brl(cents(i.valor_unitario_comercial))}</span><span>{brl(cents(i.valor_bruto))}</span></div>
          </div>
        ))}
        {line}
        <div className="flex justify-between"><span>Qtde. total de itens</span><span>{p.items.length}</span></div>
        <div className="flex justify-between"><span>Valor total R$</span><span>{brl(products)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>Desconto R$</span><span>-{brl(discount)}</span></div>}
        {others > 0 && <div className="flex justify-between"><span>Taxa de entrega R$</span><span>{brl(others)}</span></div>}
        <div className="flex justify-between text-[13px] font-bold"><span>Valor a pagar R$</span><span>{brl(doc.total_cents)}</span></div>
        <div className="mt-1 flex justify-between font-bold"><span>Forma de pagamento</span><span>Valor pago</span></div>
        {p.formas_pagamento.map((f, k) => (
          <div key={k} className="flex justify-between"><span>{f.descricao_pagamento || PAY[f.forma_pagamento] || 'Outros'}</span><span>{brl(cents(f.valor_pagamento))}</span></div>
        ))}
        {p.valor_troco ? <div className="flex justify-between"><span>Troco</span><span>{brl(cents(p.valor_troco))}</span></div> : null}
        {line}
        <p className="text-center">{doc.customer_doc ? `CONSUMIDOR CPF/CNPJ: ${formatDoc(doc.customer_doc)}` : 'CONSUMIDOR NÃO IDENTIFICADO'}</p>
        {line}
        <p className="text-center font-bold">Simulação nº {doc.number} · série {doc.series}</p>
        <p className="text-center">Emissão: {dateTimeBR(doc.issued_at || doc.created_at)}</p>
        <p className="text-center">Pedido #{doc.order_id}</p>
        {doc.status === 'cancelado' && <p className="mt-1 border border-black p-1 text-center font-bold">CANCELADA</p>}
        {line}
        <p className="text-center text-[10px]">Sem chave de acesso e sem QR Code: este documento não foi enviado à SEFAZ.
          Ligue a emissão real em Notas fiscais → Configuração.</p>
      </div>
      {IS_PREVIEW ? (
        <div className="mt-4 text-center print:hidden">
          <p className="mb-2 text-sm text-stone-500">No sistema instalado este comprovante vai direto para a impressora térmica.</p>
          <button onClick={() => navigate(-1)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white">Voltar</button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-stone-500 print:hidden">Se a impressão não abriu, use Ctrl+P.</p>
      )}
    </div>
  );
}
