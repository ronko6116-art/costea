// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import ChangePassword from './pages/Auth/ChangePassword';
import AuthCallback from './pages/Auth/AuthCallback';
import ProtectedRoute from './contexts/ProtectedRoute';
import PlatoDetail from './pages/Plato/PlatoDetail';
import PlatoForm from './pages/Plato/PlatoForm';
import IngredienteList from './pages/Ingrediente/IngredienteList';
import IngredienteForm from './pages/Ingrediente/IngredienteForm';
import RecetaManager from './pages/Plato/RecetaManager';
import ProveedorList from './pages/Proveedor/ProveedorList';
import ProveedorForm from './pages/Proveedor/ProveedorForm';
import PreciosIngrediente from './pages/Precios/PreciosIngrediente';
import FacturaList from './pages/Factura/FacturaList';
import FacturaUpload from './pages/Factura/FacturaUpload';
import FacturaRevision from './pages/Factura/FacturaRevision';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) return <div className="text-center mt-20">Cargando...</div>;

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/changepassword" element={<ChangePassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/plato/:id"
        element={
            <ProtectedRoute>
            <PlatoDetail />
            </ProtectedRoute>
        }
      />
    <Route path="/platos/nuevo" element={<ProtectedRoute><PlatoForm /></ProtectedRoute>} />
    <Route path="/platos/editar/:id" element={<ProtectedRoute><PlatoForm /></ProtectedRoute>} />
    <Route path="/ingredientes" element={<ProtectedRoute><IngredienteList /></ProtectedRoute>} />
    <Route path="/ingredientes/nuevo" element={<ProtectedRoute><IngredienteForm /></ProtectedRoute>} />
    <Route path="/ingredientes/editar/:id" element={<ProtectedRoute><IngredienteForm /></ProtectedRoute>} />
    <Route path="/plato/:id/receta" element={<ProtectedRoute><RecetaManager /></ProtectedRoute>} />
    <Route path="/precios" element={<ProtectedRoute><PreciosIngrediente /></ProtectedRoute>} />
    <Route path="/proveedores" element={<ProtectedRoute><ProveedorList /></ProtectedRoute>} />
    <Route path="/proveedores/nuevo" element={<ProtectedRoute><ProveedorForm /></ProtectedRoute>} />
    <Route path="/proveedores/editar/:id" element={<ProtectedRoute><ProveedorForm /></ProtectedRoute>} />
    <Route path="/facturas" element={<ProtectedRoute><FacturaList /></ProtectedRoute>} />
    <Route path="/facturas/nueva" element={<ProtectedRoute><FacturaUpload /></ProtectedRoute>} />
    <Route path="/facturas/:id/revision" element={<ProtectedRoute><FacturaRevision /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}