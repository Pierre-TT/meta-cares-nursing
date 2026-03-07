import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  Phone,
  MapPin,
  Nfc,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Input, AnimatedPage, AnimatedList, AnimatedItem, EmptyState, GradientHeader } from '@/design-system';
import { useNursePatients } from '@/hooks/useNursePatients';
import type { KatzCategory } from '@/lib/patients';

const katzColors: Record<KatzCategory, string> = {
  O: 'outline',
  A: 'blue',
  B: 'green',
  C: 'amber',
  Cd: 'red',
} as const;

const katzSortOrder: Record<KatzCategory, number> = {
  O: 0,
  A: 1,
  B: 2,
  C: 3,
  Cd: 4,
} as const;

const mutualityLabels = {
  MC: 'Mutualité Chrétienne',
  ML: 'Mutualité Libre',
  Partenamut: 'Partenamut',
  Solidaris: 'Solidaris',
  Neutre: 'Neutre',
} as const;

const katzFilters: { value: KatzCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'O', label: 'O' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'Cd', label: 'Cd' },
];

export function PatientsListPage() {
  const [search, setSearch] = useState('');
  const [katzFilter, setKatzFilter] = useState<KatzCategory | 'all'>('all');
  const navigate = useNavigate();
  const { data: patients = [], isLoading, error, refetch } = useNursePatients();
  const mutualites = ['all', 'MC', 'ML', 'Partenamut', 'Solidaris', 'Neutre'] as const;
  const [mutFilter, setMutFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'katz'>('name');

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const mutualityLabel =
      mutFilter === 'all'
        ? null
        : mutualityLabels[mutFilter as keyof typeof mutualityLabels];

    return patients
      .filter((patient) => {
        const matchSearch =
          !normalizedSearch ||
          `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(normalizedSearch) ||
          patient.niss.includes(search.trim()) ||
          patient.address.city.toLowerCase().includes(normalizedSearch);
        const matchKatz = katzFilter === 'all' || patient.katzCategory === katzFilter;
        const matchMutuality = !mutualityLabel || patient.mutuality === mutualityLabel;

        return matchSearch && matchKatz && matchMutuality;
      })
      .sort((left, right) => {
        if (sortBy === 'city') {
          return (
            left.address.city.localeCompare(right.address.city) ||
            left.lastName.localeCompare(right.lastName) ||
            left.firstName.localeCompare(right.firstName)
          );
        }

        if (sortBy === 'katz') {
          const leftRank = left.katzCategory ? katzSortOrder[left.katzCategory] : Number.MAX_SAFE_INTEGER;
          const rightRank = right.katzCategory ? katzSortOrder[right.katzCategory] : Number.MAX_SAFE_INTEGER;

          return (
            leftRank - rightRank ||
            left.lastName.localeCompare(right.lastName) ||
            left.firstName.localeCompare(right.firstName)
          );
        }

        return (
          left.lastName.localeCompare(right.lastName) ||
          left.firstName.localeCompare(right.firstName)
        );
      });
  }, [patients, search, katzFilter, mutFilter, sortBy]);

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <GradientHeader
        icon={<Search className="h-5 w-5" />}
        title="Mes Patients"
        subtitle={isLoading ? 'Chargement des patients…' : `${patients.length} patients actifs`}
        badge={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/nurse/identify')} className="text-white border-white/30 hover:bg-white/10">
              <Nfc className="h-3.5 w-3.5" /> eID
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/nurse/patients/new')} className="text-white border-white/30 hover:bg-white/10">
              <Plus className="h-3.5 w-3.5" /> Nouveau
            </Button>
          </div>
        }
      />

      {/* Search */}
      <Input
        placeholder="Rechercher par nom, NISS, ville…"
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Katz filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        {katzFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setKatzFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap chip-active ${
              katzFilter === f.value
                ? 'bg-[image:var(--gradient-brand)] text-white shadow-sm'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
            }`}
          >
            {f.label === 'Tous' ? 'Tous' : `Katz ${f.label}`}
          </button>
        ))}
      </div>

      {/* Mutualité filter + sort */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {mutualites.map(m => (
            <button
              key={m}
              onClick={() => setMutFilter(m)}
              className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap ${
                mutFilter === m
                  ? 'bg-mc-blue-500/20 text-mc-blue-500'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}
            >
              {m === 'all' ? 'Toutes mut.' : m}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'name' | 'city' | 'katz')}
          className="text-[10px] px-2 py-1 rounded bg-[var(--bg-tertiary)] border-0 text-[var(--text-muted)]"
        >
          <option value="name">Tri: Nom</option>
          <option value="city">Tri: Ville</option>
          <option value="katz">Tri: Katz</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-[var(--text-muted)]">{filtered.length} patient(s)</p>

      {/* Patient list */}
      {error ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Patients indisponibles"
          description="La liste des patients n’a pas pu être chargée pour le moment."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((placeholder) => (
            <Card key={placeholder} padding="sm">
              <div className="h-16 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <AnimatedList stagger={0.04} delay={0.1}>
            {filtered.map((patient) => (
              <AnimatedItem key={patient.id}>
              <Card
                hover
                padding="sm"
                className="cursor-pointer"
                onClick={() => navigate(`/nurse/patients/${patient.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={`${patient.firstName} ${patient.lastName}`} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {patient.lastName} {patient.firstName}
                      </p>
                      {patient.katzCategory && (
                        <Badge variant={katzColors[patient.katzCategory] as 'blue' | 'green' | 'amber' | 'red' | 'outline'} >
                          Katz {patient.katzCategory}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {patient.address.postalCode} {patient.address.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    </div>
                    {patient.pathologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {patient.pathologies.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                          >
                            {p}
                          </span>
                        ))}
                        {patient.pathologies.length > 2 && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            +{patient.pathologies.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                </div>
              </Card>
              </AnimatedItem>
            ))}
          </AnimatedList>

          {filtered.length === 0 && (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Aucun patient trouvé"
              description="Essayez de modifier vos filtres ou d'ajouter un nouveau patient."
              action={
                <Button variant="gradient" size="sm" onClick={() => navigate('/nurse/patients/new')}>
                  <Plus className="h-4 w-4" /> Nouveau Patient
                </Button>
              }
            />
          )}
        </>
      )}
    </AnimatedPage>
  );
}
