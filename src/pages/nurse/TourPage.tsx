import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Circle,
  Play,
  Map as MapIcon,
  Phone,
  Nfc,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, AnimatedPage, AnimatedList, AnimatedItem, GradientHeader } from '@/design-system';
import { featureFlags } from '@/lib/featureFlags';
import { MockFeatureNotice } from '@/components/MockFeatureNotice';
import { useNursePatients } from '@/hooks/useNursePatients';

interface TourVisit {
  id: string;
  patientId: string;
  time: string;
  duration: number; // minutes
  acts: string[];
  status: 'completed' | 'current' | 'upcoming' | 'cancelled';
  eta?: string;
  woundReminder?: string;
  driveMin?: number;
  nomenclature?: string;
}

const mockTour: TourVisit[] = [
  { id: 'v1', patientId: 'p2', time: '08:00', duration: 45, acts: ['Toilette complète', 'Injections insuline', 'Pilulier'], status: 'completed', nomenclature: 'Art.8§1 Forfait B', driveMin: 0 },
  { id: 'v2', patientId: 'p3', time: '09:15', duration: 60, acts: ['Toilette', 'Soins de plaie sacrum', 'Pilulier'], status: 'completed', nomenclature: 'Art.8§1 Forfait C', driveMin: 12 },
  { id: 'v3', patientId: 'p1', time: '10:30', duration: 50, acts: ['Soins de plaie', 'Glycémie', 'Pilulier'], status: 'current', eta: '12 min', woundReminder: 'Plaie jambe G — photo J+7 requise', nomenclature: 'Art.8§1 Forfait B', driveMin: 8 },
  { id: 'v4', patientId: 'p4', time: '11:45', duration: 30, acts: ['Injection', 'Paramètres vitaux'], status: 'upcoming', nomenclature: 'Art.8§1,3°', driveMin: 15 },
  { id: 'v5', patientId: 'p5', time: '13:00', duration: 25, acts: ['Injection insuline', 'Glycémie'], status: 'upcoming', nomenclature: 'Art.8§1 Forfait A', driveMin: 6 },
];

const getTimeSlotColor = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'border-l-mc-blue-500'; // morning
  if (hour < 17) return 'border-l-mc-green-500'; // afternoon
  return 'border-l-mc-amber-500'; // evening
};

