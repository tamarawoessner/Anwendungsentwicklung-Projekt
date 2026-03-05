<script setup lang="ts">
import StationMap from './components/StationMap.vue';
import { ref } from 'vue';
import Sidebar, { type SearchParams } from './components/Sidebar.vue';
import NearbyCard from './components/NearbyCard.vue';


export interface Station {
  name: string;
  station_id: string;
  lat: number;
  lon: number;
  distance_km: number;
  start_year: number;
  end_year: number;
}

const stations = ref<Station[]>([]);
const resultsCount = ref<number | null>(null);
const searchLat = ref<number | null>(null);
const searchLng = ref<number | null>(null);
const searchRadius = ref<number | null>(null);

const handleSearch = async (payload: SearchParams) => {
  searchLat.value = payload.lat;
  searchLng.value = payload.lng;
  searchRadius.value = payload.radius;
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
</script>

<template>
  <div class="app-layout">

    <Sidebar :stations="stations" :results-count="resultsCount" @search="handleSearch" />

    <main class="map-area">
      <div class="map-wrapper">
    <StationMap 
      :stations="stations" 
      :center-lat="searchLat" 
      :center-lng="searchLng" 
      :radius-km="searchRadius" 
    />
</div>

      <div class="nearby-area">
        <div class="nearby-header">
          <h2>Stationen in der Nähe</h2>
        </div>
          <div class="nearby-wrapper">
  <NearbyCard 
    v-for="i in 3" 
    :key="stations?.[i - 1]?.station_id ?? `placeholder-${i}`" 
    :station="stations[i - 1]" 
  />
</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh; 
  min-height: 100dvh;  
  width: 100%;     
  max-width: 100%;
  overflow-x: hidden;
  background-color: #0b1120; 
  color: white;
  font-family: sans-serif;
}

.map-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.map-wrapper {
  flex: 1;
  min-height: 300px;
  border-radius: 12px;
  margin: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e293b;
}

.nearby-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: clamp(20px, 5vw, 100px); 
  padding: 15px;
}

.nearby-header{
  margin-left: 15px;
}

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}


</style>