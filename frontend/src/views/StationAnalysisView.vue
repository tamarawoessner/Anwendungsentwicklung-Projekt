<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';
import StationDetailsTable from '../components/StationDetailsTable.vue';

const route = useRoute();
const router = useRouter();

const props = defineProps<{
  stationId: string;
}>();

const currentStation = ref<any>(null);
const activeSelections = ref<string[]>(['Ganzes Jahr Tmin', 'Ganzes Jahr Tmax']);
const fetchedStationData = ref<any>(null);
const isLoading = ref(false);

const parseYear = (value: unknown): number | null => {
  const year = Number(value);
  return Number.isFinite(year) ? year : null;
};

const startYearInput = ref<number | null>(parseYear(route.query.start_year));
const endYearInput = ref<number | null>(parseYear(route.query.end_year));

onMounted(() => {
  const name = (route.query.name as string) || props.stationId;
  const distanceKm = Number(route.query.distance_km) || 0;
  const startYear = parseYear(route.query.start_year);
  const endYear = parseYear(route.query.end_year);

  currentStation.value = {
    id: props.stationId,
    name: name,
    distanceKm: distanceKm,
    period: startYear !== null && endYear !== null ? `${startYear}-${endYear}` : '—'
  };

  startYearInput.value = startYear;
  endYearInput.value = endYear;

  fetchStationData();
});

const toggleSelection = (bereich: string) => {
  const relations: Record<string, string[]> = {
    'Ganzes Jahr': ['Ganzes Jahr Tmin', 'Ganzes Jahr Tmax'],
    'Winter': ['Winter Tmin', 'Winter Tmax'],
    'Frühling': ['Frühling Tmin', 'Frühling Tmax'],
    'Sommer': ['Sommer Tmin', 'Sommer Tmax'],
    'Herbst': ['Herbst Tmin', 'Herbst Tmax']
  };

  if (relations[bereich]) {
    const subSelections = relations[bereich];
    const allPresent = subSelections.every(s => activeSelections.value.includes(s));
    if (allPresent) {
      activeSelections.value = activeSelections.value.filter(s => !subSelections.includes(s));
    } else {
      subSelections.forEach(s => {
        if (!activeSelections.value.includes(s)) activeSelections.value.push(s);
      });
    }
  } else {
    const index = activeSelections.value.indexOf(bereich);
    if (index > -1) {
      activeSelections.value.splice(index, 1);
    } else {
      activeSelections.value.push(bereich);
    }
  }
};

const buildRequestPayload = () => {
  const selectionObj: Record<string, any> = {
    year: null, winter: null, spring: null, summer: null, autumn: null
  };
  const map = {
    year: { min: 'Ganzes Jahr Tmin', max: 'Ganzes Jahr Tmax' },
    winter: { min: 'Winter Tmin', max: 'Winter Tmax' },
    spring: { min: 'Frühling Tmin', max: 'Frühling Tmax' },
    summer: { min: 'Sommer Tmin', max: 'Sommer Tmax' },
    autumn: { min: 'Herbst Tmin', max: 'Herbst Tmax' }
  };
  for (const [key, sub] of Object.entries(map)) {
    const tmin = activeSelections.value.includes(sub.min);
    const tmax = activeSelections.value.includes(sub.max);
    if (tmin || tmax) {
      selectionObj[key] = { tmin, tmax };
    }
  }
  return { selection: selectionObj };
};

const dateError = computed(() => {
  if (startYearInput.value === null || endYearInput.value === null) {
    return null;
  }

  if (Number(startYearInput.value) >= Number(endYearInput.value)) {
    return "Das Startjahr muss vor dem Endjahr liegen.";
  }

  if (currentStation.value?.period) {
    const [dbStart, dbEnd] = currentStation.value.period.split('-').map(Number);

    if (!Number.isFinite(dbStart) || !Number.isFinite(dbEnd)) {
      return null;
    }
    
    if (Number(startYearInput.value) < dbStart) {
      return `Daten erst ab ${dbStart} verfügbar.`;
    }
    if (Number(endYearInput.value) > dbEnd) {
      return `Daten nur bis ${dbEnd} verfügbar.`;
    }
  }

  return null;
});

