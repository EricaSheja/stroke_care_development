import { Router } from 'express';
import { requireRole } from '../access.js';
import { daysAgoDate, isoDaysAgo } from '../util.js';

// Clinician summary of the last 7 days for each linked patient. Owner: Axel.
// DESCRIPTIVE ONLY. It counts, averages and quotes what the patient entered.
// It does not diagnose, rate risk, colour code or recommend anything. An AI written summary is Planned.

const DAYS = 7;

export function summaryRouter(db, auth) {
  const r = Router();
  r.use(auth, requireRole('clinician'));

  r.get('/', (req, res) => {
    const patients = db
      .prepare(
        `SELECT u.id, u.name, u.role FROM clinician_patients cp
           JOIN users u ON u.id = cp.patient_id WHERE cp.clinician_id = ? ORDER BY u.name`
      )
      .all(req.user.id);

    const since = isoDaysAgo(DAYS);
    const sinceDate = daysAgoDate(DAYS - 1);

    const out = patients.map((p) => {
      const stats = db
        .prepare(
          `SELECT COUNT(*) AS n, ROUND(AVG(systolic)) AS avg_sys, ROUND(AVG(diastolic)) AS avg_dia
             FROM bp_readings WHERE user_id = ? AND taken_at >= ?`
        )
        .get(p.id, since);
      const latest = db
        .prepare('SELECT systolic, diastolic, pulse, taken_at FROM bp_readings WHERE user_id = ? ORDER BY taken_at DESC LIMIT 1')
        .get(p.id);
      const taskCount = db
        .prepare('SELECT COUNT(*) AS n FROM plan_tasks t JOIN recovery_plans rp ON rp.id = t.plan_id WHERE rp.patient_id = ?')
        .get(p.id).n;
      const tasksDone = db
        .prepare('SELECT COUNT(*) AS n FROM task_logs WHERE user_id = ? AND done_on >= ?')
        .get(p.id, sinceDate).n;
      const checkins = db
        .prepare('SELECT note, created_at FROM checkins WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC')
        .all(p.id, since);
      return {
        patient: { id: p.id, name: p.name, role: p.role },
        readings: {
          count: stats.n,
          average_systolic: stats.n ? stats.avg_sys : null,
          average_diastolic: stats.n ? stats.avg_dia : null,
          latest: latest || null,
        },
        tasks: { in_plan: taskCount, done_logs: tasksDone, expected_logs: taskCount * DAYS },
        checkins: {
          count: checkins.length,
          notes: checkins.filter((c) => c.note).slice(0, 3),
        },
      };
    });

    res.json({
      period_days: DAYS,
      generated_at: new Date().toISOString(),
      disclaimer: 'Descriptive summary of what the patient entered. It is not a diagnosis and gives no treatment advice.',
      patients: out,
    });
  });

  return r;
}
