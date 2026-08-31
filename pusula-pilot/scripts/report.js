/** Kapi raporu - haftalik PMO gostergesi. node scripts/report.js [dbDosyasi] */
import { openDb } from '../src/db.js';
import { gateMetrics, secondaryMetrics } from '../src/metrics/gates.js';

const db = openDb(process.argv[2] ?? process.env.PUSULA_DB ?? './pusula-pilot.db');
const gate = gateMetrics(db);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

console.log(`\nPUSULA RADAR — FAZ 1 KARAR KAPISI (hafta ${gate.week}, ${gate.enrolled} katilimci)\n`);
for (const c of gate.criteria) {
  const sign = c.direction === 'min' ? '>=' : '<=';
  console.log(
    `  ${c.passed ? 'GECTI' : 'KALDI'}  ${c.label.padEnd(26)} ${pct(c.value).padStart(7)}  (hedef ${sign} ${pct(c.threshold)})`,
  );
}
console.log(`\n  KARAR: ${gate.passed ? 'GO — Faz 1' : 'NO-GO — kriter gevsetilmez, sure uzatilir'}\n`);

const s = secondaryMetrics(db);
console.log('  Ikincil gostergeler');
console.log(`    Uyaridan rezervasyona medyan : ${s.medianMinutesToBooking ?? 'veri yok'} dk`);
console.log(`    Kullanici basina tasarruf    : ${s.savingPerUserTry ?? 'veri yok'} TL`);
console.log(`    Gurultu sikayet orani        : ${pct(s.noiseComplaintRate)}`);
console.log(`    Kurumsal gozlemci            : ${s.corporateObservers}\n`);
db.close();
