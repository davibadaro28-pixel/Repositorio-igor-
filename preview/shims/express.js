// Router no estilo Express que atende as rotas do servidor dentro do navegador.
function compile(path, prefix) {
  const keys = [];
  const src = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, (_, k) => {
    keys.push(k);
    return '([^/]+)';
  });
  const re = new RegExp(`^${src}${prefix ? '(?:/|$)' : '$'}`);
  return (p) => {
    const m = re.exec(p);
    if (!m) return null;
    const params = {};
    keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return params;
  };
}

export function Router() {
  const layers = [];
  const add = (method) => (path, ...handlers) => {
    layers.push({ method, match: compile(path, false), handlers });
    return router;
  };
  const router = {
    layers,
    get: add('GET'),
    post: add('POST'),
    put: add('PUT'),
    patch: add('PATCH'),
    delete: add('DELETE'),
    use(path, ...handlers) {
      if (typeof path === 'function') layers.push({ method: null, match: () => ({}), handlers: [path, ...handlers] });
      else layers.push({ method: null, match: compile(path, true), handlers });
      return router;
    },
  };
  return router;
}

/** Executa as camadas na ordem do Express: middlewares, rotas e erro */
export function dispatch(layers, req, res, onError) {
  let i = 0;
  const nextLayer = (err) => {
    if (err) return onError(err);
    if (res.finished) return undefined;
    while (i < layers.length) {
      const layer = layers[i++];
      if (layer.method && layer.method !== req.method) continue;
      const params = layer.match(req.path);
      if (!params) continue;
      req.params = { ...params };
      let h = 0;
      const nextHandler = (e) => {
        if (e) return onError(e);
        if (h >= layer.handlers.length) return nextLayer();
        const fn = layer.handlers[h++];
        try {
          const r = fn(req, res, nextHandler);
          if (r && typeof r.catch === 'function') r.catch(onError);
        } catch (thrown) {
          onError(thrown);
        }
        return undefined;
      };
      return nextHandler();
    }
    return onError(Object.assign(new Error('Rota não encontrada'), { status: 404 }));
  };
  nextLayer();
}

export default { Router };
