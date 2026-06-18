// src/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-20">Cargando...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}