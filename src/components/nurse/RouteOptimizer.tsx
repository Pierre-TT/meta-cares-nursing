import { useState } from 'react';
import { Navigation, Clock, TrendingDown, RotateCcw, MapPin } from 'lucide-react';
import { Card, Button } from '@/design-system';

interface RouteStop {
  id: string;
  patient: string;
  address: string;
  time: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

const currentRoute: RouteStop[] = [
  { id: '1', patient: 'Mme Janssens', address: 'Rue de la Loi 12', time: '08:00', duration: '30 min', priority: 'high' },
  { id: '2', patient: 'M. Maes', address: 'Rue Neuve 88', time: '09:00', duration: '20 min', priority: 'medium' },
  { id: '3', patient: 'Mme Dupont', address: 'Chée de Waterloo 200', time: '10:00', duration: '25 min', priority: 'high' },
  { id: '4', patient: 'M. Van den Berg', address: 'Av. Louise 45', time: '11:00', duration: '20 min', priority: 'medium' },
  { id: '5', patient: 'Mme Peeters', address: 'Bd du Midi 15', time: '14:00', duration: '15 min', priority: 'low' },
];

const priorityColors = { high: 'bg-mc-red-500', medium: 'bg-mc-amber-500', low: 'bg-mc-green-500' };

export function RouteOptimizer() {
  const [optimized, setOptimized] = useState(false);

  const savedMinutes = 23;
  const savedKm = 8.4;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-mc-blue-500/10 flex items-center justify-center">
            <Navigation className="h-4 w-4 text-mc-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Optimisation d'itinéraire</p>
            <p className="text-[10px] text-[var(--text-muted)]">{currentRoute.length} visites aujourd'hui</p>
          </div>
        </div>
        <Button
          variant={optimized ? 'outline' : 'primary'}
          size="sm"
          className="gap-1 text-xs"
          onClick={() => setOptimized(!optimized)}
        >
          {optimized ? <RotateCcw className="h-3 w-3" /> : <Navigation className="h-3 w-3" />}
          {optimized ? 'Réinitialiser' : 'Optimiser'}
        </Button>
      </div>

      {optimized && (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-mc-green-500/10 mb-3">
          <TrendingDown className="h-4 w-4 text-mc-green-500" />
          <div className="flex items-center gap-3 text-xs">
            <span className="font-medium text-mc-green-600">
              <Clock className="h-3 w-3 inline mr-0.5" /> -{savedMinutes} min
            </span>
            <span className="font-medium text-mc-green-600">
              <MapPin className="h-3 w-3 inline mr-0.5" /> -{savedKm} km
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {currentRoute.map((stop, i) => (
          <div key={stop.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${priorityColors[stop.priority]}`} />
              {i < currentRoute.length - 1 && <div className="w-px h-6 bg-[var(--border-subtle)]" />}
            </div>
            <div className="flex-1 flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium">{stop.patient}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{stop.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold">{stop.time}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{stop.duration}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
