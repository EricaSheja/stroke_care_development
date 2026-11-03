import { Router } from 'express';
import { requireRole, requireConsent } from '../access.js';
import { today, cleanText } from '../util.js';

// Recovery plan. Owner: Axel.
// The clinician writes the plan. The survivor sees it and logs tasks as done for today.

export function planRouter(db, auth) {
  const r = Router();
  r.use(auth, requireRole('survivor'), requireConsent);

  r.get('/', (req, res) => {
    const plan = db
      .prepare(
        `SELECT p.id, p.title, p.created_at, c.name AS clinician_name
           FROM recovery_plans p JOIN users c ON c.id = p.clinician_id
          WHERE p.patient_id = ?`
      )
      .get(req.user.id);
    if (!plan) return res.json({ plan: null });
    const tasks = db
      .prepare(
        `SELECT t.id, t.title, t.instructions,
                EXISTS (SELECT 1 FROM task_logs l WHERE l.task_id = t.id AND l.done_on = ?) AS done_today
           FROM plan_tasks t WHERE t.plan_id = ? ORDER BY t.id`
      )
      .all(today(), plan.id)
      .map((t) => ({ ...t, done_today: Boolean(t.done_today) }));
    res.json({ plan: { ...plan, tasks } });
  });

  const ownTask = db.prepare(
    `SELECT t.id FROM plan_tasks t JOIN recovery_plans p ON p.id = t.plan_id
      WHERE t.id = ? AND p.patient_id = ?`
  );

  r.post('/tasks/:id/log', (req, res) => {
    const task = ownTask.get(Number(req.params.id), req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    db.prepare('INSERT OR IGNORE INTO task_logs (task_id, user_id, done_on) VALUES (?, ?, ?)').run(task.id, req.user.id, today());
    res.json({ ok: true, done_today: true });
  });

  r.delete('/tasks/:id/log', (req, res) => {
    const task = ownTask.get(Number(req.params.id), req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    db.prepare('DELETE FROM task_logs WHERE task_id = ? AND done_on = ?').run(task.id, today());
    res.json({ ok: true, done_today: false });
  });

  return r;
}

// Clinician side: list linked patients and add tasks to a linked patient's plan.
export function patientsRouter(db, auth) {
  const r = Router();
  r.use(auth, requireRole('clinician'));

  r.get('/', (req, res) => {
    const patients = db
      .prepare(
        `SELECT u.id, u.name, u.role FROM clinician_patients cp
           JOIN users u ON u.id = cp.patient_id WHERE cp.clinician_id = ? ORDER BY u.name`
      )
      .all(req.user.id);
    res.json({ patients });
  });

  r.post('/:id/plan/tasks', (req, res) => {
    const patientId = Number(req.params.id);
    const linked = db.prepare('SELECT 1 FROM clinician_patients WHERE clinician_id = ? AND patient_id = ?').get(req.user.id, patientId);
    if (!linked) return res.status(404).json({ error: 'Patient not found.' });
    const title = cleanText(req.body?.title, 120);
    if (!title) return res.status(400).json({ error: 'Enter a task title.' });

    let plan = db.prepare('SELECT id FROM recovery_plans WHERE patient_id = ?').get(patientId);
    if (!plan) {
      const info = db.prepare('INSERT INTO recovery_plans (patient_id, clinician_id, title) VALUES (?, ?, ?)').run(patientId, req.user.id, 'Recovery plan');
      plan = { id: info.lastInsertRowid };
    }
    const info = db
      .prepare('INSERT INTO plan_tasks (plan_id, title, instructions) VALUES (?, ?, ?)')
      .run(plan.id, title, cleanText(req.body?.instructions, 400));
    res.status(201).json({ task: { id: info.lastInsertRowid, title } });
  });

  return r;
}
