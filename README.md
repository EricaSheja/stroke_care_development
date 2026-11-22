<!-- Owner: Malaika Elohim Isingizwe Mukama (Scrum Master) -->
# StrokeCare

Stroke prevention and recovery at home, for Rwanda, in English, Kinyarwanda and French.
For stroke survivors, prevention users, caregivers, clinicians and community health workers.
**It records and summarises what people enter. It never diagnoses, prescribes, scores risk, or delays emergency care.**

Team 3 · Foundations Project · ALU. This repository held the team's first prototype; it now holds version 2. The prototype is still in the history.

**Live demo:** https://strokecare-8qyk.onrender.com (fictional data only — see [Demo accounts](#demo-accounts) below).

## What it does

| For | Features |
|---|---|
| Survivors and prevention users | Today screen with seven-day metric cards (blood pressure, pulse, movement, doses, check-ins, plan tasks), daily check-in (a Yes to new or worse symptoms shows emergency guidance at once and offers a symptom checklist plus free text), blood pressure with a chart, medicine ticks, talk board for aphasia, questions and voice notes for the next visit, care-team messages, care calendar, Learn (nine topics, draft articles and videos), personal emergency contacts, accessibility settings, data download and deletion |
| Caregivers | Alerts (urgent answer, doses not marked, no check-in), the same metric cards and Learn content for the person they care for, act on the person's behalf, family care calendar with handover notes, messages |
| Clinicians | Caseload with "needs a look" filters (facts only), seven-day summary, write the recovery plan and medicine list, plan templates, listen to voice notes, messages |
| Community health workers | People who invited them, home visits recorded offline and sent later, readings during visits |
| Emergency help | A verified local emergency number (never in the code — added only through `add_emergency_contact`, see below) shown with one tap to call, plus each person's own saved contacts (e.g. a relative) to call |
| Learn | Nine stroke topics with draft articles and short videos (played in YouTube's privacy-respecting embed, loaded only after a tap), each one marked with its source and review status |
| Everyone, signed in or not | Emergency help, talk board, Learn |

## Stack

| Layer | Choice |
|---|---|
| Backend | Django 5.2 + Django REST Framework, Python 3.13 |
| Database | PostgreSQL 16 (no SQLite anywhere; voice notes are stored in PostgreSQL too) |
| Auth | bcrypt password hashes, 15-minute JWT access tokens, rotating refresh tokens revoked on the server |
| Frontend | Plain HTML, CSS and JavaScript: no framework, no packages, no build step. Phosphor icons drawn inline, plain-SVG charts; installable PWA that works offline |
| Jobs | `run_scheduler` worker, or a guarded HTTP endpoint called by GitHub Actions every 15 minutes (`.github/workflows/scheduler.yml`) |
| Tests | pytest (backend), Node's built-in test runner (frontend), plus a browser run of every role's main flows in the build session |
| Delivery | GitHub Actions (backend + frontend checks), one Docker image serving the API and the app |

## Run it locally

You need Docker Desktop. From the repository root:

```bash
docker compose up --build -d     # PostgreSQL + app + scheduler worker on http://localhost:8000
docker compose exec web python manage.py seed_demo --password 'admin@2025!'
docker compose exec web python manage.py add_emergency_contact --region Rwanda --label "SAMU ambulance" \
    --kind ambulance --phone 912 --verified-by "Emmanuel Happy Rangira"
```

The first command builds the image, creates the database, runs the migrations and loads the reference content
(check-in questions, talk board, Learn topics, notes and videos). The second creates the fictional demo accounts.
The third adds the verified emergency number: numbers are never in the code (`docs/SAFETY.md`, rule 4) — this
command is how any new environment gets one, with the name of whoever checked it. Stop with `docker compose down`;
add `-v` to also delete the database.

Without installing anything on your computer, use GitHub Codespaces: [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/EricaSheja/stroke_care_development). It builds a cloud workspace with PostgreSQL, loads fictional demo data and starts the app on port 8000. See [`.devcontainer/README.md`](.devcontainer/README.md).

Quickest way without Docker (one server, app and API together). You need Python 3.13 and a PostgreSQL 16 you can reach. Nothing to build for the web app: it is plain files in `frontend/site`, and Django serves them. Create the database once:

```bash
psql -U postgres -c "CREATE USER strokecare PASSWORD 'strokecare' CREATEDB" -c "CREATE DATABASE strokecare OWNER strokecare"
```

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export DJANGO_DEBUG=1 ALLOW_DEMO_DATA=1 DATABASE_URL=postgres://strokecare:strokecare@localhost:5432/strokecare
python manage.py migrate
python manage.py seed_demo --password 'choose-a-demo-password'
python manage.py runserver                      # open http://localhost:8000
```

To change the web app, edit a file under `frontend/site/` and reload the page: there is no build and no dev server to run. After adding, removing or changing a file there, refresh the offline file list with `python tools/make_precache.py` (a test and CI fail if it is out of date). API docs are at `/api/v1/docs/`.

```bash
cd backend && pytest              # backend tests; needs DATABASE_URL
cd frontend && npm test           # frontend tests; needs Node 22 or newer, installs nothing
python tools/make_precache.py --check
```

### Demo accounts

`seed_demo` creates one fictional account per role, all with the password you gave it. On the live demo above, the
password is `admin@2025!`.

| Email | Role |
|---|---|
| `demo-survivor@example.org` | Stroke survivor |
| `demo-prevention@example.org` | Prevention user |
| `demo-caregiver@example.org` | Caregiver |
| `demo-clinician@example.org` | Clinician |
| `demo-chw@example.org` | Community health worker |
| `demo-admin@example.org` | Administrator / content reviewer |

The data is fictional and must never be used with real people.

## Deployed version

The live demo runs on Render's free tier from this repository's `master` branch, one Docker image serving both the
API and the web app (same image as local Docker, `DATABASE_URL`/`DJANGO_SECRET_KEY`/etc. set as Render environment
variables). Two notes specific to that host:

- The free web service sleeps after 15 minutes idle (next request takes ~30–50s to wake it); `.github/workflows/keepalive.yml` pings `/healthz` every 10 minutes to keep it awake, once its `STROKECARE_URL` repository secret is set.
- Render's free PostgreSQL instance expires after a set number of days — a pilot/demo database, not a permanent one.

For other hosting options (a single server, or Oracle Cloud's free tier), see `docs/DEPLOYMENT.md`,
`docs/HOSTING_PILOT.md` and `docs/DEPLOY_ORACLE.md`.

## Where things are

| | |
|---|---|
| `backend/apps/accounts` | users, consent, accessibility preferences, sign-in, personal emergency contacts |
| `backend/apps/care` | sharing links, caregiver alerts, the scheduler |
| `backend/apps/health` | blood pressure, plan, check-in (with the symptom checklist), medicines, visit questions, voice notes, summary, reminders |
| `backend/apps/recovery` | goals, clinician-set recovery stages, movement log, the seven-day metric data behind the week cards |
| `backend/apps/messaging`, `family`, `community` | care-team messages; care calendar and handover notes; CHW home visits |
| `backend/apps/content` | Learn (topics, articles, videos), emergency guidance and verified contacts (`add_emergency_contact` management command), talk board |
| `backend/apps/common`, `audit` | the single access-control module, error format, audit log |
| `frontend/site` | the web app, plain HTML, CSS and JavaScript (`js/views/` has the screens, `js/components/metric-card.js` the week cards, `locales/` the three languages); `frontend/tests` its tests; see `frontend/README.md` |
| `docs/` | architecture, roles matrix, safety rules, data model, deployment, **open questions and launch blockers** |
| `OWNERS.json` | who owns which file (`python tools/make_handoff.py --check`) |

**Before this goes near real people, read `docs/OPEN_QUESTIONS.md`.** Several launch blockers are not code.
