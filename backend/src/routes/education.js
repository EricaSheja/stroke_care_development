import { Router } from 'express';
import { requireConsent } from '../access.js';

// Education library. Owner: Erica for content, Axel for the endpoint.
// Every item shows its source and review state. Until a clinician reviews an item its status is draft.

export function educationRouter(db, auth) {
  const r = Router();
  r.use(auth, requireConsent);

  r.get('/', (req, res) => {
    const lang = ['en', 'rw', 'fr'].includes(req.query.lang) ? req.query.lang : 'en';
    let items = db.prepare('SELECT id, language, title, body, source, reviewed_on, reviewer, status FROM education_items WHERE language = ? ORDER BY id').all(lang);
    let fallback = false;
    if (items.length === 0 && lang !== 'en') {
      items = db.prepare("SELECT id, language, title, body, source, reviewed_on, reviewer, status FROM education_items WHERE language = 'en' ORDER BY id").all();
      fallback = true;
    }
    res.json({ items, language: fallback ? 'en' : lang, fallback });
  });

  return r;
}
