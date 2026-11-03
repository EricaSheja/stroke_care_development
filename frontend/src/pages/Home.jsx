import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth, useLang } from '../context.jsx';
import Clinician from './Clinician.jsx';

// Home screen: an overview for survivors and prevention users, the patient summary for clinicians. Owner: Happy.
function Overview() {
    const { user } = useAuth();
    const { t, lang } = useLang();
    const [latest, setLatest] = useState(undefined);
    const [plan, setPlan] = useState(undefined);

    useEffect(() => {
        api('/readings').then((d) => setLatest(d.readings[0] || null)).catch(() => setLatest(null));
        if (user.role === 'survivor') api('/plan').then((d) => setPlan(d.plan)).catch(() => setPlan(null));
    }, [user.role]);

    const done = plan ? plan.tasks.filter((x) => x.done_today).length : 0;
    const when = latest ? new Date(latest.taken_at).toLocaleString(lang === 'rw' ? 'en-GB' : lang) : '';

    return (
        <>
            <h1>{t('welcome')}, {user.name}</h1>
            <div className="grid">
                <section className="card">
                    <h2>{t('latest_reading')}</h2>
                    {latest ? (
                        <>
                            <p className="big">{latest.systolic} / {latest.diastolic}</p>
                            <p className="muted">{when}</p>
                        </>
                    ) : <p className="muted">{t('no_readings')}</p>}
                    <Link className="btn" to="/bp">{t('go_log')}</Link>
                </section>

                {user.role === 'survivor' && (
                    <>
                        <section className="card">
                            <h2>{t('tasks_today')}</h2>
                            <p className="big">{plan ? `${done} / ${plan.tasks.length}` : '0'}</p>
                            <Link className="btn" to="/plan">{t('open_plan')}</Link>
                        </section>
                        <section className="card">
                            <h2>{t('checkin_title')}</h2>
                            <p className="muted">{t('checkin_intro')}</p>
                            <Link className="btn" to="/checkin">{t('do_checkin')}</Link>
                        </section>
                    </>
                )}
            </div>
        </>
    );
}

export default function Home() {
    const { user } = useAuth();
    return user.role === 'clinician' ? <Clinician /> : <Overview />;
}