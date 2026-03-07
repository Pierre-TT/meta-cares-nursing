import { Navigate } from 'react-router-dom';
import { roleHomeRoutes, useAuthStore } from '@/stores/authStore';

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-3 border-mc-blue-200 border-t-mc-blue-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={roleHomeRoutes[user.role]} replace />;
  }

  return <>{children}</>;
}