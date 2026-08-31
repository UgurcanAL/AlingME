/**
 * Pilotun 8 haftalik akisini uctan uca calistiran demo.
 * Gercek katilimci verisi degildir; hattin isledigini gostermek icindir.
 *   node scripts/seed.js [dbDosyasi]
 */
import { openDb, nowIso } from '../src/db.js';
import { config, SEGMENT_QUOTAS } from '../src/config.js';
import { enrol, addWatch } from '../src/pilot/enrolment.js';
import { InventoryAgent } from '../src/agents/inventoryAgent.js';
import { SimulatedProvider } from '../src/providers/awardProvider.js';
import { Notifier, ConsoleChannel } from '../src/notify/notifier.js';
import { gateMetrics, secondaryMetrics } from '../src/metrics/gates.js';

const DESTINATIONS = ['LHR', 'FRA', 'CDG', 'AMS', 'MUC', 'ZRH', 'JFK', 'YYZ'];
const quiet = { log() {}, error() {}, warn() {} };

const db = openDb(process.argv[2] ?? ':memory:');

// --- Hafta 0: 100 katilimci, kota dagilimina gore
const participants = [];
for (const [segment, quota] of Object.entries(SEGMENT_QUOTAS)) {
  for (let i = 0; i < quota; i += 1) {
    const p = enrol(db, { handle: `${segment}_${i}`, segment, telegramChat: `${1000 + participants.length}` });
    participants.push(p);
    const destination = DESTINATIONS[participants.length % DESTINATIONS.length];
    const cabin = participants.length % 3 === 0 ? 'business' : 'economy';
    addWatch(db, p.id, {
      origin: 'IST',
      destination,
      cabin,
      dateFrom: '2026-10-01',
      dateTo: '2026-12-15',
      maxMiles: cabin === 'business' ? 70_000 : 45_000,
    });
  }
}
console.log(`Hafta 0 · ${participants.length} katilimci kaydedildi, izlemeler kuruldu.`);

// --- Hafta 1-7: tarama turlari
// Her hafta envanter degisir; saglayici tohumu haftaya baglidir.
const provider = new SimulatedProvider({ seed: 'pilot-demo-1' });
const agent = new InventoryAgent({
  db,
  provider,
  config: { ...config, scan: { ...config.scan, rateLimitPerMin: 500 } },
  logger: quiet,
});
const notifier = new Notifier({ db, channels: [new ConsoleChannel(quiet)] });

let totalAlerts = 0;
for (let week = 1; week <= 7; week += 1) {
  provider.seed = `pilot-demo-${week}`;
  const alerts = await agent.runOnce();
  await notifier.deliver(alerts);
  totalAlerts += alerts.length;

  // Editorun elle dogrulamasi: gunde 20 uyari (haftalik ilk 20).
  const pending = db.prepare(
    "SELECT id FROM alerts WHERE verification = 'unverified' ORDER BY id LIMIT 20",
  ).all();
  const verify = db.prepare('UPDATE alerts SET verification = ? WHERE id = ?');
  pending.forEach((row, i) => verify.run(i % 25 === 0 ? 'false_positive' : 'verified', row.id));

  // Haftalik geri bildirim formu
  const form = db.prepare(`
    INSERT INTO weekly_feedback (participant_id,week,active,noise_complaint,score,created_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(participant_id,week) DO NOTHING
  `);
  participants.forEach((p, i) => form.run(p.id, week, i % 5 === 0 ? 0 : 1, i % 11 === 0 ? 1 : 0, 4, nowIso()));

  console.log(`Hafta ${week} · ${alerts.length} yeni uyari gonderildi.`);
}

// --- Hafta 6-7: on satis, koltuk bulanlara oncelikli
const found = db.prepare(
  "SELECT DISTINCT participant_id FROM alerts WHERE verification = 'verified'",
).all();
const presale = db.prepare(
  'INSERT INTO presales (participant_id,plan,amount_try,charged_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
);
found.forEach((row, i) => {
  if (i % 3 !== 0) return;
  presale.run(row.participant_id, i % 4 === 0 ? 'annual' : 'monthly', i % 4 === 0 ? 1290 : 149, nowIso());
});

// Rezervasyon beyanlari
const booked = db.prepare('UPDATE alerts SET booked = 1, responded_at = ? WHERE id = ?');
db.prepare("SELECT id FROM alerts WHERE verification='verified' ORDER BY id LIMIT 60").all()
  .forEach((row, i) => { if (i % 2 === 0) booked.run(nowIso(), row.id); });

console.log(`\nToplam ${totalAlerts} uyari, ${found.length} katilimci koltuk buldu.`);
console.log(JSON.stringify({ gate: gateMetrics(db), secondary: secondaryMetrics(db) }, null, 2));
db.close();
