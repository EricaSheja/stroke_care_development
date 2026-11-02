import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, useLang } from './context.jsx';
import Layout from './components/Layout.jsx';
import Auth from './pages/Auth.jsx';
import Consent from './pages/Consent.jsx';
import Home from './pages/Home.jsx';
import BloodPressure from './pages/BloodPressure.jsx';
import Plan from './pages/Plan.jsx';
import CheckIn from './pages/CheckIn.jsx';
import Education from './pages/Education.jsx';

// Route map. Owner: Happy. Role rules here only hide screens. The API enforces the real permissions.
const SURVIVOR_ONLY = ['survivor'];
const PATIENT_ROLES = ['survivor', 'prevention'];

function Guard({ roles, children }) {
    const { user } = useAuth();
    return roles.includes(user.role) ? children : <Navigate to="/" replace />;
}

function RequireAuth() {
    const { user, loading } = useAuth();
    const { t } = useLang();
    if (loading) return <p className="center">{t('loading')}...</p>;
    if (!user) return <Navigate to="/login" replace />;
    if (!user.consent_at && user.role !== 'clinician') return <Consent />;
    return <Layout />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Auth />} />
            <Route element={<RequireAuth />}>
                <Route index element={<Home />} />
                <Route path="bp" element={<Guard roles={PATIENT_ROLES}><BloodPressure /></Guard>} />
                <Route path="plan" element={<Guard roles={SURVIVOR_ONLY}><Plan /></Guard>} />
                <Route path="checkin" element={<Guard roles={SURVIVOR_ONLY}><CheckIn /></Guard>} />
                <Route path="learn" element={<Education />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}