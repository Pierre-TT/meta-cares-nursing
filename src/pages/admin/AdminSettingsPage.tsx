import { useState } from 'react';
import { Settings, Bell, Palette, Shield, SlidersHorizontal, Sparkles, ServerCog, Clock3, CheckCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function AdminSettingsPage() {
  const { data } = useAdminPlatformData();
  const settings = data.settings;
  const toggleDefaults = settings.toggleDefaults;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Settings className="h-5 w-5" />}
        title="Paramètres administrateur"
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
            <p className="text-[10px] text-white/60">Fenêtres planifiées</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Flags & garde-fous</CardTitle>
            <Badge variant="outline">Control plane</Badge>
          </CardHeader>
          <SettingsToggleGroup
            key={`${toggleDefaults.autoFreeze}-${toggleDefaults.maintenanceBanner}-${toggleDefaults.betaFlags}`}
            defaults={toggleDefaults}
          />
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
            <Badge variant="amber">Planifié</Badge>
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
        <Button variant="outline" className="justify-start">
          <Settings className="h-4 w-4" />
          Exporter configuration
        </Button>
        <Button variant="gradient" className="justify-start">
          <Sparkles className="h-4 w-4" />
          Publier fenêtre maintenance
        </Button>
      </div>
    </AnimatedPage>
  );
}

interface ToggleDefaults {
  autoFreeze: boolean;
  maintenanceBanner: boolean;
  betaFlags: boolean;
}

function SettingsToggleGroup({ defaults }: { defaults: ToggleDefaults }) {
  const [autoFreeze, setAutoFreeze] = useState(defaults.autoFreeze);
  const [maintenanceBanner, setMaintenanceBanner] = useState(defaults.maintenanceBanner);
  const [betaFlags, setBetaFlags] = useState(defaults.betaFlags);

  return (
    <div className="space-y-4">
      <ToggleRow
        title="Gel auto si incident majeur"
        description="Bloquer les déploiements quand un incident critique est ouvert"
        checked={autoFreeze}
        onToggle={() => setAutoFreeze(!autoFreeze)}
      />
      <ToggleRow
        title="Bannière maintenance"
        description="Afficher l’information aux équipes avant les interventions planifiées"
        checked={maintenanceBanner}
        onToggle={() => setMaintenanceBanner(!maintenanceBanner)}
      />
      <ToggleRow
        title="Flags bêta en production"
        description="Autoriser l’activation contrôlée des expériences admin"
        checked={betaFlags}
        onToggle={() => setBetaFlags(!betaFlags)}
      />
    </div>
  );
}

function ToggleRow({ title, description, checked, onToggle }: { title: string; description: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mc-blue-500' : 'bg-[var(--bg-secondary)]'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
