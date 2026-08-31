import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb, testConfig, seedParticipantWithWatch, silentLogger } from './helpers.js';
import { InventoryAgent } from '../src/agents/inventoryAgent.js';
import { RateLimiter } from '../src/agents/rateLimiter.js';

class StubProvider {
  constructor(offers) { this.offers = offers; this.calls = 0; }
  async search() { this.calls += 1; return this.offers; }
}

const OFFER = {
  origin: 'IST', destination: 'JFK', cabin: 'business', departDate: '2026-10-12',
  miles: 65_000, taxesTry: 4_800, seats: 2, carrier: 'TK', cashPriceTry: 118_000,
};

function agentWith(db, provider, overrides = {}) {
  return new InventoryAgent({
    db, provider, logger: silentLogger,
    config: { ...testConfig, scan: { ...testConfig.scan, ...overrides } },
  });
}

test('eslesen izleme icin uyari uretir ve tasarrufu hesaplar', async () => {
  const db = testDb();
  seedParticipantWithWatch(db);
  const alerts = await agentWith(db, new StubProvider([OFFER])).runOnce();

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].offer.destination, 'JFK');
  assert.ok(alerts[0].offer.savingTry > 0);
});

test('ayni teklif icin ikinci tur uyari uretmez', async () => {
  const db = testDb();
  seedParticipantWithWatch(db);
  const agent = agentWith(db, new StubProvider([OFFER]));
  await agent.runOnce();
  const second = await agent.runOnce();
  assert.equal(second.length, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM alerts').get().n, 1);
});

test('mil esigi asilirsa uyari gitmez', async () => {
  const db = testDb();
  seedParticipantWithWatch(db, { watch: { maxMiles: 60_000 } });
  const alerts = await agentWith(db, new StubProvider([OFFER])).runOnce();
  assert.equal(alerts.length, 0);
});

test('yolcu sayisi koltuk sayisini asarsa uyari gitmez', async () => {
  const db = testDb();
  seedParticipantWithWatch(db, { watch: { passengers: 3 } });
  const alerts = await agentWith(db, new StubProvider([OFFER])).runOnce();
  assert.equal(alerts.length, 0);
});

test('engellenme durdurma kosulu: ajan durur ve loglar', async () => {
  const db = testDb();
  seedParticipantWithWatch(db);
  const blocking = {
    async search() { throw Object.assign(new Error('blocked'), { code: 'blocked' }); },
  };
  const agent = agentWith(db, blocking);
  await agent.runOnce();
  assert.equal(agent.blocked, true);
  const log = db.prepare("SELECT status FROM scan_log ORDER BY id DESC LIMIT 1").get();
  assert.equal(log.status, 'blocked');
});

test('hiz siniri asildiginda saglayici cagrilmaz', async () => {
  const db = testDb();
  seedParticipantWithWatch(db);
  const provider = new StubProvider([OFFER]);
  const agent = agentWith(db, provider, { rateLimitPerMin: 1 });
  await agent.runOnce();
  await agent.runOnce();
  assert.equal(provider.calls, 1);
  const limited = db.prepare("SELECT COUNT(*) AS n FROM scan_log WHERE status='rate_limited'").get().n;
  assert.equal(limited, 1);
});

test('hiz sinirlayici pencere kayinca yeniden izin verir', () => {
  let clock = 0;
  const limiter = new RateLimiter({ perMinute: 2, now: () => clock });
  assert.equal(limiter.tryAcquire(), true);
  assert.equal(limiter.tryAcquire(), true);
  assert.equal(limiter.tryAcquire(), false);
  clock += 60_001;
  assert.equal(limiter.tryAcquire(), true);
});
