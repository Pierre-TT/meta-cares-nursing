import { CloudRain, Thermometer, Wind, Snowflake, Sun } from 'lucide-react';
import { Card, Badge } from '@/design-system';

interface WeatherAlert {
  type: 'heat' | 'cold' | 'rain' | 'wind' | 'snow';
  severity: 'warning' | 'info';
  message: string;
  impact: string;
}

const weatherIcons = {
  heat: <Sun className="h-4 w-4 text-mc-amber-500" />,
  cold: <Snowflake className="h-4 w-4 text-mc-blue-500" />,
  rain: <CloudRain className="h-4 w-4 text-mc-blue-500" />,
  wind: <Wind className="h-4 w-4 text-[var(--text-muted)]" />,
  snow: <Snowflake className="h-4 w-4 text-mc-blue-300" />,
};

// Simulated current alerts for Belgian weather
const currentAlerts: WeatherAlert[] = [
  {
    type: 'cold',
    severity: 'warning',
    message: 'Températures basses prévues: -2°C à 3°C',
    impact: 'Risque d\'hypothermie patients âgés — vérifier chauffage à domicile',
  },
  {
    type: 'rain',
    severity: 'info',
    message: 'Pluie verglaçante possible ce matin',
    impact: 'Risque de chute accru — prudence sur les déplacements',
  },
];

export function WeatherHealthAlert() {
  if (currentAlerts.length === 0) return null;

  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-mc-blue-500/10 flex items-center justify-center">
          <Thermometer className="h-4 w-4 text-mc-blue-500" />
        </div>
        <div>
          <p className="text-xs font-semibold">Alertes météo-santé</p>
          <p className="text-[10px] text-[var(--text-muted)]">Bruxelles — Aujourd'hui</p>
        </div>
      </div>

      {currentAlerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 p-2 rounded-lg ${
            alert.severity === 'warning' ? 'bg-mc-amber-500/10' : 'bg-mc-blue-500/5'
          }`}
        >
          {weatherIcons[alert.type]}
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium">{alert.message}</p>
              {alert.severity === 'warning' && (
                <Badge variant="amber" className="text-[9px]">Alerte</Badge>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{alert.impact}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}
