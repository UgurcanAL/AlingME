import { PILOT_SCOPE } from '../config.js';
import { chartPrice } from '../domain/miles.js';

/**
 * Odul arama saglayici arayuzu.
 *   search({ origin, destination, cabin, dateFrom, dateTo }) -> Promise<Offer[]>
 * Offer: { origin, destination, cabin, departDate, miles, taxesTry, seats, carrier, cashPriceTry }
 */

const STAR_CARRIERS = ['TK', 'LH', 'LX', 'OS', 'AC', 'UA', 'SN'];

function* eachDate(from, to) {
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    yield cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

/** Deterministik sozde-rastgele: ayni girdi ayni sonucu verir, testler stabil kalir. */
function hash01(seed) {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Pilot icin simule saglayici. Gercek havayolu arayuzune bagli degildir:
 * kapali betada tarama hatti, esik mantigi ve bildirim akisi bununla dogrulanir.
 */
export class SimulatedProvider {
  constructor({ seed = 'pusula', hitRate = 0.06 } = {}) {
    this.seed = seed;
    this.hitRate = hitRate;
    this.calls = 0;
  }

  async search({ origin, destination, cabin, dateFrom, dateTo }) {
    this.calls += 1;
    const offers = [];
    for (const departDate of eachDate(dateFrom, dateTo)) {
      const roll = hash01(`${this.seed}|${origin}|${destination}|${cabin}|${departDate}`);
      if (roll > this.hitRate) continue;
      const base = chartPrice(destination, cabin);
      if (!base) continue;
      const carrier = STAR_CARRIERS[Math.floor(roll * 1e4) % STAR_CARRIERS.length];
      const cashMultiplier = cabin === 'business' ? 9 : 3;
      offers.push({
        origin,
        destination,
        cabin,
        departDate,
        miles: base,
        taxesTry: cabin === 'business' ? 4_800 : 2_400,
        seats: 1 + (Math.floor(roll * 1e4) % 3),
        carrier,
        cashPriceTry: Math.round(base * cashMultiplier * 0.02) * 100,
      });
    }
    return offers;
  }
}

/**
 * Gercek bir odul arama ucuna baglanan saglayici. Pilotta AWARD_PROVIDER=http
 * ile devreye alinir; sozlesme netlesene kadar varsayilan simule saglayicidir.
 */
export class HttpProvider {
  constructor({ baseUrl, apiKey, fetchImpl = globalThis.fetch } = {}) {
    if (!baseUrl) throw new Error('HttpProvider: AWARD_API_BASE tanimli degil');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
  }

  async search(query) {
    const url = new URL(`${this.baseUrl}/award-availability`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const res = await this.fetch(url, {
      headers: this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {},
    });
    if (res.status === 429) {
      const err = new Error('rate_limited');
      err.code = 'rate_limited';
      throw err;
    }
    if (res.status === 403) {
      const err = new Error('blocked');
      err.code = 'blocked';
      throw err;
    }
    if (!res.ok) throw new Error(`award provider ${res.status}`);
    const body = await res.json();
    return Array.isArray(body.offers) ? body.offers : [];
  }
}

export function createProvider(config) {
  if (config.provider.kind === 'http') {
    return new HttpProvider({ baseUrl: config.provider.baseUrl, apiKey: config.provider.apiKey });
  }
  return new SimulatedProvider();
}

export function inScope({ origin, destination, cabin }) {
  return PILOT_SCOPE.origins.includes(origin)
    && PILOT_SCOPE.destinations.includes(destination)
    && PILOT_SCOPE.cabins.includes(cabin);
}
