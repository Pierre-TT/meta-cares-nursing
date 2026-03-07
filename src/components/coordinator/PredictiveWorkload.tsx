import { useState } from 'react';
import { TrendingUp, AlertTriangle, Users, Calendar } from 'lucide-react';
import { Card, Badge } from '@/design-system';

interface DayForecast {
  day: string;
  shortDay: string;
  predicted: number;
  capacity: number;
  appointments: number;
}

const forecast: DayForecast[] = [
  { day: 'Lundi', shortDay: 'Lun', predicted: 42, capacity: 45, appointments: 38 },
  { day: 'Mardi', shortDay: 'Mar', predicted: 48, capacity: 45, appointments: 44 },
  { day: 'Mercredi', shortDay: 'Mer', predicted: 38, capacity: 45, appointments: 35 },
  { day: 'Jeudi', shortDay: 'Jeu', predicted: 51, capacity: 45, appointments: 46 },
  { day: 'Vendredi', shortDay: 'Ven', predicted: 44, capacity: 45, appointments: 40 },
  { day: 'Samedi', shortDay: 'Sam', predicted: 28, capacity: 30, appointments: 22 },
  { day: 'Dimanche', shortDay: 'Dim', predicted: 18, capacity: 20, appointments: 15 },
];

const maxVal = 55;

export function PredictiveWorkload() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const overloadDays = forecast.filter(d => d.predicted > d.capacity);
  const totalGap = overloadDays.reduce((s, d) => s + (d.predicted - d.capacity), 0);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-mc-blue-500 flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Prévision charge de travail</p>
          <p className="text-[10px] text-[var(--text-muted)]">Semaine prochaine — IA prédictive</p>
        </div>
        {overloadDays.length > 0 && (
          <Badge variant="red">{overloadDays.length} jour{overloadDays.length > 1 ? 's' : ''} en surcharge</Badge>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32 mb-2">
        {forecast.map((d, i) => {
          const isOver = d.predicted > d.capacity;
          const barH = (d.predicted / maxVal) * 100;
          const capH = (d.capacity / maxVal) * 100;
          return (
            <div key={d.shortDay} className="flex-1 flex flex-col items-center relative"
              onMouseEnter={() => setHoveredDay(i)} onMouseLeave={() => setHoveredDay(null)}>
              {/* Capacity line */}
              <div className="absolute w-full border-t border-dashed border-[var(--text-muted)]"
                style={{ bottom: `${capH}%` }} />
              {/* Predicted bar */}
              <div className={`w-full rounded-t-md transition-all duration-300 ${isOver ? 'bg-red-400 dark:bg-red-500' : 'bg-mc-blue-400 dark:bg-mc-blue-500'}`}
                style={{ height: `${barH}%`, opacity: hoveredDay === null || hoveredDay === i ? 1 : 0.4 }} />

              {/* Tooltip */}
              {hoveredDay === i && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-lg rounded-lg px-2 py-1 z-10 whitespace-nowrap">
                  <p className="text-[10px] font-bold">{d.day}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">Prévu: {d.predicted} | Capacité: {d.capacity}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div className="flex gap-2 mb-3">
        {forecast.map(d => (
          <div key={d.shortDay} className="flex-1 text-center">
            <p className={`text-[10px] font-medium ${d.predicted > d.capacity ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{d.shortDay}</p>
          </div>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <Calendar className="h-3.5 w-3.5 mx-auto mb-0.5 text-mc-blue-500" />
          <p className="text-sm font-bold">{forecast.reduce((s, d) => s + d.predicted, 0)}</p>
          <p className="text-[9px] text-[var(--text-muted)]">Visites prévues</p>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-mc-green-500" />
          <p className="text-sm font-bold">{forecast.reduce((s, d) => s + d.capacity, 0)}</p>
          <p className="text-[9px] text-[var(--text-muted)]">Capacité totale</p>
        </div>
        <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <AlertTriangle className="h-3.5 w-3.5 mx-auto mb-0.5 text-red-500" />
          <p className="text-sm font-bold text-red-500">+{totalGap}</p>
          <p className="text-[9px] text-[var(--text-muted)]">Visites en excès</p>
        </div>
      </div>

      {/* Staffing recommendation */}
      {overloadDays.length > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800">
          <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
            💡 Recommandation IA : Planifier 1 infirmier(ère) supplémentaire le{' '}
            {overloadDays.map(d => d.day).join(' et le ')} pour absorber +{totalGap} visites.
          </p>
        </div>
      )}
    </Card>
  );
}
