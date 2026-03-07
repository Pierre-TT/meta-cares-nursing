import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  List,
  Navigation,
  Clock,
} from 'lucide-react';
import { Button, Card, Badge, AnimatedPage } from '@/design-system';
import { useNursePatients } from '@/hooks/useNursePatients';

export function TourMapPage() {
  const navigate = useNavigate();
  const { data: patients = [], isLoading, error, refetch } = useNursePatients();
  const mapPatients = patients.slice(0, 5);
  const activePatient = mapPatients[2] ?? mapPatients[0] ?? null;
  const positions = [
    { top: '25%', left: '35%' },
    { top: '40%', left: '55%' },
    { top: '30%', left: '70%' },
    { top: '60%', left: '40%' },
    { top: '55%', left: '65%' },
  ];

  return (
    <AnimatedPage className="relative flex flex-col min-h-[calc(100dvh-5rem)]">
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => navigate('/nurse/tour')} className="shadow-lg">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate('/nurse/tour')} className="shadow-lg">
          <List className="h-4 w-4" />
          Liste
        </Button>
      </div>

      {/* Map placeholder — in production this would be Leaflet/MapLibre */}
      <div className="flex-1 bg-[var(--bg-tertiary)] flex items-center justify-center relative overflow-hidden">
        {/* Fake map background with grid */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Map markers */}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="max-w-sm text-center space-y-3">
              <p className="text-sm font-medium">La carte n’a pas pu charger les patients.</p>
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            </Card>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="text-center">
              <p className="text-sm text-[var(--text-muted)]">Chargement de la tournée…</p>
            </Card>
          </div>
        ) : (
          mapPatients.map((patient, i) => {
            const pos = positions[i];
            const isActive = i === 2; // Current visit

            return (
              <div
                key={patient.id}
                className="absolute cursor-pointer group"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => navigate(`/nurse/patients/${patient.id}`)}
              >
                {isActive && (
                  <div className="absolute -inset-3 rounded-full bg-mc-blue-500/20 animate-ping" />
                )}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                    isActive
                      ? 'bg-[image:var(--gradient-brand)] border-white'
                      : i < 2
                        ? 'bg-mc-green-500 border-white'
                        : 'bg-[var(--bg-primary)] border-[var(--border-default)]'
                  }`}
                >
                  {i < 2 ? (
                    <span className="text-white text-xs font-bold">✓</span>
                  ) : isActive ? (
                    <Navigation className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-bold text-[var(--text-muted)]">{i + 1}</span>
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                  <Card padding="sm" className="whitespace-nowrap shadow-xl">
                    <p className="text-xs font-semibold">{patient.firstName} {patient.lastName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {patient.address.street} {patient.address.houseNumber}
                    </p>
                  </Card>
                </div>
              </div>
            );
          })
        )}

        {/* Route line (simplified SVG) */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          <polyline
            points="35%,25% 55%,40% 70%,30% 40%,60% 65%,55%"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeDasharray="8,4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#47B6FF" />
              <stop offset="100%" stopColor="#4ABD33" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center label */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card glass className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[image:var(--gradient-brand)] flex items-center justify-center shrink-0">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {activePatient ? `Prochaine: ${activePatient.lastName} ${activePatient.firstName}` : 'Tournée indisponible'}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock className="h-3 w-3" />
                {activePatient ? (
                  <>
                    <span>10:30 • 3.2 km</span>
                    <Badge variant="blue" dot>12 min</Badge>
                  </>
                ) : (
                  <span>Carte de tournée non disponible</span>
                )}
              </div>
            </div>
            <Button variant="gradient" size="sm" onClick={() => activePatient && navigate(`/nurse/patients/${activePatient.id}`)} disabled={!activePatient}>
              Go
            </Button>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  );
}
