export type WeatherAlertType = 'heat' | 'cold' | 'rain' | 'wind' | 'snow' | 'storm' | 'uv';

export interface WeatherHealthAlertItem {
  id: string;
  type: WeatherAlertType;
  severity: 'warning' | 'info';
  message: string;
  impact: string;
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: 'geolocation' | 'fallback';
}

export interface WeatherHealthSnapshot {
  locationLabel: string;
  locationSource: WeatherLocation['source'];
  updatedAt: string;
  conditionLabel: string;
  currentWeatherCode: number;
  currentTemperatureC: number;
  apparentTemperatureC: number;
  windSpeedKmh: number;
  dailyMaxTemperatureC: number;
  dailyMinTemperatureC: number;
  dailyApparentMaxTemperatureC: number;
  precipitationProbabilityMax: number;
  windGustMaxKmh: number;
  uvIndexMax: number | null;
  alerts: WeatherHealthAlertItem[];
}

interface OpenMeteoForecastResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    apparent_temperature_max?: number[];
    precipitation_probability_max?: number[];
    wind_gusts_10m_max?: number[];
    uv_index_max?: Array<number | null>;
  };
}

export const defaultWeatherLocation: WeatherLocation = {
  latitude: 50.8503,
  longitude: 4.3517,
  label: 'Bruxelles',
  source: 'fallback',
};

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function firstDailyValue(values: Array<number | null | undefined> | undefined, label: string) {
  const value = values?.[0];
  if (typeof value !== 'number') {
    throw new Error(`Réponse météo invalide: ${label} manquant.`);
  }

  return value;
}

export function getWeatherConditionLabel(weatherCode: number) {
  if (weatherCode === 0) return 'Ciel dégagé';
  if (weatherCode === 1) return 'Peu nuageux';
  if (weatherCode === 2) return 'Partiellement nuageux';
  if (weatherCode === 3) return 'Couvert';
  if (weatherCode === 45 || weatherCode === 48) return 'Brouillard';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Bruine';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'Pluie';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'Neige';
  if ([95, 96, 99].includes(weatherCode)) return 'Orage';
  return 'Conditions variables';
}

function isSnowCode(weatherCode: number) {
  return [71, 73, 75, 77, 85, 86].includes(weatherCode);
}

function isRainCode(weatherCode: number) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode);
}

function isStormCode(weatherCode: number) {
  return [95, 96, 99].includes(weatherCode);
}

export function buildWeatherHealthAlerts(input: {
  weatherCode: number;
  currentTemperatureC: number;
  apparentTemperatureC: number;
  dailyMaxTemperatureC: number;
  dailyMinTemperatureC: number;
  dailyApparentMaxTemperatureC: number;
  precipitationProbabilityMax: number;
  windGustMaxKmh: number;
  uvIndexMax: number | null;
}) {
  const alerts: WeatherHealthAlertItem[] = [];

  if (isStormCode(input.weatherCode)) {
    alerts.push({
      id: 'storm',
      type: 'storm',
      severity: 'warning',
      message: 'Orages attendus aujourd’hui',
      impact: 'Anticipez les retards de tournée et limitez les déplacements non urgents.',
    });
  }

  if (input.dailyApparentMaxTemperatureC >= 30) {
    alerts.push({
      id: 'heat',
      type: 'heat',
      severity: 'warning',
      message: `Chaleur marquée prévue: ressenti jusqu’à ${roundToSingleDecimal(input.dailyApparentMaxTemperatureC)}°C`,
      impact: 'Renforcer l’hydratation et surveiller les patients fragiles ou insuffisants cardiaques.',
    });
  } else if (input.dailyApparentMaxTemperatureC >= 26) {
    alerts.push({
      id: 'heat',
      type: 'heat',
      severity: 'info',
      message: `Temps chaud prévu: ressenti jusqu’à ${roundToSingleDecimal(input.dailyApparentMaxTemperatureC)}°C`,
      impact: 'Prévoir de l’eau et éviter les efforts inutiles chez les patients vulnérables.',
    });
  }

  if (input.dailyMinTemperatureC <= 0) {
    alerts.push({
      id: 'cold',
      type: 'cold',
      severity: 'warning',
      message: `Températures basses prévues: ${roundToSingleDecimal(input.dailyMinTemperatureC)}°C à ${roundToSingleDecimal(input.dailyMaxTemperatureC)}°C`,
      impact: 'Vérifier chauffage, couverture et risque d’hypothermie chez les patients âgés.',
    });
  } else if (input.dailyMinTemperatureC <= 4) {
    alerts.push({
      id: 'cold',
      type: 'cold',
      severity: 'info',
      message: `Fraîcheur matinale prévue: minimum ${roundToSingleDecimal(input.dailyMinTemperatureC)}°C`,
      impact: 'Rester attentif au confort thermique des patients isolés.',
    });
  }

  if (isSnowCode(input.weatherCode)) {
    alerts.push({
      id: 'snow',
      type: 'snow',
      severity: 'warning',
      message: 'Neige ou averses de neige prévues',
      impact: 'Risque de glissade accru lors des déplacements et des sorties patient.',
    });
  } else if (input.precipitationProbabilityMax >= 65 || isRainCode(input.weatherCode)) {
    alerts.push({
      id: 'rain',
      type: 'rain',
      severity: input.precipitationProbabilityMax >= 80 ? 'warning' : 'info',
      message: `Pluie probable aujourd’hui: ${Math.round(input.precipitationProbabilityMax)}%`,
      impact: 'Prévoir plus de temps de trajet et redoubler de prudence à domicile.',
    });
  }

  if (input.windGustMaxKmh >= 60) {
    alerts.push({
      id: 'wind',
      type: 'wind',
      severity: 'warning',
      message: `Rafales fortes prévues: ${Math.round(input.windGustMaxKmh)} km/h`,
      impact: 'Adapter les tournées extérieures et sécuriser le matériel mobile.',
    });
  } else if (input.windGustMaxKmh >= 40) {
    alerts.push({
      id: 'wind',
      type: 'wind',
      severity: 'info',
      message: `Vent soutenu prévu: rafales jusqu’à ${Math.round(input.windGustMaxKmh)} km/h`,
      impact: 'Prévoir un peu plus de marge sur les trajets.',
    });
  }

  if ((input.uvIndexMax ?? 0) >= 6) {
    alerts.push({
      id: 'uv',
      type: 'uv',
      severity: 'info',
      message: `Indice UV élevé: ${roundToSingleDecimal(input.uvIndexMax ?? 0)}`,
      impact: 'Protéger les patients exposés et privilégier l’ombre lors des attentes extérieures.',
    });
  }

  return alerts;
}

