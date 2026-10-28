import { fontHref, themeColor, themeCss } from '../../../shared/theme.js';

export { FONTS, STYLES, DEFAULT_COLOR } from '../../../shared/theme.js';

/** Aplica cor, fonte e cor da barra do navegador da loja (vale para cardápio, painel e app do entregador) */
export function applyTheme(store) {
  if (!store || typeof document === 'undefined') return;
  const theme = store.theme || {};
  let style = document.getElementById('loja-theme');
  if (!style) {
    style = document.createElement('style');
    style.id = 'loja-theme';
    document.head.appendChild(style);
  }
  const css = themeCss(theme);
  if (style.textContent !== css) style.textContent = css;

  const href = fontHref(theme);
  let link = document.getElementById('loja-font');
  if (href && !document.querySelector(`link[href="${href}"]`)) {
    if (!link) {
      link = document.createElement('link');
      link.id = 'loja-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = themeColor(theme);
}
