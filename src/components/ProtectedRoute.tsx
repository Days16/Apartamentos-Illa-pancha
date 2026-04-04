import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type RequiredRole = 'admin' | 'gestion';

export default function ProtectedRoute({ requiredRole }: { requiredRole?: RequiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#fff',
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        <div className="loader">Cargando acceso...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const role = user.app_metadata?.role as string | undefined;
    const hasAccess =
      requiredRole === 'admin' ? role === 'admin' : role === 'admin' || role === 'gestion';
    if (!hasAccess) {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
