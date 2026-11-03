// The ten daily check in questions, taken from the Daily_CheckIn_Questions tab of the tracker sheet.
// Every question is a DRAFT and needs clinical review before real use (see docs/safety.md).
// kind: choice (one option), number (hours), dual (two linked choices).

export const QUESTIONS = [
  { id: 'Q1', kind: 'choice', text: 'Overall, how have you felt today compared with yesterday?',
    options: ['Much better', 'A little better', 'About the same', 'A little worse', 'Much worse'] },
  { id: 'Q2', kind: 'choice', urgent: ['Yes'], text: 'Have you noticed any new or suddenly worsening symptoms today?',
    options: ['No', 'Yes', 'Not sure'] },
  { id: 'Q3', kind: 'choice', text: 'How was your movement today compared with your current recovery plan?',
    options: ['Completed as planned', 'Partly completed', 'Could not complete', 'Not assigned'] },
  { id: 'Q4', kind: 'choice', text: 'Have you had any new or worsening joint pain, stiffness, swelling, or difficulty moving?',
    options: ['No', 'Yes', 'Not sure'] },
  { id: 'Q5', kind: 'choice', urgent: ['Yes'], text: 'Did you have any new or worsening difficulty swallowing food, drinks, or saliva?',
    options: ['No', 'Yes', 'Not sure'] },
  { id: 'Q6', kind: 'choice', urgent: ['Yes'], text: 'Did you notice any new or worsening difficulty speaking, understanding, or communicating?',
    options: ['No', 'Yes', 'Not sure'] },
  { id: 'Q7', kind: 'choice', text: 'How has your mood been today?',
    options: ['Good', 'Okay', 'Low', 'Anxious', 'Very distressed', 'Prefer not to say'] },
  { id: 'Q8', kind: 'number', min: 0, max: 24, text: 'How many hours did you sleep last night?' },
  { id: 'Q9', kind: 'dual', text: 'Did you follow your food and fluid instructions today?',
    fields: [
      { key: 'food', label: 'Food', options: ['Yes', 'Partly', 'No', 'Not sure'] },
      { key: 'fluids', label: 'Fluids', options: ['Yes', 'Partly', 'No', 'Not sure', 'Not applicable'] },
    ] },
  { id: 'Q10', kind: 'dual', text: 'Did you take your medicines and complete the care tasks scheduled for today?',
    fields: [
      { key: 'medicines', label: 'Medicines', options: ['All', 'Some', 'None', 'No medicines scheduled'] },
      { key: 'tasks', label: 'Care tasks', options: ['All', 'Some', 'None', 'No tasks scheduled'] },
    ] },
];

const SKIPPED = 'skipped';

// Returns { ok: true, answers, urgent } or { ok: false, error }.
export function validateAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Answers are missing.' };
  const answers = {};
  let urgent = false;
  for (const [id, value] of Object.entries(input)) {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) return { ok: false, error: `Unknown question ${id}.` };
    if (value === SKIPPED) { answers[id] = SKIPPED; continue; }
    if (q.kind === 'choice') {
      if (!q.options.includes(value)) return { ok: false, error: `Invalid answer for ${id}.` };
      if (q.urgent?.includes(value)) urgent = true;
    } else if (q.kind === 'number') {
      const n = Number(value);
      if (value === '' || value === null || !Number.isFinite(n) || n < q.min || n > q.max) {
        return { ok: false, error: `Invalid answer for ${id}.` };
      }
    } else if (q.kind === 'dual') {
      if (!value || typeof value !== 'object') return { ok: false, error: `Invalid answer for ${id}.` };
      const clean = {};
      for (const f of q.fields) {
        if (value[f.key] === undefined || value[f.key] === SKIPPED) { clean[f.key] = SKIPPED; continue; }
        if (!f.options.includes(value[f.key])) return { ok: false, error: `Invalid answer for ${id}.` };
        clean[f.key] = value[f.key];
      }
      answers[id] = clean;
      continue;
    }
    answers[id] = q.kind === 'number' ? Number(value) : value;
  }
  if (Object.keys(answers).length === 0) return { ok: false, error: 'Answer or skip at least one question.' };
  return { ok: true, answers, urgent };
}