import { useState } from 'react';
import { api } from '../api.js';
import { useAuth, useLang } from '../context.jsx';
import { LanguageSelect, SafetyBanner } from '../components/Layout.jsx';

// Consent screen shown once after sign up. Owner: Happy, text reviewed by Erica. The API refuses data routes until accepted.
export default function Consent() {
    const { setUser, logout } = useAuth();
    const { t } = useLang();
    const [error, setError] = useState('');

    async function accept() {
        try {
            const data = await api('/auth/consent', { method: 'POST', body: { accepted: true } });
            setUser(data.user);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="app">
            <header className="header">
                <div className="brand"><strong>{t('app_name')}</strong></div>
                <div className="header-actions"><LanguageSelect /><button className="btn ghost" onClick={logout}>{t('log_out')}</button></div>
            </header>
            <SafetyBanner />
            <main className="main narrow">
                <h1>{t('consent_title')}</h1>
                <div className="card"><p>{t('consent_text')}</p></div>
                {error && <p className="error" role="alert">{error}</p>}
                <button className="btn primary" onClick={accept}>{t('consent_agree')}</button>
            </main>
        </div>
    );
}
