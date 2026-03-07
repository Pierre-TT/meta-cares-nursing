import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail, Send } from 'lucide-react';
import { AnimatedPage, Button, Input } from '@/design-system';
import { supabase } from '@/lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo ? { redirectTo } : undefined
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <AnimatedPage className="flex flex-col items-center text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-mc-green-50 dark:bg-mc-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-mc-green-500" />
        </div>
        <h2 className="text-xl font-semibold">Email envoyé</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
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

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mot de passe oublié</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="infirmier@example.be"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {error && <p className="text-sm text-mc-red-500">{error}</p>}

        <Button variant="gradient" size="lg" className="w-full" loading={loading} type="submit">
          Envoyer le lien
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        <Link to="/login" className="text-mc-blue-500 font-medium hover:underline">
          <ArrowLeft className="h-3 w-3 inline mr-1" />
          Retour à la connexion
        </Link>
      </p>
    </AnimatedPage>
  );
}