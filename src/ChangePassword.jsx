import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // ── Caso 1: PKCE flow → hay un ?code= en la URL ──
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg('El enlace ha expirado o ya fue usado. Solicita uno nuevo.');
        } else if (data?.session) {
          setReady(true);
        }
        return; // no seguir con los otros casos
      }

      // ── Caso 2: Implicit flow → el token ya está en el hash (#access_token=...) ──
      // Supabase lo procesa automáticamente, solo verificamos si hay sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        return;
      }

      // ── Caso 3: El evento llega después del montaje ──
      // El listener de abajo lo captura
    };

    init();

    // Listener por si el evento llega después
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('¡Contraseña actualizada! Redirigiendo...');
      await supabase.auth.signOut(); // limpiamos la sesión de recovery
      setTimeout(() => navigate('/'), 2000);
    }

    setLoading(false);
  };

  // Sin sesión válida aún
  if (!ready && !errorMsg) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <p>Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Enlace inválido o expirado
  if (errorMsg && !ready) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>Enlace no válido</h2>
          <p className="error">{errorMsg}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Nueva Contraseña</h2>

        {errorMsg && <p className="error" style={{ marginBottom: '1rem' }}>{errorMsg}</p>}
        {successMsg && <p className="success" style={{ marginBottom: '1rem' }}>{successMsg}</p>}

        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-base"
              disabled={loading}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="input-base"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}