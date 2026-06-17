import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Login from './Login';
import Home from './Home';
import Welcome from './Welcome';
import ChangePassword from './ChangePassword';
import AuthCallback from './AuthCallback';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
     // console.log('Auth event:', event, 'Session:', !!session);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center mt-20">Cargando...</div>;
  }

  return (
  <div className="min-h-screen bg-gray-50">
    <Routes>
      <Route path="/" element={session ? <Navigate to="/welcome" replace /> : <Home />} />

      <Route 
        path="/login" 
        element={!session ? <Login /> : <Navigate to="/welcome" replace />} 
      />

      <Route 
        path="/welcome" 
        element={session ? <Welcome /> : <Navigate to="/" replace />} 
      />

      {/* ✅ Sin protección: el componente gestiona su propia sesión */}
      <Route 
        path="/changepassword" 
        element={<ChangePassword />} 
      />

      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  </div>
);
}

export default App;