import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

// Safety boundary tests: urgent check in guidance, a descriptive only clinician summary and education
// items that show their source and draft status. Rules are in docs/safety.md

let api;
const call = (...args) => api.call(...args);
const login = (...args) => api.login(...args);

before(async () => { api = await startTestServer(); });
after(() => api.close());

test('S10 a daily check in saves, allows skipped questions and returns urgent guidance when needed', async () => {
  const token = await login('survivor@demo.test');
  const normal = await call('/api/checkins', { method: 'POST', token, body: { answers: { Q1: 'About the same', Q2: 'No', Q3: 'skipped', Q8: 7 }, note: 'Question for my doctor.' } });
  assert.equal(normal.status, 201);
  assert.equal(normal.data.urgent_guidance, false);
  const urgent = await call('/api/checkins', { method: 'POST', token, body: { answers: { Q2: 'Yes' } } });
  assert.equal(urgent.status, 201);
  assert.equal(urgent.data.urgent_guidance, true);
  const invalid = await call('/api/checkins', { method: 'POST', token, body: { answers: { Q1: 'Wonderful' } } });
  assert.equal(invalid.status, 400);
});

test('S11 a clinician sees a descriptive summary with no diagnosis fields', async () => {
  const token = await login('clinician@demo.test');
  const { status, data } = await call('/api/summary', { token });
  assert.equal(status, 200);
  assert.equal(data.patients.length, 2);
  assert.match(data.disclaimer, /not a diagnosis/i);
  const first = data.patients.find((p) => p.patient.name === 'Demo Survivor');
  assert.ok(first.readings.count > 0);
  assert.equal(first.risk, undefined);
  assert.equal(first.diagnosis, undefined);
});

test('S13 education items show their source and review state', async () => {
  const token = await login('prevention@demo.test');
  const { status, data } = await call('/api/education?lang=rw', { token });
  assert.equal(status, 200);
  assert.equal(data.fallback, true);
  assert.ok(data.items.length >= 5);
  for (const item of data.items) {
    assert.ok(item.source);
    assert.equal(item.status, 'draft');
  }
});