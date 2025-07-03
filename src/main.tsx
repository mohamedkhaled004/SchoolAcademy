// ✅ main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './contexts/AuthContext'; // ✅ مهم جداً

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider> {/* ✅ هنا بيحط الـ Provider فوق App كله */}
      <App />
    </AuthProvider>
  </StrictMode>
);
