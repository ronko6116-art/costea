// src/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Demo from './Demo';
import LoginModal from '../../contexts/LoginModal';

export default function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  const openLogin = () => setAuthModal({ open: true, mode: 'login' });
  const openSignup = () => setAuthModal({ open: true, mode: 'signup' });
  const closeAuth = () => setAuthModal((s) => ({ ...s, open: false }));

  const handleDashboard = () => navigate('/dashboard');

  return (
    <div className="min-h-screen bg-cream">
      <Navbar
        onLoginClick={openLogin}
        onSignupClick={openSignup}
        isLoggedIn={!!session}
        onDashboardClick={handleDashboard}
      />
      <Demo onLoginClick={openLogin} onSignupClick={openSignup} />
      <LoginModal open={authModal.open} onClose={closeAuth} initialMode={authModal.mode} />
    </div>
  );
}