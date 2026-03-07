import { useState } from 'react';
import { Settings, Wifi, WifiOff, Bell, Building2, Shield, Key, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

const tabs = [
  { id: 'mycarenet', label: 'MyCareNet' },
  { id: 'efact', label: 'eFact' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'organisation', label: 'Organisation' },
];

export function BillingSettingsPage() {
  const [activeTab, setActiveTab] = useState('mycarenet');
  const mycarenetConnected = true;
  const [autoSend, setAutoSend] = useState(false);
  const [autoValidation, setAutoValidation] = useState(true);
  const [batchSize, setBatchSize] = useState(50);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifReject, setNotifReject] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifAgreement, setNotifAgreement] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Settings className="h-5 w-5" />}
        title="Paramètres facturation"
        subtitle="Configuration MyCareNet & préférences"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto ${mycarenetConnected ? 'bg-mc-green-400' : 'bg-mc-red-400'}`} />
            <p className="text-[10px] text-white/60 mt-1">MyCareNet</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">eFact v3</p>
            <p className="text-[10px] text-white/60">Protocole</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">TLS 1.3</p>
            <p className="text-[10px] text-white/60">Sécurité</p>
          </div>
        </div>
      </GradientHeader>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'mycarenet' && (
        <div className="space-y-4">
          {/* Connection status */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mycarenetConnected
                  ? <Wifi className="h-5 w-5 text-mc-green-500" />
                  : <WifiOff className="h-5 w-5 text-mc-red-500" />
                }
                <div>
                  <p className="text-sm font-semibold">Connexion MyCareNet</p>
                  <p className="text-xs text-[var(--text-muted)]">{mycarenetConnected ? 'Connecté — dernière sync: il y a 5 min' : 'Déconnecté'}</p>
                </div>
              </div>
              <Badge variant={mycarenetConnected ? 'green' : 'red'}>{mycarenetConnected ? 'Actif' : 'Inactif'}</Badge>
            </div>
          </Card>

          {/* Certificates */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Certificats eHealth</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-mc-green-500" />
                  <div>
                    <p className="text-sm font-medium">Certificat d'identification</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Valide jusqu'au 15/12/2026</p>
                  </div>
                </div>
                <Badge variant="green">OK</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-mc-green-500" />
                  <div>
                    <p className="text-sm font-medium">Certificat de chiffrement</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Valide jusqu'au 15/12/2026</p>
                  </div>
                </div>
                <Badge variant="green">OK</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-mc-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Certificat ETK</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Expire le 30/06/2026</p>
                  </div>
                </div>
                <Badge variant="amber">Renouveler</Badge>
              </div>
            </div>
          </Card>

          {/* Services */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Services activés</p>
            <div className="space-y-2">
              {[
                { name: 'eFact (facturation électronique)', active: true },
                { name: 'eAgreement (accords)', active: true },
                { name: 'eAttest (attestations)', active: true },
                { name: 'MemberData (données assurabilité)', active: true },
                { name: 'GenIns (assurabilité générique)', active: false },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-sm">{svc.name}</span>
                  {svc.active
                    ? <CheckCircle className="h-4 w-4 text-mc-green-500" />
                    : <AlertTriangle className="h-4 w-4 text-[var(--text-muted)]" />
                  }
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'efact' && (
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Envoi eFact</p>
            <div className="space-y-4">
              <ToggleSetting
                label="Envoi automatique"
                description="Envoyer automatiquement les lots validés à MyCareNet"
                checked={autoSend}
                onChange={setAutoSend}
              />
              <ToggleSetting
                label="Auto-validation"
                description="Valider automatiquement les prestations conformes"
                checked={autoValidation}
                onChange={setAutoValidation}
              />
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Taille des lots</p>
            <div>
              <input
                type="range" min={10} max={100} step={10} value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                className="w-full accent-[#47B6FF]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>10</span>
                <span className="font-bold text-sm">{batchSize} prestations/lot</span>
                <span>100</span>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Format</p>
            <div className="space-y-2">
              {[
                { label: 'eFact XML v3 (standard)', selected: true },
                { label: 'eFact flat-file (legacy)', selected: false },
              ].map(fmt => (
                <div key={fmt.label} className={`p-3 rounded-xl ${fmt.selected ? 'bg-mc-blue-500/10 ring-2 ring-mc-blue-500' : 'bg-[var(--bg-secondary)]'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${fmt.selected ? 'border-mc-blue-500' : 'border-[var(--border-default)]'}`}>
                      {fmt.selected && <div className="w-2 h-2 rounded-full bg-mc-blue-500" />}
                    </div>
                    <span className="text-sm">{fmt.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-mc-blue-500" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Alertes</p>
            </div>
            <div className="space-y-4">
              <ToggleSetting
                label="Notifications email"
                description="Recevoir les alertes par email"
                checked={notifEmail}
                onChange={setNotifEmail}
              />
              <ToggleSetting
                label="Rejets eFact"
                description="Alerte immédiate en cas de rejet MyCareNet"
                checked={notifReject}
                onChange={setNotifReject}
              />
              <ToggleSetting
                label="Paiements reçus"
                description="Notification à réception des paiements mutuelles"
                checked={notifPayment}
                onChange={setNotifPayment}
              />
              <ToggleSetting
                label="Accords expirants"
                description="Rappel 30 jours avant expiration des accords"
                checked={notifAgreement}
                onChange={setNotifAgreement}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'organisation' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-mc-blue-500" />
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Informations</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Dénomination', value: 'Meta Cares Nursing SPRL' },
                { label: 'N° INAMI groupement', value: '7-54321-00' },
                { label: 'N° BCE', value: '0123.456.789' },
                { label: 'Adresse', value: 'Rue de la Loi 42, 1000 Bruxelles' },
                { label: 'Compte bancaire (tiers payant)', value: 'BE68 5390 0754 7034' },
                { label: 'Responsable tarification', value: 'Marie Billing' },
              ].map(field => (
                <div key={field.label} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-xs text-[var(--text-muted)]">{field.label}</span>
                  <span className="text-sm font-medium">{field.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Save */}
      <div className="sticky bottom-4">
        <Button variant="gradient" className="w-full" onClick={handleSave}>
          {saved ? (
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Enregistré</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Enregistrer les paramètres</span>
          )}
        </Button>
      </div>
    </AnimatedPage>
  );
}

function ToggleSetting({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mc-blue-500' : 'bg-[var(--bg-secondary)]'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
