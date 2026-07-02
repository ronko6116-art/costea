import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando...');
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    if (type === 'recovery') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRecovery(true);
      setMessage('Procesando recuperación de contraseña...');

      if (code) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setMessage('Introduce tu nueva contraseña');
            subscription.unsubscribe();
          }
        });
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          setMessage('Introduce tu nueva contraseña');
        }, 5000);
        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }

      setMessage('Introduce tu nueva contraseña');
      return;
    }

    const handleCallback = async () => {
      let attempts = 0;
      const maxAttempts = 25;

      const checkSession = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            handledRef.current = true;
            setMessage('¡Login exitoso! Redirigiendo...');
            setTimeout(() => navigate('/dashboard', { replace: true }), 500);
            return true;
          }
        } catch (err) {
          console.error('AuthCallback: error al verificar sesión:', err);
        }
        return false;
      };

      try {
        if (await checkSession()) return;
      } catch (_err) {
        // Si el primer check falla, continuamos al polling
      }

      if (code) {
        const interval = setInterval(async () => {
          try {
            attempts++;
            const found = await checkSession();
            if (found || attempts >= maxAttempts) {
              clearInterval(interval);
              if (!handledRef.current) {
                setMessage('Error al procesar la autenticación');
                setTimeout(() => navigate('/login', { replace: true }), 1500);
              }
            }
          } catch (err) {
            console.error('AuthCallback: error en polling:', err);
            attempts++;
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setMessage('Error al procesar la autenticación');
              setTimeout(() => navigate('/login', { replace: true }), 1500);
            }
          }
        }, 200);
      } else {
        setMessage('Error al procesar la autenticación');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    };

    handleCallback();
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
      setTimeout(() => navigate('/', { replace: true }), 1200);
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
