import { AlertTriangle, ChevronRight, ClipboardPlus, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '@/design-system';
import { useSmartVisitBriefing } from '@/hooks/useSmartVisitBriefing';
import type { SmartVisitTone } from '@/lib/smartVisitBriefing';

function getToneSurfaceClasses(tone: SmartVisitTone) {
  switch (tone) {
    case 'red':
      return 'border-l-mc-red-500 bg-mc-red-50/60 dark:bg-red-900/20';
    case 'amber':
      return 'border-l-mc-amber-500 bg-mc-amber-500/10';
    case 'blue':
      return 'border-l-mc-blue-500 bg-mc-blue-50/60 dark:bg-mc-blue-900/20';
    case 'green':
      return 'border-l-mc-green-500 bg-mc-green-50/60 dark:bg-mc-green-900/20';
    default:
      return 'border-l-[var(--border-default)]';
  }
}

function getIssueIcon(tone: SmartVisitTone) {
  if (tone === 'red' || tone === 'amber') {
    return <ShieldAlert className="h-4 w-4" />;
  }

  return <Sparkles className="h-4 w-4" />;
}

export function SmartVisitBriefingCard({ patientRouteId }: { patientRouteId: string }) {
  const navigate = useNavigate();
  const { patient, briefing, isLoading, dataIssues, refetchAll } = useSmartVisitBriefing(patientRouteId);

  if (!patientRouteId) {
    return null;
  }

  if (isLoading && !briefing) {
    return (
      <Card className="space-y-3">
        <div className="h-5 w-40 rounded bg-[var(--bg-tertiary)] animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((placeholder) => (
            <div key={placeholder} className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!patient || !briefing) {
    return null;
  }

  const topItems = [...briefing.riskItems, ...briefing.adminBlockers].slice(0, 2);

  return (
    <Card className={`space-y-4 border-l-4 ${getToneSurfaceClasses(briefing.readiness.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center">
            <ClipboardPlus className="h-5 w-5 text-mc-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Smart visit briefing</p>
            <p className="text-xs text-[var(--text-muted)]">{briefing.readiness.detail}</p>
          </div>
        </div>
        <Badge variant={briefing.readiness.tone}>{briefing.readiness.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[var(--bg-primary)]/80 p-3 border border-[var(--border-subtle)]">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Risques</p>
          <p className="text-lg font-bold">{briefing.summary.riskCount}</p>
        </div>
        <div className="rounded-2xl bg-[var(--bg-primary)]/80 p-3 border border-[var(--border-subtle)]">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Blocages</p>
          <p className="text-lg font-bold">{briefing.summary.blockerCount}</p>
        </div>
        <div className="rounded-2xl bg-[var(--bg-primary)]/80 p-3 border border-[var(--border-subtle)]">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Changements</p>
          <p className="text-lg font-bold">{briefing.summary.changeCount}</p>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="space-y-2">
          {topItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2 rounded-xl bg-[var(--bg-primary)]/70 p-3 border border-[var(--border-subtle)]">
              <span className={item.tone === 'red' ? 'text-mc-red-500' : item.tone === 'amber' ? 'text-mc-amber-500' : 'text-mc-blue-500'}>
                {getIssueIcon(item.tone)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {dataIssues.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-[var(--bg-secondary)] p-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--text-muted)]">
            Certaines sources n’ont pas pu être consolidées: {dataIssues.join(', ')}.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="gradient"
          size="sm"
          className="flex-1 justify-between"
          onClick={() => navigate(`/nurse/briefing/${patient.id}`)}
        >
          Ouvrir le briefing
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => void refetchAll()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
