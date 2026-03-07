import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-[image:var(--gradient-brand-subtle)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-[var(--font-display)]">
            <span className="text-gradient">Meta Cares</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Soins infirmiers à domicile
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-default)] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
