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

export interface WeatherDataPoint {
  year: number;
  tmin_mean_c?: number;
  tmax_mean_c?: number;
}

export interface StationDataResponse {
  station: any;
  availability: any;
  year: {
    data: WeatherDataPoint[];
  };
  seasons: {
    [key: string]: {
      data: WeatherDataPoint[];
    }
  };
}