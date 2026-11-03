import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context.jsx';

// Survivor view of the recovery plan written by the clinician. Owner: Happy.
export default function Plan() {
    const { t } = useLang();
    const [plan, setPlan] = useState(undefined);
    const [error, setError] = useState('');

    const load = () => api('/plan').then((d) => setPlan(d.plan)).catch((e) => setError(e.message));
    useEffect(() => { load(); }, []);

    async function toggle(task) {
        setError('');
        try {
            await api(`/plan/tasks/${task.id}/log`, { method: task.done_today ? 'DELETE' : 'POST' });
            load();
        } catch (err) {
            setError(err.message);
        }
    }

    if (plan === undefined) return <p>{t('loading')}...</p>;

    return (
        <>
            <h1>{t('plan_title')}</h1>
            {error && <p className="error" role="alert">{error}</p>}
            {!plan ? <p className="muted">{t('plan_empty')}</p> : (
                <>
                    <p className="muted">{t('written_by')} {plan.clinician_name}</p>
                    <ul className="tasks">
                        {plan.tasks.map((task) => (
                            <li key={task.id} className={`card task ${task.done_today ? 'done' : ''}`}>
                                <div>
                                    <h2>{task.title}</h2>
                                    {task.instructions && <p>{task.instructions}</p>}
                                </div>
                                <button className={`btn ${task.done_today ? '' : 'primary'}`} onClick={() => toggle(task)}>
                                    {task.done_today ? `${t('done_today')} · ${t('undo')}` : t('mark_done')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </>
    );
}