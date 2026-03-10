import { useState } from 'react';
import {
  Settings,
  Bell,
  Palette,
  Shield,
  SlidersHorizontal,
  Sparkles,
  ServerCog,
  Clock3,
  CheckCircle,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

interface ToggleDefaults {
  autoFreeze: boolean;
  maintenanceBanner: boolean;
  betaFlags: boolean;
}

function downloadJsonFile(filename: string, contents: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') {
    return false;
  }

  const objectUrl = window.URL?.createObjectURL?.(new Blob([contents], { type: 'application/json;charset=utf-8' }));
  if (!objectUrl) {
    return false;
  }

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
  return true;
}

export function AdminSettingsPage() {
  const { data } = useAdminPlatformData();
  const settings = data.settings;
  const [toggleState, setToggleState] = useState<ToggleDefaults>(settings.toggleDefaults);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [publishedNotice, setPublishedNotice] = useState<(typeof settings.maintenanceWindows)[number] | null>(null);

  function handleToggle(key: keyof ToggleDefaults) {
    setToggleState((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      setFeedback(`Option mise a jour: ${key}`);
      return next;
    });
  }

  function handleExportConfiguration() {
    const exported = {
      exportedAt: new Date().toISOString(),
      featureFlagsCount: settings.featureFlagsCount,
      connectors: settings.connectors,
      maintenanceWindows: settings.maintenanceWindows,
      settingsHighlights: settings.settingsHighlights,
      statusCards: settings.statusCards,
      toggles: toggleState,
    };

    const success = downloadJsonFile('admin-settings-export.json', JSON.stringify(exported, null, 2));
    setFeedback(success ? 'Configuration exportee.' : 'Export indisponible dans cet environnement.');
  }

  function handlePublishMaintenance() {
    const nextWindow = settings.maintenanceWindows[0];

    if (!nextWindow) {
      setFeedback('Aucune fenetre de maintenance a publier.');
      return;
    }

    setToggleState((previous) => ({ ...previous, maintenanceBanner: true }));
    setPublishedNotice(nextWindow);
    setFeedback(`Fenetre publiee: ${nextWindow.title}`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Settings className="h-5 w-5" />}
        title="Parametres administrateur"
        subtitle="Configuration plateforme, feature flags, maintenance et branding"
        badge={<Badge variant="blue">Production</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{settings.connectors.length}</p>
            <p className="text-[10px] text-white/60">Connecteurs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{settings.featureFlagsCount}</p>
            <p className="text-[10px] text-white/60">Feature flags</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{settings.maintenanceWindows.length}</p>
            <p className="text-[10px] text-white/60">Fenetres planifiees</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      {publishedNotice && (
        <Card className="border-l-4 border-l-mc-green-500">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-mc-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{publishedNotice.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{publishedNotice.schedule}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{publishedNotice.impact}</p>
            </div>
            <Badge variant="green">Publiee</Badge>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Flags & garde-fous</CardTitle>
            <Badge variant="outline">Control plane</Badge>
          </CardHeader>
          <SettingsToggleGroup values={toggleState} onToggle={handleToggle} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connecteurs & fournisseurs</CardTitle>
            <Badge variant="green">Ops</Badge>
          </CardHeader>
          <div className="space-y-3">
            {settings.connectors.map((connector) => (
              <div key={connector.name} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ServerCog className="h-4 w-4 text-mc-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{connector.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{connector.detail}</p>
                    </div>
                  </div>
                  <Badge variant={connector.state === 'active' ? 'green' : connector.state === 'sandbox' ? 'blue' : 'amber'}>
                    {connector.state === 'active' ? 'Actif' : connector.state === 'sandbox' ? 'Sandbox' : 'Review'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance windows</CardTitle>
            <Badge variant="amber">Planifie</Badge>
          </CardHeader>
          <div className="space-y-3">
            {settings.maintenanceWindows.map((window) => (
              <div key={window.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock3 className="h-4 w-4 text-mc-amber-500" />
                  <p className="text-sm font-medium">{window.title}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{window.schedule}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{window.impact}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & notifications</CardTitle>
            <Badge variant="blue">Experience</Badge>
          </CardHeader>
          <div className="space-y-3">
            {settings.settingsHighlights.map((item) => {
              const Icon = item.tone === 'blue' ? Palette : item.tone === 'green' ? Bell : Shield;
              return (
                <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${item.tone === 'blue' ? 'text-mc-blue-500' : item.tone === 'green' ? 'text-mc-green-500' : 'text-mc-amber-500'}`} />
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {settings.statusCards.map((card) => {
          const Icon = card.label === 'Ops' ? CheckCircle : card.label === 'Flags' ? SlidersHorizontal : card.label === 'Pilotes' ? Sparkles : Bell;
          return (
            <Card key={card.label} className="text-center">
              <Icon className={`h-5 w-5 mx-auto mb-2 ${card.tone === 'green' ? 'text-mc-green-500' : card.tone === 'blue' ? 'text-mc-blue-500' : card.tone === 'amber' ? 'text-mc-amber-500' : 'text-mc-red-500'}`} />
              <p className="text-sm font-semibold">{card.label}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{card.detail}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start" onClick={handleExportConfiguration}>
          <Settings className="h-4 w-4" />
          Exporter configuration
        </Button>
        <Button variant="gradient" className="justify-start" onClick={handlePublishMaintenance}>
          <Sparkles className="h-4 w-4" />
          Publier fenetre maintenance
        </Button>
      </div>
    </AnimatedPage>
  );
}

function SettingsToggleGroup({
  values,
  onToggle,
}: {
  values: ToggleDefaults;
  onToggle: (key: keyof ToggleDefaults) => void;
}) {
  return (
    <div className="space-y-4">
      <ToggleRow
        title="Gel auto si incident majeur"
        description="Bloquer les deploiements quand un incident critique est ouvert"
        checked={values.autoFreeze}
        onToggle={() => onToggle('autoFreeze')}
      />
      <ToggleRow
        title="Banniere maintenance"
        description="Afficher l information aux equipes avant les interventions planifiees"
        checked={values.maintenanceBanner}
        onToggle={() => onToggle('maintenanceBanner')}
      />
      <ToggleRow
        title="Flags beta en production"
        description="Autoriser l activation controlee des experiences admin"
        checked={values.betaFlags}
        onToggle={() => onToggle('betaFlags')}
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mc-blue-500' : 'bg-[var(--bg-secondary)]'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
