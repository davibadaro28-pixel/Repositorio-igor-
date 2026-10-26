// Marca genérica para demonstração de vendas: troca o nome e os contatos da loja de exemplo
// e tira do cardápio as referências à loja original. Usada pela prévia (--marca=generica)
// e pelo modo demonstração (DEMO_MARCA=generica npm run demo).
import { all, get, run, tx, getSetting, setSetting } from './db.js';
import { BRANDED_PHOTOS } from './brand-photos.js';

export const GENERIC_NAME = 'Sua Doceria Aqui';

export function applyGenericBrand() {
  const store = getSetting('store', {});
  setSetting('store', {
    ...store,
    name: GENERIC_NAME,
    tagline: 'Bolos e Doces',
    slogan: 'Bolos, doces e encomendas feitos com carinho',
    whatsapp: '',
    phone: '',
    instagram: '',
    logo: '',
    address: 'Rua Exemplo, 100 – São Paulo – SP',
    pix_key: '',
    pix_name: '',
  });
  const fiscal = getSetting('fiscal', {});
  setSetting('fiscal', { ...fiscal, razao_social: `${GENERIC_NAME} Ltda` });
  tx(() => {
    for (const c of all(`SELECT id, name FROM categories WHERE name LIKE '%Laços%'`)) {
      run('UPDATE categories SET name = ? WHERE id = ?', c.name.replace(/da Laços/g, 'da Casa'), c.id);
    }
    for (const p of all(`SELECT id, name, description FROM products WHERE name LIKE '%Laços%' OR description LIKE '%Laços%'`)) {
      const fix = (t) => t.replace(/Delicia da Laços/g, 'Delícia da Casa').replace(/da Laços/g, 'da Casa');
      run('UPDATE products SET name = ?, description = ? WHERE id = ?', fix(p.name), fix(p.description), p.id);
    }
    for (const file of BRANDED_PHOTOS) run(`UPDATE products SET image = NULL WHERE image LIKE ?`, `%/${file}`);
    // nomes de itens já vendidos nos pedidos de exemplo
    run(`UPDATE order_items SET name = replace(replace(name, 'Delicia da Laços', 'Delícia da Casa'), 'da Laços', 'da Casa') WHERE name LIKE '%Laços%'`);
  });
  return get('SELECT COUNT(*) AS n FROM products WHERE name LIKE ? OR description LIKE ?', '%Laços%', '%Laços%').n === 0;
}
