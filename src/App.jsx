// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Home from './Home';
import Dashboard from './Dashboard';
import ChangePassword from './ChangePassword';
import AuthCallback from './AuthCallback';
import ProtectedRoute from './ProtectedRoute';
import PlatoDetail from './PlatoDetail';
import PlatoForm from './PlatoForm';
import IngredienteList from './IngredienteList';
import IngredienteForm from './IngredienteForm';
import RecetaManager from './RecetaManager';

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