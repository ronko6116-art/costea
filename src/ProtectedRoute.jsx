import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/home" replace />;
  }

  return children;
}