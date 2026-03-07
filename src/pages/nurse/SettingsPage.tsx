import { useState } from 'react';
import { ArrowLeft, Globe, Bell, Wifi, Moon, Sun, Shield, Database, Trash2, LogOut } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, AnimatedPage } from '@/design-system';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-mc-green-500' : 'bg-[var(--border-default)]'}`}>
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const [lang, setLang] = useState('fr');
  const [notifications, setNotifications] = useState({ visits: true, billing: true, alerts: true, chat: false });
  const [offlineMode, setOfflineMode] = useState(true);

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Paramètres</h1>
      </div>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle><Globe className="h-4 w-4 mr-2 inline" />Langue</CardTitle></CardHeader>
        <div className="flex gap-2">
          {[{ v: 'fr', l: 'Français' }, { v: 'nl', l: 'Nederlands' }, { v: 'de', l: 'Deutsch' }].map(o => (
            <button key={o.v} onClick={() => setLang(o.v)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${lang === o.v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >{o.l}</button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader><CardTitle>{theme === 'dark' ? <Moon className="h-4 w-4 mr-2 inline" /> : <Sun className="h-4 w-4 mr-2 inline" />}Apparence</CardTitle></CardHeader>
        <div className="flex gap-2">
          {[{ v: 'light' as const, l: 'Clair', i: Sun }, { v: 'dark' as const, l: 'Sombre', i: Moon }].map(o => (
            <button key={o.v} onClick={() => setTheme(o.v)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${theme === o.v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            ><o.i className="h-4 w-4" />{o.l}</button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle><Bell className="h-4 w-4 mr-2 inline" />Notifications</CardTitle></CardHeader>
        <div className="space-y-3">
          {([
            { key: 'visits' as const, label: 'Visites & planning', desc: 'Rappels de tournée' },
            { key: 'billing' as const, label: 'Facturation', desc: 'Rejets eFact, paiements' },
            { key: 'alerts' as const, label: 'Alertes cliniques', desc: 'Paramètres anormaux' },
            { key: 'chat' as const, label: 'Messages', desc: 'eHealthBox & chat patient' },
          ]).map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{n.desc}</p>
              </div>
              <Toggle on={notifications[n.key]} onChange={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))} />
            </div>
          ))}
        </div>
      </Card>

      {/* Sync & Offline */}
      <Card>
        <CardHeader><CardTitle><Wifi className="h-4 w-4 mr-2 inline" />Synchronisation</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Mode hors-ligne</p><p className="text-xs text-[var(--text-muted)]">Données en cache IndexedDB</p></div>
            <Toggle on={offlineMode} onChange={() => setOfflineMode(!offlineMode)} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Dernière sync</span>
            <Badge variant="green" dot>Il y a 2 min</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Données en cache</span>
            <span className="font-mono">24.3 MB</span>
          </div>
          <Button variant="outline" size="sm" className="w-full"><Database className="h-4 w-4" />Forcer la synchronisation</Button>
        </div>
      </Card>

      {/* eHealth */}
      <Card>
        <CardHeader>
          <CardTitle><Shield className="h-4 w-4 mr-2 inline" />eHealth</CardTitle>
          <Badge variant="green" dot>Connecté</Badge>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">MyCareNet</span><Badge variant="green">OK</Badge></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Vitalink</span><Badge variant="green">OK</Badge></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">eHealthBox</span><Badge variant="green">OK</Badge></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">BelRAI</span><Badge variant="amber">Config. requise</Badge></div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-mc-red-200 dark:border-red-800">
        <CardHeader><CardTitle className="text-mc-red-500">Zone dangereuse</CardTitle></CardHeader>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full text-mc-red-500 border-mc-red-200 dark:border-red-800">
            <Trash2 className="h-4 w-4" />Vider le cache local
          </Button>
          <Button variant="outline" size="sm" className="w-full text-mc-red-500 border-mc-red-200 dark:border-red-800" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-4 w-4" />Déconnexion
          </Button>
        </div>
      </Card>
    </AnimatedPage>
  );
}
