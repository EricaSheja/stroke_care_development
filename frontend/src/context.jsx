import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import { dict } from './i18n.js';

// Language and signed in user shared across the app. Owner: Happy.

const LangContext = createContext(null);
const AuthContext = createContext(null);

export function LangProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try { return localStorage.getItem('sc_lang') || 'en'; } catch { return 'en'; }
    });
    const setLang = useCallback((code) => {
        setLangState(code);
        try { localStorage.setItem('sc_lang', code); } catch { /* ignore */ }
        document.documentElement.lang = code;
    }, []);
    useEffect(() => { document.documentElement.lang = lang; }, [lang]);
    const value = useMemo(() => ({
        lang,
        setLang,
        t: (key) => dict[lang]?.[key] ?? dict.en[key] ?? key,
    }), [lang, setLang]);
    return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(getToken()));

    useEffect(() => {
        if (!getToken()) return;
        api('/auth/me')
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const onSignedOut = () => setUser(null);
        window.addEventListener('sc:signedout', onSignedOut);
        return () => window.removeEventListener('sc:signedout', onSignedOut);
    }, []);

    const signIn = useCallback((data) => {
        setToken(data.token);
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({ user, setUser, loading, signIn, logout }), [user, loading, signIn, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);