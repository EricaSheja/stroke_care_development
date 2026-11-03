# Test plan

Owner: Erica, these are proposed targets and test scenarios. No result here is a clinical result.

## Targets from the proposal

* At least 90% of defined test cases pass.
* At least 80% of selected tasks completed without help.
* A usability score of 70 is considered only if the sample and method suit.

## Automated tests

Run with `npm test`. Each name starts with a scenario code. Add a row here when you add a test.

| Code | What it checks | File |
| --- | --- | --- |
| S01 | Health check answers | `backend/tests/api.test.js` |
| S02 | Sign in works, wrong password refused, hash never returned | `backend/tests/api.test.js` |
| S03 | Sign up works, duplicates refused, nobody can sign up as clinician | `backend/tests/api.test.js` |
| S04 | New account must accept consent first | `backend/tests/api.test.js` |
| S05 | Reading saves and appears in history | `backend/tests/api.test.js` |
| S06 | Impossible numbers rejected | `backend/tests/api.test.js` |
| S07 | Sign in and roles enforced | `backend/tests/api.test.js` |
| S08 | Survivor ticks and unticks a plan task | `backend/tests/api.test.js` |
| S09 | Survivor cannot touch another patient's task | `backend/tests/api.test.js` |
| S10 | Check in saves, skipping allowed, urgent guidance returned | `backend/tests/safety.test.js` |
| S11 | Clinician summary is descriptive only | `backend/tests/safety.test.js` |
| S12 | Clinician adds a task and the survivor sees it | `backend/tests/api.test.js` |
| S13 | Education items show source and draft status | `backend/tests/safety.test.js` |
| R | Role matrix, one test per route | `backend/tests/roles.test.js` |

## Manual usability tasks

Run these with two teammates who did not build the screen. Write what happened in the table. Do not help them unless they are stuck for more than one minute.

| Task | Role | Without help? (Yes or No) | Time taken | What confused them |
| --- | --- | --- | --- | --- |
| U1 Sign in with a demo account and find the latest reading | Survivor | | | |
| U2 Save a blood pressure reading | Survivor | | | |
| U3 Tick today's first plan task | Survivor | | | |
| U4 Skip one check in question and send the check in | Survivor | | | |
| U5 Switch the language to Kinyarwanda and open the emergency dialog | Any | | | |
| U6 Find a patient's notes and add a plan task | Clinician | | | |

## Not tested yet

Real devices on slow networks, screen readers, translation accuracy, clinical content.