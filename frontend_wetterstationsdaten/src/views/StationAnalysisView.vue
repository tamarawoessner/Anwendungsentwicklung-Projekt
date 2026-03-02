<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { StationMeta } from '../types/index';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';
import StationDetailsTable from '../components/StationDetailsTable.vue';

const router = useRouter();

const currentStation = ref({
  id: 'GME00105229',
  name: 'Villingen-Schwenningen',
  distanceKm: 6,
  period: '1879-2025'
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
          
          <RadialSeasonMenu />
          
        </div>

        <div class="table-section">
          <div class="header-with-icon">
            <h4>Details</h4>
          </div>
          <StationDetailsTable />
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
  color: #ffffff;
}

.station-info-box {
  border: 1px solid #545454;
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
  color: #ffffff;
}

.btn-back {
  padding: 0.75rem 1rem;
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

.right-column {
  background-color: rgba(0 0, 0, 0.85);
  border: 1px solid #545454;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.chart-container {
  width: 100%;
  min-height: 600px; 
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

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .left-column {
    order: 2;
  }
  
  .right-column {
    order: 1;
  }
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