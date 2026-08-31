import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb } from './helpers.js';
import { enrol } from '../src/pilot/enrolment.js';
import { SEGMENT_QUOTAS } from '../src/config.js';
import { gateMetrics } from '../src/metrics/gates.js';
import { nowIso } from '../src/db.js';

function buildPilot(db, { participants, verifiedSeats, paid, activeWeek, falsePositives = 0 }) {
  // Katilimcilar gercek segment kotalarina gore dagitilir (toplam 100).
  const slots = Object.entries(SEGMENT_QUOTAS)
    .flatMap(([segment, quota]) => Array.from({ length: quota }, () => segment))
    .slice(0, participants);
  const ids = slots.map((segment, i) => enrol(db, { handle: `k${i}`, segment }).id);
  const watch = db.prepare(`
    INSERT INTO watches (participant_id,origin,destination,cabin,date_from,date_to,max_miles,created_at)
    VALUES (?,'IST','JFK','business','2026-10-01','2026-10-31',70000,?)
  `);
  const alert = db.prepare(`
    INSERT INTO alerts (watch_id,participant_id,fingerprint,origin,destination,cabin,depart_date,
      miles,taxes_try,seats,carrier,saving_try,verification,sent_at,channel,booked,responded_at)
    VALUES (?,?,?,'IST','JFK','business','2026-10-12',65000,4800,2,'TK',40000,?,?,'telegram',1,?)
  `);
  ids.forEach((pid, index) => {
    const wid = Number(watch.run(pid, nowIso()).lastInsertRowid);
    if (index < verifiedSeats) alert.run(wid, pid, `fp${index}`, 'verified', nowIso(), nowIso());
    else if (index < verifiedSeats + falsePositives) alert.run(wid, pid, `fp${index}`, 'false_positive', nowIso(), nowIso());
    if (index < paid) {
      db.prepare('INSERT INTO presales (participant_id,plan,amount_try,charged_at) VALUES (?,?,?,?)')
        .run(pid, 'monthly', 149, nowIso());
    }
    if (index < activeWeek) {
      db.prepare('INSERT INTO weekly_feedback (participant_id,week,active,noise_complaint,created_at) VALUES (?,?,?,?,?)')
        .run(pid, 8, 1, 0, nowIso());
    }
  });
  return ids;
}

test('dort kriter de karsilanirsa kapi acilir', () => {
  const db = testDb();
  buildPilot(db, { participants: 100, verifiedSeats: 35, paid: 10, activeWeek: 40 });
  const gate = gateMetrics(db);
  assert.equal(gate.passed, true);
  assert.equal(gate.enrolled, 100);
  assert.ok(gate.criteria.every((c) => c.passed));
});

test('on satis donusumu esigin altindaysa kapi kapali', () => {
  const db = testDb();
  buildPilot(db, { participants: 100, verifiedSeats: 40, paid: 5, activeWeek: 50 });
  const gate = gateMetrics(db);
  assert.equal(gate.passed, false);
  const presale = gate.criteria.find((c) => c.key === 'presaleConversionRate');
  assert.equal(presale.passed, false);
  assert.ok(presale.value < 0.25);
});

test('yanlis pozitif ust siniri asilirsa kapi kapali', () => {
  const db = testDb();
  buildPilot(db, { participants: 100, verifiedSeats: 35, paid: 15, activeWeek: 40, falsePositives: 10 });
  const gate = gateMetrics(db);
  const fp = gate.criteria.find((c) => c.key === 'falsePositiveRate');
  assert.equal(fp.passed, false);
  assert.equal(gate.passed, false);
});

test('iade edilen on odeme donusume sayilmaz', () => {
  const db = testDb();
  const ids = buildPilot(db, { participants: 100, verifiedSeats: 35, paid: 10, activeWeek: 40 });
  db.prepare('UPDATE presales SET refunded_at = ? WHERE participant_id IN (?,?,?)')
    .run(nowIso(), ids[0], ids[1], ids[2]);
  const gate = gateMetrics(db);
  assert.equal(gate.counts.paidAmongFound, 7);
  assert.equal(gate.passed, false);
});
