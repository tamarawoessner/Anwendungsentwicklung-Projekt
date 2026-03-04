<script setup lang="ts">
import { ref } from 'vue';
import type { Station } from '../App.vue';

export interface SearchParams {
  lat: number | null;
  lng: number | null;
  radius: number;
  startYear: number | null;
  endYear: number | null;
  limit: number;
}

const lat = ref<number | null>(null);
const lng = ref<number | null>(null);
const radius = ref<number>(20);
const startYear = ref<number | null>(null);
const endYear = ref<number | null>(null);
const limit = ref<number>(50);
const isFilterMenuOpen = ref(false);

const emit = defineEmits<{
  (e: 'search', payload: SearchParams): void
}>();
defineProps<{
  stations: Station[]
}>();

const setLimit = (newLimit: number) => {
  limit.value = newLimit;
  isFilterMenuOpen.value = false;
  triggerSearch();
};

const triggerSearch = () => {
  const paket = {
    lat: lat.value,
    lng: lng.value,
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
        <input type="number" id="latitude" v-model="lat" step="any" placeholder="48.06125" class="dark-input" />
    </div>

    <div class="input-group">
        <label for="longitude">Längengrad</label>
        <input type="number" id="longitude" v-model="lng" step="any" placeholder="8.53461" class="dark-input">
    </div>

    <div class="input-group">
        <label for="radius">Radius (in km)</label>
        <div class="slider-wrapper">
            <input type="range" id="radius" v-model="radius" min="1" max="100" class="dark-slider">
            <input type="number" v-model="radius" class="slider-value" min="1" max="100">
        </div>
    </div>

    <div class="year-row">
        <div class="input-group">
            <label for="start-year">Startjahr</label>
            <input type="number" id="start-year" v-model="startYear" placeholder="2002" class="dark-input year-input">
        </div>

        <div class="input-group">
            <label for="end-year">Endjahr</label>
            <input type="number" id="end-year" v-model="endYear" max="2025" placeholder="2016" class="dark-input year-input">
        </div>
    </div>

    <button class="search-button" @click="triggerSearch">Stationen suchen</button>
</div>

        <div class="subheader-group">
    <h2>verfügbare Wetterstationen</h2>
    
    <div class="filter-wrapper">
        <img src="../assets/filter.png" alt="Filter-Icon" @click="isFilterMenuOpen = !isFilterMenuOpen">

        <div class="filter-dropdown" v-if="isFilterMenuOpen">
            <div class="dropdown-header">Max. Treffer:</div>
            <div class="dropdown-item" :class="{ active: limit === 10 }" @click="setLimit(10)">10 Stationen</div>
            <div class="dropdown-item" :class="{ active: limit === 20 }" @click="setLimit(20)">20 Stationen</div>
            <div class="dropdown-item" :class="{ active: limit === 50 }" @click="setLimit(50)">50 Stationen</div>
            <div class="dropdown-item" :class="{ active: limit === 100 }" @click="setLimit(100)">100 Stationen</div>
        </div>
    </div>
</div>

        <div class="transparent-container">

<div class="stations-list-container">
            <div 
                class="stationcard-wrapper" 
                v-for="station in stations" 
                :key="station.station_id"
            >
                <img src="../assets/pin.png" alt="Pin-Icon" class="pin-icon">
                <span class="station-name">{{ station.name }}</span>
            </div>
        </div>

            </div>
    </aside>
</template>

<style scoped>
.sidebar {
  width: 350px;
  background-color: #0f172a;
  border-right: 1px solid #1e293b;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px; 
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
  width: 85%; 
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
  margin-bottom: 25px;
}

h2{
  font-size: 1.4rem;
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
  font-size: 1.3rem;
  color: #f8fafc;
  font-weight: 500;
}

.subheader-group {
  padding-left: 15px;
  display: flex;
  flex-direction: row;
  align-items: center; 
  gap: 15px;         
  position: relative; 
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

/* Positionierung für den Container */
.filter-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* Das schwebende Menü */
.filter-dropdown {
  position: absolute;
  top: 100%; /* Direkt unter dem Icon */
  right: 0;  /* Rechtsbündig ans Icon getackert */
  margin-top: 8px;
  background-color: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 8px 0;
  min-width: 150px;
  z-index: 100; /* Damit es ÜBER der Liste liegt */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.dropdown-header {
  padding: 4px 16px 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
  margin-bottom: 4px;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #e2e8f0;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background-color: #334155;
}

/* So heben wir das aktuell ausgewählte Limit optisch hervor */
.dropdown-item.active {
  color: #a855f7;
  font-weight: bold;
}

</style>