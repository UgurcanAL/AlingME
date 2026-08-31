import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testDb, seedParticipantWithWatch } from './helpers.js';
import { enrol, addWatch, segmentUsage, dropInactiveParticipants } from '../src/pilot/enrolment.js';
import { nowIso } from '../src/db.js';

test('kurumsal gozlemci kotasi 5 kisiden sonra kapanir', () => {
  const db = testDb();
  for (let i = 0; i < 5; i += 1) {
    enrol(db, { handle: `kurumsal_${i}`, segment: 'corporate_observer' });
  }
  assert.throws(
    () => enrol(db, { handle: 'kurumsal_5', segment: 'corporate_observer' }),
    /kotasi dolu/,
  );
  const usage = segmentUsage(db).find((u) => u.segment === 'corporate_observer');
  assert.equal(usage.remaining, 0);
});

test('kapsam disi rota reddedilir', () => {
  const db = testDb();
  const p = enrol(db, { handle: 'test', segment: 'award_hunter' });
  assert.throws(() => addWatch(db, p.id, {
    origin: 'IST', destination: 'NRT', cabin: 'business',
    dateFrom: '2026-10-01', dateTo: '2026-10-05', maxMiles: 70_000,
  }), /kapsam disi varis/);
  assert.throws(() => addWatch(db, p.id, {
    origin: 'IST', destination: 'JFK', cabin: 'first',
    dateFrom: '2026-10-01', dateTo: '2026-10-05', maxMiles: 70_000,
  }), /kapsam disi kabin/);
});

test('iki hafta form doldurmayan katilimci gruptan cikar', () => {
  const db = testDb();
  const { participant } = seedParticipantWithWatch(db);
  const aktif = enrol(db, { handle: 'aktif', segment: 'award_hunter' });
  db.prepare(
    'INSERT INTO weekly_feedback (participant_id,week,active,noise_complaint,created_at) VALUES (?,?,?,?,?)',
  ).run(aktif.id, 3, 1, 0, nowIso());

  const dropped = dropInactiveParticipants(db, 3);
  assert.deepEqual(dropped.map((d) => d.id), [participant.id]);
  const remaining = db.prepare('SELECT COUNT(*) AS n FROM participants WHERE left_at IS NULL').get().n;
  assert.equal(remaining, 1);
});
