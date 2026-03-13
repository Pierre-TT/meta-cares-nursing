import { describe, expect, it } from 'vitest';
import {
  buildWeatherHealthAlerts,
  buildWeatherHealthSnapshot,
  defaultWeatherLocation,
  getWeatherConditionLabel,
} from './weather';

describe('weather helpers', () => {
  it('maps Open-Meteo weather codes to readable labels', () => {
    expect(getWeatherConditionLabel(0)).toBe('Ciel dégagé');
    expect(getWeatherConditionLabel(63)).toBe('Pluie');
    expect(getWeatherConditionLabel(95)).toBe('Orage');
  });

  it('builds multiple health alerts from a risky forecast', () => {
    const alerts = buildWeatherHealthAlerts({
      weatherCode: 95,
      currentTemperatureC: 28.1,
      apparentTemperatureC: 31.2,
      dailyMaxTemperatureC: 29.8,
      dailyMinTemperatureC: 17.4,
      dailyApparentMaxTemperatureC: 31.4,
      precipitationProbabilityMax: 86,
      windGustMaxKmh: 64,
      uvIndexMax: 6.4,
    });

    expect(alerts.map((alert) => alert.id)).toEqual(expect.arrayContaining(['storm', 'heat', 'rain', 'wind', 'uv']));
    expect(alerts.find((alert) => alert.id === 'storm')?.severity).toBe('warning');
  });

  it('transforms an Open-Meteo payload into a snapshot', () => {
    const snapshot = buildWeatherHealthSnapshot(defaultWeatherLocation, {
      current: {
        time: '2026-03-10T09:00',
        temperature_2m: 6.8,
        apparent_temperature: 4.9,
        weather_code: 63,
        wind_speed_10m: 18.4,
      },
      daily: {
        time: ['2026-03-10'],
        weather_code: [63],
        temperature_2m_max: [9.6],
        temperature_2m_min: [1.2],
        apparent_temperature_max: [7.8],
        precipitation_probability_max: [74],
        wind_gusts_10m_max: [42],
        uv_index_max: [2.8],
      },
    });

    expect(snapshot.locationLabel).toBe('Bruxelles');
    expect(snapshot.conditionLabel).toBe('Pluie');
    expect(snapshot.currentTemperatureC).toBe(6.8);
    expect(snapshot.alerts.map((alert) => alert.id)).toEqual(expect.arrayContaining(['cold', 'rain', 'wind']));
  });
});
