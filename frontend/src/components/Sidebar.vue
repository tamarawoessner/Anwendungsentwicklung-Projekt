<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Station, SearchParams } from '../types';

const lat = ref<number | null>(null);
const lng = ref<number | null>(null);
const radius = ref<number>(20);
const startYear = ref<number | null>(null);
const endYear = ref<number | null>(null);
const limit = ref<number>(10);
const formError = ref<string | null>(null);
const latError = ref(false);
const lngError = ref(false);
const startYearError = ref(false);
const endYearError = ref(false);
const isFilterMenuOpen = ref(false);
const filterWrapperRef = ref<HTMLElement | null>(null);
const ALL_LIMIT = 500;
const topLimitOptions = Array.from({ length: 10 }, (_, i) => i + 1);

const hasCoordinateInput = computed(() => {
  if (lat.value === null || lng.value === null) return false;
  return Number.isFinite(Number(lat.value)) && Number.isFinite(Number(lng.value));
});

const clampRadius = (value: number) => Math.min(100, Math.max(1, Math.round(value)));

const normalizeRadius = () => {
  const parsed = Number(radius.value);
  radius.value = Number.isFinite(parsed) ? clampRadius(parsed) : 20;
};

const clearLatError = () => {
  latError.value = false;
  formError.value = null;
};

const clearLngError = () => {
  lngError.value = false;
  formError.value = null;
};

const clearStartYearError = () => {
  startYearError.value = false;
  formError.value = null;
};

const clearEndYearError = () => {
  endYearError.value = false;
  formError.value = null;
};

const blockInvalidCoordinateChars = (event: KeyboardEvent) => {
  if (event.key === 'e' || event.key === 'E' || event.key === '+') {
    event.preventDefault();
  }
};

const blockInvalidCoordinatePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (/[eE+]/.test(pastedText)) {
    event.preventDefault();
  }
};

const blockInvalidRadiusChars = (event: KeyboardEvent) => {
  if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
    event.preventDefault();
  }
};

const blockInvalidRadiusPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (/[eE+-]/.test(pastedText)) {
    event.preventDefault();
  }
};

const emit = defineEmits<{
  (e: 'search', payload: SearchParams): void
  (e: 'station-select', station: Station): void
}>();
defineProps<{
  stations: Station[];
  resultsCount: number | null;
  hasSearched: boolean;
}>();

const setLimit = (newLimit: number) => {
  const clampedLimit = Math.min(ALL_LIMIT, Math.max(1, Math.round(newLimit)));
  limit.value = clampedLimit;
  isFilterMenuOpen.value = false;
  if (hasCoordinateInput.value) {
    triggerSearch();
  }
};

