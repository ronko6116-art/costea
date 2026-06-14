import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando...');
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Detectar tipo en query o en hash (Supabase puede poner parámetros en el hash)
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        const type = searchParams.get('type') || hashParams.get('type');

        if (type === 'recovery') {
          // Fluir de recuperación: obtener sesión (Supabase puede insertar tokens en la URL)
          setIsRecovery(true);
          setMessage('Procesando recuperación de contraseña...');
          await supabase.auth.getSession();
          setMessage('Introduce tu nueva contraseña');
          return;
        }

        // Comportamiento por defecto (OAuth / sign-in)
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error('Error en callback:', error);
          setMessage('Error al procesar la autenticación');
          setTimeout(() => navigate('/login', { replace: true }), 1500);
          return;
        }

        setMessage('¡Login exitoso! Redirigiendo...');
        setTimeout(() => navigate('/welcome', { replace: true }), 800);
      } catch (err) {
        console.error(err);
        navigate('/login', { replace: true });
      }
    };

    // Pequeño delay para que Supabase procese la URL
    const timer = setTimeout(handleCallback, 400);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Contraseña actualizada. Redirigiendo al login...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      setMessage(err?.message ?? 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="login-card" style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ marginBottom: '1rem' }}>Restablecer Contraseña</h2>
          <p style={{ marginBottom: '1rem' }}>{message}</p>
          <form onSubmit={handleSetPassword}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-base"
              style={{ marginBottom: '1rem' }}
            />
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Establecer contraseña'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-medium">{message}</p>
      </div>
    </div>
  );
}