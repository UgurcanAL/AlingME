import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartPrice, savingTry, milesToTry, fingerprint } from '../src/domain/miles.js';

test('odul tablosu devaluasyon sonrasi degerleri dondurur', () => {
  assert.equal(chartPrice('JFK', 'business'), 65_000);
  assert.equal(chartPrice('LHR', 'economy'), 15_000);
  assert.equal(chartPrice('SYD', 'economy'), null, 'kapsam disi varis null olmali');
});

test('tasarruf hesabi milin gercek degerini dusuyor', () => {
  const saving = savingTry({ cashPriceTry: 60_000, miles: 65_000, taxesTry: 4_800 });
  assert.equal(saving, 60_000 - milesToTry(65_000) - 4_800);
});

test('nakit fiyat bilinmiyorsa tahmin edilmez', () => {
  assert.equal(savingTry({ cashPriceTry: undefined, miles: 1000, taxesTry: 0 }), null);
});

test('parmak izi mil degeri degisince degisir', () => {
  const base = { origin: 'IST', destination: 'JFK', cabin: 'business', departDate: '2026-10-04', carrier: 'TK', miles: 65_000 };
  assert.equal(fingerprint(base), fingerprint({ ...base }));
  assert.notEqual(fingerprint(base), fingerprint({ ...base, miles: 55_000 }));
});
