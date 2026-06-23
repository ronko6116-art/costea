import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Turnstile } from '@marsidev/react-turnstile';
//import {dashboard} from './Dashboard';

export default function Signup({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!captchaToken) {
      setLoading(false);
      setErrorMsg('Por favor, completa el captcha.');
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken },
      });
      if (error) throw error;
      setSuccessMsg('Cuenta creada con éxito. Revisa tu correo para confirmar.');
    } catch (err) {
      setErrorMsg(err?.message ?? 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper"> {/* Consistent background */}
      <div className="login-card"> {/* Consistent card style */}
        <h2>Crear Cuenta</h2>

        {errorMsg && (
          <p className="error" style={{ marginBottom: '1rem' }}>{errorMsg}</p>
        )}

        {successMsg && (
          <p className="success" style={{ marginBottom: '1rem' }}>{successMsg}</p>
        )}

        <form onSubmit={handleSignup} style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              name="email"
              autoComplete="email"
              className="input-base" /* Consistent input style */
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              name="password"
              autoComplete="new-password"
              className="input-base" /* Consistent input style */
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              name="confirmPassword"
              autoComplete="new-password"
              className="input-base" /* Consistent input style */
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

          <button type="submit" disabled={loading || !captchaToken || !password || !confirmPassword || password !== confirmPassword} className="btn-primary">
            {loading ? 'Cargando...' : 'Crear Cuenta'}
          </button>
        </form>

        <button onClick={onBack} className="btn-primary">
          Volver
        </button>
      </div>
    </div>
  );
}