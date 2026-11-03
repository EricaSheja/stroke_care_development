import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context.jsx';

// Daily check in with ten questions and a note. Owner: Happy.
// Questions are English only and draft until a clinician reviews them. Any question can be skipped.
const SKIPPED = 'skipped';

function Choice({ options, value, onChange, name, disabled }) {
    return (
        <div className="options" role="radiogroup">
            {options.map((o) => (
                <label key={o} className={`chip ${value === o ? 'on' : ''}`}>
                    <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} disabled={disabled} />
                    {o}
                </label>
            ))}
        </div>
    );
}

export default function CheckIn() {
    const { t } = useLang();
    const [questions, setQuestions] = useState(null);
    const [answers, setAnswers] = useState({});
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        api('/checkins/questions').then((d) => setQuestions(d.questions)).catch((e) => setError(e.message));
    }, []);

    const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
    const skip = (id) => setAnswers((a) => (a[id] === SKIPPED ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== id)) : { ...a, [id]: SKIPPED }));

    async function submit(e) {
        e.preventDefault();
        setError('');
        try {
            setResult(await api('/checkins', { method: 'POST', body: { answers, note } }));
        } catch (err) {
            setError(err.message);
        }
    }

    if (result) {
        return (
            <>
                <h1>{t('checkin_title')}</h1>
                {result.urgent_guidance && <div className="alert" role="alert"><h2>{t('emergency_title')}</h2><p>{t('emergency_text')}</p></div>}
                <p className="ok" role="status">{t('thanks')}</p>
            </>
        );
    }

    if (!questions) return <p>{error || `${t('loading')}...`}</p>;

    return (
        <>
            <h1>{t('checkin_title')}</h1>
            <p className="muted">{t('checkin_intro')}</p>
            <form onSubmit={submit}>
                {questions.map((q) => {
                    const value = answers[q.id];
                    const skipped = value === SKIPPED;
                    return (
                        <fieldset key={q.id} className="card">
                            <legend>{q.text}</legend>
                            {q.kind === 'choice' && <Choice name={q.id} options={q.options} value={value} onChange={(v) => setAnswer(q.id, v)} disabled={skipped} />}
                            {q.kind === 'number' && (
                                <label>{t('hours')}
                                    <input type="number" min={q.min} max={q.max} step="0.5" value={skipped ? '' : value ?? ''} disabled={skipped}
                                        onChange={(e) => setAnswer(q.id, e.target.value)} />
                                </label>
                            )}
                            {q.kind === 'dual' && q.fields.map((f) => (
                                <div key={f.key}>
                                    <p className="field-label">{f.label}</p>
                                    <Choice name={`${q.id}${f.key}`} options={f.options} value={skipped ? undefined : value?.[f.key]} disabled={skipped}
                                        onChange={(v) => setAnswer(q.id, { ...(typeof value === 'object' ? value : {}), [f.key]: v })} />
                                </div>
                            ))}
                            <button type="button" className="btn ghost small" onClick={() => skip(q.id)}>{skipped ? t('skipped') + ' · ' + t('undo') : t('skip')}</button>
                        </fieldset>
                    );
                })}
                <label className="card block">{t('note_label')}
                    <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
                </label>
                {error && <p className="error" role="alert">{error}</p>}
                <button className="btn primary">{t('submit')}</button>
            </form>
        </>
    );
}