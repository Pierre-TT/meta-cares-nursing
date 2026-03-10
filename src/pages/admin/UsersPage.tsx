import { useMemo, useState, type FormEvent } from 'react';
import {
  Plus,
  Search,
  ShieldAlert,
  KeyRound,
  Clock3,
  Square,
  SquareCheck,
  UserCheck,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Input, AnimatedPage, GradientHeader, Modal, Tabs } from '@/design-system';

type Role = 'nurse' | 'coordinator' | 'admin' | 'billing_office';
type Status = 'active' | 'inactive';
type Privilege = 'standard' | 'elevated' | 'critical';

interface UserRecord {
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastLogin: string;
  staleDays: number;
  mfa: boolean;
  ehealth: boolean;
  privilege: Privilege;
}

interface CreateUserFormState {
  name: string;
  email: string;
  role: Role;
}

const seedUsers: UserRecord[] = [
  { name: 'Marie Laurent', email: 'marie@metacares.be', role: 'nurse', status: 'active', lastLogin: '06/03 08:15', staleDays: 0, mfa: true, ehealth: true, privilege: 'standard' },
  { name: 'Sophie Dupuis', email: 'sophie@metacares.be', role: 'nurse', status: 'active', lastLogin: '06/03 07:45', staleDays: 0, mfa: true, ehealth: true, privilege: 'standard' },
  { name: 'Thomas Maes', email: 'thomas@metacares.be', role: 'nurse', status: 'active', lastLogin: '05/03 18:30', staleDays: 1, mfa: false, ehealth: true, privilege: 'standard' },
  { name: 'Laura Van Damme', email: 'laura@metacares.be', role: 'nurse', status: 'active', lastLogin: '06/03 08:00', staleDays: 0, mfa: true, ehealth: false, privilege: 'standard' },
  { name: 'Isabelle Moreau', email: 'isabelle@metacares.be', role: 'coordinator', status: 'active', lastLogin: '06/03 09:00', staleDays: 0, mfa: true, ehealth: true, privilege: 'elevated' },
  { name: 'Marc Dumont', email: 'marc@metacares.be', role: 'billing_office', status: 'active', lastLogin: '06/03 08:30', staleDays: 0, mfa: true, ehealth: true, privilege: 'elevated' },
  { name: 'Admin System', email: 'admin@metacares.be', role: 'admin', status: 'active', lastLogin: '06/03 09:15', staleDays: 0, mfa: true, ehealth: true, privilege: 'critical' },
  { name: 'Kevin Peeters', email: 'kevin@metacares.be', role: 'nurse', status: 'inactive', lastLogin: '15/02 10:00', staleDays: 20, mfa: false, ehealth: false, privilege: 'standard' },
];

const roleLabels: Record<Role, string> = {
  nurse: 'Infirmier',
  coordinator: 'Coordinateur',
  admin: 'Admin',
  billing_office: 'Tarification',
};

const roleColors: Record<Role, 'amber' | 'blue' | 'green' | 'red'> = {
  nurse: 'blue',
  coordinator: 'green',
  admin: 'red',
  billing_office: 'amber',
};

const emptyCreateForm: CreateUserFormState = {
  name: '',
  email: '',
  role: 'nurse',
};

function derivePrivilege(role: Role): Privilege {
  if (role === 'admin') return 'critical';
  if (role === 'coordinator' || role === 'billing_office') return 'elevated';
  return 'standard';
}

