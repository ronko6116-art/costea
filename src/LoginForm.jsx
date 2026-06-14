import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginForm({ onSubmit, loading = false, errorMsg = '', successMsg = '' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-900">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@restaurante.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C4693B] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-gray-900">
            Contraseña
          </label>
          <a
            href="#recuperar"
            className="text-xs font-medium text-[#C4693B] hover:text-[#a85a32]"
          >
            ¿La olvidaste?
          </a>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C4693B] focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#C4693B] focus:ring-[#C4693B]"
        />
        <label htmlFor="remember" className="text-sm font-normal text-gray-600">
          Mantener la sesión iniciada
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-10 w-full rounded-md bg-[#C4693B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#a85a32] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Accediendo…
          </>
        ) : (
          'Acceder al panel'
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Aún no tienes cuenta?{' '}
        <a href="#signup" className="font-semibold text-[#C4693B] hover:text-[#a85a32]">
          Solicita una demo
        </a>
      </p>
    </form>
  );
}
