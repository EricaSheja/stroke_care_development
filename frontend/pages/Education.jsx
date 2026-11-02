import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context.jsx';

// Education library. Owner: Happy for the page, Erica for the content and review dates.
// Every item shows its source and whether a clinician has reviewed it.
export default function Education() {
    const { t, lang } = useLang();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api(`/education?lang=${lang}`).then(setData).catch((e) => setError(e.message));
    }, [lang]);

    if (!data) return <p>{error || `${t('loading')}...`}</p>;

    return (
        <>
            <h1>{t('education_title')}</h1>
            {data.fallback && <p className="muted">{t('english_only')}</p>}
            {data.items.map((item) => (
                <article key={item.id} className="card">
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                    <p className="meta">
                        {t('source')}: {item.source}<br />
                        {t('reviewed')}: {item.reviewed_on || t('not_reviewed')}
                    </p>
                </article>
            ))}
        </>
    );
}