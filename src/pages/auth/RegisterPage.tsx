import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Hash,
  HeartPulse,
  Lock,
  Mail,
  Stethoscope,
  User,
} from 'lucide-react';
import { AnimatedPage, Button, Input } from '@/design-system';
import { supabase } from '@/lib/supabase';
import { type UserRole, useAuthStore } from '@/stores/authStore';

type AccountType = 'nurse' | 'patient';

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>('nurse');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inamiNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const syncSession = useAuthStore((s) => s.syncSession);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const requestedRole: UserRole = accountType;
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const inamiNumber = form.inamiNumber.trim();

    if (!firstName || !lastName || !email || !form.password || !form.confirmPassword) {
      setFormError('Complétez tous les champs requis.');
      return;
    }

    if (form.password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (requestedRole === 'nurse' && !inamiNumber) {
      setFormError('Le numéro INAMI est requis pour créer un compte infirmier.');
      return;
    }

    setLoading(true);
    setFormError(null);

    const metadata = {
      role: requestedRole,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      ...(requestedRole === 'nurse' ? { inami_number: inamiNumber } : {}),
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      await syncSession(data.session, { showLoading: false });
      setLoading(false);
      navigate('/onboarding', { replace: true });
      return;
    }

    setLoading(false);
    navigate('/login', {
      replace: true,
      state: {
        registrationNotice: `Compte créé pour ${email}. Vérifiez votre boîte mail pour finaliser l’activation.`,
      },
    });
  };

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Créer un compte</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {step === 1 ? 'Choisissez votre type de compte' : 'Complétez vos informations'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-[image:var(--gradient-brand)]' : 'bg-[var(--bg-tertiary)]'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('nurse')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                accountType === 'nurse'
                  ? 'border-mc-blue-500 bg-mc-blue-50 dark:bg-mc-blue-900/20'
                  : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
              }`}
            >
              <Stethoscope className={`h-8 w-8 ${accountType === 'nurse' ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'}`} />
              <span className="text-sm font-medium">Infirmier</span>
              <span className="text-[10px] text-[var(--text-muted)]">Accès métier terrain</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('patient')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                accountType === 'patient'
                  ? 'border-mc-green-500 bg-mc-green-50 dark:bg-mc-green-900/20'
                  : 'border-[var(--border-default)] hover:border-[var(--text-muted)]'
              }`}
            >
              <HeartPulse className={`h-8 w-8 ${accountType === 'patient' ? 'text-mc-green-500' : 'text-[var(--text-muted)]'}`} />
              <span className="text-sm font-medium">Patient</span>
              <span className="text-[10px] text-[var(--text-muted)]">Portail Mon Infirmière</span>
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Les rôles coordinateur, admin et bureau de tarification sont créés manuellement dans
            Supabase.
          </p>

          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => setStep(2)}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Continuer
          </Button>
        </div>
      )}

      {step === 2 && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              name="firstName"
              autoComplete="given-name"
              icon={<User className="h-4 w-4" />}
              value={form.firstName}
              onChange={(event) => update('firstName', event.target.value)}
              required
            />
            <Input
              label="Nom"
              name="lastName"
              autoComplete="family-name"
              icon={<User className="h-4 w-4" />}
              value={form.lastName}
              onChange={(event) => update('lastName', event.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nom@example.be"
            icon={<Mail className="h-4 w-4" />}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            required
          />

          {accountType === 'nurse' && (
            <Input
              label="Numéro INAMI"
              placeholder="1-12345-67-890"
              name="inamiNumber"
              autoComplete="off"
              icon={<Hash className="h-4 w-4" />}
              value={form.inamiNumber}
              onChange={(event) => update('inamiNumber', event.target.value)}
              hint="Requis pour les comptes infirmiers auto-inscrits."
            />
          )}

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Min. 8 caractères"
            icon={<Lock className="h-4 w-4" />}
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            error={
              form.confirmPassword && form.password !== form.confirmPassword
                ? 'Les mots de passe ne correspondent pas'
                : undefined
            }
            required
          />

          {formError && <p className="text-sm text-mc-red-500">{formError}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} type="button" className="w-14">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              loading={loading}
              type="submit"
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Créer mon compte
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-[var(--text-muted)]">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-mc-blue-500 font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </AnimatedPage>
  );
}
