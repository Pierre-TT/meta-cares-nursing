import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, RefreshCw, Search, Send, Shield, XCircle } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Input, Modal, StatRing, Tabs } from '@/design-system';
import { useEAgreementRequests } from '@/hooks/useEAgreementData';
import {
  getDaysUntilEAgreementEnd,
  getEAgreementPresentationLabel,
  getEAgreementPresentationStatus,
  getEAgreementPresentationVariant,
  type EAgreementPresentationStatus,
} from '@/lib/eagreements';
import { maskNiss, matchesNissSearch } from '@/lib/niss';

type AgreementManagerTab = 'all' | 'expiring' | 'pending' | 'rejected';

const statusIcons: Record<EAgreementPresentationStatus, React.ReactNode> = {
  active: <CheckCircle className="h-4 w-4 text-mc-green-500" />,
  expiring: <Clock className="h-4 w-4 text-mc-amber-500" />,
  expired: <AlertTriangle className="h-4 w-4 text-mc-red-500" />,
  pending: <RefreshCw className="h-4 w-4 text-mc-blue-500" />,
  rejected: <XCircle className="h-4 w-4 text-mc-red-500" />,
  cancelled: <XCircle className="h-4 w-4 text-mc-red-500" />,
  draft: <Clock className="h-4 w-4 text-[var(--text-muted)]" />,
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-BE');
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgreementManagerPage() {
  const [activeTab, setActiveTab] = useState<AgreementManagerTab>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [preparedRenewals, setPreparedRenewals] = useState<Set<string>>(new Set());
  const [relaunchedRequests, setRelaunchedRequests] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useEAgreementRequests();

  const counts = useMemo(() => {
    return requests.reduce(
      (summary, request) => {
        const status = getEAgreementPresentationStatus(request);

        if (status === 'active') summary.active += 1;
        else if (status === 'expiring' || status === 'expired') summary.renewal += 1;
        else if (status === 'pending' || status === 'draft') summary.pending += 1;
        else if (status === 'rejected' || status === 'cancelled') summary.rejected += 1;

        return summary;
      },
      { active: 0, renewal: 0, pending: 0, rejected: 0 }
    );
  }, [requests]);

  const tabs = [
    { id: 'all', label: 'Tous', count: requests.length },
    { id: 'expiring', label: 'A renouveler', count: counts.renewal },
    { id: 'pending', label: 'En cours', count: counts.pending },
    { id: 'rejected', label: 'Refuses', count: counts.rejected },
  ];

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const presentationStatus = getEAgreementPresentationStatus(request);

      if (activeTab === 'expiring' && presentationStatus !== 'expiring' && presentationStatus !== 'expired') return false;
      if (activeTab === 'pending' && presentationStatus !== 'pending' && presentationStatus !== 'draft') return false;
      if (activeTab === 'rejected' && presentationStatus !== 'rejected' && presentationStatus !== 'cancelled') return false;
      if (!normalizedSearch) return true;

      const haystack = [
        request.patient.fullName,
        request.patient.mutuality,
        request.nomenclature,
        request.careType,
        request.mycarenetReference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch) || matchesNissSearch(request.patient.niss, search);
    });
  }, [activeTab, requests, search]);

  const historyRequest = historyId ? requests.find((request) => request.id === historyId) ?? null : null;

  function handlePrepareRenewal(requestId: string, patientName: string) {
    setPreparedRenewals((previous) => new Set(previous).add(requestId));
    setFeedback(`Renouvellement prepare pour ${patientName}.`);
  }

  function handleRelaunch(requestId: string, patientName: string) {
    setRelaunchedRequests((previous) => new Set(previous).add(requestId));
    setFeedback(`Relance MyCareNet enregistree pour ${patientName}.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader icon={<Shield className="h-5 w-5" />} title="Accords (eAgreement)" subtitle="Gestion centralisee MyCareNet">
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{requests.length}</p>
            <p className="text-[10px] text-white/60">Total</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{counts.active}</p>
            <p className="text-[10px] text-white/60">Actifs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${counts.renewal > 0 ? 'text-mc-amber-300' : 'text-mc-green-300'}`}>{counts.renewal}</p>
            <p className="text-[10px] text-white/60">A renouveler</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <Shield className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center py-3">
          <StatRing value={counts.active} max={Math.max(requests.length, 1)} color="green" label="Actifs" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={counts.renewal} max={Math.max(requests.length, 1)} color="amber" label="Renouvellement" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={counts.pending} max={Math.max(requests.length, 1)} color="blue" label="En attente" />
        </Card>
      </div>

      {counts.renewal > 0 && (
        <div className="p-3 rounded-xl bg-mc-amber-500/10 border border-mc-amber-500/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-mc-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-mc-amber-600">{counts.renewal} accord(s) a renouveler</p>
            <p className="text-xs text-[var(--text-muted)]">La facturation et le terrain consultent la meme source persistante.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('expiring')}>
            Ouvrir
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher patient, NISS, mutuelle..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(tabId) => setActiveTab(tabId as AgreementManagerTab)} />

      <div className="space-y-3">
        {isLoading ? (
          <Card className="text-center py-8">
            <Clock className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Chargement du registre eAgreement...</p>
          </Card>
        ) : error ? (
          <Card className="border border-mc-red-500/20">
            <div className="flex items-start gap-3 text-sm text-mc-red-600">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Le registre n'a pas pu etre charge.</p>
                <p className="text-xs text-[var(--text-muted)]">{(error as Error).message}</p>
              </div>
            </div>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="text-center py-8">
            <Shield className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Aucun accord trouve</p>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const presentationStatus = getEAgreementPresentationStatus(request);
            const daysLeft = getDaysUntilEAgreementEnd(request);
            const isExpanded = expandedId === request.id;
            const renewalPrepared = preparedRenewals.has(request.id);
            const requestRelaunched = relaunchedRequests.has(request.id);

            return (
              <Card key={request.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                <div className="flex items-start gap-3">
                  {statusIcons[presentationStatus]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{request.patient.fullName || 'Patient non resolu'}</p>
                      <Badge variant={getEAgreementPresentationVariant(presentationStatus)}>{getEAgreementPresentationLabel(presentationStatus)}</Badge>
                      {renewalPrepared && <Badge variant="blue">Renouvellement pret</Badge>}
                      {requestRelaunched && <Badge variant="amber">Relance envoyee</Badge>}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{maskNiss(request.patient.niss)} - {request.patient.mutuality || 'Mutuelle inconnue'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {request.katzCategory && <Badge variant="blue">Forfait {request.katzCategory}</Badge>}
                      <span className="text-xs text-[var(--text-muted)]">{formatDate(request.startAt)} to {formatDate(request.endAt)}</span>
                      {(presentationStatus === 'active' || presentationStatus === 'expiring') && daysLeft > 0 && (
                        <span className="text-[10px] font-medium text-mc-amber-500">{daysLeft}j restants</span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div><span className="text-[var(--text-muted)]">Type:</span> <span className="font-medium">{request.careType}</span></div>
                      <div><span className="text-[var(--text-muted)]">Creee par:</span> <span className="font-medium">{request.createdBy?.fullName ?? 'Non attribue'}</span></div>
                      <div><span className="text-[var(--text-muted)]">Nomenclature:</span> <span className="font-medium">{request.nomenclature}</span></div>
                      <div><span className="text-[var(--text-muted)]">Prescripteur:</span> <span className="font-medium">{request.prescriberName || '-'}</span></div>
                      {request.mycarenetReference && (
                        <div><span className="text-[var(--text-muted)]">Ref. MyCareNet:</span> <span className="font-mono font-medium">{request.mycarenetReference}</span></div>
                      )}
                      <div><span className="text-[var(--text-muted)]">Soumise le:</span> <span className="font-medium">{formatDateTime(request.submittedAt ?? request.createdAt)}</span></div>
                      {request.hadEpisodeReference && (
                        <div><span className="text-[var(--text-muted)]">Episode HAD:</span> <span className="font-medium">{request.hadEpisodeReference}</span></div>
                      )}
                      {request.reviewedBy?.fullName && (
                        <div><span className="text-[var(--text-muted)]">Revu par:</span> <span className="font-medium">{request.reviewedBy.fullName}</span></div>
                      )}
                    </div>

                    {request.rejectionReason && (
                      <div className="p-2 rounded-lg bg-mc-red-500/10 text-xs text-mc-red-600">
                        <strong>Motif de refus:</strong> {request.rejectionReason}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {(presentationStatus === 'expired' || presentationStatus === 'expiring') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePrepareRenewal(request.id, request.patient.fullName || 'patient');
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Preparer le renouvellement
                        </Button>
                      )}
                      {(presentationStatus === 'rejected' || presentationStatus === 'cancelled') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRelaunch(request.id, request.patient.fullName || 'patient');
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Relancer la demande
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setHistoryId(request.id);
                        }}
                      >
                        Historique
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Modal open={Boolean(historyRequest)} onClose={() => setHistoryId(null)} title={historyRequest ? `Historique ${historyRequest.patient.fullName}` : 'Historique'}>
        {historyRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Reference</p>
                <p className="font-semibold">{historyRequest.mycarenetReference || 'En preparation'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">NISS</p>
                <p className="font-semibold">{maskNiss(historyRequest.patient.niss)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p><span className="text-[var(--text-muted)]">Creation:</span> {formatDateTime(historyRequest.createdAt)}</p>
              <p><span className="text-[var(--text-muted)]">Soumission:</span> {formatDateTime(historyRequest.submittedAt ?? historyRequest.createdAt)}</p>
              <p><span className="text-[var(--text-muted)]">Decision:</span> {formatDateTime(historyRequest.decidedAt)}</p>
              <p><span className="text-[var(--text-muted)]">Statut:</span> {getEAgreementPresentationLabel(getEAgreementPresentationStatus(historyRequest))}</p>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setHistoryId(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}
