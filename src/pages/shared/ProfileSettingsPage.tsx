import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Stethoscope,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import {
  AnimatedPage,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  GradientHeader,
  Input,
} from '@/design-system';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { roleHomeRoutes, useAuthStore, type ProfessionalStatus } from '@/stores/authStore';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  inamiNumber: string;
  professionalStatus: ProfessionalStatus | '';
  bceNumber: string;
  companyName: string;
  professionalStreet: string;
  professionalHouseNumber: string;
  professionalPostalCode: string;
  professionalCity: string;
};

type StatusState =
  | { tone: 'success' | 'error'; message: string }
  | null;

type SelectFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

const PROFILE_IMAGES_BUCKET = 'profile-images';
const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';

const roleLabels = {
  nurse: 'Infirmier',
  coordinator: 'Coordinateur',
  patient: 'Patient',
  admin: 'Administration',
  billing_office: 'Bureau de facturation',
} as const;

const professionalStatusOptions: Array<{ value: ProfessionalStatus; label: string }> = [
  { value: 'independant', label: 'Indépendant' },
  { value: 'independant_complementaire', label: 'Indépendant complémentaire' },
  { value: 'salarie', label: 'Salarié' },
];

function toOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'Une erreur inattendue est survenue.';
}

function sanitizeStorageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

async function uploadProfileImage(userId: string, file: File) {
  const filePath = `${sanitizeStorageSegment(userId)}/avatar`;
  const bucket = supabase.storage.from(PROFILE_IMAGES_BUCKET);
  const { error } = await bucket.upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  const { data } = bucket.getPublicUrl(filePath);
  return data.publicUrl;
}

function getInitialProfileState(user: ReturnType<typeof useAuthStore.getState>['user']): ProfileFormState {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    inamiNumber: user?.inamiNumber ?? '',
    professionalStatus: user?.professionalStatus ?? '',
    bceNumber: user?.bceNumber ?? '',
    companyName: user?.companyName ?? '',
    professionalStreet: user?.professionalStreet ?? '',
    professionalHouseNumber: user?.professionalHouseNumber ?? '',
    professionalPostalCode: user?.professionalPostalCode ?? '',
    professionalCity: user?.professionalCity ?? '',
  };
}

