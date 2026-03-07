import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CarFront,
  CheckCircle,
  Clock,
  MapPin,
  PenLine,
  Send,
  Printer,
  Mic,
  Route,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, AnimatedPage } from '@/design-system';
import { useNurseVisitSummary, useSignNurseVisit } from '@/hooks/useNurseClinicalData';
import { getHourlyPilotPlaceLabel, getHourlyPilotSegmentLabel } from '@/lib/hourlyPilot';
import { useNursePatient } from '@/hooks/useNursePatients';
import { parseNurseVisitSignature } from '@/lib/nurseClinical';
import { useAuthStore } from '@/stores/authStore';

function formatVisitDate(value: string) {
  return new Date(value).toLocaleDateString('fr-BE');
}

function formatVisitTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatVisitDuration(start: string, end?: string) {
  if (!end) {
    return '—';
  }

  const durationMinutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );

  if (durationMinutes >= 60) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours} h ${minutes.toString().padStart(2, '0')}`;
  }

  return `${durationMinutes} min`;
}

function getStatusVariant(status: 'planned' | 'in_progress' | 'completed' | 'cancelled') {
  switch (status) {
    case 'completed':
      return 'green';
    case 'in_progress':
      return 'blue';
    case 'cancelled':
      return 'red';
    default:
      return 'outline';
  }
}

function getHourlyStatusBadgeVariant(status?: string) {
  switch (status) {
    case 'validated':
      return 'green';
    case 'review':
      return 'amber';
    case 'exported':
      return 'blue';
    default:
      return 'outline';
  }
}

function getHourlyStatusLabel(status?: string) {
  switch (status) {
    case 'validated':
      return 'Validé';
    case 'review':
      return 'À revoir';
    case 'exported':
      return 'Exporté';
    default:
      return 'Brouillon';
  }
}

function getStatusLabel(status: 'planned' | 'in_progress' | 'completed' | 'cancelled') {
  switch (status) {
    case 'completed':
      return 'Terminée';
    case 'in_progress':
      return 'En cours';
    case 'cancelled':
      return 'Annulée';
    default:
      return 'Planifiée';
  }
}

export function VisitSummaryPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const requestedVisitId = (location.state as { visitId?: string } | null)?.visitId;
  const { data: patient, isLoading, error, refetch } = useNursePatient(id);
  const {
    data: visit,
    isLoading: isVisitLoading,
    error: visitError,
    refetch: refetchVisit,
  } = useNurseVisitSummary(patient?.databaseId, requestedVisitId);
  const signVisitMutation = useSignNurseVisit();

  const totalW = visit?.totalW ?? 0;
  const totalEuro = totalW * 7.25;
  const parsedSignature = parseNurseVisitSignature(visit?.signature);
  const signed = Boolean(parsedSignature);
  const hourlyPilot = visit?.hourlyPilot;
  const hourlySummary = hourlyPilot?.summary;

  const vitalsSummary = useMemo(() => {
    if (!visit) {
      return [];
    }

    return [
      visit.vitals.bloodPressureSystolic !== undefined && visit.vitals.bloodPressureDiastolic !== undefined
        ? { label: 'TA', value: `${visit.vitals.bloodPressureSystolic}/${visit.vitals.bloodPressureDiastolic}`, unit: 'mmHg' }
        : null,
      visit.vitals.heartRate !== undefined
        ? { label: 'Pouls', value: String(visit.vitals.heartRate), unit: 'bpm' }
        : null,
      visit.vitals.temperature !== undefined
        ? { label: 'Temp.', value: String(visit.vitals.temperature), unit: '°C' }
        : null,
      visit.vitals.oxygenSaturation !== undefined
        ? { label: 'SpO₂', value: String(visit.vitals.oxygenSaturation), unit: '%' }
        : null,
      visit.vitals.glycemia !== undefined
        ? { label: 'Glyc.', value: String(visit.vitals.glycemia), unit: 'mg/dL' }
        : null,
      visit.vitals.weight !== undefined
        ? { label: 'Poids', value: String(visit.vitals.weight), unit: 'kg' }
        : null,
      visit.vitals.pain !== undefined
        ? { label: 'Douleur', value: String(visit.vitals.pain), unit: '/10' }
        : null,
    ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [visit]);

  const handleSign = async () => {
    if (!visit) {
      return;
    }

    setSignatureError(null);

    try {
      await signVisitMutation.mutateAsync({
        visitId: visit.id,
        signerId: user?.id,
        signerName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
    } catch {
      setSignatureError('La signature n’a pas pu être enregistrée.');
    }
  };

  const handleSubmit = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      navigate('/nurse/tour');
    }, 1500);
  };

  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Résumé indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le contexte patient de cette visite n’a pas pu être chargé.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/tour')}>
            Retour à la tournée
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du résumé de visite…</p>
      </AnimatedPage>
    );
  }

  if (visitError) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Résumé indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Les données de visite persistées n’ont pas pu être chargées.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchVisit()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/tour')}>
            Retour à la tournée
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isVisitLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du résumé de visite…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Patient introuvable</h2>
        <Button variant="outline" onClick={() => navigate('/nurse/tour')}>
          Retour à la tournée
        </Button>
      </AnimatedPage>
    );
  }

  if (!visit) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Aucune visite enregistrée</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Aucun résumé de visite persisté n’est disponible pour ce patient.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Retour
          </Button>
          <Button variant="gradient" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
            Démarrer une visite
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Résumé de visite</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {patient.lastName} {patient.firstName} — {formatVisitDate(visit.completedAt ?? visit.scheduledEnd ?? visit.scheduledStart)}
          </p>
        </div>
        <Badge variant={getStatusVariant(visit.status)} dot>{getStatusLabel(visit.status)}</Badge>
      </div>

      <Card gradient className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-mc-blue-500" />
          <div>
            <p className="text-sm font-medium">Durée de visite</p>
            <p className="text-2xl font-bold">{formatVisitDuration(visit.scheduledStart, visit.completedAt ?? visit.scheduledEnd)}</p>
          </div>
        </div>
        <div className="text-right text-sm text-[var(--text-muted)]">
          <p>{formatVisitTime(visit.scheduledStart)} → {formatVisitTime(visit.completedAt ?? visit.scheduledEnd)}</p>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Paramètres vitaux</CardTitle></CardHeader>
        {vitalsSummary.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {vitalsSummary.map((v) => (
              <div key={v.label} className="text-center p-2 rounded-xl bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-muted)]">{v.label}</p>
                <p className="text-sm font-bold">{v.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{v.unit}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Aucun paramètre vital n’a été enregistré pour cette visite.</p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actes réalisés</CardTitle>
          <Badge variant="blue">{visit.acts.length} actes</Badge>
        </CardHeader>
        <div className="space-y-2">
          {visit.acts.length > 0 ? visit.acts.map((act) => (
            <div key={act.code} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <div>
                <p className="text-sm font-medium">{act.label}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">Code {act.code}</p>
              </div>
              <span className="text-sm font-bold font-mono">{act.valueW.toFixed(3)}W</span>
            </div>
          )) : (
            <p className="text-sm text-[var(--text-muted)]">Aucun acte n’a été encodé pour cette visite.</p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
            <span className="text-sm font-semibold">Total</span>
            <div className="text-right">
              <span className="text-sm font-bold font-mono">{totalW.toFixed(3)}W</span>
              <p className="text-xs text-mc-green-500 font-semibold">≈ €{totalEuro.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {hourlyPilot && (
        <Card>
          <CardHeader>
            <CardTitle>Pilote horaire INAMI</CardTitle>
            <Badge variant={getHourlyStatusBadgeVariant(hourlySummary?.status)}>
              {getHourlyStatusLabel(hourlySummary?.status)}
            </Badge>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <Badge variant="outline">{getHourlyPilotPlaceLabel(hourlySummary?.placeOfService ?? 'A')}</Badge>
              <span>{hourlyPilot.locationEvents.length} point(s) GPS</span>
              {hourlySummary?.geofencingCoverageRatio !== undefined && (
                <>
                  <span>•</span>
                  <span>Couverture GPS {Math.round(hourlySummary.geofencingCoverageRatio * 100)}%</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
                <CarFront className="mx-auto h-4 w-4 text-mc-blue-500" />
                <p className="mt-1 text-xs text-[var(--text-muted)]">Déplacement</p>
                <p className="text-sm font-bold">{Math.round(hourlySummary?.totalTravelMinutes ?? 0)} min</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
                <MapPin className="mx-auto h-4 w-4 text-mc-green-500" />
                <p className="mt-1 text-xs text-[var(--text-muted)]">Direct</p>
                <p className="text-sm font-bold">{Math.round(hourlySummary?.totalDirectMinutes ?? 0)} min</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
                <Route className="mx-auto h-4 w-4 text-mc-amber-500" />
                <p className="mt-1 text-xs text-[var(--text-muted)]">Indirect</p>
                <p className="text-sm font-bold">{Math.round(hourlySummary?.totalIndirectMinutes ?? 0)} min</p>
              </div>
            </div>

            {hourlySummary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border-default)] p-3">
                  <p className="text-xs text-[var(--text-muted)]">Montant horaire</p>
                  <p className="text-lg font-bold text-mc-green-500">€{hourlySummary.hourlyAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] p-3">
                  <p className="text-xs text-[var(--text-muted)]">Écart vs forfait</p>
                  <p className={`text-lg font-bold ${hourlySummary.deltaAmount >= 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                    {hourlySummary.deltaAmount >= 0 ? '+' : ''}€{hourlySummary.deltaAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {hourlySummary?.reviewReasons.length ? (
              <div className="rounded-xl border border-mc-amber-200 bg-mc-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-mc-amber-700 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Revue manuelle requise
                </div>
                <ul className="space-y-1 text-sm text-mc-amber-700 dark:text-amber-200">
                  {hourlySummary.reviewReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Lignes / pseudocodes générés</p>
              {hourlyPilot.lines.length > 0 ? (
                hourlyPilot.lines.map((line, index) => (
                  <div
                    key={`${line.code}-${line.segmentType}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{line.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {line.code} · {getHourlyPilotSegmentLabel(line.segmentType)} · {Math.round(line.unitMinutes)} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{line.amount.toFixed(2)}</p>
                      <p className="text-xs text-[var(--text-muted)]">€{line.hourlyRate.toFixed(2)}/h</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Aucune ligne horaire n’a encore été générée.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notes cliniques</CardTitle>
          <Mic className="h-4 w-4 text-[var(--text-muted)]" />
        </CardHeader>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {visit.notes || 'Aucune note clinique enregistrée pour cette visite.'}
        </p>
      </Card>

      <Card className={signed ? 'border-mc-green-200 dark:border-mc-green-800' : ''}>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          {signed && <Badge variant="green" dot>Signé</Badge>}
        </CardHeader>
        {!signed ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl border-2 border-dashed border-[var(--border-default)] flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Zone de signature tactile</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { void handleSign(); }} disabled={signVisitMutation.isPending}>
              <PenLine className="h-4 w-4" />
              {signVisitMutation.isPending ? 'Signature...' : 'Signer la visite'}
            </Button>
            {signatureError && (
              <p className="text-sm text-mc-red-600 dark:text-red-300">{signatureError}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-mc-green-600 dark:text-mc-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>
              {parsedSignature?.signedByName
                ? `Visite signée par ${parsedSignature.signedByName}`
                : 'Signature enregistrée'}
              {parsedSignature?.signedAt
                ? ` le ${formatVisitDate(parsedSignature.signedAt)} à ${formatVisitTime(parsedSignature.signedAt)}`
                : ''}
            </span>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Printer className="h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="gradient"
          size="lg"
          className="flex-[2]"
          disabled={!signed || sending}
          onClick={handleSubmit}
        >
          <Send className="h-4 w-4" />
          {sending ? 'Envoi...' : 'Valider & facturer'}
        </Button>
      </div>
    </AnimatedPage>
  );
}
