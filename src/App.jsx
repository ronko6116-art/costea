// src/App.jsx
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { AlertTriangle } from 'lucide-react';
import Login from './pages/Auth/Login';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import ChangePassword from './pages/Auth/ChangePassword';
import AuthCallback from './pages/Auth/AuthCallback';
import ProtectedRoute from './contexts/ProtectedRoute';
import AppLayout from './contexts/AppLayout';
import PlatoDetail from './pages/Plato/PlatoDetail';
import PlatoForm from './pages/Plato/PlatoForm';
import IngredienteList from './pages/Ingrediente/IngredienteList';
import IngredienteForm from './pages/Ingrediente/IngredienteForm';
import HistoricoCompras from './pages/Ingrediente/HistoricoCompras';
import ProveedorList from './pages/Proveedor/ProveedorList';
import ProveedorForm from './pages/Proveedor/ProveedorForm';
import PreciosIngrediente from './pages/Precios/PreciosIngrediente';
import Graficos from './pages/Graficos/Graficos';
import RecetasBase from './pages/Recetas/RecetasBase';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRoutes() {
  const { session, loading, error, retry } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4" />
        <p className="text-ink-soft">Cargando...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream p-4">
        <div className="max-w-sm w-full bg-white rounded-xl border border-red-200 p-6 shadow-lg text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">Error de conexión</h2>
          <p className="text-sm text-ink-soft mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="flex-1 bg-terracotta text-white rounded-full py-2.5 text-sm font-semibold hover:bg-terracotta-dark transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-2.5 text-sm font-medium hover:bg-warm-gray/5 transition-colors"
            >
              Ir al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/changepassword" element={<ChangePassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/plato/:id"
        element={
            <ProtectedRoute>
            <AppLayout><PlatoDetail /></AppLayout>
            </ProtectedRoute>
        }
      />
    <Route path="/platos/nuevo" element={<ProtectedRoute><AppLayout><PlatoForm /></AppLayout></ProtectedRoute>} />
    <Route path="/platos/editar/:id" element={<ProtectedRoute><AppLayout><PlatoForm /></AppLayout></ProtectedRoute>} />
    <Route path="/ingredientes" element={<ProtectedRoute><AppLayout><IngredienteList /></AppLayout></ProtectedRoute>} />
    <Route path="/ingredientes/historico" element={<ProtectedRoute><AppLayout><HistoricoCompras /></AppLayout></ProtectedRoute>} />
    <Route path="/ingredientes/nuevo" element={<ProtectedRoute><AppLayout><IngredienteForm /></AppLayout></ProtectedRoute>} />
    <Route path="/ingredientes/editar/:id" element={<ProtectedRoute><AppLayout><IngredienteForm /></AppLayout></ProtectedRoute>} />
    <Route path="/recetas" element={<ProtectedRoute><AppLayout><RecetasBase /></AppLayout></ProtectedRoute>} />
    <Route path="/graficos" element={<ProtectedRoute><AppLayout><Graficos /></AppLayout></ProtectedRoute>} />
    <Route path="/precios" element={<ProtectedRoute><AppLayout><PreciosIngrediente /></AppLayout></ProtectedRoute>} />
    <Route path="/proveedores" element={<ProtectedRoute><AppLayout><ProveedorList /></AppLayout></ProtectedRoute>} />
    <Route path="/proveedores/nuevo" element={<ProtectedRoute><AppLayout><ProveedorForm /></AppLayout></ProtectedRoute>} />
    <Route path="/proveedores/editar/:id" element={<ProtectedRoute><AppLayout><ProveedorForm /></AppLayout></ProtectedRoute>} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <AppRoutes />
      </RestaurantProvider>
    </AuthProvider>
  );
}