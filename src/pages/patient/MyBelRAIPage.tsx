import { Brain, ChevronRight, ClipboardList, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedPage, Badge, Button, Card, GradientHeader } from '@/design-system';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { usePatientHomeData } from '@/hooks/usePlatformData';

function toneToBadgeVariant(tone: 'blue' | 'green' | 'amber' | 'red') {
  return tone;
}

function priorityToBadgeVariant(priority: 'low' | 'medium' | 'high') {
  switch (priority) {
    case 'high':
      return 'red' as const;
    case 'medium':
      return 'amber' as const;
    default:
      return 'blue' as const;
  }
}

export function MyBelRAIPage() {
  const navigate = useNavigate();
  const { data: patientData, isLoading: isPatientLoading } = usePatientHomeData();
  const { linkedPatientId, profile } = patientData;
  const belraiQuery = useBelraiTwin(linkedPatientId ?? undefined);
  const belrai = belraiQuery.data;
  const officialResult = belrai?.officialResult ?? null;
  const sharedResultsReady = Boolean(belrai?.sharedResultsReady && officialResult?.isSharedWithPatient);
  const waitingStatusLabel = officialResult?.statusLabel ?? belrai?.statusLabel ?? 'En preparation';
  const waitingSyncLabel = officialResult?.syncLabel ?? belrai?.syncLabel ?? 'Synthese en preparation';
  const waitingUpdatedLabel = officialResult?.receivedLabel ?? belrai?.lastUpdatedLabel ?? '—';

  if (isPatientLoading) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Chargement de votre espace BelRAI...
          </p>
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title="Mon BelRAI"
        subtitle="Vue citoyenne simplifiee des resultats partages"
        badge={
          <Badge variant={sharedResultsReady ? 'green' : 'amber'}>
            {sharedResultsReady ? 'Disponible' : 'En preparation'}
          </Badge>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{sharedResultsReady ? officialResult?.caps.length ?? 0 : '—'}</p>
            <p className="text-[10px] text-white/60">Priorites</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{sharedResultsReady ? officialResult?.scores.length ?? 0 : '—'}</p>
            <p className="text-[10px] text-white/60">Reperes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{sharedResultsReady ? officialResult?.katz.category ?? '—' : '—'}</p>
            <p className="text-[10px] text-white/60">Katz</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Ce que vous voyez ici</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Cette page affiche uniquement une synthese partagee par votre equipe soignante.
              Les reponses detaillees du screener ne sont pas visibles dans le portail patient.
            </p>
          </div>
          <Badge variant="blue">Protege</Badge>
        </div>
      </Card>

      {!linkedPatientId ? (
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-mc-amber-500" />
            <div>
              <p className="text-sm font-semibold">Dossier BelRAI indisponible</p>
              <p className="text-xs text-[var(--text-muted)]">
                Aucun dossier patient relie n&apos;a encore ete trouve pour {profile.firstName} {profile.lastName}.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate('/patient/messages')}>
            Contacter mon equipe
          </Button>
        </Card>
      ) : belraiQuery.isLoading ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Verification du dernier partage BelRAI...
          </p>
        </Card>
      ) : belraiQuery.error || !belrai ? (
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-mc-red-500" />
            <div>
              <p className="text-sm font-semibold">Synthese temporairement indisponible</p>
              <p className="text-xs text-[var(--text-muted)]">
                Le portail ne peut pas encore recuperer votre derniere synthese BelRAI partagee.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void belraiQuery.refetch()}>
            Reessayer
          </Button>
        </Card>
      ) : !sharedResultsReady ? (
        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-mc-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Resultats en preparation</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {officialResult && !officialResult.isSharedWithPatient
                  ? 'Votre equipe a deja recu les resultats officiels, mais le partage patient n est pas encore active.'
                  : 'Votre equipe consolide encore l evaluation. Les resultats apparaitront ici une fois partages dans Meta Cares.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Etape actuelle</p>
              <p className="text-sm font-semibold mt-1">{waitingStatusLabel}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{waitingSyncLabel}</p>
            </div>
            <div className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Derniere mise a jour</p>
              <p className="text-sm font-semibold mt-1">{waitingUpdatedLabel}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Vue detaillee masquee tant que le partage n est pas finalise.</p>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/patient/messages')}>
            Demander une mise a jour a mon equipe
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Dernier partage</p>
              <p className="text-sm font-semibold">{officialResult?.sharedLabel ?? officialResult?.receivedLabel ?? '—'}</p>
              <p className="text-xs text-[var(--text-muted)]">{officialResult?.syncLabel ?? waitingSyncLabel}</p>
            </Card>
            <Card className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Niveau d aide</p>
              <p className="text-sm font-semibold">{officialResult?.katz.category ?? '—'}</p>
              <p className="text-xs text-[var(--text-muted)]">{officialResult?.katz.description ?? 'Synthese Katz indisponible.'}</p>
            </Card>
          </div>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-mc-blue-500" />
              <p className="text-sm font-semibold">Mes reperes de suivi</p>
            </div>
            <div className="space-y-2">
              {officialResult?.scores.map((score) => (
                <div key={score.key} className="rounded-2xl bg-[var(--bg-secondary)] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{score.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{score.detail}</p>
                    </div>
                    <Badge variant={toneToBadgeVariant(score.tone)}>{score.value}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-mc-green-500" />
              <p className="text-sm font-semibold">Ce que mon equipe surveille en priorite</p>
            </div>
            <div className="space-y-2">
              {officialResult?.caps.map((cap) => (
                <div key={cap.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{cap.title}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{cap.detail}</p>
                    </div>
                    <Badge variant={priorityToBadgeVariant(cap.priority)}>{cap.priority}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    L equipe travaille notamment sur : {cap.suggestedInterventions.slice(0, 2).join(' · ')}.
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/patient/documents')}>
              <ClipboardList className="h-4 w-4" />
              Mes documents
            </Button>
            <Button variant="gradient" className="justify-start" onClick={() => navigate('/patient/messages')}>
              <ChevronRight className="h-4 w-4" />
              Poser une question
            </Button>
          </div>
        </>
      )}
    </AnimatedPage>
  );
}
