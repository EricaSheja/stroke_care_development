# Safety boundary

Owner: Erica

## The boundary

1. The app does not diagnose, prescribe or give treatment advice.
2. The app never delays emergency help. The safety banner is on every page and the emergency button is always visible.
3. Prototype data is fictional. Nobody enters real health information.
4. Readings are shown as numbers only. No colour coding, no good or bad labels, no alerts.
5. The clinician summary only counts, averages and quotes what the patient entered.
6. No clinical content, threshold, question or emergency number goes live without review by a qualified clinician.

## Waiting for clinical review

| Item | Where it lives | State |
| --- | --- | --- |
| Education text and sources | `backend/src/educationContent.js` | Draft |
| Ten check in questions | `backend/src/checkinQuestions.js` | Draft |
| Urgent answers that show emergency guidance (Q2, Q5, Q6) | `backend/src/checkinQuestions.js` | Draft |
| Safety banner and emergency text in three languages | `frontend/src/i18n.js` | Needs a fluent speaker and a clinician |
| Blood pressure thresholds | Nowhere in the code | Not built on purpose |
| Emergency phone numbers | Nowhere in the code | Not built on purpose. Add one only after a clinician verifies it and the source is written here. |

## Verified emergency contacts

None yet. When a clinician verifies a number, record it below with the source, the person who verified it, and the date. Then, and only then, add it to the app.

| Number | Service | Source | Verified by | Date |
| --- | --- | --- | --- | --- |
| | | | | |

## Privacy

* Fictional data only in the demo. The demo database is rebuilt on every deploy.
* Passwords are hashed. Sessions expire after 7 days.
* Before any real data: encryption at rest, a hosting location that fits Rwanda's personal data protection law, reviewed consent text, an audit log and backups. All of these are Planned.