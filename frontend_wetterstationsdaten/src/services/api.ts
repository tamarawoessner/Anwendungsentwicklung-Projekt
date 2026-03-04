import type { StationMetaResponse, StationDataResponse } from '../types';

const BASE_URL = 'http://localhost:8000';

export const apiService = {
  async getStationMeta(id: string): Promise<StationMetaResponse> {
    const response = await fetch(`${BASE_URL}/stations/${id}/meta`);
    if (!response.ok) throw new Error('Station-Metadaten konnten nicht geladen werden');
    return response.json();
  },

  async getStationData(id: string): Promise<StationDataResponse> {
    const response = await fetch(`${BASE_URL}/stations/${id}/data`); 
    if (!response.ok) throw new Error('Wetterdaten konnten nicht geladen werden');
    return response.json();
  }
};
/*
// src/services/api.ts
import type { StationMetaResponse, StationDataResponse } from '../types';

export const apiService = {
  // Metadaten-Mock
  async getStationMeta(id: string): Promise<StationMetaResponse> {
    return {
      station: {
        station_id: id,
        name: 'Villingen-Schwenningen (Testbetrieb)',
        lat: 48.06,
        lon: 8.45
      },
      availability: {
        start_year: 1950,
        end_year: 2024
      }
    };
  },

  // Wetterdaten-Mock
  async getStationData(id: string): Promise<StationDataResponse> {
    return {
      station: { station_id: id, name: 'Test-Station', lat: 0, lon: 0 },
      availability: { start_year: 2000, end_year: 2024 },
      request: { station_id: id, start_year: 2000, end_year: 2024 },
      year: {
        element: "BOTH" as any,
        data: [
          { year: 2024, tmin_mean_c: 5.2, tmax_mean_c: 14.8 },
          { year: 2023, tmin_mean_c: 6.1, tmax_mean_c: 15.5 },
          { year: 2022, tmin_mean_c: 4.8, tmax_mean_c: 16.2 }
        ]
      },
      seasons: { 
        WINTER: { data: [] }, 
        SUMMER: { data: [] }, 
        SPRING: { data: [] }, 
        AUTUMN: { data: [] } 
      }
    } as StationDataResponse;
  }
};*/