export function buildWeatherHealthSnapshot(
  location: WeatherLocation,
  response: OpenMeteoForecastResponse
): WeatherHealthSnapshot {
  const current = response.current;
  const daily = response.daily;

  if (
    !current
    || typeof current.time !== 'string'
    || typeof current.temperature_2m !== 'number'
    || typeof current.apparent_temperature !== 'number'
    || typeof current.weather_code !== 'number'
    || typeof current.wind_speed_10m !== 'number'
    || !daily
  ) {
    throw new Error('Réponse météo invalide.');
  }

  const snapshot: WeatherHealthSnapshot = {
    locationLabel: location.label,
    locationSource: location.source,
    updatedAt: current.time,
    conditionLabel: getWeatherConditionLabel(current.weather_code),
    currentWeatherCode: current.weather_code,
    currentTemperatureC: roundToSingleDecimal(current.temperature_2m),
    apparentTemperatureC: roundToSingleDecimal(current.apparent_temperature),
    windSpeedKmh: roundToSingleDecimal(current.wind_speed_10m),
    dailyMaxTemperatureC: roundToSingleDecimal(firstDailyValue(daily.temperature_2m_max, 'temperature_2m_max')),
    dailyMinTemperatureC: roundToSingleDecimal(firstDailyValue(daily.temperature_2m_min, 'temperature_2m_min')),
    dailyApparentMaxTemperatureC: roundToSingleDecimal(
      firstDailyValue(daily.apparent_temperature_max, 'apparent_temperature_max')
    ),
    precipitationProbabilityMax: roundToSingleDecimal(
      firstDailyValue(daily.precipitation_probability_max, 'precipitation_probability_max')
    ),
    windGustMaxKmh: roundToSingleDecimal(firstDailyValue(daily.wind_gusts_10m_max, 'wind_gusts_10m_max')),
    uvIndexMax: daily.uv_index_max?.[0] ?? null,
    alerts: [],
  };

  snapshot.alerts = buildWeatherHealthAlerts({
    weatherCode: snapshot.currentWeatherCode,
    currentTemperatureC: snapshot.currentTemperatureC,
    apparentTemperatureC: snapshot.apparentTemperatureC,
    dailyMaxTemperatureC: snapshot.dailyMaxTemperatureC,
    dailyMinTemperatureC: snapshot.dailyMinTemperatureC,
    dailyApparentMaxTemperatureC: snapshot.dailyApparentMaxTemperatureC,
    precipitationProbabilityMax: snapshot.precipitationProbabilityMax,
    windGustMaxKmh: snapshot.windGustMaxKmh,
    uvIndexMax: snapshot.uvIndexMax,
  });

  return snapshot;
}

export async function fetchWeatherHealthSnapshot(
  location: WeatherLocation,
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_gusts_10m_max,uv_index_max',
    forecast_days: '1',
    timezone: 'auto',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Service météo indisponible (${response.status}).`);
  }

  const payload = (await response.json()) as OpenMeteoForecastResponse;
  return buildWeatherHealthSnapshot(location, payload);
}
