export interface Station {
  name: string;
  station_id: string;
  lat: number;
  lon: number;
  distance_km: number;
  start_year: number;
  end_year: number;
}

export interface SearchParams {
  lat: number | null;
  lng: number | null;
  radius: number;
  startYear: number | null;
  endYear: number | null;
  limit: number;
}
