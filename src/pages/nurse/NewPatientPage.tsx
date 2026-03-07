import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  UserPlus,
  Save,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Shield,
  AlertTriangle,
  CheckCircle,
  Scan,
} from 'lucide-react';
import { Button, Card, Input, ContentTabs, AnimatedPage } from '@/design-system';
import { validateNationalNumber } from '@/lib/eid';

export function NewPatientPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'eid' | 'manual'>('eid');
  const [eidScanned, setEidScanned] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    niss: '', firstName: '', lastName: '', birthDate: '', gender: 'F',
    address: '', city: '', postalCode: '', phone: '', email: '',
    prescribingDoctor: '', doctorINAMI: '',
    mutuality: '', mutualityNr: '',
    allergies: '',
    notes: '',
  });

  const nissValid = form.niss.length >= 11 && validateNationalNumber(form.niss.replace(/[.\- ]/g, ''));
  const canSave = form.niss && form.firstName && form.lastName && form.birthDate && nissValid;

  const handleEidScan = () => {
    // Simulate eID NFC scan
    setEidScanned(true);
    setForm(f => ({
      ...f,
      niss: '85.07.15-123.45',
      firstName: 'Nouveau',
      lastName: 'Patient',
      birthDate: '1985-07-15',
      gender: 'F',
      address: 'Rue de la Loi 16',
      city: 'Bruxelles',
      postalCode: '1000',
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/nurse/patients');
    }, 1200);
  };

  const up = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const tabs = [
    {
      label: 'Identification',
      content: (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('eid')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                mode === 'eid' ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Scan eID
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                mode === 'manual' ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              <UserPlus className="h-4 w-4" /> Saisie manuelle
            </button>
          </div>

          {mode === 'eid' && !eidScanned && (
            <Card gradient className="text-center py-8">
              <div className="h-20 w-20 rounded-2xl bg-[image:var(--gradient-brand)] flex items-center justify-center mx-auto mb-4">
                <Scan className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1">Scanner la carte eID</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Approchez la carte d'identité du patient du capteur NFC
              </p>
              <Button variant="gradient" size="lg" onClick={handleEidScan}>
                <CreditCard className="h-4 w-4" />
                Simuler le scan eID
              </Button>
            </Card>
          )}

          {(mode === 'manual' || eidScanned) && (
            <div className="space-y-3">
              {eidScanned && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-mc-green-50 dark:bg-mc-green-900/20 border border-mc-green-200 dark:border-mc-green-800">
                  <CheckCircle className="h-4 w-4 text-mc-green-500" />
                  <span className="text-xs font-medium text-mc-green-700 dark:text-mc-green-300">
                    Carte eID lue avec succès — données pré-remplies
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom *" value={form.firstName} onChange={up('firstName')} placeholder="Jean" />
                <Input label="Nom *" value={form.lastName} onChange={up('lastName')} placeholder="Dupont" />
              </div>

              <Input
                label="NISS *"
                value={form.niss}
                onChange={up('niss')}
                placeholder="85.07.15-123.45"
                icon={<Shield className="h-4 w-4" />}
                hint={form.niss ? (nissValid ? '✓ NISS valide' : '✗ NISS invalide') : 'Numéro de registre national'}
                className={form.niss ? (nissValid ? '' : 'border-mc-red-300') : ''}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Date de naissance *" type="date" value={form.birthDate} onChange={up('birthDate')} />
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Genre</label>
                  <select
                    value={form.gender}
                    onChange={up('gender')}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm"
                  >
                    <option value="F">Féminin</option>
                    <option value="M">Masculin</option>
                    <option value="X">Autre</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Contact',
      content: (
        <div className="space-y-3">
          <Input label="Adresse" value={form.address} onChange={up('address')} placeholder="Rue de la Loi 16" icon={<MapPin className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" value={form.postalCode} onChange={up('postalCode')} placeholder="1000" />
            <Input label="Ville" value={form.city} onChange={up('city')} placeholder="Bruxelles" />
          </div>
          <Input label="Téléphone" value={form.phone} onChange={up('phone')} placeholder="+32 470 12 34 56" icon={<Phone className="h-4 w-4" />} />
          <Input label="Email" value={form.email} onChange={up('email')} placeholder="patient@email.be" icon={<Mail className="h-4 w-4" />} />
        </div>
      ),
    },
    {
      label: 'Médical',
      content: (
        <div className="space-y-3">
          <Input label="Médecin traitant" value={form.prescribingDoctor} onChange={up('prescribingDoctor')} placeholder="Dr. Martin" icon={<Stethoscope className="h-4 w-4" />} />
          <Input label="N° INAMI médecin" value={form.doctorINAMI} onChange={up('doctorINAMI')} placeholder="1-23456-78-901" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Mutualité</label>
              <select
                value={form.mutuality}
                onChange={up('mutuality')}
                className="w-full h-10 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm"
              >
                <option value="">— Sélectionner —</option>
                <option value="100">100 — Alliance Nationale</option>
                <option value="200">200 — Mutualité Chrétienne</option>
                <option value="300">300 — Mutualité Neutre</option>
                <option value="400">400 — Mutualité Socialiste</option>
                <option value="500">500 — Mutualité Libérale</option>
                <option value="600">600 — CAAMI/HZIV</option>
                <option value="900">900 — HR Railroad</option>
              </select>
            </div>
            <Input label="N° affilié" value={form.mutualityNr} onChange={up('mutualityNr')} placeholder="123456789" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Allergies</label>
            <div className="flex items-start gap-2 p-2 rounded-xl bg-mc-red-50 dark:bg-red-900/20 border border-mc-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-mc-red-500 mt-0.5 shrink-0" />
              <textarea
                value={form.allergies}
                onChange={up('allergies')}
                placeholder="Pénicilline, Latex..."
                rows={2}
                className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-mc-red-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes complémentaires</label>
            <textarea
              value={form.notes}
              onChange={up('notes')}
              placeholder="Informations supplémentaires..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm resize-none outline-none"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Nouveau Patient</h1>
          <p className="text-sm text-[var(--text-muted)]">Créer un dossier patient</p>
        </div>
      </div>

      <ContentTabs tabs={tabs} />

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={!canSave || saving}
        onClick={handleSave}
      >
        <Save className="h-4 w-4" />
        {saving ? 'Enregistrement...' : 'Créer le dossier patient'}
      </Button>
    </AnimatedPage>
  );
}