const handleOutsideClick = (event: MouseEvent) => {
  if (!isFilterMenuOpen.value) return;
  const target = event.target as Node | null;
  if (!target) return;
  if (!filterWrapperRef.value?.contains(target)) {
    isFilterMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

const triggerSearch = () => {
  normalizeRadius();

  const latMissing = lat.value === null || lat.value === '' as unknown as number || !Number.isFinite(Number(lat.value));
  const lngMissing = lng.value === null || lng.value === '' as unknown as number || !Number.isFinite(Number(lng.value));
  latError.value = latMissing;
  lngError.value = lngMissing;

  if (latMissing || lngMissing) {
    formError.value = 'Bitte Breiten- und Längengrad ausfüllen.';
    return;
  }

  const latValue = Number(lat.value);
  const lngValue = Number(lng.value);

  if (latValue < -90 || latValue > 90 || lngValue < -180 || lngValue > 180) {
    latError.value = latValue < -90 || latValue > 90;
    lngError.value = lngValue < -180 || lngValue > 180;
    formError.value = 'Ung\u00FCltige Koordinaten: Breite -90 bis 90, L\u00E4nge -180 bis 180.';
    return;
  }

  if (startYear.value !== null || endYear.value !== null) {
    const sYear = Number(startYear.value);
    const eYear = Number(endYear.value);

    if (startYear.value !== null && (sYear < 1000 || sYear > 9999)) {
      startYearError.value = true;
      formError.value = 'Das Startjahr muss vierstellig sein (z. B. 2002).';
      return;
    }

    if (endYear.value !== null && (eYear < 1000 || eYear > 9999)) {
      endYearError.value = true;
      formError.value = 'Das Endjahr muss vierstellig sein (z. B. 2024).';
      return;
    }

    if (startYear.value !== null && endYear.value !== null && sYear > eYear) {
      startYearError.value = true;
      endYearError.value = true;
      formError.value = 'Das Startjahr darf nicht nach dem Endjahr liegen.';
      return;
    }
  }

  formError.value = null;
  latError.value = false;
  lngError.value = false;
  startYearError.value = false;
  endYearError.value = false;
  const paket = {
    lat: latValue,
    lng: lngValue,
    radius: Number(radius.value),
    startYear: startYear.value,
    endYear: endYear.value,
    limit: limit.value
  };
  emit('search', paket);
};
</script>

<template>
    <aside class="sidebar">
        <div class="header-group">
            <h1>Wetterdaten</h1>
            <img src="../assets/cloudy.png" alt="Emoji mit Wolken und Sonne" class="header-picture">
        </div>


            <div class="transparent-container">
    <div class="input-group">
        <label for="latitude">Breitengrad</label>
        <input
          type="number"
          id="latitude"
          v-model="lat"
          step="any"
          min="-90"
          max="90"
          placeholder="48,06125"
          :class="['dark-input', { 'input-error': latError }]"
          @keydown="blockInvalidCoordinateChars"
          @paste="blockInvalidCoordinatePaste"
          @input="clearLatError"
        >
    </div>

    <div class="input-group">
        <label for="longitude">Längengrad</label>
        <input
          type="number"
          id="longitude"
          v-model="lng"
          step="any"
          min="-180"
          max="180"
          placeholder="8,53461"
          :class="['dark-input', { 'input-error': lngError }]"
          @keydown="blockInvalidCoordinateChars"
          @paste="blockInvalidCoordinatePaste"
          @input="clearLngError"
        >
    </div>

    <div class="input-group">
        <label for="radius">Radius (in km)</label>
        <div class="slider-wrapper">
            <input type="range" id="radius" v-model="radius" min="1" max="100" class="dark-slider" @input="normalizeRadius">
            <input
              type="number"
              v-model="radius"
              class="slider-value"
              min="1"
              max="100"
              @keydown="blockInvalidRadiusChars"
              @paste="blockInvalidRadiusPaste"
              @input="normalizeRadius"
              @blur="normalizeRadius"
            >
        </div>
    </div>

    <div class="year-row">
        <div class="input-group">
            <label for="start-year">Startjahr</label>
            <input type="number" id="start-year" v-model="startYear" placeholder="2002" :class="['dark-input', 'year-input', { 'input-error': startYearError }]" @input="clearStartYearError">
        </div>

        <div class="input-group">
            <label for="end-year">Endjahr</label>
            <input type="number" id="end-year" v-model="endYear" max="2025" placeholder="2016" :class="['dark-input', 'year-input', { 'input-error': endYearError }]" @input="clearEndYearError">
        </div>
    </div>

    <p v-if="formError" class="form-error">{{ formError }}</p>
    <button class="search-button" @click="triggerSearch">Stationen suchen</button>
</div>

        <div class="subheader-group">
    <div class="subheader-texts">
      <h2>verfügbare Stationen</h2>
      <p class="results-count">Anzahl der Ergebnisse: {{ resultsCount ?? '-' }}</p>
    </div>
    
    <div class="filter-wrapper" ref="filterWrapperRef">
        <img src="../assets/filter.png" alt="Filter-Icon" @click="isFilterMenuOpen = !isFilterMenuOpen">

        <div class="filter-dropdown" v-if="isFilterMenuOpen">
            <div class="dropdown-header">
              {{ limit === ALL_LIMIT ? 'Alle Stationen' : `Top ${limit} Station${limit === 1 ? '' : 'en'}` }}
            </div>
            <div class="limit-grid">
              <button
                v-for="option in topLimitOptions"
                :key="option"
                type="button"
                class="limit-chip"
                :class="{ active: limit === option }"
                @click="setLimit(option)"
              >
                Top {{ option }}
              </button>
              <button
                type="button"
                class="limit-chip limit-chip-all"
                :class="{ active: limit === ALL_LIMIT }"
                @click="setLimit(ALL_LIMIT)"
              >
                Alle
              </button>
            </div>
        </div>
    </div>
</div>

        <div class="transparent-container">

<div class="stations-list-container">
    
    <div v-if="stations.length === 0 && !hasSearched" class="empty-state">
        <span class="skeleton-text">Warten auf Suche...</span>
    </div>

    <div v-else-if="stations.length === 0 && hasSearched" class="empty-state">
        <span class="skeleton-text">Keine Treffer</span>
    </div>

    <template v-else>
        <div 
            class="stationcard-wrapper" 
            v-for="station in stations" 
            :key="station.station_id"
            @click="emit('station-select', station)"
        >
            <img src="../assets/pin.png" alt="Pin-Icon" class="pin-icon">
            <span class="station-name">{{ station.name || station.station_id }}</span>
        </div>
    </template>
</div>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
  width: 350px;
  flex-shrink: 0;
  background-color: #0f172a;
  border-right: 1px solid #1e293b;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 15px;
}

label {
  font-size: 0.9rem;
  color: #cbd5e1;
}

.dark-input {
  background-color: transparent; 
  color: white;
  border: 1px solid #475569;
  border-radius: 6px; 
  padding: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.dark-input:focus {
  border-color: #a855f7; 
}

#latitude::-webkit-outer-spin-button,
#latitude::-webkit-inner-spin-button,
#longitude::-webkit-outer-spin-button,
#longitude::-webkit-inner-spin-button,
.slider-value::-webkit-outer-spin-button,
.slider-value::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

#latitude,
#longitude,
.slider-value {
  -moz-appearance: textfield;
  appearance: textfield;
}

.input-error {
  border-color: #f87171;
}

.input-error:focus {
  border-color: #ef4444;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 15px; 
}

.dark-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: transparent;
}

.dark-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
}

