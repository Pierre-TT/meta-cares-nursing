import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { defaultWeatherLocation, fetchWeatherHealthSnapshot, type WeatherLocation } from '@/lib/weather';

const weatherHealthQueryKey = ['weather-health'] as const;

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

export function useWeatherHealth() {
  const [location, setLocation] = useState<WeatherLocation>(defaultWeatherLocation);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
          label: 'Autour de vous',
          source: 'geolocation',
        });
      },
      () => {
        setLocation(defaultWeatherLocation);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 15,
        timeout: 8000,
      }
    );
  }, []);

  return useQuery({
    queryKey: [...weatherHealthQueryKey, location.latitude, location.longitude],
    queryFn: ({ signal }) => fetchWeatherHealthSnapshot(location, signal),
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 30,
    placeholderData: (previous) => previous,
  });
}
