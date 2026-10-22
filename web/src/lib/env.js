/* global __PREVIEW__ */
// true apenas na prévia que roda inteira no navegador (sem servidor)
export const IS_PREVIEW = typeof __PREVIEW__ !== 'undefined' && __PREVIEW__;

/** Caminho de arquivo público: absoluto no servidor, relativo à página na prévia */
export const asset = (path) => (IS_PREVIEW && path?.startsWith('/') ? path.slice(1) : path);

/** Abre em outra aba no sistema instalado; na prévia navega na mesma tela */
export const newTab = IS_PREVIEW ? {} : { target: '_blank', rel: 'noreferrer' };
