import { nowIso } from '../db.js';
import { fingerprint, savingTry } from '../domain/miles.js';
import { RateLimiter } from './rateLimiter.js';

/**
 * Envanter Ajani - taslak Bolum 4.1.
 * Aktif izlemeleri rota/kabin bazinda gruplar, hiz siniri butcesi icinde tarar,
 * bulunan teklifleri kaydeder ve eslesen izlemeler icin uyari uretir.
 * Rezervasyon yapmaz; yalnizca bilgi ve uyari uretir (Bolum 4.3).
 */
export class InventoryAgent {
  constructor({ db, provider, config, logger = console }) {
    this.db = db;
    this.provider = provider;
    this.config = config;
    this.logger = logger;
    this.limiter = new RateLimiter({ perMinute: config.scan.rateLimitPerMin });
    this.blocked = false;
    this.timer = null;
  }

  /** Ayni rota+kabin+tarih araligini bir kez sorgulamak icin gruplar. */
  #scanTargets() {
    return this.db.prepare(`
      SELECT origin, destination, cabin,
             MIN(date_from) AS date_from,
             MAX(date_to)   AS date_to
      FROM watches
      WHERE active = 1
      GROUP BY origin, destination, cabin
    `).all();
  }

  #matchingWatches(offer) {
    return this.db.prepare(`
      SELECT w.*, p.telegram_chat, p.handle
      FROM watches w
      JOIN participants p ON p.id = w.participant_id
      WHERE w.active = 1
        AND p.left_at IS NULL
        AND w.origin = ? AND w.destination = ? AND w.cabin = ?
        AND ? BETWEEN w.date_from AND w.date_to
        AND w.max_miles >= ?
        AND w.passengers <= ?
    `).all(offer.origin, offer.destination, offer.cabin, offer.departDate, offer.miles, offer.seats);
  }

  #recordAvailability(offer) {
    this.db.prepare(`
      INSERT INTO availability
        (origin,destination,cabin,depart_date,miles,taxes_try,seats,carrier,cash_price_try,seen_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT DO UPDATE SET seats = excluded.seats, seen_at = excluded.seen_at
    `).run(
      offer.origin, offer.destination, offer.cabin, offer.departDate,
      offer.miles, offer.taxesTry, offer.seats, offer.carrier,
      offer.cashPriceTry ?? null, nowIso(),
    );
  }

  #log(route, status, results, detail) {
    this.db.prepare(
      'INSERT INTO scan_log (route,status,results,detail,created_at) VALUES (?,?,?,?,?)',
    ).run(route, status, results, detail ?? null, nowIso());
  }

  /** Tek tur tarama. Uretilen (henuz gonderilmemis) uyarilari dondurur. */
  async runOnce() {
    if (this.blocked) return [];
    const produced = [];

    for (const target of this.#scanTargets()) {
      const route = `${target.origin}-${target.destination}/${target.cabin}`;

      if (!this.limiter.tryAcquire()) {
        this.#log(route, 'rate_limited', 0, `retry in ${this.limiter.retryAfterMs()}ms`);
        continue;
      }

      let offers;
      try {
        offers = await this.provider.search({
          origin: target.origin,
          destination: target.destination,
          cabin: target.cabin,
          dateFrom: target.date_from,
          dateTo: target.date_to,
        });
      } catch (err) {
        if (err.code === 'blocked') {
          // Durdurma kosulu: havayolu tarama trafigini engelledi.
          this.blocked = true;
          this.#log(route, 'blocked', 0, err.message);
          this.logger.error('[envanter] engellendi, ajan durduruldu:', err.message);
          return produced;
        }
        this.#log(route, err.code === 'rate_limited' ? 'rate_limited' : 'error', 0, err.message);
        continue;
      }

      this.#log(route, 'ok', offers.length, null);

      for (const offer of offers) {
        this.#recordAvailability(offer);
        const fp = fingerprint(offer);
        for (const watch of this.#matchingWatches(offer)) {
          const alert = this.#createAlert(watch, offer, fp);
          if (alert) produced.push(alert);
        }
      }
    }
    return produced;
  }

  /** Dedupe: ayni izleme + ayni parmak izi icin ikinci uyari uretilmez. */
  #createAlert(watch, offer, fp) {
    const saving = savingTry({
      cashPriceTry: offer.cashPriceTry,
      miles: offer.miles,
      taxesTry: offer.taxesTry,
    });
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO alerts
        (watch_id,participant_id,fingerprint,origin,destination,cabin,depart_date,
         miles,taxes_try,seats,carrier,saving_try,sent_at,channel)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')
    `).run(
      watch.id, watch.participant_id, fp, offer.origin, offer.destination, offer.cabin,
      offer.departDate, offer.miles, offer.taxesTry, offer.seats, offer.carrier,
      saving, nowIso(),
    );
    if (result.changes === 0) return null;
    return {
      id: Number(result.lastInsertRowid),
      participantId: watch.participant_id,
      handle: watch.handle,
      telegramChat: watch.telegram_chat,
      offer: { ...offer, savingTry: saving },
    };
  }

  start(onAlerts) {
    const tick = async () => {
      try {
        const alerts = await this.runOnce();
        if (alerts.length) await onAlerts(alerts);
      } catch (err) {
        this.logger.error('[envanter] tur hatasi:', err);
      }
    };
    void tick();
    this.timer = setInterval(tick, this.config.scan.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
