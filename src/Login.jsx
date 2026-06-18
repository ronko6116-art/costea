import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
//import './Login.css';
import Recuperar from './Recuperar';
import Signup from './Signup';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login({ embedded = false, initialMode = 'login' }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { access_type: 'offline', prompt: 'select_account' },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'login') {
        if (!captchaToken) {
          setErrorMsg('Por favor, completa el captcha.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
        if (error) throw error;
        if (data?.session) navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken },
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err?.message ?? 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'recuperar':
        return <Recuperar onBack={() => setMode('login')} />;
      case 'signup':
        return <Signup onBack={() => setMode('login')} />;
      default:
        return (
          <div className="login-wrapper"> {/* Changed from auth-wrapper */}
            <div className="login-card"> {/* Changed from login-container */}
              <h2>Iniciar Sesión</h2>

              {errorMsg && (
                <p className="error" style={{ marginBottom: '1rem' }}>{errorMsg}</p>
              )}

              {successMsg && (
                <p className="success" style={{ marginBottom: '1rem' }}>{successMsg}</p>
              )}

              <form onSubmit={handleEmailAuth} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    name="email"
                    autoComplete="email"
                    className="input-base" /* Added class for consistent styling */
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
                    autoComplete="current-password"
                    className="input-base" /* Added class for consistent styling */
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
                  {loading ? 'Cargando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <div style={{ marginBottom: '1.5rem' }}>
                <button onClick={handleGoogleLogin} disabled={loading} className="google-button">
                  <img
                    src="https://developers.google.com/identity/images/btn_google_signin_dark_normal_web.png"
                    alt="Iniciar con Google"
                  />
                </button>
              </div>

              <div className="links">
                <button onClick={() => setMode('recuperar')} style={{ marginBottom: '0.5rem' }}>
                  ¿Olvidaste tu contraseña?
                </button>
                <button onClick={() => setMode('signup')}>
                  Crear una cuenta
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (embedded) {
    return renderContent();
  }

  return <div className="auth-wrapper">{renderContent()}</div>;
}