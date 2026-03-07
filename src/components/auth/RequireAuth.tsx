import { Navigate, useLocation } from 'react-router-dom';
import { roleHomeRoutes, useAuthStore, type UserRole } from '@/stores/authStore';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-3 border-mc-blue-200 border-t-mc-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomeRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}