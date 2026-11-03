import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context.jsx';

// Clinician view: descriptive 7 day summary per patient and a form to add plan tasks. Owner: Happy.
// The summary counts and averages what patients entered. It never rates risk or suggests treatment.
function AddTask({ patientId, onAdded }) {
    const { t } = useLang();
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [error, setError] = useState('');

    async function submit(e) {
        e.preventDefault();
        setError('');
        try {
            await api(`/patients/${patientId}/plan/tasks`, { method: 'POST', body: { title, instructions } });
            setTitle('');
            setInstructions('');
            onAdded();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <form className="form inline" onSubmit={submit}>
            <h3>{t('add_task')}</h3>
            <label>{t('task_title')}<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
            <label>{t('instructions')}<input value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={400} /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="btn">{t('add')}</button>
        </form>
    );
}

export default function Clinician() {
    const { t, lang } = useLang();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const load = () => api('/summary').then(setData).catch((e) => setError(e.message));
    useEffect(() => { load(); }, []);

    if (!data) return <p>{error || `${t('loading')}...`}</p>;
    const locale = lang === 'rw' ? 'en-GB' : lang;

    return (
        <>
            <h1>{t('summary_title')}</h1>
            <p className="muted">{t('summary_disclaimer')}</p>
            {data.patients.map(({ patient, readings, tasks, checkins }) => (
                <section key={patient.id} className="card">
                    <h2>{patient.name}</h2>
                    <dl className="stats">
                        <div><dt>{t('readings_count')}</dt><dd>{readings.count}</dd></div>
                        <div><dt>{t('average')}</dt><dd>{readings.count ? `${readings.average_systolic} / ${readings.average_diastolic}` : ''}</dd></div>
                        <div><dt>{t('latest')}</dt><dd>{readings.latest ? `${readings.latest.systolic} / ${readings.latest.diastolic}` : ''}</dd></div>
                        <div><dt>{t('tasks_ticked')}</dt><dd>{tasks.done_logs} / {tasks.expected_logs}</dd></div>
                        <div><dt>{t('checkins')}</dt><dd>{checkins.count}</dd></div>
                    </dl>
                    {checkins.notes.length > 0 && (
                        <>
                            <h3>{t('notes')}</h3>
                            <ul>
                                {checkins.notes.map((n) => (
                                    <li key={n.created_at}><span className="muted">{new Date(n.created_at).toLocaleDateString(locale)}</span> {n.note}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    <AddTask patientId={patient.id} onAdded={load} />
                </section>
            ))}
        </>
    );
}