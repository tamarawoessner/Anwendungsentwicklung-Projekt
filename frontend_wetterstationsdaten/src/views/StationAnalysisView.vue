<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { StationMetaResponse, StationDataResponse, WeatherDataPoint } from '../types/index';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';

const router = useRouter();

const BASE_URL = 'http://localhost:8000';

const apiService = {
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

const currentStation = ref<any>(null);
const stationData = ref<any>(null);
const weatherData = ref<WeatherDataPoint[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const activeSelections = ref<string[]>(['Ganzes Jahr']);

const loadStationData = async () => {
  isLoading.value = true;
  errorMessage.value = null;
try {
    const stationId = 'GME00105229'; // Deine Test-ID
    
    // Wir rufen Metadaten UND Wetterdaten ab
    const [meta, dataResponse] = await Promise.all([
      apiService.getStationMeta(stationId),
      apiService.getStationData(stationId)
    ]);

    currentStation.value = meta;
    stationData.value = dataResponse;
  } catch (err) {
    errorMessage.value = "Verbindung zum Backend fehlgeschlagen";
    console.error("API Error:", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStationData();
});

const goBackToSearch = () => {
  router.push({ name: 'home' }); 
};
</script>

<template>
  <div class="analysis-view-container">
    
    <main class="content-grid">
      
      <aside class="left-column">
        
        <h2 class="section-title">Ausgewählte Station 📍</h2>

        <div class="station-info-box">
          <h3>{{ currentStation.name }}</h3>
          <p><strong>ID:</strong> {{ currentStation.id }}</p>
          <p><strong>Distanz:</strong> {{ currentStation.distanceKm }} km</p>
        </div>

        <button @click="goBackToSearch" class="btn-back">
          Zurück / Andere Station wählen
        </button>

        <div class="radial-menus-container">
          <div class="menu-wrapper">
            <h4>Jahreszeiten</h4>
            <RadialSeasonMenu />
          </div>
          
          <div class="menu-wrapper">
            <h4>Jahre</h4>
            <div class="placeholder-circle">Jahres-Menü</div>
          </div>
        </div>

        <div class="table-container">
          <h4>Details</h4>
          <div class="placeholder-table">
            Hier kommt die Tabelle (Jahr, Tmin, Tmax)
          </div>
        </div>

      </aside>

      <section class="right-column">
        <div class="chart-container">
          <TemperatureChart />
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.analysis-view-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}


.content-grid {
  display: grid;
  grid-template-columns: 1fr 2.5fr; 
  gap: 2.5rem;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  margin: 0;
  color: #333;
}

.station-info-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.station-info-box h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.2rem;
}

.station-info-box p {
  margin: 0.25rem 0;
  color: #475569;
}

.btn-back {
  padding: 0.75rem 1rem;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #334155;
  transition: all 0.2s;
  text-align: center;
}

.btn-back:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.radial-menus-container {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
}

.menu-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 50%;
}

.menu-wrapper h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.right-column {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.chart-container {
  width: 100%;
  min-height: 600px; 
}

/* Platzhalter */
.placeholder-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #64748b;
}

.placeholder-table {
  height: 250px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}
</style>