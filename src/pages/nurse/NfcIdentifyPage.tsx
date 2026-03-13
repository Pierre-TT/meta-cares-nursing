import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  CreditCard,
  Hash,
  Keyboard,
  MapPin,
  Nfc,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, Input } from '@/design-system';
import type { BelgianEid } from '@/lib/eid';
import { mockNfcRead, validateNationalNumber } from '@/lib/eid';
import { savePatientIdentityVerification } from '@/lib/patientIdentityVerification';
import { useNursePatients, type NursePatient } from '@/hooks/useNursePatients';

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'manual';

function normalizeNationalNumber(value: string) {
  return value.replace(/\D/g, '');
}

function patientToBelgianEid(patient: NursePatient, chipAuthSuccess: boolean): BelgianEid {
  return {
    nationalNumber: patient.niss,
    lastName: patient.lastName.toUpperCase(),
    firstName: patient.firstName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    nationality: 'Belge',
    placeOfBirth: 'Non renseigne',
    address: {
      street: patient.address.street,
      houseNumber: patient.address.houseNumber,
      postalCode: patient.address.postalCode,
      city: patient.address.city,
    },
    cardNumber: chipAuthSuccess ? 'NFC' : 'MANUAL',
    validFrom: '',
    validUntil: '',
    chipAuthSuccess,
  };
}

