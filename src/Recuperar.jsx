import { useState } from 'react';
import { supabase } from './supabaseClient';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Recuperar({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  // Comprobación instantánea usando el comportamiento de la API de Auth
  const checkAccountExists = async (emailToCheck) => {
    try {
      console.log("1. Validando existencia del email mediante intento de autenticación...");
      
      // Intentamos un login con una contraseña que jamás coincidirá
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToCheck.toLowerCase().trim(),
        password: 'UnAsTeRiScO_TeMp_PaSs_9999!' 
      });

      if (!error) {
        // Caso extremadamente raro: ¡coincidió la contraseña! El usuario existe.
        return true;
      }

      console.log("Respuesta de Auth recibida. Mensaje de error:", error.message);

      // Evaluamos el mensaje de error del servidor de Supabase
      // Nota: Dependiendo de tu configuración de Supabase, el mensaje suele ser 'User not found' o 'Invalid login credentials'
      const msg = error.message.toLowerCase();
      
      if (msg.includes('user not found') || msg.includes('no user found')) {
        return false; // El email NO existe en el sistema
      }

      // Si dice "invalid login credentials", es que el usuario SÍ existe (pero la contraseña está mal)
      if (msg.includes('invalid login credentials') || msg.includes('credentials')) {
        return true; 
      }

      // Ante cualquier otro tipo de error (rate limit, etc.), devolvemos null para no bloquear
      return null;

    } catch (err) {
      console.error('Error inesperado en la validación:', err);
      return null;
    }
  };

  // Manejador del formulario
const handlePasswordReset = async (e) => {
  e.preventDefault();
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    setErrorMsg('Por favor, ingresa tu correo electrónico.');
    return;
  }
  setLoading(true);
  setErrorMsg('');
  setSuccessMsg('');

  try {
    if (!captchaToken) {
      setErrorMsg('Por favor, completa el captcha.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: 'http://localhost:5174/changepassword',
      captchaToken,
    });
    if (error) throw error;
    setSuccessMsg('Revisa tu correo para restablecer la contraseña.');
    setEmail('');
  } catch (err) {
    console.error(err);
    setErrorMsg(err.message || 'No se pudo enviar el correo.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Recuperar Contraseña</h2>

        {errorMsg && <p className="error" style={{ marginBottom: '1rem' }}>{errorMsg}</p>}
        {successMsg && <p className="success" style={{ marginBottom: '1rem' }}>{successMsg}</p>}

        <form onSubmit={handlePasswordReset} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              name="email"
              autoComplete="email"
              className="input-base"
              disabled={loading}
            />
          </div>

          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => { setCaptchaToken(token); setErrorMsg(''); }}
              onError={() => setErrorMsg('Error en el captcha, recarga la página.')}
              onExpire={() => setCaptchaToken('')}
            />
          </div>

          <button type="submit" disabled={loading || !captchaToken} className="btn-primary">
            {loading ? 'Cargando...' : 'Enviar Correo'}
          </button>
        </form>

        <button onClick={onBack} className="btn-primary" disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  );
}