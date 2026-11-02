import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context.jsx';

// Blood pressure log and history. Owner: Happy.
// There is no colour coding or "high / low" label on purpose: thresholds need clinical review first.
const EMPTY = { systolic: '', diastolic: '', pulse: '', note: '' };

export default function BloodPressure() {
    const { t, lang } = useLang();
    const [form, setForm] = useState(EMPTY);
    const [readings, setReadings] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const load = () => api('/readings').then((d) => setReadings(d.readings)).catch((e) => setError(e.message));
    useEffect(() => { load(); }, []);

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await api('/readings', { method: 'POST', body: form });
            setForm(EMPTY);
            setMessage(t('saved'));
            load();
        } catch (err) {
            setError(err.message);
        }
    }

    const locale = lang === 'rw' ? 'en-GB' : lang;

    return (
        <>
            <h1>{t('bp_title')}</h1>
            <p className="muted">{t('bp_disclaimer')}</p>
            <form className="card form" onSubmit={onSubmit}>
                <div className="row">
                    <label>{t('systolic')}<input inputMode="numeric" value={form.systolic} onChange={set('systolic')} required /></label>
                    <label>{t('diastolic')}<input inputMode="numeric" value={form.diastolic} onChange={set('diastolic')} required /></label>
                    <label>{t('pulse')}<input inputMode="numeric" value={form.pulse} onChange={set('pulse')} /></label>
                </div>
                <label>{t('note')}<input value={form.note} onChange={set('note')} maxLength={300} /></label>
                {error && <p className="error" role="alert">{error}</p>}
                {message && <p className="ok" role="status">{message}</p>}
                <button className="btn primary">{t('save')}</button>
            </form>

            <h2>{t('history')}</h2>
            {readings === null ? <p>{t('loading')}...</p> : readings.length === 0 ? <p className="muted">{t('no_readings')}</p> : (
                <div className="table-wrap">
                    <table>
                        <thead><tr><th></th><th>{t('systolic')}</th><th>{t('diastolic')}</th><th>{t('pulse')}</th></tr></thead>
                        <tbody>
                            {readings.map((r) => (
                                <tr key={r.id}>
                                    <td>{new Date(r.taken_at).toLocaleString(locale)}</td>
                                    <td>{r.systolic}</td><td>{r.diastolic}</td><td>{r.pulse ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}