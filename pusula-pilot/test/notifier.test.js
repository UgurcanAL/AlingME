import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb, seedParticipantWithWatch, silentLogger } from './helpers.js';
import { Notifier, ConsoleChannel, TelegramChannel, formatAlert } from '../src/notify/notifier.js';
import { InventoryAgent } from '../src/agents/inventoryAgent.js';
import { testConfig } from './helpers.js';

const OFFER = {
  origin: 'IST', destination: 'JFK', cabin: 'business', departDate: '2026-10-12',
  miles: 65_000, taxesTry: 4_800, seats: 2, carrier: 'TK', cashPriceTry: 118_000,
};

async function produceAlert(db) {
  seedParticipantWithWatch(db);
  const agent = new InventoryAgent({
    db, provider: { async search() { return [OFFER]; } },
    config: testConfig, logger: silentLogger,
  });
  return agent.runOnce();
}

test('nakit karsiligi yoksa mesaj tahmin etmez, dogrulanamadi der', () => {
  const text = formatAlert({ offer: { ...OFFER, savingTry: null } });
  assert.match(text, /dogrulanamadi/);
  assert.doesNotMatch(text, /net tasarruf/);
});

test('mesaj rezervasyonu kullanicinin yaptigini soyler', () => {
  const text = formatAlert({ offer: { ...OFFER, savingTry: 40_000 } });
  assert.match(text, /sizin adiniza islem yapmaz/);
});

test('telegram basarisiz olursa konsola duser ve kanal kaydedilir', async () => {
  const db = testDb();
  const alerts = await produceAlert(db);
  const failingTelegram = new TelegramChannel({
    botToken: 'x',
    fetchImpl: async () => { throw new Error('network'); },
  });
  const notifier = new Notifier({ db, channels: [failingTelegram, new ConsoleChannel(silentLogger)] });
  const delivered = await notifier.deliver(alerts);

  assert.equal(delivered[0].channel, 'console');
  const stored = db.prepare('SELECT channel FROM alerts WHERE id = ?').get(alerts[0].id);
  assert.equal(stored.channel, 'console');
});

test('telegram chat kayitliysa birincil kanal kullanilir', async () => {
  const db = testDb();
  const alerts = await produceAlert(db);
  const calls = [];
  const telegram = new TelegramChannel({
    botToken: 'token',
    fetchImpl: async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok: true }; },
  });
  const delivered = await new Notifier({ db, channels: [telegram, new ConsoleChannel(silentLogger)] })
    .deliver(alerts);

  assert.equal(delivered[0].channel, 'telegram');
  assert.equal(calls[0].body.chat_id, '1001');
  assert.match(calls[0].body.text, /IST → JFK/);
});
