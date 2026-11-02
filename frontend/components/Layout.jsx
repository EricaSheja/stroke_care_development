import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, useLang } from '../context.jsx';
import { LANGS } from '../i18n.js';

// Header, safety banner, navigation and emergency dialog. Owner: Happy.
// The safety banner is on every page. The emergency button opens guidance and shows no phone number:
// a number may appear only after a clinician has verified it (see docs/safety.md).

export function LanguageSelect() {
    const { lang, setLang, t } = useLang();
    return (
        <label className="lang">
            <span className="sr">{t('language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('language')}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
        </label>
    );
}

export function SafetyBanner() {
    const { t } = useLang();
    return <div className="banner" role="note">{t('banner')}</div>;
}

function EmergencyDialog({ onClose }) {
    const { t } = useLang();
    return (
        <div className="overlay" role="presentation" onClick={onClose}>
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="em-title" onClick={(e) => e.stopPropagation()}>
                <h2 id="em-title">{t('emergency_title')}</h2>
                <p>{t('emergency_text')}</p>
                <button className="btn" onClick={onClose} autoFocus>{t('close')}</button>
            </div>
        </div>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const { t } = useLang();
    const [open, setOpen] = useState(false);

    const links = [{ to: '/', label: t('nav_home'), end: true }];
    if (user.role === 'survivor' || user.role === 'prevention') links.push({ to: '/bp', label: t('nav_bp') });
    if (user.role === 'survivor') {
        links.push({ to: '/plan', label: t('nav_plan') });
        links.push({ to: '/checkin', label: t('nav_checkin') });
    }
    links.push({ to: '/learn', label: t('nav_education') });

    return (
        <div className="app">
            <header className="header">
                <div className="brand">
                    <strong>{t('app_name')}</strong>
                </div>
                <div className="header-actions">
                    <LanguageSelect />
                    <button className="btn danger" onClick={() => setOpen(true)}>{t('emergency')}</button>
                    <button className="btn ghost" onClick={logout}>{t('log_out')}</button>
                </div>
            </header>
            <SafetyBanner />
            <nav className="nav" aria-label="Main">
                {links.map((l) => (
                    <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>{l.label}</NavLink>
                ))}
            </nav>
            <main className="main"><Outlet /></main>
            <footer className="footer">{t('footer')}</footer>
            {open && <EmergencyDialog onClose={() => setOpen(false)} />}
        </div>
    );
}