.dark-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.dark-slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
}

.dark-slider::-moz-range-thumb {
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
}

.slider-value {
  background-color: transparent;
  border: 1px solid #475569;
  padding: 10px;
  border-radius: 6px;
  min-width: 40px;
  text-align: center;
  color: white;
  font-size: 1rem;
}

.year-row {
  display: flex;
  gap: 15px;
}

.year-input {
  width: 100%;
  color-scheme: dark;
}

.search-button {
  margin-top: 10px;
  background-color: white;
  color: black;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: #e2e8f0;
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  margin: 2px 0 0;
  color: #fda4af;
  font-size: 0.8rem;
  line-height: 1.2;
}

.header-group {
  display: flex;
  flex-direction: row;
  align-items: center; 
  gap: 15px;           
  margin-bottom: 20px; 
}

.header-group h1 {
  margin: 0;          
  font-size: 1.8rem;
  color: white;
}

.header-picture {
  width: 40px;
  height: auto;        
}

.transparent-container {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h2{
  font-size: 1.4rem;
  margin: 0;
  line-height: 1.1;
}

.stations-list-container {
  max-height: 175px;
  overflow-y: auto;
  padding-right: 10px;
}

.stations-list-container::-webkit-scrollbar {
  width: 4px;
}
.stations-list-container::-webkit-scrollbar-track {
  background: transparent;
}
.stations-list-container::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}
.stations-list-container::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.stationcard-wrapper {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stationcard-wrapper:hover {
  background-color: #334155;
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.pin-icon {
  width: 18px;
  height: auto;
}

.station-name {
  font-size: 0.95rem;
  color: #f8fafc;
  font-weight: 500;
}

.subheader-group {
  padding: 0 0 0 15px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;         
  position: relative;
  margin-top: 15px;
}

.subheader-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.results-count {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1;
  color: #94a3b8;
}

.subheader-group img{
  width: 22px;
  height: auto;
  cursor: pointer;
  opacity: 0.8;
}

.subheader-group img:hover{
  opacity: 1;
}

.filter-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;  
  margin-top: 8px;
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 8px 0;
  min-width: 150px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.dropdown-header {
  padding: 4px 16px 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
  margin-bottom: 4px;
}

.limit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 12px;
}

.limit-chip {
  border: 1px solid #475569;
  background-color: transparent;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s;
}

.limit-chip-all {
  grid-column: 1 / -1;
}

.limit-chip:hover {
  background-color: #334155;
  border-color: #64748b;
}

.limit-chip.active {
  color: #a855f7;
  border-color: #a855f7;
  font-weight: bold;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.02);
}

.skeleton-text {
    color: #94a3b8;
    font-style: italic;
    font-size: 1.1rem;
}

</style>