const statusConfig = {
  completed: { color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/30', icon: CheckCircle, label: 'Terminée' },
  current: { color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/30', icon: Play, label: 'En cours' },
  upcoming: { color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-tertiary)]', icon: Circle, label: 'À venir' },
  cancelled: { color: 'text-mc-red-500', bg: 'bg-mc-red-50 dark:bg-red-900/30', icon: Circle, label: 'Annulée' },
};

export function TourPage() {
  const [selectedDate] = useState(new Date());
  const [showTransfer, setShowTransfer] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: patients = [], isLoading, error, refetch } = useNursePatients();
  const patientsById = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );

  const dateStr = selectedDate.toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const completedCount = mockTour.filter((v) => v.status === 'completed').length;
  const totalMinutes = mockTour.reduce((s, v) => s + v.duration, 0);

  if (!featureFlags.enableHealthcareMocks) {
    return <MockFeatureNotice feature="Gestion des tournees terrain" />;
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <GradientHeader
        icon={<MapIcon className="h-5 w-5" />}
        title="Ma Tournée"
        subtitle={dateStr}
        badge={
          <Button variant="outline" size="sm" className="bg-white/15 border-white/20 text-white hover:bg-white/25" onClick={() => navigate('/nurse/tour/map')}>
            <MapIcon className="h-4 w-4" />
            Carte
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{completedCount}/{mockTour.length}</p>
            <p className="text-[10px] text-white/60">Visites</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{Math.floor(totalMinutes / 60)}h{(totalMinutes % 60).toString().padStart(2, '0')}</p>
            <p className="text-[10px] text-white/60">Durée</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">47 km</p>
            <p className="text-[10px] text-white/60">Distance</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€842</p>
            <p className="text-[10px] text-white/60">CA prévu</p>
          </div>
        </div>
      </GradientHeader>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[image:var(--gradient-brand)]"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / mockTour.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Timeline */}
      {error ? (
        <Card className="text-center space-y-3">
          <p className="text-sm font-medium">La tournée n’a pas pu charger les patients.</p>
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((placeholder) => (
            <Card key={placeholder} padding="sm">
              <div className="h-28 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <AnimatedList stagger={0.08} delay={0.15} className="space-y-0">
          {mockTour.map((visit, index) => {
            const patient = patientsById.get(visit.patientId);
            if (!patient) return null;
            const config = statusConfig[visit.status];
            const StatusIcon = config.icon;

            return (
              <AnimatedItem key={visit.id} className="relative flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center z-10 shrink-0 ${visit.status === 'current' ? 'ring-2 ring-mc-blue-500/40 animate-pulse' : ''}`}>
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  {index < mockTour.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[var(--border-default)] min-h-4" />
                  )}
                </div>

                {/* Drive time indicator */}
                {visit.driveMin && visit.driveMin > 0 && index > 0 && (
                  <div className="absolute -top-3.5 left-9 flex items-center gap-1 text-[9px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 rounded z-20">
                    <Navigation className="h-2.5 w-2.5" />
                    {visit.driveMin} min
                  </div>
                )}

                {/* Visit card */}
                <Card
                  hover={visit.status !== 'cancelled'}
                  padding="sm"
                  className={`flex-1 mb-3 border-l-4 ${getTimeSlotColor(visit.time)} ${visit.status === 'current' ? 'border-mc-blue-300 dark:border-mc-blue-700 shadow-md border-l-mc-blue-500' : ''}`}
                  onClick={() => {
                    if (visit.status === 'current') navigate(`/nurse/visit/${patient.id}`);
                    else navigate(`/nurse/patients/${patient.id}`);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${patient.firstName} ${patient.lastName}`} size="sm" />
                      <div>
                        <p className="text-sm font-semibold">
                          {patient.lastName} {patient.firstName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          <span>{visit.time} • {visit.duration} min</span>
                          {visit.eta && (
                            <Badge variant="blue" dot>{visit.eta}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acts */}
                  <div className="flex flex-wrap gap-1 mt-2 ml-10">
                    {visit.acts.map((act) => (
                      <span
                        key={act}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                      >
                        {act}
                      </span>
                    ))}
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-1 mt-1.5 ml-10 text-xs text-[var(--text-muted)]">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {patient.address.street} {patient.address.houseNumber}, {patient.address.postalCode} {patient.address.city}
                    </span>
                  </div>

                  {/* Wound reminder */}
                  {visit.woundReminder && (
                    <div className="flex items-center gap-2 mt-2 ml-10 p-1.5 rounded-lg bg-mc-amber-500/10 text-xs">
                      <AlertCircle className="h-3.5 w-3.5 text-mc-amber-500 shrink-0" />
                      <span className="text-mc-amber-600">{visit.woundReminder}</span>
                    </div>
                  )}

                  {/* Current visit actions */}
                  {visit.status === 'current' && (
                    <div className="flex gap-2 mt-3 ml-10">
                      <Button variant="outline" size="sm">
                        <Phone className="h-3.5 w-3.5" />
                        Appeler
                      </Button>
                      <Button variant="outline" size="sm">
                        <Navigation className="h-3.5 w-3.5" />
                        GPS
                      </Button>
                      <Button variant="gradient" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/nurse/visit/${patient.id}`); }}>
                        <Nfc className="h-3.5 w-3.5" />
                        Démarrer
                      </Button>
                    </div>
                  )}

                  {/* Transfer visit button for upcoming */}
                  {visit.status === 'upcoming' && (
                    <div className="mt-2 ml-10">
                      {showTransfer === visit.id ? (
                        <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] space-y-2" onClick={e => e.stopPropagation()}>
                          <p className="text-xs font-medium">Transférer à :</p>
                          <div className="flex gap-2">
                            {['Sophie V.', 'Anne D.', 'Julie M.'].map(nurse => (
                              <button key={nurse} className="px-2 py-1 rounded-lg bg-mc-blue-500/10 text-xs text-mc-blue-500 hover:bg-mc-blue-500/20 transition-colors" onClick={() => setShowTransfer(null)}>
                                {nurse}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowTransfer(visit.id); }}
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-mc-blue-500 transition-colors"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Transférer cette visite
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              </AnimatedItem>
            );
          })}
        </AnimatedList>
      )}
    </AnimatedPage>
  );
}
