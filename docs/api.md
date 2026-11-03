# API endpoints

Owner: Axel. All paths start with `/api`. Every route except health, register and login needs `Authorization: Bearer <token>`.

| Method | Path | Who may call it | What it does | Status |
| --- | --- | --- | --- | --- |
| GET | `/health` | Anyone | Health check for the host | Built |
| POST | `/api/auth/register` | Anyone | Create a survivor or prevention account | Built |
| POST | `/api/auth/login` | Anyone | Sign in and receive a token | Built |
| POST | `/api/auth/logout` | Signed in | End the session | Built |
| GET | `/api/auth/me` | Signed in | Current user | Built |
| POST | `/api/auth/consent` | Signed in | Accept the consent screen | Built |
| GET | `/api/readings` | Survivor, prevention user | Own blood pressure history | Built |
| POST | `/api/readings` | Survivor, prevention user | Save a reading | Built |
| GET | `/api/plan` | Survivor | Own recovery plan with today's ticks | Built |
| POST | `/api/plan/tasks/:id/log` | Survivor | Mark a task done today | Built |
| DELETE | `/api/plan/tasks/:id/log` | Survivor | Undo today's tick | Built |
| GET | `/api/checkins/questions` | Survivor | The ten questions | Built |
| GET | `/api/checkins` | Survivor | Own recent check ins | Built |
| POST | `/api/checkins` | Survivor | Save a check in with a note | Built |
| GET | `/api/education` | Signed in | Education items with source and review state | Built |
| GET | `/api/patients` | Clinician | Linked patients | Built |
| POST | `/api/patients/:id/plan/tasks` | Clinician | Add a task to a linked patient's plan | Built |
| GET | `/api/summary` | Clinician | Descriptive 7 day summary per linked patient | Built |
| GET | `/api/alerts` | Clinician | Alerts about patients | Planned |
| POST | `/api/emergency` | Survivor | Notify verified contacts | Planned |

## Rules every route follows

1. The role is checked first. The consent check follows for patient data.
2. Input is validated. A bad request returns 400 with a plain sentence the app can show.
3. A user can only touch their own rows. A patient id from another user returns 404.
4. Responses never include `password_hash`.
5. The summary counts, averages and quotes. It never labels, scores or advises.
6. Readings limits only catch typing mistakes. They are not clinical thresholds.
