// Textos do cardápio mais limpos para exibição (nomes curtos, selos e descrições)

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const CONNECTOR = /^(de|da|do|das|dos)\s+/i;

/** "Pudim (Novidade)" → título "Pudim" + selo "Novidade"; "Bolo no Pote (200ml)" → nota "200ml" */
export function splitTitle(name) {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(name);
  if (!m) return { title: name };
  return /novidade|lan[cç]amento|novo/i.test(m[2]) ? { title: m[1], badge: m[2] } : { title: m[1], note: m[2] };
}

// "bolo" ~ "bolos", "fatia" ~ "bolo em fatia", "bg" ~ "bolo gelado", "docinho" ~ "doces"
function sameWord(a, b) {
  return a.startsWith(b) || b.startsWith(a);
}
function prefixMatches(prefix, category) {
  const words = prefix.split(' ');
  const cat = category.split(' ');
  if (category.includes(prefix)) return true;
  if (words.every((w, i) => cat[i] && sameWord(w, cat[i]))) return true;
  if (prefix === cat.map((w) => w[0]).join('')) return true;
  return words.length === 1 && prefix.length >= 3 && cat[0].slice(0, 3) === prefix.slice(0, 3);
}

/**
 * Nome curto dentro da categoria:
 * "Bolo Premium - Ninho com morango" em "Bolo Premium" → "Ninho com morango"
 * "Bolo de cenoura com calda" em "Bolos Caseiros" → "Cenoura com calda"
 */
export function shortName(name, categoryTitle) {
  const cat = norm(categoryTitle);
  const parts = name.split(' - ');
  if (parts.length > 1 && prefixMatches(norm(parts[0]), cat)) {
    return capitalize(parts.slice(1).join(' - ').trim());
  }
  const words = name.trim().split(/\s+/);
  const catWords = categoryTitle.trim().split(/\s+/);
  // tira as palavras iniciais que repetem a categoria ("Cobertura extra de ganache" → "Ganache")
  let k = 0;
  while (k < words.length && k < catWords.length && sameWord(norm(words[k]), norm(catWords[k]))) k++;
  if (k > 0) {
    const rest = words.slice(k).join(' ').replace(CONNECTOR, '');
    if (rest.length >= 3) return capitalize(rest);
  }
  return name;
}

/** "Pudim - Tradicional" → "Pudim – Tradicional" */
export const displayName = (name) => name.replace(/\s+-\s+/g, ' – ');

/** Tira da descrição a linha que repete o nome e marcações como "-1 UNIDADE"; listas com "-" viram "·" */
export function cleanDesc(desc, name) {
  const nameWords = new Set(norm(name).split(' '));
  const repeatsName = (line) => {
    if (/[.!?]$/.test(line)) return false;
    const words = norm(line).split(' ').filter((w) => w.length > 2);
    if (!words.length || words.length > 7) return false;
    return words.filter((w) => nameWords.has(w)).length / words.length >= 0.6;
  };
  const lines = String(desc || '').split('\n').map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^-?\s*1\s*unidade$/i.test(l))
    // blocos em MAIÚSCULAS (ex.: "TAMANHOS/PESOS: …") repetem o que já aparece nas opções de tamanho
    .filter((l) => !(/[A-ZÀ-Ú]{3}/.test(l) && l === l.toUpperCase()))
    .filter((l, i) => !(i === 0 && repeatsName(l)));
  let text = lines.join(' ');
  if (/^-\s/.test(text)) text = text.replace(/^-\s*/, '').split(/\s+-\s+/).join(' · ');
  return text.trim();
}
