import { createHash } from 'node:crypto';

/**
 * Miles&Smiles promosyon odul tablosu (Subat 2024 devaluasyonu sonrasi, tek yon).
 * Kaynak: proje taslagi Bolum 2.2. Devaluasyon Ajani bu tabloyu gunluk diff'ler.
 */
export const AWARD_CHART = {
  europe: { economy: 15_000, business: 25_000 },
  north_america: { economy: 40_000, business: 65_000 },
};

const REGION_BY_AIRPORT = {
  LHR: 'europe', FRA: 'europe', CDG: 'europe',
  AMS: 'europe', MUC: 'europe', ZRH: 'europe',
  JFK: 'north_america', YYZ: 'north_america',
};

export function regionOf(airport) {
  return REGION_BY_AIRPORT[airport] ?? null;
}

export function chartPrice(destination, cabin) {
  const region = regionOf(destination);
  if (!region) return null;
  return AWARD_CHART[region]?.[cabin] ?? null;
}

/**
 * Milin degeri kurus/mil cinsinden. Pilotta sabit, Faz 1'de kullanim
 * verisinden turetilecek. Taslak Bolum 3.2: nominal oran degil, milin
 * gercekte ne satin aldigi esas alinir.
 */
export const MILE_VALUE_KURUS = 45; // 0,45 TL / mil

export function milesToTry(miles) {
  return Math.round((miles * MILE_VALUE_KURUS) / 100);
}

/**
 * Kullanicinin bu odul biletiyle elde ettigi net tasarruf (TL).
 * Nakit bilet fiyati - (harcanan milin degeri + vergiler).
 * Nakit fiyat bilinmiyorsa null doner; pilot "dogrulanamadi" der, tahmin etmez.
 */
export function savingTry({ cashPriceTry, miles, taxesTry }) {
  if (!Number.isFinite(cashPriceTry)) return null;
  return Math.round(cashPriceTry - milesToTry(miles) - taxesTry);
}

/**
 * Ayni koltuk icin tekrar tekrar uyari gitmesini engelleyen parmak izi.
 * Mil degeri de dahildir: fiyat dususe yeni bir uyari hak eder.
 */
export function fingerprint(offer) {
  return createHash('sha1')
    .update([
      offer.origin, offer.destination, offer.cabin,
      offer.departDate, offer.carrier, offer.miles,
    ].join('|'))
    .digest('hex')
    .slice(0, 16);
}
