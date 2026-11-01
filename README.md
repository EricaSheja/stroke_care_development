# StrokeCare

A student prototype that supports stroke recovery beyond the hospital. It has a survivor view, a prevention view and a clinician view, in English, Kinyarwanda and French. Foundations Project, Team StrokeCare, ALU.

**All data is fictional. Do not enter real health information.** The app records and summarises what users enter. It does not diagnose, prescribe or give treatment advice, and it never delays emergency help.

## What is in this repo

Each person pushes their own files, so the history shows who built what.

| Part | What it holds | Owner |
| --- | --- | --- |
| `backend/src/` | Express API, database, sign in, routes, seed data | Axel |
| `backend/src/access.js`, `backend/tests/roles.test.js` | Who may use which route, and the test for it | Kenneth |
| `backend/src/educationContent.js`, `checkinQuestions.js`, `backend/tests/safety.test.js` | Education text, check in questions and the safety tests | Erica |
| `backend/src/hosting.js`, `server.js` | Health check, headers, serving the app, settings | Orion |
| `frontend/` | React app built with Vite | Happy |
| `.github/`, `render.yaml`, `Procfile`, root `package.json` | CI, deploy files, scripts | Orion |
| `docs/` | Roles matrix, architecture, ERD, API list, MVP, test plan, safety, sprint plan, deployment | Owner named at the top of each file |

One service serves both the API and the built frontend, so the whole app has one public link.

## Run it on your computer

You need Node 20 or newer.

1. Clone the repo and open a terminal in its folder.
2. Run `npm run install:all` to install backend and frontend packages.
3. Run `npm run build` to build the frontend.
4. Run `npm start` and open http://localhost:3000

For daily development run two terminals: `npm run dev:api` (API on port 3000) and `npm run dev:web` (app on port 5173, which forwards `/api` to the API).

Run the tests with `npm test`.

Until every part has been merged some of these commands will not work yet. The checks on a pull request run the backend and the frontend separately for this reason.

## Demo accounts

The database loads fictional users the first time it starts. The password for every demo account is `demo1234`.

| Role | Email |
| --- | --- |
| Stroke survivor | survivor@demo.test |
| Second survivor | survivor2@demo.test |
| Prevention user | prevention@demo.test |
| Clinician | clinician@demo.test |

Set `SEED_DEMO=false` to start with an empty database.

## How we work

1. Pick a Trello card and move it to In progress.
2. Create a branch from main named `feature/` plus a short word, for example `feature/bpchart`. Use your own name and email in git so the commits are yours: `git config user.name` and `git config user.email`.
3. Make small commits. Pull often.
4. Open a pull request. The template asks for the Trello card and how to test. The checks backend and frontend must pass, and one teammate approves (see the reviewer list in `docs/deployment.md`).
5. Merge to main. The host deploys main automatically.

Never commit secrets, real health data or the `.env` file.

## Safety rules

* No diagnosis, no prescribing, no treatment advice, no colour coded readings.
* No emergency phone number appears anywhere until a clinician has verified it and the source is written down.
* Education text, check in questions, translations and any threshold need clinical review before they are used with real people.
* See `docs/safety.md`.
