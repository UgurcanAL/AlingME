import { nowIso } from '../db.js';

const CABIN_LABEL = { economy: 'Ekonomi', business: 'Business' };

export function formatAlert({ offer }) {
  const lines = [
    '🧭 *Pusula Radar* — odul koltugu bulundu',
    '',
    `*${offer.origin} → ${offer.destination}* · ${CABIN_LABEL[offer.cabin] ?? offer.cabin}`,
    `Tarih: ${offer.departDate} · Tasiyici: ${offer.carrier} · Koltuk: ${offer.seats}`,
    `Mil: ${offer.miles.toLocaleString('tr-TR')} + ${offer.taxesTry.toLocaleString('tr-TR')} TL vergi`,
  ];
  // Belirsizlikte tahmin edilmez (taslak Bolum 4.3).
  lines.push(
    Number.isFinite(offer.savingTry)
      ? `Tahmini net tasarruf: ${offer.savingTry.toLocaleString('tr-TR')} TL`
      : 'Nakit karsiligi *dogrulanamadi*.',
  );
  lines.push('', 'Rezervasyonu siz tamamlarsiniz — Pusula sizin adiniza islem yapmaz.');
  return lines.join('\n');
}

export class ConsoleChannel {
  constructor(logger = console) { this.logger = logger; this.sent = []; }
  get name() { return 'console'; }
  async send(alert) {
    this.sent.push(alert);
    this.logger.log(`\n--- [${alert.handle}] ---\n${formatAlert(alert)}\n`);
    return true;
  }
}

export class TelegramChannel {
  constructor({ botToken, fetchImpl = globalThis.fetch }) {
    this.botToken = botToken;
    this.fetch = fetchImpl;
  }
  get name() { return 'telegram'; }
  async send(alert) {
    if (!alert.telegramChat) return false;
    const res = await this.fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: alert.telegramChat,
        text: formatAlert(alert),
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  }
}

/** Telegram birincil kanal, konsol/e-posta yedek (taslak Bolum 4.2). */
export class Notifier {
  constructor({ db, channels }) {
    this.db = db;
    this.channels = channels;
  }

  async deliver(alerts) {
    const delivered = [];
    for (const alert of alerts) {
      let usedChannel = 'undelivered';
      for (const channel of this.channels) {
        try {
          if (await channel.send(alert)) { usedChannel = channel.name; break; }
        } catch {
          // sonraki kanala dus
        }
      }
      this.db.prepare('UPDATE alerts SET channel = ?, sent_at = ? WHERE id = ?')
        .run(usedChannel, nowIso(), alert.id);
      delivered.push({ ...alert, channel: usedChannel });
    }
    return delivered;
  }
}

export function buildChannels(config) {
  const channels = [];
  if (config.telegram.botToken) channels.push(new TelegramChannel(config.telegram));
  channels.push(new ConsoleChannel());
  return channels;
}
