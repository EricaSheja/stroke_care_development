# Database structure

Owner: Axel, with Kenneth. This matches `backend/src/db.js`. If you change one, change the other.

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ BP_READINGS : logs
  USERS ||--o{ CHECKINS : submits
  USERS ||--o{ TASK_LOGS : ticks
  USERS ||--o| RECOVERY_PLANS : "has one as patient"
  USERS ||--o{ CLINICIAN_PATIENTS : "clinician side"
  RECOVERY_PLANS ||--o{ PLAN_TASKS : contains
  PLAN_TASKS ||--o{ TASK_LOGS : "ticked on a day"
  USERS {
    int id PK
    text name
    text email UK
    text password_hash
    text role
    text consent_at
  }
  BP_READINGS {
    int id PK
    int user_id FK
    int systolic
    int diastolic
    int pulse
    text taken_at
  }
  RECOVERY_PLANS {
    int id PK
    int patient_id FK
    int clinician_id FK
    text title
  }
  PLAN_TASKS {
    int id PK
    int plan_id FK
    text title
    text instructions
  }
  TASK_LOGS {
    int id PK
    int task_id FK
    int user_id FK
    text done_on
  }
  CHECKINS {
    int id PK
    int user_id FK
    text answers
    text note
    text created_at
  }
  EDUCATION_ITEMS {
    int id PK
    text language
    text title
    text body
    text source
    text reviewed_on
    text reviewer
    text status
  }
```

## Decisions

* **Consent** is a `consent_at` column on `users` for now. A separate consent table with versions is Planned.
* **Roles** are a column on `users`. The check allows `admin`, but no admin screen exists yet.
* **Passwords** are stored as a salted scrypt hash, never as text.
* **Sessions** are random tokens with an expiry date, stored in `sessions`.
* **One active plan per patient.** `recovery_plans.patient_id` is unique. Plan history is Planned.
* **Task ticks** are one row per task per day. The pair `(task_id, done_on)` is unique.
* **Check in answers** are stored as JSON text so the ten questions can change without a new table.
* **Personal data fields:** `name`, `email`, readings, check in answers and notes. Treat these as personal data when real data is ever used.

## Planned tables, not created yet

`caregiver_links`, `alerts`, `appointments`, `audit_log`, `emergency_contacts`, `reminders`
