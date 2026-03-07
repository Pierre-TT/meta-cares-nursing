import { useState } from 'react';
import { Plus, Search, ShieldAlert, KeyRound, Clock3, Square, SquareCheck, UserCheck, Lock, ShieldCheck } from 'lucide-react';
import { Avatar, Badge, Button, Card, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

const users = [
  { name: 'Marie Laurent', email: 'marie@metacares.be', role: 'nurse' as const, status: 'active', lastLogin: '06/03 08:15', staleDays: 0, mfa: true, ehealth: true, privilege: 'standard' as const },
  { name: 'Sophie Dupuis', email: 'sophie@metacares.be', role: 'nurse' as const, status: 'active', lastLogin: '06/03 07:45', staleDays: 0, mfa: true, ehealth: true, privilege: 'standard' as const },
  { name: 'Thomas Maes', email: 'thomas@metacares.be', role: 'nurse' as const, status: 'active', lastLogin: '05/03 18:30', staleDays: 1, mfa: false, ehealth: true, privilege: 'standard' as const },
  { name: 'Laura Van Damme', email: 'laura@metacares.be', role: 'nurse' as const, status: 'active', lastLogin: '06/03 08:00', staleDays: 0, mfa: true, ehealth: false, privilege: 'standard' as const },
  { name: 'Isabelle Moreau', email: 'isabelle@metacares.be', role: 'coordinator' as const, status: 'active', lastLogin: '06/03 09:00', staleDays: 0, mfa: true, ehealth: true, privilege: 'elevated' as const },
  { name: 'Marc Dumont', email: 'marc@metacares.be', role: 'billing_office' as const, status: 'active', lastLogin: '06/03 08:30', staleDays: 0, mfa: true, ehealth: true, privilege: 'elevated' as const },
  { name: 'Admin System', email: 'admin@metacares.be', role: 'admin' as const, status: 'active', lastLogin: '06/03 09:15', staleDays: 0, mfa: true, ehealth: true, privilege: 'critical' as const },
  { name: 'Kevin Peeters', email: 'kevin@metacares.be', role: 'nurse' as const, status: 'inactive', lastLogin: '15/02 10:00', staleDays: 20, mfa: false, ehealth: false, privilege: 'standard' as const },
];

const roleLabels = { nurse: 'Infirmier', coordinator: 'Coordinateur', admin: 'Admin', billing_office: 'Tarification' };
const roleColors = { nurse: 'blue' as const, coordinator: 'green' as const, admin: 'red' as const, billing_office: 'amber' as const };

const tabs = [
  { id: 'all', label: 'Tous', count: users.length },
  { id: 'nurse', label: 'Infirmiers', count: users.filter((u) => u.role === 'nurse').length },
  { id: 'coordinator', label: 'Coord.', count: users.filter((u) => u.role === 'coordinator').length },
  { id: 'admin', label: 'Admins', count: users.filter((u) => u.role === 'admin').length },
];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = users.filter((u) => {
    if (activeTab !== 'all' && u.role !== activeTab) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<UserCheck className="h-5 w-5" />}
        title="Identités & accès"
        subtitle={`${users.filter((u) => u.status === 'active').length} actifs · ${users.filter((u) => u.mfa).length}/${users.length} MFA`}
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><Plus className="h-3.5 w-3.5" />Créer</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{users.filter((u) => u.role === 'admin' || u.privilege !== 'standard').length}</p>
            <p className="text-[10px] text-white/60">Accès élevés</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{users.filter((u) => !u.mfa).length}</p>
            <p className="text-[10px] text-white/60">Sans MFA</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{users.filter((u) => u.staleDays >= 14).length}</p>
            <p className="text-[10px] text-white/60">Comptes dormants</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Infirmiers', count: users.filter((u) => u.role === 'nurse').length, tone: 'blue' as const },
          { label: 'Coordination', count: users.filter((u) => u.role === 'coordinator').length, tone: 'green' as const },
          { label: 'Admin', count: users.filter((u) => u.role === 'admin').length, tone: 'red' as const },
          { label: 'Billing', count: users.filter((u) => u.role === 'billing_office').length, tone: 'amber' as const },
        ].map((item) => (
          <Card key={item.label} className="text-center">
            <p className={`text-2xl font-bold ${item.tone === 'blue' ? 'text-mc-blue-500' : item.tone === 'green' ? 'text-mc-green-500' : item.tone === 'red' ? 'text-mc-red-500' : 'text-mc-amber-500'}`}>{item.count}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
          </Card>
        ))}
      </div>

      <Input placeholder="Rechercher un utilisateur..." icon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <ShieldCheck className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{selected.size} utilisateur(s) sélectionné(s)</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm">Activer MFA</Button>
            <Button variant="primary" size="sm">Exporter</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.email} hover className="cursor-pointer">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleSelect(u.email)} className="shrink-0">
                {selected.has(u.email) ? <SquareCheck className="h-5 w-5 text-mc-blue-500" /> : <Square className="h-5 w-5 text-[var(--text-muted)]" />}
              </button>
              <Avatar name={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{u.name}</p>
                  <Badge variant={roleColors[u.role]}>{roleLabels[u.role]}</Badge>
                  {u.status === 'inactive' && <Badge variant="outline">Inactif</Badge>}
                  {u.privilege === 'critical' && <Badge variant="red">Critique</Badge>}
                  {u.privilege === 'elevated' && <Badge variant="amber">Élevé</Badge>}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={u.mfa ? 'green' : 'amber'}>{u.mfa ? 'MFA actif' : 'MFA manquant'}</Badge>
                  <Badge variant={u.ehealth ? 'blue' : 'red'}>{u.ehealth ? 'eHealth OK' : 'eHealth KO'}</Badge>
                  <span className={`text-[10px] ${u.staleDays >= 14 ? 'text-mc-red-500 font-medium' : 'text-[var(--text-muted)]'}`}>
                    Dernier accès: {u.lastLogin}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {u.staleDays >= 14 ? (
                  <div className="flex items-center gap-1 text-mc-red-500">
                    <Clock3 className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{u.staleDays}j</span>
                  </div>
                ) : u.mfa ? (
                  <div className="flex items-center gap-1 text-mc-green-500">
                    <KeyRound className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Protégé</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-mc-amber-500">
                    <ShieldAlert className="h-3 w-3" />
                    <span className="text-[10px] font-medium">À traiter</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="mt-2">
                  <Lock className="h-3 w-3" />
                  Gérer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
