import { Router } from 'express';
import { requireRole, requireConsent } from '../access.js';
import { cleanText } from '../util.js';

// Blood pressure log. Owner: Axel.
// The limits below only reject typing mistakes. They are NOT clinical thresholds.
// The app never labels a reading as good or bad: thresholds need clinical review first.

const SYSTOLIC = [50, 300];
const DIASTOLIC = [30, 200];

const inRange = (n, [lo, hi]) => Number.isInteger(n) && n >= lo && n <= hi;

export function readingsRouter(db, auth) {
  const r = Router();
  r.use(auth, requireRole('survivor', 'prevention'), requireConsent);

  r.get('/', (req, res) => {
    const readings = db
      .prepare(
        `SELECT id, systolic, diastolic, pulse, note, taken_at FROM bp_readings
          WHERE user_id = ? ORDER BY taken_at DESC, id DESC LIMIT 200`
      )
      .all(req.user.id);
    res.json({ readings });
  });

  r.post('/', (req, res) => {
    const systolic = Number(req.body?.systolic);
    const diastolic = Number(req.body?.diastolic);
    const pulseRaw = req.body?.pulse;
    const pulse = pulseRaw === undefined || pulseRaw === null || pulseRaw === '' ? null : Number(pulseRaw);

    if (!inRange(systolic, SYSTOLIC) || !inRange(diastolic, DIASTOLIC)) {
      return res.status(400).json({ error: 'Check the numbers. Use whole numbers for both values.' });
    }
    if (systolic <= diastolic) {
      return res.status(400).json({ error: 'The first number must be larger than the second.' });
    }
    if (pulse !== null && !inRange(pulse, [20, 250])) {
      return res.status(400).json({ error: 'Check the pulse number.' });
    }

    let takenAt = new Date();
    if (req.body?.taken_at) {
      takenAt = new Date(req.body.taken_at);
      if (Number.isNaN(takenAt.getTime()) || takenAt.getTime() > Date.now() + 5 * 60000) {
        return res.status(400).json({ error: 'The date and time cannot be in the future.' });
      }
    }

    const info = db
      .prepare('INSERT INTO bp_readings (user_id, systolic, diastolic, pulse, note, taken_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, systolic, diastolic, pulse, cleanText(req.body?.note, 300), takenAt.toISOString());
    const reading = db.prepare('SELECT id, systolic, diastolic, pulse, note, taken_at FROM bp_readings WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ reading });
  });

  return r;
}
