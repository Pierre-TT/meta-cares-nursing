import type { ReactNode } from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  Snowflake,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { Card, Badge } from '@/design-system';
import { useWeatherHealth } from '@/hooks/useWeatherHealth';
import type { WeatherAlertType } from '@/lib/weather';

const alertIcons: Record<WeatherAlertType, ReactNode> = {
  heat: <Sun className="h-4 w-4 text-mc-amber-500" />,
  cold: <Snowflake className="h-4 w-4 text-mc-blue-500" />,
  rain: <CloudRain className="h-4 w-4 text-mc-blue-500" />,
  wind: <Wind className="h-4 w-4 text-[var(--text-muted)]" />,
  snow: <Snowflake className="h-4 w-4 text-mc-blue-300" />,
  storm: <CloudLightning className="h-4 w-4 text-mc-amber-500" />,
  uv: <Sun className="h-4 w-4 text-mc-amber-500" />,
};

function getCurrentWeatherIcon(weatherCode: number) {
  if (weatherCode === 0) {
    return <Sun className="h-5 w-5 text-mc-amber-500" />;
  }

  if ([1, 2, 3, 45, 48].includes(weatherCode)) {
    return <Cloud className="h-5 w-5 text-mc-blue-500" />;
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return <CloudLightning className="h-5 w-5 text-mc-amber-500" />;
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return <Snowflake className="h-5 w-5 text-mc-blue-400" />;
  }

  return <CloudRain className="h-5 w-5 text-mc-blue-500" />;
}

function formatUpdatedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'mise à jour indisponible';
  }

  return parsed.toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function WeatherStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

export function WeatherHealthAlert() {
  const weatherQuery = useWeatherHealth();
  const snapshot = weatherQuery.data;

  if (weatherQuery.isLoading && !snapshot) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-[var(--bg-tertiary)] animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-[var(--bg-tertiary)] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((placeholder) => (
            <div key={placeholder} className="h-16 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (weatherQuery.isError && !snapshot) {
    return (
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-mc-amber-500/10 flex items-center justify-center">
            <Thermometer className="h-4 w-4 text-mc-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold">Météo indisponible</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              Impossible de charger la météo en temps réel.
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {weatherQuery.error instanceof Error
            ? weatherQuery.error.message
            : 'Le fournisseur météo n’a pas répondu.'}
        </p>
      </Card>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-mc-blue-500/10 flex items-center justify-center">
            {getCurrentWeatherIcon(snapshot.currentWeatherCode)}
          </div>
          <div>
            <p className="text-xs font-semibold">Météo en temps réel</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {snapshot.locationLabel} • Mise à jour {formatUpdatedAt(snapshot.updatedAt)}
            </p>
          </div>
        </div>
        <Badge variant={snapshot.alerts.length > 0 ? 'amber' : 'green'}>{snapshot.conditionLabel}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <WeatherStat
          label="Temp."
          value={`${snapshot.currentTemperatureC.toFixed(1)}°C`}
          hint={`Ressenti ${snapshot.apparentTemperatureC.toFixed(1)}°C`}
        />
        <WeatherStat
          label="Pluie"
          value={`${Math.round(snapshot.precipitationProbabilityMax)}%`}
          hint={`Min/max ${snapshot.dailyMinTemperatureC.toFixed(0)}°C • ${snapshot.dailyMaxTemperatureC.toFixed(0)}°C`}
        />
        <WeatherStat
          label="Vent"
          value={`${Math.round(snapshot.windSpeedKmh)} km/h`}
          hint={`Rafales ${Math.round(snapshot.windGustMaxKmh)} km/h`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold">Alertes météo-santé</p>
          <div className="flex items-center gap-2">
            {typeof snapshot.uvIndexMax === 'number' ? (
              <Badge variant="outline">UV {snapshot.uvIndexMax.toFixed(1)}</Badge>
            ) : null}
            {weatherQuery.isFetching ? <Badge variant="outline">Actualisation…</Badge> : null}
          </div>
        </div>

        {snapshot.alerts.length === 0 ? (
          <div className="rounded-xl bg-mc-green-500/8 px-3 py-2">
            <p className="text-xs font-medium text-mc-green-600 dark:text-mc-green-300">
              Aucune alerte météo-santé notable pour le moment.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Source: Open-Meteo</p>
          </div>
        ) : (
          snapshot.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-2 p-2 rounded-lg ${
                alert.severity === 'warning' ? 'bg-mc-amber-500/10' : 'bg-mc-blue-500/5'
              }`}
            >
              {alertIcons[alert.type]}
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{alert.message}</p>
                  {alert.severity === 'warning' ? (
                    <Badge variant="amber" className="text-[9px]">
                      Alerte
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{alert.impact}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
