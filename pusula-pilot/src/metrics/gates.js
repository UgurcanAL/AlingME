import { GATE_THRESHOLDS } from '../config.js';

const rate = (numerator, denominator) => (denominator === 0 ? 0 : numerator / denominator);

/**
 * Faz 1 karar kapisi. Dort kriterin tamami karsilanmadan gecis yoktur.
 * Her olcutun tek bir kaynagi vardir (pilot dokumani Tablo 3).
 */
export function gateMetrics(db, { week } = {}) {
  const enrolled = db.prepare(
    'SELECT COUNT(*) AS n FROM participants WHERE left_at IS NULL',
  ).get().n;

  // 1. Rezerve edilebilir koltuk bulunan katilimci orani.
  const withSeat = db.prepare(`
    SELECT COUNT(DISTINCT participant_id) AS n FROM alerts
    WHERE verification = 'verified'
  `).get().n;

  // 2. On satis donusumu - koltuk bulanlar icinde net tahsilat yapilanlar.
  const paidAmongFound = db.prepare(`
    SELECT COUNT(DISTINCT s.participant_id) AS n
    FROM presales s
    WHERE s.refunded_at IS NULL
      AND s.participant_id IN (
        SELECT participant_id FROM alerts WHERE verification = 'verified'
      )
  `).get().n;
  const paidOverall = db.prepare(
    'SELECT COUNT(*) AS n FROM presales WHERE refunded_at IS NULL',
  ).get().n;

  // 3. Haftalik aktiflik - son raporlanan hafta esas alinir.
  const lastWeek = week ?? db.prepare('SELECT MAX(week) AS w FROM weekly_feedback').get().w ?? 0;
  const activeRow = db.prepare(
    'SELECT COUNT(*) AS n FROM weekly_feedback WHERE week = ? AND active = 1',
  ).get(lastWeek);

  // 4. Yanlis pozitif - "uyari geldi, koltuk yoktu".
  const checked = db.prepare(
    "SELECT COUNT(*) AS n FROM alerts WHERE verification <> 'unverified'",
  ).get().n;
  const falsePositives = db.prepare(
    "SELECT COUNT(*) AS n FROM alerts WHERE verification = 'false_positive'",
  ).get().n;

  const values = {
    seatFoundRate: rate(withSeat, enrolled),
    presaleConversionRate: rate(paidAmongFound, withSeat),
    weeklyActiveRate: rate(activeRow.n, enrolled),
    falsePositiveRate: rate(falsePositives, checked),
  };

  const criteria = [
    { key: 'seatFoundRate', label: 'Koltuk bulan katilimci', direction: 'min' },
    { key: 'presaleConversionRate', label: 'On satis donusumu', direction: 'min' },
    { key: 'weeklyActiveRate', label: 'Haftalik aktiflik', direction: 'min' },
    { key: 'falsePositiveRate', label: 'Yanlis pozitif', direction: 'max' },
  ].map((criterion) => {
    const value = values[criterion.key];
    const threshold = GATE_THRESHOLDS[criterion.key];
    const passed = criterion.direction === 'min' ? value >= threshold : value <= threshold;
    return { ...criterion, value, threshold, passed };
  });

  return {
    week: lastWeek,
    enrolled,
    criteria,
    passed: criteria.every((c) => c.passed),
    counts: { withSeat, paidAmongFound, paidOverall, checked, falsePositives },
  };
}

/** Kapi olmayan ikincil gostergeler (pilot dokumani Bolum 05). */
export function secondaryMetrics(db) {
  const medianRow = db.prepare(`
    SELECT AVG(delta) AS median FROM (
      SELECT (julianday(responded_at) - julianday(sent_at)) * 24 * 60 AS delta
      FROM alerts
      WHERE booked = 1 AND responded_at IS NOT NULL
      ORDER BY delta
      LIMIT 2 - (SELECT COUNT(*) FROM alerts WHERE booked = 1 AND responded_at IS NOT NULL) % 2
      OFFSET (SELECT (COUNT(*) - 1) / 2 FROM alerts WHERE booked = 1 AND responded_at IS NOT NULL)
    )
  `).get().median;

  const saving = db.prepare(`
    SELECT COUNT(DISTINCT participant_id) AS users, SUM(saving_try) AS total
    FROM alerts WHERE booked = 1 AND saving_try IS NOT NULL
  `).get();

  const noise = db.prepare(`
    SELECT
      (SELECT COUNT(DISTINCT participant_id) FROM weekly_feedback WHERE noise_complaint = 1) AS complained,
      (SELECT COUNT(*) FROM participants WHERE left_at IS NULL) AS total
  `).get();

  const corporate = db.prepare(`
    SELECT COUNT(*) AS n FROM participants
    WHERE segment = 'corporate_observer' AND left_at IS NULL
  `).get().n;

  return {
    medianMinutesToBooking: medianRow == null ? null : Math.round(medianRow),
    savingPerUserTry: saving.users ? Math.round(saving.total / saving.users) : null,
    noiseComplaintRate: rate(noise.complained, noise.total),
    corporateObservers: corporate,
  };
}
