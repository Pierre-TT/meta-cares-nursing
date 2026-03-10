import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  User,
  Link2,
  Eye,
  History,
} from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, Input, EmptyState } from '@/design-system';
import { eHealthComplianceQueryKeys } from '@/hooks/useEHealthCompliance';
import { useConsentAccessAudit } from '@/hooks/useConsentAccessAudit';
import {
  getConsentHistory,
  hasTrackedExclusion,
  listConsentRegistry,
  syncConsentRegistry,
  syncPatientConsent,
  type ConsentHistoryEntry,
  type ConsentRegistryEntry,
} from '@/lib/eHealthConsent';

const consentRegistryQueryKey = ['ehealth-consent-registry', 'nurse'] as const;

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Jamais synchronise';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSourceLabel(source: string) {
  switch (source) {
    case 'local-fallback':
      return 'Fallback local';
    case 'ehealth-api':
      return 'Passerelle eHealth';
    default:
      return source.replace(/[_-]+/g, ' ');
  }
}

function requiresReview(entry: ConsentRegistryEntry) {
  return (
    entry.consentStatus !== 'active' ||
    entry.therapeuticLinkStatus !== 'ok' ||
    entry.latestSyncStatus === 'error'
  );
}

function getConsentBadge(entry: ConsentRegistryEntry) {
  switch (entry.consentStatus) {
    case 'active':
      return { label: 'Consentement actif', variant: 'green' as const };
    case 'renewal':
      return { label: 'A renouveler', variant: 'amber' as const };
    default:
      return { label: 'Consentement absent', variant: 'red' as const };
  }
}

function getTherapeuticLinkBadge(entry: ConsentRegistryEntry) {
  switch (entry.therapeuticLinkStatus) {
    case 'ok':
      return { label: 'Lien therapeutique OK', variant: 'blue' as const };
    case 'review':
      return { label: 'Lien a revoir', variant: 'amber' as const };
    default:
      return { label: 'Acces bloque', variant: 'red' as const };
  }
}

function getSyncBadge(entry: ConsentRegistryEntry) {
  switch (entry.latestSyncStatus) {
    case 'success':
      return { label: 'Sync confirmee', variant: 'green' as const };
    case 'fallback':
      return { label: 'Sync de secours', variant: 'amber' as const };
    case 'error':
      return { label: 'Erreur de sync', variant: 'red' as const };
    case 'pending':
      return { label: 'Sync en attente', variant: 'blue' as const };
    default:
      return { label: 'Historique incomplet', variant: 'outline' as const };
  }
}

function getHistoryBadge(entry: ConsentHistoryEntry) {
  switch (entry.status) {
    case 'success':
      return 'green' as const;
    case 'fallback':
      return 'amber' as const;
    case 'error':
      return 'red' as const;
    default:
      return 'blue' as const;
  }
}

