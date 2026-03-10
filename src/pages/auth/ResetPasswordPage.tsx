import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Save } from 'lucide-react';
import { AnimatedPage, Button, Input } from '@/design-system';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncRecoveryState = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setHasRecoverySession(Boolean(data.session));
      setReady(true);
    };

    void syncRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setHasRecoverySession(Boolean(session));
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const passwordError =
    password && password.length < 8
      ? 'Le mot de passe doit contenir au moins 8 caractères.'
      : undefined;
  const confirmPasswordError =
    confirmPassword && password !== confirmPassword
      ? 'Les mots de passe ne correspondent pas.'
      : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    void supabase.auth.signOut();
    window.setTimeout(() => navigate('/login', { replace: true }), 1500);
  };

  if (!ready) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-10 w-10 rounded-full border-3 border-mc-blue-200 border-t-mc-blue-500 animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Vérification du lien de réinitialisation…</p>
      </AnimatedPage>
    );
  }

  if (success) {
    return (
      <AnimatedPage className="flex flex-col items-center text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-mc-green-50 dark:bg-mc-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-mc-green-500" />
        </div>
        <h2 className="text-xl font-semibold">Mot de passe mis à jour</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Votre mot de passe a été réinitialisé. Vous allez être redirigé vers la connexion.
        </p>
        <Link to="/login">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Button>
        </Link>
      </AnimatedPage>
    );
  }

  if (!hasRecoverySession) {
    return (
      <AnimatedPage className="space-y-6 text-center">
        <div>
          <h2 className="text-xl font-semibold">Lien invalide ou expiré</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Demandez un nouveau lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        <Link to="/forgot-password">
          <Button variant="gradient" className="w-full">
            Demander un nouveau lien
          </Button>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-mc-blue-500 font-medium hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à la connexion
        </Link>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Définir un nouveau mot de passe</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Choisissez un mot de passe robuste pour sécuriser votre compte.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Nouveau mot de passe"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Min. 8 caractères"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          required
        />

        <Input
          label="Confirmer le mot de passe"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmPasswordError}
          required
        />

        {error && <p className="text-sm text-mc-red-500">{error}</p>}

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          loading={loading}
          type="submit"
          iconRight={<Save className="h-4 w-4" />}
        >
          Enregistrer le nouveau mot de passe
        </Button>
      </form>
    </AnimatedPage>
  );
}