function SelectField({ id, label, hint, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const syncSession = useAuthStore((s) => s.syncSession);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => getInitialProfileState(user));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileStatus, setProfileStatus] = useState<StatusState>(null);
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const homeRoute = user ? roleHomeRoutes[user.role] : '/login';
  const showInamiField = Boolean(user && (user.role === 'nurse' || user.role === 'coordinator'));
  const showProfessionalFields = user?.role === 'nurse';

  useEffect(() => {
    setProfileForm(getInitialProfileState(user));
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  if (!user) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Chargement du profil…</p>
        </Card>
      </AnimatedPage>
    );
  }

  const fullName = `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim();
  const avatarSrc = avatarPreviewUrl ?? (profileForm.avatarUrl || undefined);

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      setProfileStatus({
        tone: 'error',
        message: 'Formats acceptés: PNG, JPG ou WebP.',
      });
      event.target.value = '';
      return;
    }

    if (nextFile.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
      setProfileStatus({
        tone: 'error',
        message: 'La photo de profil doit faire moins de 5 Mo.',
      });
      event.target.value = '';
      return;
    }

    setAvatarFile(nextFile);
    setProfileStatus(null);
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    setProfileForm((current) => ({ ...current, avatarUrl: '' }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstName = profileForm.firstName.trim();
    const lastName = profileForm.lastName.trim();
    const phone = toOptionalValue(profileForm.phone);
    const inamiNumber = showInamiField ? toOptionalValue(profileForm.inamiNumber) : null;
    const professionalStatus =
      showProfessionalFields && profileForm.professionalStatus
        ? profileForm.professionalStatus
        : null;
    const bceNumber = showProfessionalFields ? toOptionalValue(profileForm.bceNumber) : null;
    const companyName = showProfessionalFields ? toOptionalValue(profileForm.companyName) : null;
    const professionalStreet = showProfessionalFields
      ? toOptionalValue(profileForm.professionalStreet)
      : null;
    const professionalHouseNumber = showProfessionalFields
      ? toOptionalValue(profileForm.professionalHouseNumber)
      : null;
    const professionalPostalCode = showProfessionalFields
      ? toOptionalValue(profileForm.professionalPostalCode)
      : null;
    const professionalCity = showProfessionalFields ? toOptionalValue(profileForm.professionalCity) : null;

    if (!firstName || !lastName) {
      setProfileStatus({
        tone: 'error',
        message: 'Le prénom et le nom sont obligatoires.',
      });
      return;
    }

    setSavingProfile(true);
    setProfileStatus(null);

    try {
      const avatarUrl = avatarFile
        ? await uploadProfileImage(user.id, avatarFile)
        : toOptionalValue(profileForm.avatarUrl);

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          phone,
          avatar_url: avatarUrl,
          inami_number: inamiNumber,
          professional_status: professionalStatus,
          bce_number: bceNumber,
          company_name: companyName,
          professional_street: professionalStreet,
          professional_house_number: professionalHouseNumber,
          professional_postal_code: professionalPostalCode,
          professional_city: professionalCity,
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!updatedProfile) {
        throw new Error('Profil introuvable.');
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone,
          avatar_url: avatarUrl,
          inami_number: inamiNumber,
          professional_status: professionalStatus,
          bce_number: bceNumber,
          company_name: companyName,
          professional_street: professionalStreet,
          professional_house_number: professionalHouseNumber,
          professional_postal_code: professionalPostalCode,
          professional_city: professionalCity,
          role: user.role,
        },
      });

      const { data: sessionData } = await supabase.auth.getSession();
      await syncSession(sessionData.session, { showLoading: false });

      setProfileForm({
        firstName,
        lastName,
        phone: phone ?? '',
        avatarUrl: avatarUrl ?? '',
        inamiNumber: inamiNumber ?? '',
        professionalStatus: professionalStatus ?? '',
        bceNumber: bceNumber ?? '',
        companyName: companyName ?? '',
        professionalStreet: professionalStreet ?? '',
        professionalHouseNumber: professionalHouseNumber ?? '',
        professionalPostalCode: professionalPostalCode ?? '',
        professionalCity: professionalCity ?? '',
      });
      setAvatarFile(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }

      setProfileStatus({
        tone: metadataError ? 'error' : 'success',
        message: metadataError
          ? 'Profil enregistré, mais les métadonnées du compte n’ont pas été synchronisées.'
          : 'Profil mis à jour.',
      });
    } catch (error) {
      setProfileStatus({
        tone: 'error',
        message: getErrorMessage(error),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setPasswordStatus({
        tone: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        tone: 'error',
        message: 'Les mots de passe ne correspondent pas.',
      });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordStatus({
        tone: 'error',
        message: error.message,
      });
      setSavingPassword(false);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatus({
      tone: 'success',
      message: 'Mot de passe mis à jour.',
    });
    setSavingPassword(false);
  };

  return (
    <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => navigate(homeRoute)}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Mon profil"
        subtitle="Mettez à jour vos informations, votre photo et votre mot de passe."
        badge={<Badge variant="outline">{roleLabels[user.role]}</Badge>}
      >
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} name={fullName || `${user.firstName} ${user.lastName}`} size="lg" />
          <div>
            <p className="text-sm font-semibold text-white">{fullName || user.email}</p>
            <p className="text-xs text-white/70">{user.email}</p>
          </div>
        </div>
      </GradientHeader>

      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
          <Badge variant="blue">
            <BadgeCheck className="h-3.5 w-3.5" />
            Synchronisé
          </Badge>
        </CardHeader>

        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={avatarSrc}
                name={fullName || `${user.firstName} ${user.lastName}`}
                size="xl"
              />
              <div className="space-y-2">
                <div>
                  <label htmlFor="profile-avatar-upload" className="block text-sm font-medium text-[var(--text-secondary)]">
                    Photo de profil
                  </label>
                  <input
                    ref={avatarInputRef}
                    id="profile-avatar-upload"
                    type="file"
                    accept={PROFILE_IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={handleAvatarFileChange}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    Importez une image depuis votre appareil. PNG, JPG ou WebP, 5 Mo max.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    iconRight={<Upload className="h-4 w-4" />}
                  >
                    Importer depuis l’appareil
                  </Button>
                  {(avatarSrc || avatarFile) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClearAvatar}
                      iconRight={<Trash2 className="h-4 w-4" />}
                    >
                      Retirer la photo
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                  {avatarFile ? <Badge variant="outline">{avatarFile.name}</Badge> : null}
                  {profileForm.avatarUrl && !avatarFile ? <Badge variant="outline">Photo enregistrée</Badge> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prénom"
              value={profileForm.firstName}
              onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
              icon={<UserRound className="h-4 w-4" />}
              autoComplete="given-name"
              required
            />
            <Input
              label="Nom"
              value={profileForm.lastName}
              onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
              icon={<UserRound className="h-4 w-4" />}
              autoComplete="family-name"
              required
            />
          </div>

          <Input
            label="Adresse email"
            value={user.email}
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            disabled
            hint="L’adresse email actuelle est affichée ici comme identifiant de connexion."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Téléphone"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
              icon={<Phone className="h-4 w-4" />}
              autoComplete="tel"
              placeholder="+32 470 12 34 56"
            />
            {showInamiField ? (
              <Input
                label="Numéro INAMI"
                value={profileForm.inamiNumber}
                onChange={(event) => setProfileForm((current) => ({ ...current, inamiNumber: event.target.value }))}
                icon={<Stethoscope className="h-4 w-4" />}
                placeholder="5-12345-67-890"
              />
            ) : null}
          </div>

          {showProfessionalFields ? (
            <div className="rounded-2xl border border-[var(--border-default)] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-mc-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Informations professionnelles</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Renseignez vos informations légales et votre adresse professionnelle.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="professional-status"
                  label="Statut professionnel"
                  hint="Sélectionnez votre cadre d’exercice."
                  value={profileForm.professionalStatus}
                  onChange={(value) =>
                    setProfileForm((current) => ({
                      ...current,
                      professionalStatus: value as ProfessionalStatus | '',
                    }))
                  }
                  options={professionalStatusOptions}
                />
                <Input
                  label="Numéro de BCE"
                  value={profileForm.bceNumber}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bceNumber: event.target.value }))}
                  icon={<Building2 className="h-4 w-4" />}
                  placeholder="0123.456.789"
                />
              </div>

              <Input
                label="Nom de société"
                value={profileForm.companyName}
                onChange={(event) => setProfileForm((current) => ({ ...current, companyName: event.target.value }))}
                icon={<Building2 className="h-4 w-4" />}
                placeholder="Cabinet infirmier Meta Cares"
                hint="Laissez vide si non applicable."
              />

              <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Input
                  label="Rue"
                  value={profileForm.professionalStreet}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, professionalStreet: event.target.value }))
                  }
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="Rue de l’Exemple"
                />
                <Input
                  label="Numéro"
                  value={profileForm.professionalHouseNumber}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, professionalHouseNumber: event.target.value }))
                  }
                  placeholder="42"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <Input
                  label="Code postal"
                  value={profileForm.professionalPostalCode}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, professionalPostalCode: event.target.value }))
                  }
                  placeholder="1000"
                />
                <Input
                  label="Ville"
                  value={profileForm.professionalCity}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, professionalCity: event.target.value }))
                  }
                  placeholder="Bruxelles"
                />
              </div>
            </div>
          ) : null}

          {profileStatus ? (
            <p
              role="status"
              className={profileStatus.tone === 'success' ? 'text-sm text-mc-green-500' : 'text-sm text-mc-red-500'}
            >
              {profileStatus.message}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="gradient"
            className="w-full sm:w-auto"
            loading={savingProfile}
            iconRight={<Save className="h-4 w-4" />}
          >
            Enregistrer le profil
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
          <Badge variant="amber">Mot de passe</Badge>
        </CardHeader>

        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              placeholder="Min. 8 caractères"
              required
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              required
            />
          </div>

          {passwordStatus ? (
            <p
              role="status"
              className={passwordStatus.tone === 'success' ? 'text-sm text-mc-green-500' : 'text-sm text-mc-red-500'}
            >
              {passwordStatus.message}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="outline"
            className="w-full sm:w-auto"
            loading={savingPassword}
            iconRight={<Save className="h-4 w-4" />}
          >
            Mettre à jour le mot de passe
          </Button>
        </form>
      </Card>
    </AnimatedPage>
  );
}
