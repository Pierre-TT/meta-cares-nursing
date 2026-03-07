import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, CardHeader, CardTitle, ContentTabs, GradientHeader } from '@/design-system';
import {
  applySuggestedAnswers,
  buildBelraiTwin,
  type BelraiItem,
  type BelraiTone,
  type StoredBelraiDraft,
} from '@/lib/belrai';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';

function toneToBadgeVariant(tone: BelraiTone) {
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

export function BelRAIScreenerPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, saveDraft, markReadyForSync, resetDraft, isSaving } = useBelraiTwin(patientId);
  const [localDraftState, setLocalDraftState] = useState<{
    patientId: string | null;
    draft: StoredBelraiDraft | null;
  }>({
    patientId: null,
    draft: null,
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['cognition', 'adl']));
  const activePatientId = data?.patient.id ?? patientId ?? null;
  const draft = useMemo(() => {
    if (localDraftState.patientId === activePatientId) {
      return localDraftState.draft;
    }

    return data?.draft ?? null;
  }, [activePatientId, data?.draft, localDraftState]);
  const setDraft = (
    next:
      | StoredBelraiDraft
      | null
      | ((current: StoredBelraiDraft | null) => StoredBelraiDraft | null),
  ) => {
    setLocalDraftState((currentState) => {
      const currentDraft = currentState.patientId === activePatientId
        ? currentState.draft
        : data?.draft ?? null;

      return {
        patientId: activePatientId,
        draft: typeof next === 'function' ? next(currentDraft) : next,
      };
    });
  };

  const snapshot = useMemo(() => {
    if (!data || !draft) {
      return data;
    }

    return buildBelraiTwin(data.patient, draft);
  }, [data, draft]);

  const updateDraft = (updater: (current: StoredBelraiDraft) => StoredBelraiDraft) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const next = updater(current);
      return {
        ...next,
        status: next.status === 'ready_for_sync' ? next.status : 'in_review',
        syncStatus: next.status === 'ready_for_sync' ? next.syncStatus : 'local_only',
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setAnswer = (itemId: string, value: number) => {
    updateDraft((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [itemId]: value,
      },
      confirmedItemIds: current.confirmedItemIds.filter((entry) => entry !== itemId),
    }));
  };

  const toggleConfirmed = (itemId: string) => {
    updateDraft((current) => {
      if (current.answers[itemId] === undefined) {
        return current;
      }

      return {
        ...current,
        confirmedItemIds: current.confirmedItemIds.includes(itemId)
          ? current.confirmedItemIds.filter((entry) => entry !== itemId)
          : [...current.confirmedItemIds, itemId],
      };
    });
  };

  const handlePrefill = () => {
    if (!snapshot || !draft) {
      return;
    }

    setDraft(applySuggestedAnswers(draft, snapshot.suggestedAnswers));
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    const savedSnapshot = await saveDraft(draft);
    setDraft(savedSnapshot.draft);
  };

  const handleMarkReady = async () => {
    if (!draft || !snapshot?.readyToSync) {
      return;
    }

    const savedSnapshot = await markReadyForSync(draft);
    setDraft(savedSnapshot.draft);
  };

  const handleReset = async () => {
    const resetSnapshot = await resetDraft();
    setDraft(resetSnapshot.draft);
    setExpandedSections(new Set(['cognition', 'adl']));
  };

  if (error) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">
            Impossible de charger le screener BelRAI pour ce patient.
          </p>
        </Card>
      </AnimatedPage>
    );
  }

  if (isLoading || !snapshot || !draft) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Chargement du workspace BelRAI Twin…</p>
        </Card>
      </AnimatedPage>
    );
  }

  const assessmentTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm font-bold">
            {snapshot.progress.answeredItems}/{snapshot.progress.totalItems} items ({snapshot.progress.percent}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-mc-blue-500 to-mc-green-500 transition-all"
            style={{ width: `${snapshot.progress.percent}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">{snapshot.nextAction}</p>
      </Card>

      <Button variant="outline" className="w-full gap-2" onClick={handlePrefill}>
        <Sparkles className="h-4 w-4" />
        Pré-remplir les items manquants à partir du dossier patient
      </Button>

      {snapshot.sections.map((section) => (
        <Card key={section.id}>
          <button className="w-full flex items-center justify-between" onClick={() => toggleSection(section.id)}>
            <span className="font-semibold">
              {section.icon} {section.title}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {section.items.filter((item) => draft.answers[item.id] !== undefined).length}/{section.items.length}
              </Badge>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {expandedSections.has(section.id) && (
            <div className="mt-3 space-y-4">
              {section.items.map((item) => {
                const suggestion = snapshot.suggestedAnswers[item.id];
                const currentValue = draft.answers[item.id];
                const isConfirmed = draft.confirmedItemIds.includes(item.id);
                const hasDeviation = currentValue !== undefined && currentValue !== suggestion.value;

                return (
                  <div key={item.id} className="border-t border-[var(--border-subtle)] pt-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {item.code} — {item.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1 shrink-0">
                        {item.critical && <Badge variant="red">Critique</Badge>}
                        {isConfirmed && <Badge variant="green">Confirmé</Badge>}
                        {hasDeviation && <Badge variant="amber">Écart</Badge>}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Suggestion Twin</p>
                        <Badge variant={toneToBadgeVariant(suggestion.tone)}>
                          {Math.round(suggestion.confidence * 100)}% confiance
                        </Badge>
                      </div>
                      <p className="text-sm">{suggestion.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{suggestion.rationale}</p>
                      <div className="space-y-1">
                        {suggestion.evidence.map((evidence) => (
                          <div key={`${item.id}-${evidence.id}`} className="rounded-lg bg-[var(--bg-primary)] p-2">
                            <p className="text-[11px] font-medium">{evidence.sourceLabel}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{evidence.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {item.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setAnswer(item.id, option.value)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                            currentValue === option.value
                              ? 'border-mc-blue-500 bg-mc-blue-500 text-white'
                              : 'border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-mc-blue-500/40 hover:bg-mc-blue-500/5'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleConfirmed(item.id)}
                        disabled={currentValue === undefined}
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        {isConfirmed ? 'Retirer la confirmation' : 'Confirmer la réponse'}
                      </Button>
                      {currentValue !== undefined && (
                        <Badge variant={hasDeviation ? 'amber' : 'blue'}>
                          Réponse actuelle : {item.options.find((option) => option.value === currentValue)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  const reviewTab = (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{snapshot.statusLabel}</p>
            <p className="text-xs text-[var(--text-muted)]">{snapshot.syncLabel}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Dernière mise à jour : {snapshot.lastUpdatedLabel}</p>
          </div>
          <Badge variant={toneToBadgeVariant(snapshot.statusTone)}>
            {snapshot.progress.confirmedItems} preuve(s)
          </Badge>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scores et signaux</CardTitle>
          <Badge variant={toneToBadgeVariant(snapshot.katz.color)}>{snapshot.katz.forfait}</Badge>
        </CardHeader>
        <div className="space-y-3">
          {snapshot.scores.map((score) => (
            <div key={score.key} className="rounded-xl bg-[var(--bg-secondary)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{score.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{score.detail}</p>
                </div>
                <Badge variant={toneToBadgeVariant(score.tone)}>{score.value}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Note de revue clinique</CardTitle>
          <Badge variant="outline">Locale</Badge>
        </CardHeader>
        <textarea
          rows={4}
          value={draft.reviewNote}
          onChange={(event) =>
            updateDraft((current) => ({
              ...current,
              reviewNote: event.target.value,
            }))
          }
          placeholder="Ajoutez ici les écarts, points à confirmer, contributions patient/famille ou éléments à reprendre lors de la prochaine visite."
          className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40"
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items critiques à compléter</CardTitle>
          <Badge variant={snapshot.criticalMissingItems.length > 0 ? 'amber' : 'green'}>
            {snapshot.criticalMissingItems.length}
          </Badge>
        </CardHeader>
        {snapshot.criticalMissingItems.length > 0 ? (
          <div className="space-y-2">
            {snapshot.criticalMissingItems.map((item: BelraiItem) => (
              <div key={item.id} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <p className="text-sm font-medium">
                  {item.code} — {item.label}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{snapshot.suggestedAnswers[item.id].rationale}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Les items critiques sont couverts. La revue peut maintenant se concentrer sur la confirmation et les CAPs.
          </p>
        )}
      </Card>
    </div>
  );

  const capsTab = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>CAPs actives</CardTitle>
          <Badge variant="blue">{snapshot.caps.length}</Badge>
        </CardHeader>
        {snapshot.caps.length > 0 ? (
          <div className="space-y-3">
            {snapshot.caps.map((cap) => (
              <div key={cap.id} className="rounded-xl bg-[var(--bg-secondary)] p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{cap.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cap.detail}</p>
                  </div>
                  <Badge variant={priorityToBadgeVariant(cap.priority)}>{cap.priority}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{cap.rationale}</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-[var(--text-secondary)]">
                  {cap.suggestedInterventions.map((intervention) => (
                    <li key={intervention}>{intervention}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Aucune CAP n’est encore activée. Les CAPs apparaîtront dès que les domaines clés seront assez documentés.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions proposées pour le plan de soins</CardTitle>
          <Badge variant="outline">{snapshot.carePlanSuggestions.length} liaison(s)</Badge>
        </CardHeader>
        {snapshot.carePlanSuggestions.length > 0 ? (
          <div className="space-y-3">
            {snapshot.carePlanSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{suggestion.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{suggestion.detail}</p>
                  </div>
                  <Badge variant={toneToBadgeVariant(suggestion.tone)}>{suggestion.linkedCap}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mt-3 text-xs text-[var(--text-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Interventions</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {suggestion.interventions.map((intervention) => (
                        <li key={intervention}>{intervention}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Outcomes</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {suggestion.outcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Le plan de soins sera enrichi automatiquement dès que des CAPs auront été confirmées.
          </p>
        )}

        <Button
          variant="gradient"
          className="w-full mt-4"
          onClick={() => navigate(`/nurse/care-plan?patientId=${snapshot.patient.id}`)}
        >
          <ShieldCheck className="h-4 w-4" /> Ouvrir le plan de soins lié
        </Button>
      </Card>
    </div>
  );

  const tabs = [
    { label: 'Évaluation', content: assessmentTab },
    { label: 'Revue & preuves', content: reviewTab },
    { label: 'CAPs & soins', content: capsTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <GradientHeader
        icon={<ClipboardCheck className="h-5 w-5" />}
        title="BelRAI Twin"
        subtitle={`${snapshot.patient.firstName} ${snapshot.patient.lastName} · Screener local interRAI HC`}
        badge={<Badge variant={toneToBadgeVariant(snapshot.statusTone)}>{snapshot.statusLabel}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{snapshot.progress.percent}%</p>
            <p className="text-[10px] text-white/60">Progression</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{snapshot.katz.category}</p>
            <p className="text-[10px] text-white/60">Katz estimé</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{snapshot.caps.length}</p>
            <p className="text-[10px] text-white/60">CAPs actives</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {snapshot.persistenceMode === 'supabase' ? 'Mode persistant Supabase' : 'Mode local préparatoire'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {snapshot.persistenceMode === 'supabase'
                ? 'Le brouillon, les preuves dérivées, les CAPs et l’état de synchronisation sont persistés dans Supabase tout en gardant une reprise locale.'
                : 'Cette phase consolide le brouillon, les preuves et les CAPs localement dans Meta Cares avant persistance ou branchement de la passerelle officielle BelRAI.'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{snapshot.syncLabel}</p>
          </div>
          <Badge variant={snapshot.persistenceMode === 'supabase' ? 'green' : 'blue'}>
            {snapshot.persistenceLabel}
          </Badge>
        </div>
      </Card>

      <ContentTabs tabs={tabs} />

      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="danger" className="justify-start" onClick={handleReset} disabled={isSaving}>
          <RefreshCw className="h-4 w-4" />
          Réinitialiser
        </Button>
        <Button variant="outline" className="justify-start" onClick={handleSave} loading={isSaving}>
          <Save className="h-4 w-4" />
          Sauvegarder brouillon
        </Button>
        <Button
          variant="gradient"
          className="justify-start"
          onClick={handleMarkReady}
          disabled={!snapshot.readyToSync || isSaving}
        >
          <CheckCircle2 className="h-4 w-4" />
          Marquer prêt
        </Button>
      </div>
    </AnimatedPage>
  );
}
