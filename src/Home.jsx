import { useState } from 'react';
import Navbar from './Navbar';
import Demo from './Demo';
import LoginModal from './LoginModal';

export default function Home() {
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  const openLogin = () => setAuthModal({ open: true, mode: 'login' });
  const openSignup = () => setAuthModal({ open: true, mode: 'signup' });
  const closeAuth = () => setAuthModal((s) => ({ ...s, open: false }));

  return (
    <div className="min-h-screen bg-cream">
      <Navbar onLoginClick={openLogin} onSignupClick={openSignup} />
      <Demo onLoginClick={openLogin} onSignupClick={openSignup} />
      <LoginModal open={authModal.open} onClose={closeAuth} initialMode={authModal.mode} />
    </div>
  );
}
