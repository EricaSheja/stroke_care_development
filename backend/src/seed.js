import { hashPassword } from './auth.js';
import { today, daysAgoDate } from './util.js';
import { EDUCATION, SOURCE } from './educationContent.js';

// Demo data. EVERYTHING here is fictional. Owner: Axel, with Orion for deployment.
// The data is the same on every deploy so the demo always looks the same.
// Demo password for every account: demo1234

export const DEMO_PASSWORD = 'demo1234';

function atUtc(daysAgo, hour) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function seedIfEmpty(db) {
  if (process.env.SEED_DEMO === 'false') return false;
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return false;

  const now = new Date().toISOString();
  const hash = hashPassword(DEMO_PASSWORD);
  const addUser = db.prepare('INSERT INTO users (name, email, password_hash, role, consent_at) VALUES (?, ?, ?, ?, ?)');
  const clinician = addUser.run('Demo Clinician', 'clinician@demo.test', hash, 'clinician', now).lastInsertRowid;
  const survivor = addUser.run('Demo Survivor', 'survivor@demo.test', hash, 'survivor', now).lastInsertRowid;
  const survivor2 = addUser.run('Demo Survivor Two', 'survivor2@demo.test', hash, 'survivor', now).lastInsertRowid;
  const prevention = addUser.run('Demo Prevention User', 'prevention@demo.test', hash, 'prevention', now).lastInsertRowid;

  const link = db.prepare('INSERT INTO clinician_patients (clinician_id, patient_id) VALUES (?, ?)');
  link.run(clinician, survivor);
  link.run(clinician, survivor2);

  const addReading = db.prepare('INSERT INTO bp_readings (user_id, systolic, diastolic, pulse, note, taken_at) VALUES (?, ?, ?, ?, ?, ?)');
  const reading = (userId, daysAgo, hour, k) => {
    const sys = 126 + ((daysAgo * 5 + k * 3) % 17);
    const dia = 78 + ((daysAgo * 3 + k * 5) % 9);
    const pulse = 68 + ((daysAgo + k * 2) % 8);
    addReading.run(userId, sys, dia, pulse, null, atUtc(daysAgo, hour));
  };
  for (let d = 13; d >= 0; d--) {
    reading(survivor, d, 6, 0);
    reading(survivor, d, 17, 1);
  }
  for (let d = 4; d >= 0; d--) reading(survivor2, d, 7, 2);
  for (let d = 12; d >= 0; d -= 2) reading(prevention, d, 6, 3);

  const addPlan = db.prepare('INSERT INTO recovery_plans (patient_id, clinician_id, title) VALUES (?, ?, ?)');
  const addTask = db.prepare('INSERT INTO plan_tasks (plan_id, title, instructions) VALUES (?, ?, ?)');
  const plan1 = addPlan.run(survivor, clinician, 'Recovery plan').lastInsertRowid;
  const tasks1 = [
    ['Arm and hand exercises', 'Do the exercise set your physiotherapist showed you.'],
    ['Walking practice', 'Walk with your helper, as written in your plan.'],
    ['Speech practice', 'Read aloud or name objects around you, as your therapist advised.'],
    ['Medicines', 'Take your medicines as written on your medicine list.'],
  ].map(([t, i]) => addTask.run(plan1, t, i).lastInsertRowid);

  const plan2 = addPlan.run(survivor2, clinician, 'Recovery plan').lastInsertRowid;
  const tasks2 = [
    ['Walking practice', 'Walk with your helper, as written in your plan.'],
    ['Medicines', 'Take your medicines as written on your medicine list.'],
  ].map(([t, i]) => addTask.run(plan2, t, i).lastInsertRowid);

  const addLog = db.prepare('INSERT OR IGNORE INTO task_logs (task_id, user_id, done_on) VALUES (?, ?, ?)');
  for (let d = 6; d >= 1; d--) {
    const date = daysAgoDate(d);
    addLog.run(tasks1[0], survivor, date);
    addLog.run(tasks1[3], survivor, date);
    if (d % 2 === 0) addLog.run(tasks1[1], survivor, date);
    if (d % 3 !== 0) addLog.run(tasks1[2], survivor, date);
  }
  for (let d = 3; d >= 1; d--) {
    addLog.run(tasks2[1], survivor2, daysAgoDate(d));
  }
  addLog.run(tasks1[0], survivor, today());

  const addCheckin = db.prepare('INSERT INTO checkins (user_id, answers, note, created_at) VALUES (?, ?, ?, ?)');
  addCheckin.run(
    survivor,
    JSON.stringify({ Q1: 'About the same', Q2: 'No', Q3: 'Completed as planned', Q7: 'Okay', Q8: 7, Q10: { medicines: 'All', tasks: 'Some' } }),
    'Felt tired after walking practice. Question for the doctor: can my helper join the next visit?',
    atUtc(2, 18)
  );
  addCheckin.run(
    survivor,
    JSON.stringify({ Q1: 'A little better', Q2: 'No', Q3: 'Partly completed', Q7: 'Good', Q8: 8, Q10: { medicines: 'All', tasks: 'All' } }),
    null,
    atUtc(1, 18)
  );
  addCheckin.run(
    survivor2,
    JSON.stringify({ Q1: 'About the same', Q2: 'No', Q7: 'Low', Q8: 6, Q10: { medicines: 'All', tasks: 'Some' } }),
    'Sleeping less this week.',
    atUtc(1, 19)
  );

  const addEdu = db.prepare('INSERT INTO education_items (language, title, body, source, reviewed_on, reviewer, status) VALUES (?, ?, ?, ?, NULL, NULL, ?)');
  for (const item of EDUCATION) addEdu.run('en', item.title, item.body, SOURCE, 'draft');

  return true;
}
