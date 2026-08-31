const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: int(process.env.PORT, 4310),
  dbFile: process.env.PUSULA_DB ?? './pusula-pilot.db',
  scan: {
    intervalMs: int(process.env.SCAN_INTERVAL_MS, 60_000),
    rateLimitPerMin: int(process.env.SCAN_RATE_LIMIT_PER_MIN, 30),
    concurrency: int(process.env.SCAN_CONCURRENCY, 2),
  },
  provider: {
    kind: process.env.AWARD_PROVIDER ?? 'simulated',
    baseUrl: process.env.AWARD_API_BASE ?? '',
    apiKey: process.env.AWARD_API_KEY ?? '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  },
};

/**
 * Pilot kapsam siniri: pilot yalnizca bu rota ailesinde calisir.
 * Kapsam disi bir izleme kaydi API tarafindan reddedilir.
 */
export const PILOT_SCOPE = {
  origins: ['IST'],
  destinations: ['LHR', 'FRA', 'CDG', 'AMS', 'MUC', 'ZRH', 'JFK', 'YYZ'],
  cabins: ['economy', 'business'],
  programme: 'MilesAndSmiles',
};

/** Segment kotalari - toplam 100 katilimci. */
export const SEGMENT_QUOTAS = {
  award_hunter: 55,
  card_optimiser: 25,
  deal_follower: 15,
  corporate_observer: 5,
};

/** Faz 1 karar kapisi esikleri. Pilot sirasinda degistirilmez. */
export const GATE_THRESHOLDS = {
  seatFoundRate: 0.30,
  presaleConversionRate: 0.25,
  weeklyActiveRate: 0.35,
  falsePositiveRate: 0.05, // ust sinir
};
