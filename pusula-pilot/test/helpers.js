import { openDb } from '../src/db.js';
import { enrol, addWatch } from '../src/pilot/enrolment.js';

export function testDb() {
  return openDb(':memory:');
}

export const testConfig = {
  scan: { intervalMs: 1000, rateLimitPerMin: 100, concurrency: 1 },
  provider: { kind: 'simulated', baseUrl: '', apiKey: '' },
  telegram: { botToken: '' },
};

export function seedParticipantWithWatch(db, overrides = {}) {
  const participant = enrol(db, {
    handle: overrides.handle ?? 'ucus_avcisi',
    segment: overrides.segment ?? 'award_hunter',
    telegramChat: '1001',
  });
  const watch = addWatch(db, participant.id, {
    origin: 'IST',
    destination: 'JFK',
    cabin: 'business',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-31',
    maxMiles: 70_000,
    ...overrides.watch,
  });
  return { participant, watch };
}

export const silentLogger = { log() {}, error() {}, warn() {} };
