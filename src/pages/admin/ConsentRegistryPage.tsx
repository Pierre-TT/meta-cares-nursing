import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  Eye,
  HeartHandshake,
  Link2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  AnimatedPage,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  GradientHeader,
  Modal,
} from '@/design-system';
import { eHealthComplianceQueryKeys, useAdminEHealthCompliance } from '@/hooks/useEHealthCompliance';
import { syncConsentRegistry } from '@/lib/eHealthConsent';

export function ConsentRegistryPage() {
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'info' } | null>(null);
  const { data } = useAdminEHealthCompliance();
  const queryClient = useQueryClient();
  const consents = data.consents;
  const reviewPatients = consents.patientConsents.filter(
    (row) => row.consent !== 'active' || row.therapeuticLink !== 'ok'
  );
  const flaggedPatientIds = reviewPatients.map((row) => row.patientId);

  const syncRegistryMutation = useMutation({
    mutationFn: () =>
      syncConsentRegistry(flaggedPatientIds, {
        syncType: 'full',
        reason: 'admin-consent-registry-bulk-sync',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eHealthComplianceQueryKeys.all });
      setFeedback({
        tone: 'info',
        message: `Synchronisation relancee pour ${flaggedPatientIds.length} patient(s).`,
      });
    },
    onError: () => {
      setFeedback({
        tone: 'error',
        message: 'Synchronisation indisponible pour le moment.',
      });
    },
  });

  const coveredAccess = Number(consents.accessAudit.find((item) => item.label.includes('couverts'))?.value ?? 0);
  const exclusionsTracked = Number(
    consents.accessAudit.find((item) => item.label.includes('exclusion'))?.value ?? 0
  );
  const totalAccessEvents = consents.accessAudit.reduce((sum, item) => sum + Number(item.value), 0);
  const coverage = totalAccessEvents > 0 ? Math.round((coveredAccess / totalAccessEvents) * 100) : 0;
  const syncGapCount = consents.syncGaps.filter((item) => item.severity !== 'green').length;

  function openAuditQueue() {
    setReviewOpen(false);
    setFeedback({
      tone: 'info',
      message: 'Revue redirigee vers la file audit.',
    });
    navigate('/admin/audit');
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<HeartHandshake className="h-5 w-5" />}
        title="Registre des consentements"
        subtitle="Consentement eclaire, liens therapeutiques, exclusions et controles d acces"
        badge={<Badge variant="blue">{coverage}% couverture</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{coverage}%</p>
            <p className="text-[10px] text-white/60">Consentements actifs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{exclusionsTracked}</p>
            <p className="text-[10px] text-white/60">Exclusions suivies</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{syncGapCount}</p>
            <p className="text-[10px] text-white/60">Sync gaps</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 p-3 rounded-xl border ${
            feedback.tone === 'error'
              ? 'bg-mc-red-500/10 border-mc-red-500/20'
              : 'bg-mc-blue-500/10 border-mc-blue-500/20'
          }`}
        >
          {feedback.tone === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-mc-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Gap de synchronisation eHealth</p>
            <p className="text-xs text-[var(--text-muted)]">{consents.syncNotice}</p>
          </div>
          <Badge variant={flaggedPatientIds.length > 0 ? 'amber' : 'green'}>
            {flaggedPatientIds.length > 0 ? 'Action requise' : 'A jour'}
          </Badge>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Couverture patient</CardTitle>
          <Badge variant="outline">Consent & link</Badge>
        </CardHeader>
        <div className="space-y-3">
          {consents.patientConsents.map((row) => (
            <div key={row.patientId} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{row.patient}</p>
                  <p className="text-xs text-[var(--text-muted)]">{row.exclusion}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Dernier sync {row.lastSync}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={row.consent === 'active' ? 'green' : row.consent === 'renewal' ? 'amber' : 'red'}>
                    {row.consent === 'active'
                      ? 'Consent actif'
                      : row.consent === 'renewal'
                        ? 'A renouveler'
                        : 'Absent'}
                  </Badge>
                  <Badge
                    variant={
                      row.therapeuticLink === 'ok'
                        ? 'blue'
                        : row.therapeuticLink === 'review'
                          ? 'amber'
                          : 'red'
                    }
                  >
                    {row.therapeuticLink === 'ok'
                      ? 'Lien OK'
                      : row.therapeuticLink === 'review'
                        ? 'Lien a revoir'
                        : 'Acces bloque'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ecarts de synchronisation</CardTitle>
            <Badge variant="amber">Interop</Badge>
          </CardHeader>
          <div className="space-y-3">
            {consents.syncGaps.map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.severity === 'green' ? (
                      <CheckCircle className="h-4 w-4 text-mc-green-500" />
                    ) : item.severity === 'amber' ? (
                      <Clock3 className="h-4 w-4 text-mc-amber-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-mc-red-500" />
                    )}
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <Badge variant={item.severity === 'green' ? 'green' : item.severity === 'amber' ? 'amber' : 'red'}>
                    {item.severity === 'green' ? 'OK' : item.severity === 'amber' ? 'Suivi' : 'Bloquant'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compteurs d audit</CardTitle>
            <Badge variant="green">24h</Badge>
          </CardHeader>
          <div className="space-y-3">
            {consents.accessAudit.map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.tone === 'green' ? (
                      <ShieldCheck className="h-4 w-4 text-mc-green-500" />
                    ) : item.tone === 'amber' ? (
                      <Link2 className="h-4 w-4 text-mc-amber-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-mc-blue-500" />
                    )}
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      item.tone === 'green'
                        ? 'text-mc-green-500'
                        : item.tone === 'amber'
                          ? 'text-mc-amber-500'
                          : 'text-mc-blue-500'
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => syncRegistryMutation.mutate()}
          disabled={syncRegistryMutation.isPending || flaggedPatientIds.length === 0}
        >
          <RefreshCw className="h-4 w-4" />
          {syncRegistryMutation.isPending
            ? 'Synchronisation...'
            : `Re-synchroniser${flaggedPatientIds.length > 0 ? ` (${flaggedPatientIds.length})` : ''}`}
        </Button>
        <Button
          variant="gradient"
          className="justify-start"
          disabled={flaggedPatientIds.length === 0}
          onClick={() => {
            setReviewOpen(true);
            setFeedback({
              tone: 'info',
              message: `Liste de revue ouverte pour ${flaggedPatientIds.length} patient(s).`,
            });
          }}
        >
          <HeartHandshake className="h-4 w-4" />
          {flaggedPatientIds.length > 0 ? `Patients a revoir (${flaggedPatientIds.length})` : 'Aucune revue en attente'}
        </Button>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Patients a revoir">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Patients avec consentement incomplet, renouvellement a lancer ou lien therapeutique a verifier.
          </p>

          <div className="space-y-3">
            {reviewPatients.map((row) => (
              <div
                key={row.patientId}
                className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{row.patient}</p>
                    <p className="text-xs text-[var(--text-muted)]">{row.exclusion}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Dernier sync {row.lastSync}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={row.consent === 'missing' ? 'red' : 'amber'}>
                      {row.consent === 'missing' ? 'Consent absent' : 'Renouvellement'}
                    </Badge>
                    <Badge variant={row.therapeuticLink === 'blocked' ? 'red' : 'amber'}>
                      {row.therapeuticLink === 'blocked' ? 'Acces bloque' : 'Lien a revoir'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={openAuditQueue}>Ouvrir audit</Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
