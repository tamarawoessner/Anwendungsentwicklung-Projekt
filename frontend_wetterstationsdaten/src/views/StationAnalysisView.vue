<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { StationMetaResponse, StationDataResponse, StationMeta, WeatherDataPoint } from '../types/index';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';
import StationDetailsTable from '../components/StationDetailsTable.vue';

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

const toggleSelection = (bereich: string) => {
  const index = activeSelections.value.indexOf(bereich);
  
  if (index > -1) {
    activeSelections.value.splice(index, 1);
  } else {
    activeSelections.value.push(bereich);
  }
};

const goBackToSearch = () => {
  router.push({ name: 'home' }); 
};
</script>

<template>
  <div class="analysis-view-container">
    
    <div v-if="isLoading" class="state-overlay">
      <div class="spinner"></div>
      <p>Daten werden von der Wetterstation abgerufen...</p>
    </div>

    <div v-else-if="errorMessage" class="state-overlay error">
      <div class="error-content">
        <h2>Ups! Etwas lief schief.</h2>
        <p>{{ errorMessage }}</p>
        <button @click="loadStationData" class="btn-back">Erneut versuchen</button>
      </div>
    </div>

    <main v-else class="content-grid">
      
      <aside class="left-column">
        <h2 class="section-title">Ausgewählte Station 📍</h2>

        <div class="station-info-box" v-if="currentStation">
          <h3>{{ currentStation.station.name }}</h3>
          <p class="station-id">#{{ currentStation.station.station_id }}</p>
          <div class="station-details">
            <p>Zeitraum: {{ currentStation.availability.start_year }} - {{ currentStation.availability.end_year }}</p>
          </div>
        </div>

        <button @click="goBackToSearch" class="btn-back">
          andere Station wählen
        </button>

        <div class="selection-container">
          <h4>Auswahl</h4>
          <RadialSeasonMenu @selection-changed="toggleSelection" />
        </div>

        <div class="table-section">
          <div class="header-with-icon">
            <h4>Details</h4>
          </div>
          <StationDetailsTable 
            :selections="activeSelections" 
            :data="stationData" 
          />
        </div>
      </aside>

      <section class="right-column">
        <div class="chart-container">
          <TemperatureChart 
            :selections="activeSelections" 
            :data="stationData" 
          />
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.analysis-view-container {
  padding: 1rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.content-grid {
  display: grid;
  grid-template-columns: 350px 1fr; 
  gap: 2rem;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%; 
  min-height: 0; 
  overflow: hidden;
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.right-column {
  background-color: rgba(0, 0, 0, 0.85);
  border: 1px solid #545454;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.chart-container {
  width: 100%;
  flex: 1;
  position: relative;
  min-height: 0;
}

.section-title {
  font-size: 1.25rem;
  margin: 0;
  color: #ffffff;
}

.station-info-box {
  border: 1px solid #545454;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.station-info-box h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.station-info-box p {
  margin: 0.15rem 0;
  font-size: 0.9rem;
  color: #ffffff;
}

.btn-back {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  background: linear-gradient(90deg, #004aad, #cb6ce6);
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #ffffff;
  transition: all 0.2s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-back:hover {
  opacity: 0.8;
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

.table-container::-webkit-scrollbar {
  width: 6px;
}
.table-container::-webkit-scrollbar-track {
  background: transparent;
}
.table-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: background 0.3s;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.state-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.1);
  border-top-color: #cb6ce6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-content {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid #ef4444;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-content h2,
.error-content p {
  text-align: center;
  margin-bottom: 1rem;
}

.error-content button {
  margin-top: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media screen and (min-width: 601px) and (max-width: 1024px) {
  .analysis-view-container {
    height: auto !important;
    min-height: 100vh;
  }

  .content-grid {
    display: flex !important;
    flex-direction: column;
    gap: 2rem;
  }

  .left-column {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    height: auto !important;
    position: relative;
  }

  .left-column > * {
    grid-column: 1;
  }

  .left-column > .table-section {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: calc(50% - 0.75rem);
    height: 100% !important;
    margin-top: 0 !important;
  }

  .right-column {
    width: 100%;
    height: 450px !important;
    margin-top: 1rem;
  }
}

@media screen and (max-width: 600px) {
  .analysis-view-container {
    height: auto !important;
  }

  .content-grid {
    display: flex !important;
    flex-direction: column;
  }

  .left-column {
    display: flex !important;
    flex-direction: column;
    gap: 1rem;
  }

  .table-section {
    height: 400px !important;
  }

  .right-column {
    height: 400px !important;
    min-height: 400px !important;
    display: flex !important;
    flex-direction: column;
    margin-top: 1rem;
  }
}
</style>