export function NfcIdentifyPage() {
  const [state, setState] = useState<ScanState>('idle');
  const [eid, setEid] = useState<BelgianEid | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualNISS, setManualNISS] = useState('');
  const [manualFallbackMode, setManualFallbackMode] = useState<'barcode' | 'manual_niss'>('manual_niss');
  const [manualReason, setManualReason] = useState('');
  const navigate = useNavigate();
  const { data: patients = [], isLoading: isPatientsLoading, error: patientsError } = useNursePatients();

  const findPatientByNiss = useCallback((niss: string) => {
    const normalizedNiss = normalizeNationalNumber(niss);
    return patients.find((patient) => normalizeNationalNumber(patient.niss) === normalizedNiss) ?? null;
  }, [patients]);

  const matchedPatient = useMemo(() => {
    if (!eid) {
      return null;
    }

    return findPatientByNiss(eid.nationalNumber);
  }, [eid, findPatientByNiss]);

  const startScan = useCallback(async () => {
    setState('scanning');
    setErrorMessage('');

    try {
      const data = await mockNfcRead();
      const matched = findPatientByNiss(data.nationalNumber);
      const resolvedEid = matched ? patientToBelgianEid(matched, true) : data;

      setEid(resolvedEid);
      if (matched) {
        savePatientIdentityVerification({
          patientRouteId: matched.routeId,
          patientDatabaseId: matched.databaseId,
          patientLabel: `${matched.firstName} ${matched.lastName}`,
          nationalNumber: matched.niss,
          verifiedAt: new Date().toISOString(),
          method: 'eid_chip',
          assurance: 'high',
          supportNumber: resolvedEid.cardNumber,
        });
      }

      setErrorMessage(matched ? '' : 'Aucun patient actif ne correspond a ce NISS. Verifiez le dossier ou creez un nouveau patient.');
      setState('success');
    } catch {
      setErrorMessage('Impossible de lire la carte. Reessayez ou utilisez la saisie manuelle.');
      setState('error');
    }
  }, [findPatientByNiss]);

  function handleManualSubmit() {
    const clean = manualNISS.replace(/\D/g, '');
    if (!validateNationalNumber(clean)) {
      setErrorMessage('Numero national invalide. Verifiez le format.');
      return;
    }

    if (patientsError) {
      setErrorMessage('La base patients est indisponible pour le moment. Reessayez dans quelques instants.');
      return;
    }

    if (isPatientsLoading) {
      setErrorMessage('Chargement des patients en cours. Reessayez dans un instant.');
      return;
    }

    if (!manualReason.trim()) {
      setErrorMessage('Indiquez le motif du fallback manuel avant de continuer.');
      return;
    }

    const matched = findPatientByNiss(clean);
    if (!matched) {
      setErrorMessage('Aucun patient actif ne correspond a ce NISS.');
      return;
    }

    setErrorMessage('');
    setEid(patientToBelgianEid(matched, false));
    savePatientIdentityVerification({
      patientRouteId: matched.routeId,
      patientDatabaseId: matched.databaseId,
      patientLabel: `${matched.firstName} ${matched.lastName}`,
      nationalNumber: matched.niss,
      verifiedAt: new Date().toISOString(),
      method: manualFallbackMode,
      assurance: 'fallback',
      supportNumber: manualFallbackMode === 'barcode' ? 'BARCODE' : 'MANUAL',
      reason: manualReason.trim(),
    });
    setState('success');
  }

  function resetToIdle() {
    setState('idle');
    setEid(null);
    setErrorMessage('');
    setManualReason('');
    setManualNISS('');
    setManualFallbackMode('manual_niss');
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Identification Patient</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Approchez la carte eID du patient pres de votre telephone.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {(state === 'idle' || state === 'scanning') && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className="relative h-48 w-48 flex items-center justify-center mb-8">
              {state === 'scanning' && (
                <>
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-full border-2 border-mc-blue-300"
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.5, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
              <div
                className={`h-28 w-28 rounded-3xl flex items-center justify-center shadow-lg transition-colors ${
                  state === 'scanning' ? 'bg-[image:var(--gradient-brand)]' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <Nfc className={`h-12 w-12 ${state === 'scanning' ? 'text-white' : 'text-[var(--text-muted)]'}`} />
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
              {state === 'scanning'
                ? 'Lecture en cours. Ne retirez pas la carte.'
                : "Placez la carte d'identite contre le dos du telephone."}
            </p>

            <div className="w-full space-y-3">
              <Button variant="gradient" size="lg" className="w-full" onClick={startScan} loading={state === 'scanning'}>
                <CreditCard className="h-5 w-5" />
                {state === 'scanning' ? 'Lecture NFC...' : 'Scanner la carte eID'}
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => { setState('manual'); setErrorMessage(''); }}>
                <Keyboard className="h-4 w-4" />
                Saisie manuelle du NISS
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="h-16 w-16 rounded-full bg-mc-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-mc-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Echec de lecture</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs">{errorMessage}</p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={startScan} className="flex-1">
                <RotateCcw className="h-4 w-4" />
                Reessayer
              </Button>
              <Button variant="gradient" onClick={() => setState('manual')} className="flex-1">
                <Keyboard className="h-4 w-4" />
                Saisie manuelle
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Card>
              <h3 className="text-sm font-semibold mb-3">Saisie manuelle</h3>
              <Input
                label="Numero national (NISS)"
                placeholder="85.07.15-123.45"
                icon={<Hash className="h-4 w-4" />}
                value={manualNISS}
                onChange={(event) => { setManualNISS(event.target.value); setErrorMessage(''); }}
                error={errorMessage || undefined}
                hint="Format: XX.XX.XX-XXX.XX (11 chiffres)"
              />

              <label className="block mt-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Mode fallback</span>
                <select
                  value={manualFallbackMode}
                  onChange={(event) => setManualFallbackMode(event.target.value as 'barcode' | 'manual_niss')}
                  className="mt-1 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="manual_niss">Saisie manuelle NISS</option>
                  <option value="barcode">Lecture code-barres / sticker</option>
                </select>
              </label>

              <label className="block mt-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Motif du fallback</span>
                <textarea
                  value={manualReason}
                  onChange={(event) => { setManualReason(event.target.value); setErrorMessage(''); }}
                  className="mt-1 min-h-[72px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="Carte illisible, sticker mutuelle, patient sans support electronique..."
                />
              </label>

              {patientsError && (
                <p className="text-xs text-mc-red-500 mt-2">
                  La liste des patients n'est pas disponible pour la recherche immediate.
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setState('idle')} className="flex-1">
                  Annuler
                </Button>
                <Button variant="gradient" onClick={handleManualSubmit} className="flex-1">
                  Rechercher
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {state === 'success' && eid && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle className="h-5 w-5 text-mc-green-500" />
              <span className="text-sm font-medium text-mc-green-600 dark:text-mc-green-400">
                {eid.chipAuthSuccess ? 'Authentification NFC reussie' : 'Identification manuelle'}
              </span>
            </div>

            <Card gradient className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${eid.firstName} ${eid.lastName}`} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold truncate">
                    {eid.firstName} {eid.lastName}
                  </h3>
                  <Badge variant={eid.chipAuthSuccess ? 'green' : 'amber'} dot>
                    {eid.chipAuthSuccess ? 'eID verifie' : 'Fallback trace'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">NISS</p>
                    <p className="font-mono font-medium">{eid.nationalNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Ne(e) le</p>
                    <p className="font-medium">{eid.dateOfBirth}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">Adresse</p>
                    <p className="font-medium">
                      {eid.address.street} {eid.address.houseNumber}, {eid.address.postalCode} {eid.address.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-sm">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Trace d'identification</p>
                <p className="font-medium">
                  {eid.chipAuthSuccess
                    ? 'Lecture eID/ISI+ puce'
                    : manualFallbackMode === 'barcode'
                      ? 'Fallback code-barres / sticker'
                      : 'Fallback manuel NISS'}
                </p>
                {!eid.chipAuthSuccess && manualReason.trim() && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{manualReason.trim()}</p>
                )}
              </div>
            </Card>

            {!matchedPatient && errorMessage && (
              <Card className="border-mc-amber-200 dark:border-amber-800">
                <p className="text-sm text-[var(--text-secondary)]">{errorMessage}</p>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetToIdle} className="flex-1">
                <RotateCcw className="h-4 w-4" />
                Autre patient
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                disabled={!matchedPatient}
                onClick={() => matchedPatient && navigate(`/nurse/patients/${matchedPatient.id}`)}
              >
                {matchedPatient ? 'Continuer' : 'Patient introuvable'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
