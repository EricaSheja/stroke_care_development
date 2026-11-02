// Small fetch helper for the API. Owner: Happy, with Axel for the endpoints.
const TOKEN_KEY = 'sc_token';

export function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* storage can be blocked */ }
}

export async function api(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
        res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
        throw new Error('Cannot reach the server. Check your connection and try again.');
    }
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    if (res.status === 401 && token) {
        setToken(null);
        window.dispatchEvent(new Event('sc:signedout'));
    }
    if (!res.ok) {
        const err = new Error(data?.error || 'Something went wrong.');
        err.status = res.status;
        err.code = data?.code;
        throw err;
    }
    return data;
}