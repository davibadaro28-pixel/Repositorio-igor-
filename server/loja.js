// Loja (cliente) atendida por esta instalação. Cada cliente tem uma pasta em lojas/<nome>/ com
// loja.json (dados da loja, tema, bairros, insumos…), catalogo.json (cardápio) e public/ (logo e fotos).
// Escolha com a variável LOJA (ex.: LOJA=vs-burger); sem ela, lacos-de-mae.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const LOJA = String(process.env.LOJA || 'lacos-de-mae').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'lacos-de-mae';
export const LOJA_DIR = join(root, 'lojas', LOJA);
export const LOJA_PUBLIC = join(LOJA_DIR, 'public');

let config;
let catalog;
/** loja.json da loja escolhida */
export function lojaConfig() {
  config ??= JSON.parse(readFileSync(join(LOJA_DIR, 'loja.json'), 'utf8'));
  return config;
}
/** Cardápio inicial (categorias, produtos, preços, adicionais) */
export function lojaCatalog() {
  catalog ??= JSON.parse(readFileSync(join(LOJA_DIR, 'catalogo.json'), 'utf8'));
  return catalog;
}
