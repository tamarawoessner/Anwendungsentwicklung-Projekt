<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { StationMeta } from '../types/index';
import TemperatureChart from '../components/TemperatureChart.vue'; 
import RadialSeasonMenu from '../components/RadialSeasonMenu.vue';
import StationDetailsTable from '../components/StationDetailsTable.vue';

const router = useRouter();

const currentStation = ref<StationMeta>({
  id: 'GME00105229',
  name: 'Villingen-Schwenningen',
  distanceKm: 6,
  period: '1879-2025'
});

const activeSelections = ref<string[]>(['Ganzes Jahr']);

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
          <RadialSeasonMenu @selection-changed="toggleSelection" />
        </div>

        <div class="table-section">
          <div class="header-with-icon">
            <h4>Details</h4>
          </div>
          <StationDetailsTable :selections="activeSelections" />
        </div>
      </aside>

      <section class="right-column">
        <div class="chart-container">
          <TemperatureChart :selections="activeSelections" />
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
/* ==========================================
   1. DAS GRUND-GERÜST (Desktop)
   ========================================== */
.analysis-view-container {
  padding: 1rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - 2rem); /* Zwingt die Seite auf Bildschirmhöhe */
  display: flex;
  flex-direction: column;
}

.content-grid {
  display: grid;
  grid-template-columns: 350px 1fr; 
  gap: 2rem;
  flex: 1; /* Füllt die Reste-Höhe aus */
  min-height: 0; /* WICHTIG! */
  width: 100%;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%; 
  min-height: 0; 
  overflow: hidden; /* Schneidet Überstehendes ab */
}

.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.right-column {
  background-color: rgba(0, 0, 0, 0.85); /* Achtung: Hier war vorhin ein Kommafehler in deinem Code */
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
  flex: 1; /* Chart soll die Box ausfüllen */
  position: relative;
}

/* ==========================================
   2. DEINE BOXEN & BUTTONS (Bleiben erhalten!)
   ========================================== */
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
  font-size: 0,9rem;
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

/* ==========================================
   3. SCROLLBAR (Tabelle)
   ========================================== */
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

/* ==========================================
   4. RESPONSIVE (Unter 1024px)
   ========================================== */
@media screen and (max-width: 1024px) {
  .analysis-view-container {
    height: auto !important; 
    min-height: 100vh;
    display: block; 
  }

  .content-grid {
    display: flex !important;
    flex-direction: column;
    height: auto !important;
    overflow: visible;
  }

  .left-column {
    order: 1;
    width: 100%;
    height: auto !important; 
    overflow: visible;
  }

  .right-column {
    order: 2;
    width: 100%;
    height: 450px !important; 
    flex: none;
    margin-top: 1rem;
  }

  .table-section {
    height: 400px !important;
    flex: none;
    margin-top: 1rem;
  }
}
</style>