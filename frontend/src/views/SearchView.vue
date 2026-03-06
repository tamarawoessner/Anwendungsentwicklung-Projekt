<script setup lang="ts">
import StationMap from '../components/StationMap.vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import NearbyCard from '../components/NearbyCard.vue';
import type { Station, SearchParams } from '../types';

const router = useRouter();

const stations = ref<Station[]>([]);
const resultsCount = ref<number | null>(null);
const searchLat = ref<number | null>(null);
const searchLng = ref<number | null>(null);
const searchRadius = ref<number | null>(null);
const hasSearched = ref<boolean>(false);
const searchStartYear = ref<number | null>(null);
const searchEndYear = ref<number | null>(null);

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

onMounted(() => {
  if (nearbyRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    resizeObserver.observe(nearbyRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

const handleSearch = async (payload: SearchParams) => {
  hasSearched.value = true;
  searchLat.value = payload.lat;
  searchLng.value = payload.lng;
  searchRadius.value = payload.radius;
  searchStartYear.value = payload.startYear;
  searchEndYear.value = payload.endYear;

  const apiPayload = {
    lat: payload.lat,
    lon: payload.lng,
    radius_km: payload.radius,
    limit: payload.limit,
    start_year: payload.startYear,
    end_year: payload.endYear
  };

  try {
    const response = await fetch('http://localhost:8000/stations/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) throw new Error(`Fehler vom Server: Status ${response.status}`);

    const data = await response.json();
    
    stations.value = data.stations; 
    resultsCount.value = Number.isFinite(data.count) ? data.count : data.stations.length;

    console.log(`BÄM! ${data.count} Stationen gefunden:`, stations.value);

  } catch (error) {
    resultsCount.value = null;
    console.error("Ohje, da ging was schief beim Abrufen:", error);
  }
};

const navigateToAnalysis = (station: Station) => {
  router.push({
    name: 'analyse',
    params: { stationId: station.station_id },
    query: {
      name: station.name,
      distance_km: String(station.distance_km),
      start_year: searchStartYear.value != null ? String(searchStartYear.value) : String(station.start_year),
      end_year: searchEndYear.value != null ? String(searchEndYear.value) : String(station.end_year)
    }
  });
};
</script>

<template>
  <div class="app-layout">

    <Sidebar 
      :stations="stations" 
      :results-count="resultsCount" 
      :has-searched="hasSearched" 
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
          <div v-if="hasSearched && stations.length === 0" class="no-results">
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
