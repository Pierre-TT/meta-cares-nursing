import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { AnimatedPage, Button, Input } from '@/design-system';
import { supabase } from '@/lib/supabase';
import { roleHomeRoutes, useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const syncSession = useAuthStore((s) => s.syncSession);
  const locationState = location.state as
    | { from?: { pathname?: string }; registrationNotice?: string }
    | null;
  const redirectTarget = locationState?.from?.pathname;
  const registrationNotice = locationState?.registrationNotice;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const user = await syncSession(data.session ?? null, { showLoading: false });

    setLoading(false);

    if (!user) {
      setError('Connexion établie, mais le profil utilisateur est introuvable.');
      return;
    }

    const destination =
      redirectTarget && redirectTarget !== '/login' ? redirectTarget : roleHomeRoutes[user.role];

    navigate(destination, { replace: true });
  };

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connexion</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Accédez à votre espace sécurisé Meta Cares
        </p>
      </div>

      {registrationNotice && (
        <div className="rounded-2xl border border-mc-green-500/20 bg-mc-green-50/80 px-4 py-3 text-sm text-mc-green-700 dark:bg-mc-green-900/20 dark:text-mc-green-200">
          {registrationNotice}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="infirmier@example.be"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="text-sm text-mc-red-500">{error}</p>}

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          loading={loading}
          type="submit"
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          Se connecter
        </Button>
      </form>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-mc-blue-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Accès rôles privilégiés</p>
            <p className="text-xs text-[var(--text-muted)]">
              Les comptes coordinateur, admin et bureau de tarification sont provisionnés
              séparément. L’inscription publique reste limitée aux patients et infirmiers.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          to="/forgot-password"
          className="text-[var(--text-muted)] hover:text-mc-blue-500 transition-colors"
        >
          Mot de passe oublié ?
        </Link>
        <Link to="/register" className="text-mc-blue-500 font-medium hover:underline">
          Créer un compte
        </Link>
      </div>
    </AnimatedPage>
  );
}
