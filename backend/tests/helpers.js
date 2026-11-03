import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { seedIfEmpty, DEMO_PASSWORD } from '../src/seed.js';
import { createApp } from '../src/app.js';

// Shared test setup: starts the app on a free port with a fresh in memory database of fictional demo data.
// Owner: Axel. Used by api.test.js, roles.test.js and safety.test.js.

export async function startTestServer() {
  const db = openDb(':memory:');
  seedIfEmpty(db);
  const app = createApp(db);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    return { status: res.status, data };
  }

  async function login(email) {
    const { status, data } = await call('/api/auth/login', { method: 'POST', body: { email, password: DEMO_PASSWORD } });
    assert.equal(status, 200);
    return data.token;
  }

  return { call, login, close: () => server.close() };
}