function buildLastLoginLabel(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

function buildUsersCsv(users: UserRecord[]) {
  const header = ['name', 'email', 'role', 'status', 'mfa', 'ehealth', 'last_login'];
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role,
    user.status,
    user.mfa ? 'enabled' : 'disabled',
    user.ehealth ? 'ok' : 'missing',
    user.lastLogin,
  ]);

  return [header, ...rows]
    .map((columns) => columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadTextFile(filename: string, contents: string, mimeType: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') {
    return false;
  }

  const objectUrl = window.URL?.createObjectURL?.(new Blob([contents], { type: mimeType }));
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

export function UsersPage() {
  const [userRecords, setUserRecords] = useState<UserRecord[]>(seedUsers);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [managedEmail, setManagedEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      userRecords.filter((user) => {
        if (activeTab !== 'all' && user.role !== activeTab) return false;
        if (
          search &&
          !user.name.toLowerCase().includes(search.toLowerCase()) &&
          !user.email.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [activeTab, search, userRecords]
  );

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Tous', count: userRecords.length },
      { id: 'nurse', label: 'Infirmiers', count: userRecords.filter((user) => user.role === 'nurse').length },
      { id: 'coordinator', label: 'Coord.', count: userRecords.filter((user) => user.role === 'coordinator').length },
      { id: 'admin', label: 'Admins', count: userRecords.filter((user) => user.role === 'admin').length },
    ],
    [userRecords]
  );

  const managedUser = managedEmail ? userRecords.find((user) => user.email === managedEmail) ?? null : null;
  const activeUsers = userRecords.filter((user) => user.status === 'active').length;
  const elevatedUsers = userRecords.filter((user) => user.role === 'admin' || user.privilege !== 'standard').length;
  const usersWithoutMfa = userRecords.filter((user) => !user.mfa).length;
  const dormantUsers = userRecords.filter((user) => user.staleDays >= 14).length;

  function toggleSelect(email: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateForm(emptyCreateForm);
    setCreateError(null);
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createForm.name.trim();
    const email = createForm.email.trim().toLowerCase();

    if (!name || !email) {
      setCreateError('Nom et email sont requis.');
      return;
    }

    if (!email.includes('@')) {
      setCreateError('Adresse email invalide.');
      return;
    }

    if (userRecords.some((user) => user.email.toLowerCase() === email)) {
      setCreateError('Cet utilisateur existe deja.');
      return;
    }

    const nextUser: UserRecord = {
      name,
      email,
      role: createForm.role,
      status: 'active',
      lastLogin: buildLastLoginLabel(),
      staleDays: 0,
      mfa: false,
      ehealth: false,
      privilege: derivePrivilege(createForm.role),
    };

    setUserRecords((previous) => [nextUser, ...previous]);
    setFeedback(`Utilisateur cree: ${nextUser.email}`);
    closeCreateModal();
  }

  function updateUser(email: string, updater: (user: UserRecord) => UserRecord) {
    setUserRecords((previous) => previous.map((user) => (user.email === email ? updater(user) : user)));
  }

  function handleBulkEnableMfa() {
    if (selected.size === 0) return;

    setUserRecords((previous) =>
      previous.map((user) => (selected.has(user.email) ? { ...user, mfa: true, staleDays: 0 } : user))
    );
    setFeedback(`MFA active pour ${selected.size} utilisateur(s).`);
  }

  function handleExportUsers() {
    const exportedUsers = userRecords.filter((user) => selected.has(user.email));
    const success = downloadTextFile(
      'admin-users-export.csv',
      buildUsersCsv(exportedUsers),
      'text/csv;charset=utf-8'
    );

    setFeedback(
      success
        ? `Export CSV prepare pour ${exportedUsers.length} utilisateur(s).`
        : 'Export indisponible dans cet environnement.'
    );
  }

  function handleManagedStatusToggle() {
    if (!managedUser) return;

    const nextStatus: Status = managedUser.status === 'active' ? 'inactive' : 'active';
    updateUser(managedUser.email, (user) => ({ ...user, status: nextStatus, staleDays: nextStatus === 'active' ? 0 : user.staleDays }));
    setFeedback(`${managedUser.email} est maintenant ${nextStatus === 'active' ? 'actif' : 'inactif'}.`);
  }

  function handleManagedMfaToggle() {
    if (!managedUser) return;

    updateUser(managedUser.email, (user) => ({ ...user, mfa: !user.mfa, staleDays: 0 }));
    setFeedback(`${managedUser.email}: MFA ${managedUser.mfa ? 'desactivee' : 'activee'}.`);
  }

  function handleManagedEHealthToggle() {
    if (!managedUser) return;

    updateUser(managedUser.email, (user) => ({ ...user, ehealth: !user.ehealth }));
    setFeedback(`${managedUser.email}: statut eHealth mis a jour.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<UserCheck className="h-5 w-5" />}
        title="Identites & acces"
        subtitle={`${activeUsers} actifs · ${userRecords.filter((user) => user.mfa).length}/${userRecords.length} MFA`}
        badge={
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Creer
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{elevatedUsers}</p>
            <p className="text-[10px] text-white/60">Acces eleves</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{usersWithoutMfa}</p>
            <p className="text-[10px] text-white/60">Sans MFA</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{dormantUsers}</p>
            <p className="text-[10px] text-white/60">Comptes dormants</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-green-500/10 border border-mc-green-500/20">
          <ShieldCheck className="h-4 w-4 text-mc-green-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Infirmiers', count: userRecords.filter((user) => user.role === 'nurse').length, tone: 'blue' as const },
          { label: 'Coordination', count: userRecords.filter((user) => user.role === 'coordinator').length, tone: 'green' as const },
          { label: 'Admin', count: userRecords.filter((user) => user.role === 'admin').length, tone: 'red' as const },
          { label: 'Billing', count: userRecords.filter((user) => user.role === 'billing_office').length, tone: 'amber' as const },
        ].map((item) => (
          <Card key={item.label} className="text-center">
            <p className={`text-2xl font-bold ${item.tone === 'blue' ? 'text-mc-blue-500' : item.tone === 'green' ? 'text-mc-green-500' : item.tone === 'red' ? 'text-mc-red-500' : 'text-mc-amber-500'}`}>
              {item.count}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
          </Card>
        ))}
      </div>

      <Input
        placeholder="Rechercher un utilisateur..."
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <ShieldCheck className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{selected.size} utilisateur(s) selectionne(s)</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkEnableMfa}>
              Activer MFA
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportUsers}>
              Exporter
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((user) => (
          <Card key={user.email} hover>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSelect(user.email)}
                aria-label={`Selectionner ${user.name}`}
                className="shrink-0"
              >
                {selected.has(user.email) ? (
                  <SquareCheck className="h-5 w-5 text-mc-blue-500" />
                ) : (
                  <Square className="h-5 w-5 text-[var(--text-muted)]" />
                )}
              </button>
              <Avatar name={user.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                  {user.status === 'inactive' && <Badge variant="outline">Inactif</Badge>}
                  {user.privilege === 'critical' && <Badge variant="red">Critique</Badge>}
                  {user.privilege === 'elevated' && <Badge variant="amber">Eleve</Badge>}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={user.mfa ? 'green' : 'amber'}>{user.mfa ? 'MFA actif' : 'MFA manquant'}</Badge>
                  <Badge variant={user.ehealth ? 'blue' : 'red'}>{user.ehealth ? 'eHealth OK' : 'eHealth KO'}</Badge>
                  <span className={`text-[10px] ${user.staleDays >= 14 ? 'text-mc-red-500 font-medium' : 'text-[var(--text-muted)]'}`}>
                    Dernier acces: {user.lastLogin}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {user.staleDays >= 14 ? (
                  <div className="flex items-center gap-1 text-mc-red-500">
                    <Clock3 className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{user.staleDays}j</span>
                  </div>
                ) : user.mfa ? (
                  <div className="flex items-center gap-1 text-mc-green-500">
                    <KeyRound className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Protege</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-mc-amber-500">
                    <ShieldAlert className="h-3 w-3" />
                    <span className="text-[10px] font-medium">A traiter</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setManagedEmail(user.email)}>
                  <Lock className="h-3 w-3" />
                  Gerer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={createOpen} onClose={closeCreateModal} title="Creer un utilisateur">
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          <Input
            label="Nom complet"
            value={createForm.name}
            onChange={(event) => setCreateForm((previous) => ({ ...previous, name: event.target.value }))}
            autoFocus
          />
          <Input
            label="Adresse email"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((previous) => ({ ...previous, email: event.target.value }))}
          />
          <div className="space-y-1.5">
            <label htmlFor="create-role" className="block text-sm font-medium text-[var(--text-secondary)]">
              Role
            </label>
            <select
              id="create-role"
              value={createForm.role}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, role: event.target.value as Role }))}
              className="w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500"
            >
              <option value="nurse">Infirmier</option>
              <option value="coordinator">Coordinateur</option>
              <option value="billing_office">Tarification</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {createError && <p className="text-sm text-mc-red-500">{createError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCreateModal}>
              Annuler
            </Button>
            <Button type="submit">Creer l utilisateur</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(managedUser)} onClose={() => setManagedEmail(null)} title={managedUser ? `Gerer ${managedUser.name}` : 'Gerer'}>
        {managedUser && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
              <p className="text-sm font-medium">{managedUser.email}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {roleLabels[managedUser.role]} · {managedUser.status === 'active' ? 'Actif' : 'Inactif'} · Dernier acces {managedUser.lastLogin}
              </p>
            </div>

            <div className="grid gap-2">
              <Button variant="outline" onClick={handleManagedStatusToggle}>
                {managedUser.status === 'active' ? 'Desactiver le compte' : 'Reactiver le compte'}
              </Button>
              <Button variant="outline" onClick={handleManagedMfaToggle}>
                {managedUser.mfa ? 'Retirer MFA' : 'Activer MFA'}
              </Button>
              <Button variant="outline" onClick={handleManagedEHealthToggle}>
                {managedUser.ehealth ? 'Marquer eHealth KO' : 'Marquer eHealth OK'}
              </Button>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setManagedEmail(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}
