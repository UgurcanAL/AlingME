import { createServer } from 'node:http';
import { nowIso } from '../db.js';
import { gateMetrics, secondaryMetrics } from '../metrics/gates.js';
import { addWatch, enrol, segmentUsage } from '../pilot/enrolment.js';
import { PILOT_SCOPE, SEGMENT_QUOTAS } from '../config.js';

const json = (res, status, body) => {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
};

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw Object.assign(new Error('govde cok buyuk'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('gecersiz JSON'), { status: 400 });
  }
}

export function createApi({ db, agent }) {
  const routes = [
    ['GET', /^\/health$/, () => ({
      status: agent?.blocked ? 'blocked' : 'ok',
      scope: PILOT_SCOPE,
      quotas: SEGMENT_QUOTAS,
    })],

    ['GET', /^\/pilot\/quotas$/, () => segmentUsage(db)],

    ['POST', /^\/participants$/, async (_m, req) => {
      const body = await readJson(req);
      if (!body.handle) throw Object.assign(new Error('handle zorunlu'), { status: 400 });
      return enrol(db, body);
    }],

    ['POST', /^\/participants\/(\d+)\/watches$/, async (m, req) => {
      const body = await readJson(req);
      return addWatch(db, Number(m[1]), body);
    }],

    // Uyariya verilen tek soruluk yanit: "rezerve ettiniz mi?"
    ['POST', /^\/alerts\/(\d+)\/response$/, async (m, req) => {
      const body = await readJson(req);
      const booked = body.booked === true ? 1 : 0;
      const info = db.prepare('UPDATE alerts SET booked = ?, responded_at = ? WHERE id = ?')
        .run(booked, nowIso(), Number(m[1]));
      if (info.changes === 0) throw Object.assign(new Error('uyari yok'), { status: 404 });
      return { alertId: Number(m[1]), booked: Boolean(booked) };
    }],

    // Editorun gunluk 20 uyarilik elle dogrulamasi.
    ['POST', /^\/alerts\/(\d+)\/verify$/, async (m, req) => {
      const body = await readJson(req);
      const verdict = body.verdict;
      if (!['verified', 'false_positive', 'unverified'].includes(verdict)) {
        throw Object.assign(new Error('verdict: verified|false_positive|unverified'), { status: 400 });
      }
      const info = db.prepare('UPDATE alerts SET verification = ? WHERE id = ?')
        .run(verdict, Number(m[1]));
      if (info.changes === 0) throw Object.assign(new Error('uyari yok'), { status: 404 });
      return { alertId: Number(m[1]), verification: verdict };
    }],

    ['POST', /^\/feedback$/, async (_m, req) => {
      const b = await readJson(req);
      db.prepare(`
        INSERT INTO weekly_feedback (participant_id,week,active,noise_complaint,score,note,created_at)
        VALUES (?,?,?,?,?,?,?)
        ON CONFLICT(participant_id,week) DO UPDATE SET
          active = excluded.active, noise_complaint = excluded.noise_complaint,
          score = excluded.score, note = excluded.note
      `).run(
        b.participantId, b.week, b.active ? 1 : 0, b.noiseComplaint ? 1 : 0,
        b.score ?? null, b.note ?? null, nowIso(),
      );
      return { ok: true };
    }],

    ['POST', /^\/presales$/, async (_m, req) => {
      const b = await readJson(req);
      if (!['monthly', 'annual'].includes(b.plan)) {
        throw Object.assign(new Error('plan: monthly|annual'), { status: 400 });
      }
      const amount = b.plan === 'monthly' ? 149 : 1290;
      db.prepare(`
        INSERT INTO presales (participant_id,plan,amount_try,charged_at) VALUES (?,?,?,?)
        ON CONFLICT(participant_id) DO UPDATE SET
          plan = excluded.plan, amount_try = excluded.amount_try,
          charged_at = excluded.charged_at, refunded_at = NULL
      `).run(b.participantId, b.plan, amount, nowIso());
      return { participantId: b.participantId, plan: b.plan, amountTry: amount };
    }],

    // 14 gunluk cayma hakki; kapi hesabi net rakami kullanir.
    ['POST', /^\/presales\/(\d+)\/refund$/, (m) => {
      const info = db.prepare('UPDATE presales SET refunded_at = ? WHERE participant_id = ?')
        .run(nowIso(), Number(m[1]));
      if (info.changes === 0) throw Object.assign(new Error('kayit yok'), { status: 404 });
      return { participantId: Number(m[1]), refunded: true };
    }],

    ['GET', /^\/metrics\/gate$/, () => gateMetrics(db)],
    ['GET', /^\/metrics\/secondary$/, () => secondaryMetrics(db)],
  ];

  return createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    for (const [method, pattern, handler] of routes) {
      const match = pattern.exec(path);
      if (!match || req.method !== method) continue;
      try {
        return json(res, method === 'POST' ? 201 : 200, await handler(match, req));
      } catch (err) {
        return json(res, err.status ?? 500, { error: err.message });
      }
    }
    return json(res, 404, { error: 'bulunamadi' });
  });
}
