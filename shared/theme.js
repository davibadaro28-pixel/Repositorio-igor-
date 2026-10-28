// Aparência da loja (cor principal, fonte do nome, borda do topo). Usado pelo servidor (index.html já
// sai com as cores certas) e pelas telas (quando a loja muda a aparência em Configurações).

export const DEFAULT_COLOR = '#973358';

/** Fontes para o nome da loja. scale: ajuste de tamanho para caber no topo do cardápio */
export const FONTS = {
  script: { label: 'Manuscrita (Dancing Script)', family: '"Dancing Script", cursive', google: 'Dancing+Script:wght@700', scale: 1 },
  pixel: { label: 'Gamer / pixel (Pixelify Sans)', family: '"Pixelify Sans", ui-sans-serif, sans-serif', google: 'Pixelify+Sans:wght@700', scale: 0.8 },
  impacto: { label: 'Impacto (Bebas Neue)', family: '"Bebas Neue", Impact, sans-serif', google: 'Bebas+Neue', scale: 1.08 },
  moderna: { label: 'Moderna (Poppins)', family: 'Poppins, ui-sans-serif, system-ui, sans-serif', google: null, scale: 0.78 },
  retro: { label: 'Retrô (Lobster)', family: 'Lobster, cursive', google: 'Lobster', scale: 0.92 },
};

export const STYLES = { renda: 'Renda (confeitaria)', onda: 'Onda', reto: 'Reto' };

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Tons 50–900 a partir da cor principal (que vira o tom 600, usado em botões) */
export function palette(hex) {
  const base = hexToRgb(hex);
  const W = [255, 255, 255];
  const K = [12, 8, 10];
  const steps = { 50: [W, 0.94], 100: [W, 0.87], 200: [W, 0.74], 300: [W, 0.54], 400: [W, 0.3], 500: [W, 0.13], 600: [W, 0], 700: [K, 0.18], 800: [K, 0.36], 900: [K, 0.52] };
  return Object.fromEntries(Object.entries(steps).map(([k, [to, t]]) => [k, rgbToHex(mix(base, to, t))]));
}

const validHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

/** Variáveis CSS do tema (vazio = cores originais do sistema) */
export function themeCss(theme = {}) {
  const font = FONTS[theme.font] || FONTS.script;
  const vars = [`--font-script:${font.family}`, `--font-script-scale:${font.scale}`];
  if (validHex(theme.color) && theme.color.toLowerCase() !== DEFAULT_COLOR) {
    for (const [k, v] of Object.entries(palette(theme.color))) vars.push(`--color-brand-${k}:${v}`);
    vars.push(`--color-cream:${validHex(theme.bg) ? theme.bg : rgbToHex(mix(hexToRgb(theme.color), [255, 255, 255], 0.975))}`);
  } else if (validHex(theme.bg)) {
    vars.push(`--color-cream:${theme.bg}`);
  }
  return `:root{${vars.join(';')}}`;
}

/** Endereço do Google Fonts para a fonte do nome (null = já carregada) */
export function fontHref(theme = {}) {
  const font = FONTS[theme.font] || FONTS.script;
  return font.google ? `https://fonts.googleapis.com/css2?family=${font.google}&display=swap` : null;
}

/** Cor da barra do navegador no celular */
export const themeColor = (theme = {}) => (validHex(theme.color) ? theme.color : DEFAULT_COLOR);
