<script setup lang="ts">
import StationMap from '../components/StationMap.vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import NearbyCard from '../components/NearbyCard.vue';
import type { Station, SearchParams } from '../types';

const router = useRouter();
const route = useRoute();
const SEARCH_STATE_KEY = 'weather-search-state';

const stations = ref<Station[]>([]);
const resultsCount = ref<number | null>(null);
const searchLat = ref<number | null>(null);
const searchLng = ref<number | null>(null);
const searchLatInput = ref<string>('');
const searchLngInput = ref<string>('');
const searchRadius = ref<number | null>(null);
const hasSearched = ref<boolean>(false);
const searchStartYear = ref<number | null>(null);
const searchEndYear = ref<number | null>(null);
const searchLimit = ref<number>(10);

const CARD_WIDTH = 300;
const CARD_GAP = 24;
const nearbyRef = ref<HTMLElement | null>(null);
const containerWidth = ref(1200);
let resizeObserver: ResizeObserver | null = null;

const maxCardsFit = computed(() => {
  if (containerWidth.value < CARD_WIDTH) return 1;
  return Math.floor((containerWidth.value + CARD_GAP) / (CARD_WIDTH + CARD_GAP));
});

const cardsToDisplay = computed(() => {
  const maxSlots = Math.min(maxCardsFit.value, 4);
  if (!hasSearched.value) return 0;
  return Math.min(stations.value.length, maxSlots);
});

const parseQueryNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const persistSearchState = (payload: SearchParams) => {
  sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(payload));
};

const readPersistedSearchState = (): SearchParams | null => {
  const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SearchParams>;
    const lat = parseQueryNumber(parsed.lat);
    const lng = parseQueryNumber(parsed.lng);

    if (lat === null || lng === null) {
      return null;
    }

    const radius = parseQueryNumber(parsed.radius);
    const limit = parseQueryNumber(parsed.limit);

    return {
      lat,
      lng,
      radius: radius !== null ? Math.min(100, Math.max(1, Math.round(radius))) : 20,
      startYear: parseQueryNumber(parsed.startYear),
      endYear: parseQueryNumber(parsed.endYear),
      limit: limit !== null ? Math.max(1, Math.round(limit)) : 10
    };
  } catch {
    return null;
  }
};

const sidebarInitialSearch = computed(() => ({
  lat: searchLat.value,
  lng: searchLng.value,
  latInput: searchLatInput.value,
  lngInput: searchLngInput.value,
  radius: searchRadius.value,
  startYear: searchStartYear.value,
  endYear: searchEndYear.value,
  limit: searchLimit.value
}));

