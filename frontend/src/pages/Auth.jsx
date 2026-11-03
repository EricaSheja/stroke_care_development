import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth, useLang } from '../context.jsx';
import { LanguageSelect, SafetyBanner } from '../components/Layout.jsx';

// Sign in and sign up. Owner: Happy. Demo accounts are fictional and exist only in the seeded demo database.
const DEMOS = [
    { key: 'demo_survivor', email: 'survivor@demo.test' },
    { key: 'demo_prevention', email: 'prevention@demo.test' },
    { key: 'demo_clinician', email: 'clinician@demo.test' },
];
const DEMO_PASSWORD = 'demo1234';

export default function Auth() {
    const { user, signIn } = useAuth();
    const { t } = useLang();
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'survivor' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    async function submit(path, body) {
        setBusy(true);
        setError('');
        try {
            signIn(await api(path, { method: 'POST', body }));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const onSubmit = (e) => {
        e.preventDefault();
        if (mode === 'login') submit('/auth/login', { email: form.email, password: form.password });
        else submit('/auth/register', form);
    };

    return (
        <div className="app">
            <header className="header">
                <div className="brand"><strong>{t('app_name')}</strong></div>
                <div className="header-actions"><LanguageSelect /></div>
            </header>
            <SafetyBanner />
            <main className="main narrow">
                <h1>{t('app_name')}</h1>
                <p className="lead">{t('tagline')}</p>

                <div className="tabs" role="tablist">
                    <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{t('sign_in')}</button>
                    <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>{t('create_account')}</button>
                </div>

                <form className="card form" onSubmit={onSubmit}>
                    {mode === 'register' && (
                        <label>{t('name')}<input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={80} /></label>
                    )}
                    <label>{t('email')}<input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
                    <label>{t('password')}<input type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : undefined} /></label>
                    {mode === 'register' && (
                        <label>{t('role')}
                            <select value={form.role} onChange={set('role')}>
                                <option value="survivor">{t('role_survivor')}</option>
                                <option value="prevention">{t('role_prevention')}</option>
                            </select>
                        </label>
                    )}
                    {error && <p className="error" role="alert">{error}</p>}
                    <button className="btn primary" disabled={busy}>{mode === 'login' ? t('sign_in') : t('create_account')}</button>
                </form>

                <section className="card">
                    <h2>{t('demo_title')}</h2>
                    <div className="row">
                        {DEMOS.map((d) => (
                            <button key={d.email} className="btn" disabled={busy} onClick={() => submit('/auth/login', { email: d.email, password: DEMO_PASSWORD })}>{t(d.key)}</button>
                        ))}
                    </div>
                </section>
            </main>
            <footer className="footer">{t('footer')}</footer>
        </div>
    );
}