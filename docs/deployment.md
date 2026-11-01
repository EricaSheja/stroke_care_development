# Deployment

Owner: Orion. One web service serves the API and the built frontend, so there is one public link.

## Environments

| Environment | Where | Data | Status |
| --- | --- | --- | --- |
| Local | Each person's computer | Fictional demo data | Built |
| Dev, public link | Free hosting tier, deploys from main | Fictional demo data, rebuilt on every deploy | Built once Orion deploys it |
| Production | Not chosen | Real data would need compliance work first | Planned |

## Settings

| Variable | Meaning | Default |
| --- | --- | --- |
| `PORT` | Port the service listens on. Hosts set it for you. | 3000 |
| `DB_FILE` | Path to the SQLite file. Use `:memory:` for a throwaway database. | `backend/data/strokecare.db` |
| `SEED_DEMO` | `true` loads fictional users when the database is empty. | `true` |
| `FRONTEND_DIR` | Folder with the built frontend. | `frontend/dist` |

Secrets go in the host's environment settings, never in the repo. The demo needs no secret.

## Deploy on Render (blueprint included)

1. In Render choose New, then Blueprint, and select this repo. It reads `render.yaml`.
2. Build command: `npm run install:all && npm run build`. Start command: `npm start`. Health check path: `/health`.
3. Turn on auto deploy from main.
4. Open the public link on a phone using mobile data and sign in with a demo account.

## Deploy on Heroku or another Node host

The `Procfile` and the `heroku-postbuild` script in the root `package.json` build the frontend and start the server. The GitHub Student Pack gives Heroku credit.

## Free tier behaviour

Free services sleep when idle, so the first request after a pause is slow and the demo database is rebuilt. Open the link and the `/health` page 10 minutes before presenting, and again at 08:30 on Tuesday.

## Pipeline

`.github/workflows/ci.yml` has two checks on every pull request and every push to main. The check named `backend` installs packages and runs `npm test` in `backend/`. The check named `frontend` installs packages and builds `frontend/`. A check passes without running when its folder has not been pushed yet, so parts can land one at a time. A red check means do not merge.

## Branch rules (set in GitHub, Settings, Branches)

* Protect `main`. Require a pull request, one approval and the two checks `backend` and `frontend`.
* Reviewers: Kenneth and Axel review each other, Axel reviews Happy, Malaika and Erica review each other, Kenneth reviews Orion.
* Work on short branches named `feature/` plus a short word.
* Tag the demo release `v0.1` on Monday at 18:30.

## Security controls and their status

| Control | Status |
| --- | --- |
| HTTPS from the host | Built |
| Secrets in environment settings, none in the repo | Built |
| Pull request review and CI | Built |
| Passwords hashed with scrypt, sessions expire | Built |
| Role checked on every API route, tested | Built |
| Parameterised database queries | Built |
| Login rate limit | Planned. Axel has a stretch task for it. Change this row to Built when it is merged. |
| Encryption at rest, backups, monitoring | Planned |
| Audit log | Planned |
| Hosting location that fits Rwanda's data protection law | Planned, needed before any real data |

## Fallback if the live link fails

1. Venue wifi, then the phone hotspot.
2. Run it locally with `npm run install:all`, `npm run build`, `npm start`.
3. Play the recorded video of the demo script.
4. Show the screenshots in the backup slides.

If the live link has not loaded after 20 seconds, move down one step without apology.
