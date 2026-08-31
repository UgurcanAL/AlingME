# Pusula Radar — Kapalı Beta Pilot Servisi

Pusula proje taslağındaki **Faz 0 → Faz 1 karar kapısı** pilotunun çalışan
implementasyonu: Star Alliance ödül koltuk taraması, uyarı dağıtımı, katılımcı
yönetimi ve dört kapı kriterinin ölçümü.

Sıfır bağımlılık. Node 22.5+ (`node:sqlite`) yeterlidir.

```bash
cd pusula-pilot
cp .env.example .env
npm test          # 24 test
npm run seed      # 8 haftalık pilotu uçtan uca simüle eder
npm start         # HTTP API + tarama ajanı
npm run report    # kapı raporu
```

## Mimari

| Dosya | Karşılığı (proje taslağı) |
|---|---|
| `src/agents/inventoryAgent.js` | Envanter Ajanı — sürekli tarama, eşleştirme, dedupe |
| `src/agents/rateLimiter.js` | Kaynak bazlı hız sınırlama (Bölüm 8, kritik risk) |
| `src/providers/awardProvider.js` | Ödül arama sağlayıcısı — `simulated` \| `http` |
| `src/domain/miles.js` | Ödül tablosu, mil değerleme, net tasarruf |
| `src/notify/notifier.js` | Telegram birincil, konsol yedek (Bölüm 4.2) |
| `src/pilot/enrolment.js` | Segment kotaları, kapsam kontrolü, katılımcı düşürme |
| `src/metrics/gates.js` | Dört kapı kriteri + ikincil göstergeler |

## Koda gömülü pilot kuralları

Bunlar yorum değil, kod seviyesinde zorlanan kısıtlardır:

- **Kapsam sınırı** — `PILOT_SCOPE` dışındaki rota/kabin için izleme kaydı
  `422` ile reddedilir. Pilot tek rota ailesinde kalır.
- **Segment kotası** — `SEGMENT_QUOTAS` dolduğunda kayıt `409` döner
  (55/25/15/5). Kotasız grup, ön satış sonucunu okunamaz hale getirir.
- **Rezervasyon yok** — ajan yalnız bilgi ve uyarı üretir; hiçbir yerde
  rezervasyon çağrısı yoktur (Bölüm 4.3).
- **Tahmin yok** — nakit karşılığı bilinmiyorsa `savingTry()` `null` döner ve
  mesaj "doğrulanamadı" der.
- **Kimlik bilgisi yok** — şemada üyelik numarası/şifre alanı yoktur;
  katılımcı takma adla tutulur.
- **Fiyat sunucuda** — ön satış tutarı istemciden alınmaz (`149` / `1290`).
- **Durdurma koşulu** — sağlayıcı `403` dönerse ajan kendini durdurur ve
  `scan_log`'a `blocked` yazar.
- **Eşikler sabit** — `GATE_THRESHOLDS` tek yerde; dördü birden geçmeden
  `passed: false`.

## API

| Uç | İş |
|---|---|
| `GET /health` | Ajan durumu, kapsam, kotalar |
| `GET /pilot/quotas` | Segment doluluk |
| `POST /participants` | Katılımcı kaydı (kota kontrollü) |
| `POST /participants/:id/watches` | İzleme kurulumu (kapsam kontrollü) |
| `POST /alerts/:id/response` | "Rezerve ettiniz mi?" tek soruluk yanıt |
| `POST /alerts/:id/verify` | Editör doğrulaması: `verified` \| `false_positive` |
| `POST /feedback` | Haftalık form |
| `POST /presales` · `POST /presales/:id/refund` | Ön satış ve cayma |
| `GET /metrics/gate` · `GET /metrics/secondary` | Kapı ve ikincil göstergeler |

## Gerçek veriye geçiş

`AWARD_PROVIDER=http` + `AWARD_API_BASE` ile `HttpProvider` devreye girer;
`429` → `rate_limited`, `403` → `blocked` olarak yorumlanır. Simüle sağlayıcı
deterministiktir, testler bu yüzden stabildir.
