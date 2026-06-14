import { supabase } from './supabaseClient';

export default function Welcome() {
  const user = supabase.auth.getUser(); // o usa el session del contexto

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">¡Bienvenido!</h1>
      <p className="mb-8">Has iniciado sesión correctamente.</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}