onMounted(() => {
  if (nearbyRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(nearbyRef.value);
  }

  const queryLat = parseQueryNumber(route.query.lat);
  const queryLng = parseQueryNumber(route.query.lng);

  if (queryLat === null || queryLng === null) {
    const storedPayload = readPersistedSearchState();
    if (storedPayload) {
      handleSearch(storedPayload);
    }
    return;
  }

  const queryRadius = parseQueryNumber(route.query.radius_km);
  const queryLimit = parseQueryNumber(route.query.limit);
  const queryStartYear = parseQueryNumber(route.query.start_year);
  const queryEndYear = parseQueryNumber(route.query.end_year);
  const queryLatInput = typeof route.query.lat_input === 'string' ? route.query.lat_input : String(queryLat);
  const queryLngInput = typeof route.query.lng_input === 'string' ? route.query.lng_input : String(queryLng);

  const payload: SearchParams = {
    lat: queryLat,
    lng: queryLng,
    latInput: queryLatInput,
    lngInput: queryLngInput,
    radius: queryRadius !== null ? Math.min(100, Math.max(1, Math.round(queryRadius))) : 20,
    startYear: queryStartYear,
    endYear: queryEndYear,
    limit: queryLimit !== null ? Math.max(1, Math.round(queryLimit)) : 10
  };

  persistSearchState(payload);
  handleSearch(payload);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

const handleSearch = async (payload: SearchParams) => {
  persistSearchState(payload);

  hasSearched.value = true;
  searchLat.value = payload.lat;
  searchLng.value = payload.lng;
  searchLatInput.value = payload.latInput ?? (payload.lat !== null ? String(payload.lat) : '');
  searchLngInput.value = payload.lngInput ?? (payload.lng !== null ? String(payload.lng) : '');
  searchRadius.value = payload.radius;
  searchStartYear.value = payload.startYear;
  searchEndYear.value = payload.endYear;
  searchLimit.value = payload.limit;

  const apiPayload = {
    lat: payload.lat,
    lon: payload.lng,
    radius_km: payload.radius,
    limit: payload.limit,
    start_year: payload.startYear,
    end_year: payload.endYear
  };

  try {
    const response = await fetch('/api/stations/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) throw new Error(`Fehler vom Server: Status ${response.status}`);

    const data = await response.json();
    
    stations.value = data.stations; 
    resultsCount.value = Number.isFinite(data.count) ? data.count : data.stations.length;

  } catch (error) {
    stations.value = [];
    resultsCount.value = null;
    console.error("Fehler beim Abrufen der Daten.", error);
  }
};

const navigateToAnalysis = (station: Station) => {
  const resolvedStartYear = searchStartYear.value != null ? searchStartYear.value : station.start_year;
  const resolvedEndYear = searchEndYear.value != null ? searchEndYear.value : station.end_year;

  const query: Record<string, string> = {
    name: station.name,
    distance_km: String(station.distance_km),
    start_year: String(resolvedStartYear),
    end_year: String(resolvedEndYear),
    radius_km: searchRadius.value != null ? String(searchRadius.value) : '20',
    limit: String(searchLimit.value)
  };

  if (searchLat.value != null) query.lat = String(searchLat.value);
  if (searchLng.value != null) query.lng = String(searchLng.value);
  if (searchLatInput.value.length > 0) query.lat_input = searchLatInput.value;
  if (searchLngInput.value.length > 0) query.lng_input = searchLngInput.value;
  if (searchStartYear.value != null) query.search_start_year = String(searchStartYear.value);
  if (searchEndYear.value != null) query.search_end_year = String(searchEndYear.value);

  router.push({
    name: 'analyse',
    params: { stationId: station.station_id },
    query
  });
};
</script>

<template>
  <div class="app-layout">

    <Sidebar 
      :stations="stations" 
      :results-count="resultsCount" 
      :has-searched="hasSearched" 
      :initial-search="sidebarInitialSearch"
      @search="handleSearch" 
      @station-select="navigateToAnalysis"
    />

    <main class="map-area">
      <div class="map-wrapper">
        <StationMap 
          :stations="stations" 
          :center-lat="searchLat" 
          :center-lng="searchLng" 
          :radius-km="searchRadius" 
        />
      </div>

      <div class="nearby-area" ref="nearbyRef">
        <div class="nearby-header" v-if="cardsToDisplay > 0">
          <h2>Stationen in der Nähe</h2>
        </div>
          <div v-if="!hasSearched" class="no-results">
            <span>Warten auf Suche...</span>
          </div>
          <div v-else-if="hasSearched && stations.length === 0" class="no-results">
            <span>Die Suche ergab keine Treffer. Versuche einen größeren Radius oder andere Kriterien.</span>
          </div>
          <div v-else-if="cardsToDisplay > 0" class="nearby-wrapper">
            <NearbyCard 
              v-for="i in cardsToDisplay" 
              :key="stations?.[i - 1]?.station_id ?? `placeholder-${i}`" 
              :station="stations[i - 1]" 
              @select="navigateToAnalysis"
            />
          </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh; 
  height: 100dvh;  
  width: 100%;     
  max-width: 100%;
  overflow: hidden;
  background-color: #0b1120; 
  color: white;
}

.map-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.map-wrapper {
  flex: 1;
  min-height: 0;
  border-radius: 12px;
  margin: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e293b;
  overflow: hidden;
}

.nearby-area {
  margin: 0 15px 10px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px 20px 16px;
  min-height: 130px;
  flex-shrink: 0;
}

.nearby-wrapper {
  display: flex;
  justify-content: flex-start;
  gap: 24px;
  flex-wrap: nowrap;
}

.nearby-header{
  margin-bottom: 10px;
}

.nearby-header h2 {
  font-size: 1.1rem;
  margin: 0;
}

.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #94a3b8;
  font-style: italic;
  font-size: 0.95rem;
  text-align: center;
  padding: 0 20px;
}
</style>
