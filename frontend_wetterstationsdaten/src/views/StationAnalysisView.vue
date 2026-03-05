<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';
import StationDetailsTable from '../components/StationDetailsTable.vue';

const router = useRouter();

const currentStation = ref<any>(null);

onMounted(() => {
  if (history.state && history.state.stationData) {
    currentStation.value = history.state.stationData;

    fetchStationData();
  } else {
    console.warn("Keine Stationsdaten gefunden. Gehe zurück zur Suche.");
    router.push({ name: 'home' });
  }
})/*

onMounted(() => {
  if (history.state && history.state.stationData) {
    // Der echte Weg: Wenn die Suche später fertig ist, nehmen wir die echten Daten
    currentStation.value = history.state.stationData;
    fetchStationData(); 
  } else {
    // TEMPORÄRER WORKAROUND FÜR DICH ZUM TESTEN:
    console.warn("Keine echten Router-Daten gefunden! Lade Dummy-Station zum Testen.");
    
    // Wir setzen hier einfach eine Station hart rein, die es im Backend gibt
    currentStation.value = {
      id: 'GME00122842', // Achte darauf, dass diese ID in eurer Datenbank existiert!
      name: 'Villingen-Schwenningen (Test-Modus)',
      distanceKm: 6,
      period: '1970-2025'
    };
    
    fetchStationData(); // Und laden die API trotzdem!
  }
});*/

const activeSelections = ref<string[]>(['Ganzes Jahr']);
const fetchedStationData = ref<any>(null);
const isLoading = ref(false);

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

const buildRequestPayload = () => {
  const selectionObj: Record<string, any> = {
    year: null, winter: null, spring: null, summer: null, autumn: null
  };

  const map: Record<string, any> = {
    'year': {both: 'Ganzes Jahr', min: 'Ganzes Jahr - min', max: 'Ganzes Jahr - max'},
    'winter': {both: 'Winter', min: 'Winter - min', max: 'Winter - max'},
    'spring': {both: 'Frühling', min: 'Frühling - min', max: 'Frühling - max'},
    'summer': {both: 'Sommer', min: 'Sommer - min', max: 'Sommer - max'},
    'autumn': {both: 'Herbst', min: 'Herbst - min', max: 'Herbst - max'}
  }

  for (const [key, mapping] of Object.entries(map)) {
    const tmin = activeSelections.value.includes(mapping.both) || activeSelections.value.includes(mapping.min);
    const tmax = activeSelections.value.includes(mapping.both) || activeSelections.value.includes(mapping.max);
    
    if (tmin || tmax) {
      selectionObj[key] = { tmin, tmax };
    }
  }

  return { selection: selectionObj };
};

const fetchStationData = async () => {
  if (activeSelections.value.length === 0) {
    fetchedStationData.value = null;
    return;
  }

  isLoading.value = true;
  const payload = buildRequestPayload();

  try {
    const [startYear, endYear] = currentStation.value.period.split('-');
    const url = `http://localhost:8000/stations/${currentStation.value.id}/data?start_year=${startYear}&end_year=${endYear}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Netzwerk-Antwort war nicht ok (Status: ${res.status})`);
    
    const data = await res.json();
    fetchedStationData.value = data;
  } catch (err) {
    console.error("Fehler beim Laden der API:", err);
  } finally {
    isLoading.value = false;
  }
};

watch(activeSelections, fetchStationData, { deep: true });

</script>

<template>
  <div class="analysis-view-container">
    
    <main class="content-grid">
      
      <aside class="left-column">
        
        <h2 class="section-title">Ausgewählte Station 📍</h2>

      <div class="station-info-box" v-if="currentStation">
        <h3>{{ currentStation.name }}</h3>
        <p class="station-id">#{{ currentStation.id }}</p>
        <div class="station-details">
          <p>Entfernung: {{ currentStation.distanceKm }}km</p>
          <p>Zeitraum: {{ currentStation.period }}</p>
        </div>
      </div>

        <button @click="goBackToSearch" class="btn-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
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
          <StationDetailsTable :selections="activeSelections" :data="fetchedStationData" />
        </div>
      </aside>

      <section class="right-column">
        <div class="chart-container">
          <TemperatureChart :selections="activeSelections" :data="fetchedStationData" />
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
  border: none;
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
  .table-container {
    max-height: 320px; 
    overflow-y: auto;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  }
}
</style>