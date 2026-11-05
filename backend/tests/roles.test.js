import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { seedIfEmpty, DEMO_PASSWORD } from '../src/seed.js';
import { createApp } from '../src/app.js';

// Role matrix test. Owner: Kenneth (System Architect). Each row is one cell of docs/roles-matrix.md.
// If you change who may use a route, change the matrix and this table together.

let server;
let base;
const tokens = {};

const ACCOUNTS = {
  survivor: 'survivor@demo.test',
  prevention: 'prevention@demo.test',
  clinician: 'clinician@demo.test',
};

// route, then the expected status for survivor, prevention, clinician and a visitor who is not signed in
const MATRIX = [
  ['/api/readings', 200, 200, 403, 401],
  ['/api/plan', 200, 403, 403, 401],
  ['/api/checkins', 200, 403, 403, 401],
  ['/api/checkins/questions', 200, 403, 403, 401],
  ['/api/education', 200, 200, 200, 401],
  ['/api/summary', 403, 403, 200, 401],
  ['/api/patients', 403, 403, 200, 401],
];

before(async () => {
  const db = openDb(':memory:');
  seedIfEmpty(db);
  const app = createApp(db);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  for (const [role, email] of Object.entries(ACCOUNTS)) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: DEMO_PASSWORD }),
    });
    tokens[role] = (await res.json()).token;
  }
});

after(() => server.close());

async function status(path, token) {
  const res = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.status;
}

for (const [path, survivor, prevention, clinician, visitor] of MATRIX) {
  test(`R ${path} follows the role matrix`, async () => {
    assert.equal(await status(path, tokens.survivor), survivor, 'survivor');
    assert.equal(await status(path, tokens.prevention), prevention, 'prevention user');
    assert.equal(await status(path, tokens.clinician), clinician, 'clinician');
    assert.equal(await status(path), visitor, 'not signed in');
  });
}
