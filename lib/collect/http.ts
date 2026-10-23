export async function fetchText(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
        accept: '*/*',
        ...(opts.headers || {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<T = any>(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}): Promise<T> {
  const txt = await fetchText(url, opts);
  return JSON.parse(txt) as T;
}
