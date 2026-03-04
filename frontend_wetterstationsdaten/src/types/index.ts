export interface StationMeta {
  id: string;
  name: string;
  distanceKm: number;
  period: string;
}

export interface WeatherDataPoint {
  year: number;
  values: {
    [key: string]: number | null;
  };
}

export interface StationMetaResponse {
  station: {
    station_id: string;
    name: string;
    lat: number;
    lon: number;
  };
  availability: {
    start_year: number;
    end_year: number;
  };
}

export interface StationDataResponse {
  station: {
    station_id: string;
    name: string;
    lat: number;
    lon: number;
  };
  availability: {
    start_year: number;
    end_year: number;
  };
  request: {
    station_id: string;
    start_year: number;
    end_year: number;
  };
  year: {
    element: string;
    data: WeatherDataPoint[];
  };
  seasons: {
    [key: string]: {
      data: WeatherDataPoint[];
    };
  };
}
