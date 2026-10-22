import { useEffect, useRef, useState, useCallback } from 'react';

const TOKEN_KEY = 'lacos_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navegação privada */
  }
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/public') && !path.startsWith('/auth/login')) {
      setToken(null);
      window.dispatchEvent(new Event('lacos:logout'));
    }
    throw new ApiError(res.status, data?.error || 'Erro de conexão');
  }
  return data;
}

api.get = (p) => api(p);
api.post = (p, body) => api(p, { method: 'POST', body });
api.put = (p, body) => api(p, { method: 'PUT', body });
api.patch = (p, body) => api(p, { method: 'PATCH', body });
api.del = (p) => api(p, { method: 'DELETE' });

/** Carrega dados da API e expõe { data, error, loading, reload, setData } */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const ctrl = useRef();
  const load = useCallback(async () => {
    if (!path) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await api(path, { signal: c.signal });
      if (!c.signal.aborted) setState({ data, error: null, loading: false });
    } catch (e) {
      if (e.name !== 'AbortError') setState((s) => ({ ...s, error: e.message, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    load();
    return () => ctrl.current?.abort();
  }, [load]);
  const setData = (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn }));
  return { ...state, reload: load, setData };
}

/** Escuta eventos em tempo real do servidor (novos pedidos, mudanças de status) */
export function useLiveEvents(onEvent) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;
    const es = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);
    const fn = (e) => handler.current?.(JSON.parse(e.data));
    es.addEventListener('order', fn);
    return () => es.close();
  }, []);
}
