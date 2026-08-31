import { SEGMENT_QUOTAS, PILOT_SCOPE } from '../config.js';
import { nowIso } from '../db.js';

export class QuotaError extends Error {
  constructor(message) { super(message); this.name = 'QuotaError'; this.status = 409; }
}
export class ScopeError extends Error {
  constructor(message) { super(message); this.name = 'ScopeError'; this.status = 422; }
}

export function segmentUsage(db) {
  const rows = db.prepare(`
    SELECT segment, COUNT(*) AS used FROM participants
    WHERE left_at IS NULL GROUP BY segment
  `).all();
  const used = Object.fromEntries(rows.map((r) => [r.segment, r.used]));
  return Object.entries(SEGMENT_QUOTAS).map(([segment, quota]) => ({
    segment, quota, used: used[segment] ?? 0, remaining: quota - (used[segment] ?? 0),
  }));
}

/**
 * Katilimci kaydi. Kota dolu segmentte kayit reddedilir - kotasiz alinan
 * bir grup, on satis sonucunu okunamaz hale getirir.
 */
export function enrol(db, { handle, segment, telegramChat }) {
  if (!(segment in SEGMENT_QUOTAS)) throw new ScopeError(`bilinmeyen segment: ${segment}`);
  const usage = segmentUsage(db).find((u) => u.segment === segment);
  if (usage.remaining <= 0) throw new QuotaError(`${segment} kotasi dolu (${usage.quota})`);

  const info = db.prepare(
    'INSERT INTO participants (handle,segment,telegram_chat,enrolled_at) VALUES (?,?,?,?)',
  ).run(handle, segment, telegramChat ?? null, nowIso());
  return { id: Number(info.lastInsertRowid), handle, segment };
}

export function addWatch(db, participantId, watch) {
  const { origin, destination, cabin, dateFrom, dateTo, maxMiles, passengers = 1 } = watch;
  if (!PILOT_SCOPE.origins.includes(origin)) throw new ScopeError(`kapsam disi kalkis: ${origin}`);
  if (!PILOT_SCOPE.destinations.includes(destination)) throw new ScopeError(`kapsam disi varis: ${destination}`);
  if (!PILOT_SCOPE.cabins.includes(cabin)) throw new ScopeError(`kapsam disi kabin: ${cabin}`);
  if (!(dateFrom <= dateTo)) throw new ScopeError('tarih araligi gecersiz');
  if (!Number.isFinite(maxMiles) || maxMiles <= 0) throw new ScopeError('mil esigi gecersiz');

  const info = db.prepare(`
    INSERT INTO watches
      (participant_id,origin,destination,cabin,date_from,date_to,max_miles,passengers,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(participantId, origin, destination, cabin, dateFrom, dateTo, maxMiles, passengers, nowIso());
  return { id: Number(info.lastInsertRowid), ...watch };
}

/** Iki hafta ust uste form doldurmayan katilimci gruptan cikarilir. */
export function dropInactiveParticipants(db, currentWeek) {
  if (currentWeek < 2) return [];
  const stale = db.prepare(`
    SELECT p.id, p.handle FROM participants p
    WHERE p.left_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM weekly_feedback f
        WHERE f.participant_id = p.id AND f.week IN (?, ?)
      )
  `).all(currentWeek - 1, currentWeek);
  const update = db.prepare('UPDATE participants SET left_at = ? WHERE id = ?');
  for (const row of stale) update.run(nowIso(), row.id);
  return stale;
}
