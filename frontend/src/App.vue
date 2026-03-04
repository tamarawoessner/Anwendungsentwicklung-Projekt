<script setup lang="ts">
import { ref } from 'vue';
import Sidebar, { type SearchParams } from './components/Sidebar.vue';
import NearbyCard from './components/NearbyCard.vue';

export interface Station {
  station_id: string;
  lat: number;
  lon: number;
  distance_km: number;
  start_year: number;
  end_year: number;
}

const stations = ref<Station[]>([]);

const handleSearch = async (payload: SearchParams) => {
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

    console.log(`BÄM! ${data.count} Stationen gefunden:`, stations.value);

  } catch (error) {
    console.error("Ohje, da ging was schief beim Abrufen:", error);
  }
};
</script>

<template>
  <div class="app-layout">

    <Sidebar :stations="stations" @search="handleSearch" />

    <main class="map-area">
      <div class="map-wrapper">
        <div id="map-container">Platzhalter Karte
        </div>
      </div>

      <div class="nearby-area">
        <div class="nearby-header">
          <h2>Stationen in der Nähe</h2>
        </div>
        <div class="nearby-wrapper">
          <NearbyCard />
          <NearbyCard />
          <NearbyCard />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
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
  gap: 100px;
  padding: 15px;
}

.nearby-header{
  margin-left: 15px;
}
</style>