export function ConsentPage() {
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data: registry = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: consentRegistryQueryKey,
    queryFn: listConsentRegistry,
  });
  const {
    data: history = [],
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['ehealth-consent-history', selectedPatientId ?? 'all'],
    queryFn: () => getConsentHistory(selectedPatientId ?? undefined),
  });
  const accessAuditQuery = useConsentAccessAudit(selectedPatientId ?? undefined);

  const flaggedPatientIds = useMemo(
    () => registry.filter(requiresReview).map((entry) => entry.patientId),
    [registry],
  );
  const filteredRegistry = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return registry;
    }

    return registry.filter((entry) =>
      [
        entry.patientName,
        entry.patientNissMasked,
        entry.exclusionNote,
        entry.source,
        entry.latestSyncStatus ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [registry, search]);
  const selectedEntry = registry.find((entry) => entry.patientId === selectedPatientId) ?? null;

  const invalidateConsentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: consentRegistryQueryKey }),
      queryClient.invalidateQueries({ queryKey: eHealthComplianceQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['ehealth-consent-history'] }),
      queryClient.invalidateQueries({ queryKey: ['consent-access-audit'] }),
    ]);
  };

  const syncPatientMutation = useMutation({
    mutationFn: (patientId: string) =>
      syncPatientConsent(patientId, {
        syncType: 'full',
        reason: 'nurse-consent-page-manual-sync',
      }),
    onSuccess: invalidateConsentQueries,
  });

  const syncRegistryMutation = useMutation({
    mutationFn: () =>
      syncConsentRegistry(flaggedPatientIds, {
        syncType: 'full',
        reason: 'nurse-consent-page-bulk-sync',
      }),
    onSuccess: invalidateConsentQueries,
  });

  const compliantCount = registry.filter(
    (entry) => entry.consentStatus === 'active' && entry.therapeuticLinkStatus === 'ok',
  ).length;
  const issueCount = flaggedPatientIds.length;
  const fallbackCount = registry.filter((entry) => entry.latestSyncStatus === 'fallback').length;
  const syncError = (syncPatientMutation.error ?? syncRegistryMutation.error) as Error | null;
  const accessEvents = accessAuditQuery.data?.events ?? [];
  const tracedAccessCount = accessEvents.filter((event) => event.containsPii || event.patientId).length;
  const criticalAccessCount = accessEvents.filter((event) => event.severity === 'high').length;

  return (
    <AnimatedPage className="px-4 py-6 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Consentements & acces eHealth"
        subtitle="Cockpit patient des consentements, liens therapeutiques, synchronisations et acces traces"
        badge={
          <Badge variant={selectedEntry ? 'blue' : issueCount > 0 ? 'amber' : 'green'}>
            {selectedEntry ? selectedEntry.patientName : issueCount > 0 ? `${issueCount} patient(s) a revoir` : 'Registre aligne'}
          </Badge>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{registry.length}</p>
            <p className="text-[10px] text-white/60">Patients suivis</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{compliantCount}</p>
            <p className="text-[10px] text-white/60">Conformes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{accessEvents.length}</p>
            <p className="text-[10px] text-white/60">Acces visibles</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card glass className="text-center">
          <CheckCircle2 className="h-5 w-5 text-mc-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{compliantCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Consentements & liens OK</p>
        </Card>
        <Card glass className="text-center">
          <AlertTriangle className="h-5 w-5 text-mc-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{issueCount}</p>
          <p className="text-xs text-[var(--text-muted)]">A regulariser</p>
        </Card>
        <Card glass className="text-center">
          <Clock className="h-5 w-5 text-mc-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{fallbackCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Fallback local</p>
        </Card>
        <Card glass className="text-center">
          <Eye className="h-5 w-5 text-mc-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{tracedAccessCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Acces traces</p>
        </Card>
      </div>

      <Card className={issueCount > 0 ? 'border-l-4 border-l-mc-amber-500' : 'border-l-4 border-l-mc-green-500'}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-4 w-4 mt-0.5 ${issueCount > 0 ? 'text-mc-amber-500' : 'text-mc-green-500'}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {issueCount > 0 ? 'Des patients necessitent une re-synchronisation ou une regularisation.' : 'Le registre est stabilise sur les dossiers affiches.'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Selectionnez un patient pour ouvrir le cockpit detaille, revoir l historique de synchronisation et verifier les acces traces sur son dossier.
            </p>
          </div>
          {selectedEntry && (
            <Button variant="outline" size="sm" onClick={() => setSelectedPatientId(null)}>
              Vue globale
            </Button>
          )}
        </div>
      </Card>

      {syncError && (
        <Card className="border border-mc-red-500/20">
          <div className="flex items-start gap-3 text-sm text-mc-red-600">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">La synchronisation n a pas abouti.</p>
              <p className="text-xs text-[var(--text-muted)]">{syncError.message}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-2">
        <div className="flex-1">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Rechercher un patient, une source ou un statut..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
        <Button
          variant="gradient"
          loading={syncRegistryMutation.isPending}
          disabled={flaggedPatientIds.length === 0 || syncPatientMutation.isPending}
          onClick={() => syncRegistryMutation.mutate()}
        >
          <RefreshCw className="h-4 w-4" />
          {flaggedPatientIds.length > 0 ? `Re-synchroniser (${flaggedPatientIds.length})` : 'Tout est synchronise'}
        </Button>
      </div>

      {selectedEntry && (
        <Card className={requiresReview(selectedEntry) ? 'border-l-4 border-l-mc-amber-500' : 'border-l-4 border-l-mc-green-500'}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-mc-blue-500/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-mc-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{selectedEntry.patientName}</p>
                  <Badge variant="outline" className="font-mono">{selectedEntry.patientNissMasked}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Dernier sync: {formatDateTime(selectedEntry.lastSyncAt)} · Source: {formatSourceLabel(selectedEntry.source)}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={getConsentBadge(selectedEntry).variant}>{getConsentBadge(selectedEntry).label}</Badge>
                  <Badge variant={getTherapeuticLinkBadge(selectedEntry).variant}>{getTherapeuticLinkBadge(selectedEntry).label}</Badge>
                  <Badge variant={getSyncBadge(selectedEntry).variant}>{getSyncBadge(selectedEntry).label}</Badge>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              loading={syncPatientMutation.isPending && syncPatientMutation.variables === selectedEntry.patientId}
              disabled={syncRegistryMutation.isPending}
              onClick={() => syncPatientMutation.mutate(selectedEntry.patientId)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-synchroniser ce patient
            </Button>
          </div>

          <div className="mt-3 rounded-xl bg-[var(--bg-secondary)] p-3">
            <p className="text-xs font-medium text-[var(--text-primary)]">Exclusions et restrictions</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{selectedEntry.exclusionNote}</p>
          </div>
        </Card>
      )}

      <div className="grid xl:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-mc-blue-500" />
              <p className="text-sm font-semibold">
                {selectedEntry ? 'Historique de synchronisation' : 'Dernieres synchronisations'}
              </p>
            </div>
            <Badge variant="outline">{history.length}</Badge>
          </div>

          {isHistoryLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Chargement de l historique eHealth...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucune synchronisation tracee pour le filtre courant.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{entry.patientName}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {entry.syncType} · {formatSourceLabel(entry.source)} · {formatDateTime(entry.syncedAt)}
                      </p>
                    </div>
                    <Badge variant={getHistoryBadge(entry)}>{entry.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">{entry.detail}</p>
                  {entry.responseCode && (
                    <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">{entry.responseCode}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-mc-blue-500" />
              <p className="text-sm font-semibold">
                {selectedEntry ? 'Journal d acces' : 'Acces traces'}
              </p>
            </div>
            <Badge variant={criticalAccessCount > 0 ? 'amber' : 'outline'}>
              {criticalAccessCount > 0 ? `${criticalAccessCount} critique(s)` : `${accessEvents.length} evenement(s)`}
            </Badge>
          </div>

          {accessAuditQuery.isLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Chargement du journal d acces...</p>
          ) : accessAuditQuery.data?.visibility === 'restricted' ? (
            <div className="rounded-xl border border-mc-amber-500/20 bg-mc-amber-500/10 p-3">
              <p className="text-sm font-medium text-mc-amber-700">Journal restreint</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Le role infirmier n a pas encore acces a ce journal dans cet environnement. Appliquez la migration de politique RLS pour exposer les acces patients assignes.
              </p>
            </div>
          ) : accessAuditQuery.data?.visibility === 'unavailable' ? (
            <p className="text-sm text-[var(--text-muted)]">Le journal d acces n est pas encore disponible sur ce projet.</p>
          ) : accessEvents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucun acces trace pour le filtre courant.</p>
          ) : (
            <div className="space-y-2">
              {accessEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{event.actorLabel}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {event.actorRole} · {event.actionLabel} · {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                    <Badge variant={event.severity === 'high' ? 'red' : event.severity === 'medium' ? 'amber' : 'outline'}>
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="text-xs mt-2">{event.resourceLabel}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {event.patientName}{event.containsPii ? ' · donnees sensibles' : ''}{event.systemGenerated ? ' · systeme' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {isLoading ? (
        <Card className="text-center py-8">
          <Clock className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm">Chargement du registre eHealth...</p>
        </Card>
      ) : error ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="Registre indisponible"
          description={(error as Error).message}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reessayer
            </Button>
          }
        />
      ) : filteredRegistry.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Aucun patient trouve"
          description="Ajustez la recherche pour retrouver un dossier de consentement."
        />
      ) : (
        <div className="space-y-4">
          {filteredRegistry.map((entry) => {
            const consentBadge = getConsentBadge(entry);
            const therapeuticLinkBadge = getTherapeuticLinkBadge(entry);
            const syncBadge = getSyncBadge(entry);
            const isPatientSyncing =
              syncPatientMutation.isPending && syncPatientMutation.variables === entry.patientId;
            const isSelected = selectedPatientId === entry.patientId;

            return (
              <Card
                key={entry.patientId}
                className={`${requiresReview(entry) ? 'border-l-4 border-l-mc-amber-500' : 'border-l-4 border-l-mc-green-500'} ${isSelected ? 'ring-2 ring-mc-blue-500/30' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(isSelected ? null : entry.patientId)}
                    className="flex items-start gap-3 text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-mc-blue-500/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-mc-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{entry.patientName}</p>
                        <Badge variant="outline" className="font-mono">{entry.patientNissMasked}</Badge>
                        {isSelected && <Badge variant="blue">Cockpit ouvert</Badge>}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Dernier sync: {formatDateTime(entry.lastSyncAt)} · Source: {formatSourceLabel(entry.source)}
                      </p>
                      {entry.latestResponseCode && (
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">
                          Reponse: {entry.latestResponseCode}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatientId(isSelected ? null : entry.patientId)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isSelected ? 'Fermer le cockpit' : 'Ouvrir le cockpit'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isPatientSyncing}
                      disabled={syncRegistryMutation.isPending}
                      onClick={() => syncPatientMutation.mutate(entry.patientId)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-synchroniser
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={consentBadge.variant}>{consentBadge.label}</Badge>
                  <Badge variant={therapeuticLinkBadge.variant}>{therapeuticLinkBadge.label}</Badge>
                  <Badge variant={syncBadge.variant}>{syncBadge.label}</Badge>
                </div>

                {hasTrackedExclusion(entry) ? (
                  <div className="mt-3 p-3 rounded-xl bg-mc-amber-500/10 border border-mc-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Link2 className="h-4 w-4 text-mc-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-mc-amber-700 dark:text-mc-amber-300">
                          Exclusion ou restriction suivie
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{entry.exclusionNote}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    {entry.exclusionNote}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
