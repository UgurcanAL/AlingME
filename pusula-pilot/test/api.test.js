import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './helpers.js';
import { createApi } from '../src/api/server.js';

let server;
let base;
const db = testDb();

before(async () => {
  server = createApi({ db, agent: null });
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) => fetch(`${base}${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

test('saglik ucu pilot kapsamini yayinlar', async () => {
  const res = await fetch(`${base}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body.scope.cabins, ['economy', 'business']);
  assert.equal(body.quotas.award_hunter, 55);
});

test('katilimci kaydi ve izleme kurulumu', async () => {
  const enrolled = await (await post('/participants', {
    handle: 'mil_avcisi', segment: 'award_hunter', telegramChat: '4242',
  })).json();
  assert.ok(enrolled.id);

  const res = await post(`/participants/${enrolled.id}/watches`, {
    origin: 'IST', destination: 'FRA', cabin: 'economy',
    dateFrom: '2026-11-01', dateTo: '2026-11-20', maxMiles: 20_000,
  });
  assert.equal(res.status, 201);
});

test('kapsam disi izleme 422 doner', async () => {
  const p = await (await post('/participants', { handle: 'kapsam_disi', segment: 'deal_follower' })).json();
  const res = await post(`/participants/${p.id}/watches`, {
    origin: 'ESB', destination: 'FRA', cabin: 'economy',
    dateFrom: '2026-11-01', dateTo: '2026-11-20', maxMiles: 20_000,
  });
  assert.equal(res.status, 422);
  assert.match((await res.json()).error, /kapsam disi kalkis/);
});

test('on satis plani dogrulanir ve fiyat sunucuda belirlenir', async () => {
  const p = await (await post('/participants', { handle: 'odeyen', segment: 'card_optimiser' })).json();
  const bad = await post('/presales', { participantId: p.id, plan: 'lifetime' });
  assert.equal(bad.status, 400);

  const ok = await (await post('/presales', { participantId: p.id, plan: 'annual', amountTry: 1 })).json();
  assert.equal(ok.amountTry, 1290, 'fiyat istemciden alinmaz');
});

test('bilinmeyen uyariya yanit 404 doner', async () => {
  const res = await post('/alerts/9999/response', { booked: true });
  assert.equal(res.status, 404);
});

test('gecersiz JSON 400 doner', async () => {
  const res = await fetch(`${base}/participants`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bozuk',
  });
  assert.equal(res.status, 400);
});
