import { Router } from 'express';
import { requireRole, requireConsent } from '../access.js';
import { QUESTIONS, validateAnswers } from '../checkinQuestions.js';
import { cleanText } from '../util.js';

// Daily check in. Owner: Axel.
// Answers and the note are stored with a timestamp and the author. No answer triggers an automatic alert yet:
// clinician alerts are Planned. If an urgent question is answered Yes, the response asks the app to show
// the emergency guidance. The app never waits for the form to tell someone to get help.

export function checkinsRouter(db, auth) {
  const r = Router();
  r.use(auth, requireRole('survivor'), requireConsent);

  r.get('/questions', (req, res) => res.json({ questions: QUESTIONS }));

  r.get('/', (req, res) => {
    const rows = db
      .prepare('SELECT id, answers, note, created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 14')
      .all(req.user.id)
      .map((row) => ({ ...row, answers: JSON.parse(row.answers) }));
    res.json({ checkins: rows });
  });

  r.post('/', (req, res) => {
    const result = validateAnswers(req.body?.answers);
    if (!result.ok) return res.status(400).json({ error: result.error });
    const note = cleanText(req.body?.note, 600);
    const now = new Date().toISOString();
    const info = db
      .prepare('INSERT INTO checkins (user_id, answers, note, created_at) VALUES (?, ?, ?, ?)')
      .run(req.user.id, JSON.stringify(result.answers), note, now);
    res.status(201).json({ id: info.lastInsertRowid, created_at: now, urgent_guidance: result.urgent });
  });

  return r;
}
