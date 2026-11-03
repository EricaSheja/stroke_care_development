import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';
import { DEMO_PASSWORD } from '../src/seed.js';

// API tests for sign in, consent, readings and the recovery plan. Owner: Axel.
// Each test name starts with the scenario it covers in docs/test-plan.md.

let api;
const call = (...args) => api.call(...args);
const login = (...args) => api.login(...args);

before(async () => { api = await startTestServer(); });
after(() => api.close());

test('S01 health check answers ok', async () => {
  const { status, data } = await call('/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

test('S02 sign in works and a wrong password is refused', async () => {
  const good = await call('/api/auth/login', { method: 'POST', body: { email: 'survivor@demo.test', password: DEMO_PASSWORD } });
  assert.equal(good.status, 200);
  assert.equal(good.data.user.role, 'survivor');
  assert.equal(good.data.user.password_hash, undefined);
  const bad = await call('/api/auth/login', { method: 'POST', body: { email: 'survivor@demo.test', password: 'wrongpass1' } });
  assert.equal(bad.status, 401);
});

test('S03 sign up creates a survivor but never a clinician', async () => {
  const ok = await call('/api/auth/register', { method: 'POST', body: { name: 'Test Person', email: 'new.person@demo.test', password: 'longenough1', role: 'survivor' } });
  assert.equal(ok.status, 201);
  const clinician = await call('/api/auth/register', { method: 'POST', body: { name: 'Sneaky', email: 'sneaky@demo.test', password: 'longenough1', role: 'clinician' } });
  assert.equal(clinician.status, 400);
  const dup = await call('/api/auth/register', { method: 'POST', body: { name: 'Test Person', email: 'new.person@demo.test', password: 'longenough1', role: 'survivor' } });
  assert.equal(dup.status, 409);
});

test('S04 a new account must accept consent before using data routes', async () => {
  const reg = await call('/api/auth/register', { method: 'POST', body: { name: 'Consent Test', email: 'consent@demo.test', password: 'longenough1', role: 'prevention' } });
  const token = reg.data.token;
  const blocked = await call('/api/readings', { token });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.data.code, 'consent_required');
  const accepted = await call('/api/auth/consent', { method: 'POST', token, body: { accepted: true } });
  assert.equal(accepted.status, 200);
  const allowed = await call('/api/readings', { token });
  assert.equal(allowed.status, 200);
});

test('S05 a signed in survivor can save a blood pressure reading and see it in the history', async () => {
  const token = await login('survivor@demo.test');
  const saved = await call('/api/readings', { method: 'POST', token, body: { systolic: 131, diastolic: 84, pulse: 72 } });
  assert.equal(saved.status, 201);
  const list = await call('/api/readings', { token });
  assert.equal(list.status, 200);
  assert.equal(list.data.readings[0].systolic, 131);
});

test('S06 impossible blood pressure numbers are rejected', async () => {
  const token = await login('survivor@demo.test');
  const swapped = await call('/api/readings', { method: 'POST', token, body: { systolic: 80, diastolic: 120 } });
  assert.equal(swapped.status, 400);
  const huge = await call('/api/readings', { method: 'POST', token, body: { systolic: 900, diastolic: 80 } });
  assert.equal(huge.status, 400);
  const text = await call('/api/readings', { method: 'POST', token, body: { systolic: 'abc', diastolic: 80 } });
  assert.equal(text.status, 400);
});

test('S07 routes need sign in and roles are enforced', async () => {
  assert.equal((await call('/api/readings')).status, 401);
  const survivor = await login('survivor@demo.test');
  assert.equal((await call('/api/summary', { token: survivor })).status, 403);
  const clinician = await login('clinician@demo.test');
  assert.equal((await call('/api/readings', { token: clinician })).status, 403);
});

test('S08 a survivor sees the clinician plan and can tick and untick a task', async () => {
  const token = await login('survivor@demo.test');
  const plan = await call('/api/plan', { token });
  assert.equal(plan.status, 200);
  assert.ok(plan.data.plan.tasks.length >= 3);
  const task = plan.data.plan.tasks.find((t) => !t.done_today);
  const done = await call(`/api/plan/tasks/${task.id}/log`, { method: 'POST', token });
  assert.equal(done.data.done_today, true);
  const undone = await call(`/api/plan/tasks/${task.id}/log`, { method: 'DELETE', token });
  assert.equal(undone.data.done_today, false);
});

test('S09 a survivor cannot tick a task from another patient plan', async () => {
  const token = await login('survivor@demo.test');
  const other = await login('survivor2@demo.test');
  const otherPlan = await call('/api/plan', { token: other });
  const foreignTask = otherPlan.data.plan.tasks[0].id;
  const res = await call(`/api/plan/tasks/${foreignTask}/log`, { method: 'POST', token });
  assert.equal(res.status, 404);
});

test('S12 a clinician can add a task to a linked patient plan and the survivor sees it', async () => {
  const clinician = await login('clinician@demo.test');
  const survivor = await login('survivor2@demo.test');
  const patients = await call('/api/patients', { token: clinician });
  const patient = patients.data.patients.find((p) => p.name === 'Demo Survivor Two');
  const added = await call(`/api/patients/${patient.id}/plan/tasks`, { method: 'POST', token: clinician, body: { title: 'Balance practice', instructions: 'As shown by your therapist.' } });
  assert.equal(added.status, 201);
  const plan = await call('/api/plan', { token: survivor });
  assert.ok(plan.data.plan.tasks.some((t) => t.title === 'Balance practice'));
});
