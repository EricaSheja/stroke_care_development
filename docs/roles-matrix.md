# Roles and permissions matrix

Owner: Kenneth. Draft written to match the code. Check every cell, then update `backend/tests/roles.test.js` if you change one.

| Action | Prevention user | Stroke survivor | Clinician | Caregiver (Planned) | Admin (Planned) |
| --- | --- | --- | --- | --- | --- |
| Sign up on their own | Yes | Yes | No, created by an admin | Planned | No |
| Accept the consent screen | Yes | Yes | Not needed in the demo | Planned | Not needed |
| Log own blood pressure | Yes | Yes | No | No | No |
| See own blood pressure history | Own | Own | No | Only if the survivor shares | No |
| See own recovery plan | No | Own | No | Only if the survivor shares | No |
| Tick plan tasks | No | Own | No | Planned, only if shared | No |
| Daily check in | No | Own | No | Planned | No |
| Read education items | Yes | Yes | Yes | Yes | Manage content (Planned) |
| See a 7 day summary | No | No | Linked patients only | No | No |
| Add a task to a plan | No | No | Linked patients only | No | No |
| See another person's health data | No | No | Linked patients only | Only what the survivor shares | No, content only |

## Rules

1. A caregiver sees only what the survivor chooses to share. Caregivers are Planned.
2. A clinician sees only patients linked to them.
3. An admin manages content and users and cannot read health data. Admin is Planned.
4. The API checks the role on every route. Hiding a button in the app is never the control.
5. Clinician accounts are created by an admin. Nobody can sign up as a clinician.

## Where the code enforces it

* `backend/src/auth.js`: `authMiddleware`, `requireRole`, `requireConsent`
* Each file in `backend/src/routes/`: the first lines call `r.use(auth, requireRole(...))`
* `backend/tests/roles.test.js`: one row per route, one column per role
