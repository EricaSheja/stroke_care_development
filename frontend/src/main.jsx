import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider, LangProvider } from './context.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <LangProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </LangProvider>
        </BrowserRouter>
    </StrictMode>
);