const fetchStationData = async () => {
  if (startYearInput.value === null || endYearInput.value === null) {
    fetchedStationData.value = null;
    return;
  }

  if (startYearInput.value >= endYearInput.value) {
    fetchedStationData.value = null;
    return;
  }

  isLoading.value = true;
  const payload = buildRequestPayload();

  try {
    const url = `http://localhost:8000/stations/${currentStation.value.id}/data?start_year=${startYearInput.value}&end_year=${endYearInput.value}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    fetchedStationData.value = data;

    if (data.availability) {
      currentStation.value.period = `${data.availability.start_year}-${data.availability.end_year}`;
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  } finally {
    isLoading.value = false;
  }
};

watch([activeSelections, startYearInput, endYearInput], () => {
  fetchStationData();
}, { deep: true });

const goBackToSearch = () => {
  const query: Record<string, string> = {};

  const lat = route.query.lat;
  const lng = route.query.lng;
  const latInput = route.query.lat_input;
  const lngInput = route.query.lng_input;
  const radiusKm = route.query.radius_km;
  const limit = route.query.limit;
  const searchStartYear = route.query.search_start_year;
  const searchEndYear = route.query.search_end_year;

  if (typeof lat === 'string' && lat.length > 0) query.lat = lat;
  if (typeof lng === 'string' && lng.length > 0) query.lng = lng;
  if (typeof latInput === 'string' && latInput.length > 0) query.lat_input = latInput;
  if (typeof lngInput === 'string' && lngInput.length > 0) query.lng_input = lngInput;
  if (typeof radiusKm === 'string' && radiusKm.length > 0) query.radius_km = radiusKm;
  if (typeof limit === 'string' && limit.length > 0) query.limit = limit;
  if (typeof searchStartYear === 'string' && searchStartYear.length > 0) query.start_year = searchStartYear;
  if (typeof searchEndYear === 'string' && searchEndYear.length > 0) query.end_year = searchEndYear;

  router.push({ name: 'search', query });
};
</script>

<template>
  <div class="analysis-view-container">
    <main class="content-grid">
      <aside class="left-column">
        <h2 class="section-title">
          Ausgewählte Station
          <img src="../assets/pin.png" alt="Pin-Icon" class="pin-icon">
        </h2>

        <div class="station-info-box" v-if="currentStation">
          <h3>{{ currentStation.name }}</h3>
          <p class="station-id">#{{ currentStation.id }}</p>
          <div class="station-details">
            <p>Entfernung: {{ Number(currentStation.distanceKm).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }} km</p>
            <p>Zeitraum: {{ currentStation.period }}</p>
          </div>
        </div>

        <button @click="goBackToSearch" class="btn-back">andere Station wählen</button>

        <div class="selection-container">
          <h4>Auswahl</h4>
          
          <div class="selection-controls-wrapper">
            <div class="radial-menus-mini">
              <RadialSeasonMenu :activeSelections="activeSelections" @selection-changed="toggleSelection" />
            </div>

            <div class="year-selector-compact">
              <div class="compact-input-group">
                <label>Startjahr</label>
                <input 
                  type="number" 
                  v-model="startYearInput" 
                  class="dark-input compact-year-field"
                  :class="{ 'input-error': dateError }"
                >
              </div>
              <div class="compact-input-group">
                <label>Endjahr</label>
                <input 
                  type="number" 
                  v-model="endYearInput" 
                  class="dark-input compact-year-field"
                  :class="{ 'input-error': dateError }"
                >
              </div>

              <p v-if="dateError" class="error-box">
                {{ dateError }}
              </p>
            </div>
          </div>
        </div>

        <div class="table-section">
          <h4>Details</h4>
          <StationDetailsTable :selections="activeSelections" :data="fetchedStationData" />
        </div>
      </aside>

      <section class="right-column">
        <div class="chart-container">
          <div v-if="isLoading" class="loader-hint">Lade Daten...</div>
          <TemperatureChart
            :selections="activeSelections"
            :data="fetchedStationData"
            @toggle-selection="toggleSelection"
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
  overflow: hidden;
}

.selection-container {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
}

.selection-controls-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.radial-menus-mini {
  flex: 2.5;
  transform: scale(0.95);
  margin-left: -15px;
}

.year-selector-compact {
  flex: 0.75;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 150px;
}

.compact-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-input-group label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.error-box {
  background-color: rgba(245, 158, 11, 0.15);
  color: #ffffff;
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-top: 5px;
  line-height: 1.2;
}

.input-error {
  border-color: #fbbf24;
  box-shadow: 0 0 5px rgba(251, 191, 36, 0.2);
}

.dark-input {
  background-color: transparent; 
  color: white;
  border: 1px solid #475569;
  border-radius: 6px; 
  padding: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
  width: 100%;
  text-align: center;
}

.dark-input:focus {
  border-color: #a855f7; 
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
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chart-container {
  width: 100%;
  flex: 1;
  position: relative;
}

.loader-hint {
  position: absolute;
  top: 0;
  right: 0;
  color: #a855f7;
  font-size: 0.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  color: #ffffff;
}

.pin-icon { 
  width: 18px; 
  height: auto; 
}

.station-info-box {
  border: 1px solid #545454;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.station-id, .station-details p {
  color: #ffffff;
  font-size: 0.9rem;
}

.btn-back {
  padding: 0.5rem 0.75rem;
  background: linear-gradient(90deg, #004aad, #cb6ce6);
  border-radius: 6px;
  border: none;
  cursor: pointer;
  color: #ffffff;
  font-weight: bold;
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
