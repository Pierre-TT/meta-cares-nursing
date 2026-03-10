import { ArrowLeft, ChevronRight, ClipboardPlus, Clock, Navigation, Phone, Pill, RefreshCw, ShieldAlert, Sparkles, Stethoscope, TriangleAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatedPage, Badge, Button, Card, CardHeader, CardTitle, GradientHeader } from '@/design-system';
import { useSmartVisitBriefing } from '@/hooks/useSmartVisitBriefing';
import type { SmartVisitBriefingItem, SmartVisitJournalEntry, SmartVisitMedicationItem, SmartVisitTone } from '@/lib/smartVisitBriefing';

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getToneSurfaceClasses(tone: SmartVisitTone) {
  switch (tone) {
    case 'red':
      return 'bg-mc-red-50 dark:bg-red-900/20 border-mc-red-200 dark:border-red-800';
    case 'amber':
      return 'bg-mc-amber-500/10 border-mc-amber-500/30';
    case 'blue':
      return 'bg-mc-blue-50 dark:bg-mc-blue-900/20 border-mc-blue-200 dark:border-mc-blue-800';
    case 'green':
      return 'bg-mc-green-50 dark:bg-mc-green-900/20 border-mc-green-200 dark:border-mc-green-800';
    default:
      return 'bg-[var(--bg-secondary)] border-[var(--border-subtle)]';
  }
}

function getToneIcon(tone: SmartVisitTone) {
  if (tone === 'red' || tone === 'amber') {
    return <ShieldAlert className="h-4 w-4" />;
  }

  return <Sparkles className="h-4 w-4" />;
}

