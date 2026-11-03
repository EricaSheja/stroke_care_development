// Access rules: who may use which route. Owner: Kenneth (System Architect).
// These two checks run after sign in. They are the code form of docs/roles-matrix.md.
// If you change a rule, change the matrix and backend/tests/roles.test.js together.

// Roles are survivor, prevention and clinician. Clinicians are created by an admin, never by sign up.
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Your role cannot do this.' });

// Survivors and prevention users must accept the consent screen before any data route works.
// Clinicians are linked to patients by an admin, so the consent screen does not apply to them.
export const requireConsent = (req, res, next) =>
  req.user.consent_at || req.user.role === 'clinician'
    ? next()
    : res.status(403).json({ error: 'Please accept the consent screen first.', code: 'consent_required' });
