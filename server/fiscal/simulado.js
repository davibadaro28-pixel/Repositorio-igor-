// Modo treinamento: percorre todo o fluxo da nota (emitir, imprimir, cancelar, exportar) sem falar com a SEFAZ.
// Os documentos gerados são marcados como simulação e não têm valor fiscal.
import { getSetting, setSetting } from '../db.js';

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);

export const SIM_MESSAGE = 'Simulação: documento de treinamento, sem valor fiscal';

export async function emit(_cfg, ref, payload) {
  const number = (getSetting('fiscal_sim_seq', 0) || 0) + 1;
  setSetting('fiscal_sim_seq', number);
  const items = payload.items.map((i) => `  <item descricao="${esc(i.descricao)}" ncm="${esc(i.codigo_ncm)}" cfop="${esc(i.cfop)}" quantidade="${i.quantidade_comercial}" valor="${i.valor_bruto}"/>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<simulacao aviso="DOCUMENTO DE TREINAMENTO - SEM VALOR FISCAL" referencia="${esc(ref)}" numero="${number}" data="${esc(payload.data_emissao)}">\n${items.join('\n')}\n</simulacao>\n`;
  return { status: 'autorizado', number: String(number), series: 'TREINO', message: SIM_MESSAGE, xml };
}

export async function consult(_cfg, _ref) {
  return {};
}

export async function cancel(_cfg, ref, justificativa) {
  return {
    status: 'cancelado',
    message: 'Simulação: cancelamento registrado',
    cancel_xml: `<?xml version="1.0" encoding="UTF-8"?>\n<simulacao-cancelamento aviso="DOCUMENTO DE TREINAMENTO - SEM VALOR FISCAL" referencia="${esc(ref)}" justificativa="${esc(justificativa)}"/>\n`,
  };
}

export async function testConnection() {
  return 'Modo treinamento ativo: as notas são simuladas e não vão para a SEFAZ.';
}