function BriefingList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: SmartVisitBriefingItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{emptyDescription}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className={`border ${getToneSurfaceClasses(item.tone)}`}>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center shrink-0">
              <span className={item.tone === 'red' ? 'text-mc-red-500' : item.tone === 'amber' ? 'text-mc-amber-500' : 'text-mc-blue-500'}>
                {getToneIcon(item.tone)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <Badge variant={item.tone}>{item.tone === 'outline' ? 'Info' : item.tone === 'red' ? 'Critique' : item.tone === 'amber' ? 'Attention' : item.tone === 'green' ? 'OK' : 'Info'}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{item.detail}</p>
              {item.when && (
                <p className="text-[10px] text-[var(--text-muted)] mt-2">{formatDateTime(item.when)}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MedicationList({ medications }: { medications: SmartVisitMedicationItem[] }) {
  if (medications.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium">Aucun traitement consolidé</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Le briefing n’a trouvé ni rappels patients ni lignes thérapeutiques HAD actives.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {medications.map((item) => (
        <Card key={item.id} className={`border ${getToneSurfaceClasses(item.tone)}`}>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center shrink-0">
              <Pill className="h-4 w-4 text-mc-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <Badge variant={item.tone}>{item.source === 'had_order' ? 'HAD' : 'Rappel'}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{item.detail}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                {item.when ? formatDateTime(item.when) : 'Horaire non renseigné'} • statut {item.status}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function NotesList({ notes }: { notes: SmartVisitJournalEntry[] }) {
  if (notes.length === 0) {
    return (
      <Card>
        <p className="text-sm font-medium">Aucune transmission récente</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Le briefing n’a pas trouvé de notes infirmières ou d’événements chronologiques récents.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((entry) => (
        <Card key={entry.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{entry.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{formatDateTime(entry.recordedAt)} • {entry.actsSummary}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{entry.excerpt}</p>
            </div>
            <Badge variant={entry.signed ? 'green' : 'amber'}>{entry.signed ? 'Signé' : 'À signer'}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SmartVisitBriefingPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { patient, briefing, isLoading, notFound, primaryError, dataIssues, refetchAll } = useSmartVisitBriefing(patientId);

  if (primaryError) {
    return (
      <AnimatedPage className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-3">
        <TriangleAlert className="h-8 w-8 text-mc-red-500" />
        <h2 className="text-lg font-bold">Briefing indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le dossier patient n’a pas pu être chargé pour consolider la visite.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetchAll()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            Retour
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading && !patient) {
    return (
      <AnimatedPage className="min-h-[60vh] flex items-center justify-center px-4">
        <p className="text-sm text-[var(--text-muted)]">Consolidation du briefing visite…</p>
      </AnimatedPage>
    );
  }

  if (notFound || !patient || !briefing) {
    return (
      <AnimatedPage className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-3">
        <ClipboardPlus className="h-8 w-8 text-mc-blue-500" />
        <h2 className="text-lg font-bold">Patient introuvable</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Impossible de préparer un briefing sans dossier patient valide.
        </p>
        <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
          Retour aux patients
        </Button>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(`/nurse/patients/${patient.id}`)}
        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au dossier
      </button>

      <GradientHeader
        icon={<ClipboardPlus className="h-5 w-5" />}
        title="Smart visit briefing"
        subtitle={`${patient.firstName} ${patient.lastName} • prochaine visite ${formatDateTime(patient.nextVisit)}`}
        badge={<Badge variant={briefing.readiness.tone}>{briefing.readiness.label}</Badge>}
      >
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-white/80">Risques</p>
            <p className="text-lg font-bold text-white">{briefing.summary.riskCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-white/80">Blocages</p>
            <p className="text-lg font-bold text-white">{briefing.summary.blockerCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-white/80">Changements</p>
            <p className="text-lg font-bold text-white">{briefing.summary.changeCount}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wide text-white/80">Traitements</p>
            <p className="text-lg font-bold text-white">{briefing.summary.medicationCount}</p>
          </div>
        </div>
      </GradientHeader>

      {dataIssues.length > 0 && (
        <Card className="border border-mc-amber-500/30 bg-mc-amber-500/10">
          <div className="flex items-start gap-2">
            <TriangleAlert className="h-4 w-4 text-mc-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--text-secondary)]">
              Certaines sources n’ont pas pu être consolidées: {dataIssues.join(', ')}.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="gradient" onClick={() => navigate(`/nurse/visit/${patient.id}`)}>
          <Stethoscope className="h-4 w-4" />
          Démarrer la visite
        </Button>
        <Button variant="outline" onClick={() => void refetchAll()}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
        <Button variant="outline" onClick={() => navigate(`/nurse/eagreement?patientId=${patient.id}`)}>
          <ChevronRight className="h-4 w-4" />
          Ouvrir eAgreement
        </Button>
        <Button variant="outline" onClick={() => navigate('/nurse/consent')}>
          <ShieldAlert className="h-4 w-4" />
          Vérifier consentement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Préparation express</CardTitle>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {patient.nextVisit ? formatDateTime(patient.nextVisit) : 'Horaire à confirmer'}
          </Badge>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Médecin</p>
            <p className="font-medium">{patient.prescribingDoctor}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Katz</p>
            <p className="font-medium">{patient.katzCategory ?? 'À confirmer'}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Adresse</p>
            <p className="font-medium">{patient.address.street} {patient.address.houseNumber}, {patient.address.postalCode} {patient.address.city}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Mutualité</p>
            <p className="font-medium">{patient.mutuality}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`tel:${patient.phone}`)}>
            <Phone className="h-4 w-4" />
            Appeler
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${patient.address.street} ${patient.address.houseNumber}, ${patient.address.postalCode} ${patient.address.city}`,
              )}`,
              '_blank',
              'noopener,noreferrer',
            )}
          >
            <Navigation className="h-4 w-4" />
            Itinéraire
          </Button>
        </div>
      </Card>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Risques prioritaires</h2>
          <Badge variant={briefing.summary.riskCount > 0 ? 'amber' : 'green'}>{briefing.summary.riskCount}</Badge>
        </div>
        <BriefingList
          items={briefing.riskItems}
          emptyTitle="Aucun risque clinique prioritaire"
          emptyDescription="Le briefing ne détecte pas de drapeau rouge immédiat sur les constantes, plaies ou alertes HAD."
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Traitements et rappels du jour</h2>
          <Badge variant="blue">{briefing.summary.medicationCount}</Badge>
        </div>
        <MedicationList medications={briefing.medications} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ce qui a changé depuis le dernier passage</h2>
          <Badge variant={briefing.summary.changeCount > 0 ? 'blue' : 'outline'}>{briefing.summary.changeCount}</Badge>
        </div>
        <BriefingList
          items={briefing.changes}
          emptyTitle="Pas de rupture récente"
          emptyDescription="Aucune différence majeure n’a été détectée entre les dernières données consolidées."
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Blocages admin et facturation</h2>
          <Badge variant={briefing.summary.blockerCount > 0 ? 'red' : 'green'}>{briefing.summary.blockerCount}</Badge>
        </div>
        <BriefingList
          items={briefing.adminBlockers}
          emptyTitle="Aucun blocage administratif"
          emptyDescription="Consentement, eAgreement et dernière visite ne remontent pas de point bloquant."
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Focus de soin</h2>
          <Badge variant="outline">{briefing.careFocus.length}</Badge>
        </div>
        <BriefingList
          items={briefing.careFocus}
          emptyTitle="Aucun focus spécifique"
          emptyDescription="Le briefing n’a pas dégagé d’axe de suivi dominant pour cette visite."
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Dernières transmissions</h2>
          <Badge variant="outline">{briefing.summary.noteCount}</Badge>
        </div>
        <NotesList notes={briefing.recentNotes} />
      </section>
    </AnimatedPage>
  );
}
