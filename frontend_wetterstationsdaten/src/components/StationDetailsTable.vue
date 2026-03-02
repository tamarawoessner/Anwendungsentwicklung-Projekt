<template>
  <div class="table-container">
    <table class="details-table">
      <thead>
        <tr>
          <th>Jahr</th>
          <th>Jahr-Min <span class="icon-cold">❄️</span></th>
          <th>Jahr-Max <span class="icon-warm">🔥</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in weatherData" :key="row.year">
          <td>{{ row.year }}</td>
          <td class="val-cold">{{ row.min.toLocaleString('de-DE') }}</td>
          <td class="val-warm">{{ row.max.toLocaleString('de-DE') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Dummy-Daten basierend auf deinem Screenshot
const weatherData = ref([
  { year: 1960, min: 3.9, max: 13.5 },
  { year: 1961, min: 4.4, max: 14.2 },
  { year: 1962, min: 2.4, max: 12.3 },
  { year: 1963, min: 2.1, max: 12.4 },
  { year: 1964, min: 3.6, max: 13.4 },
  { year: 1965, min: 3.5, max: 12.5 },
  { year: 1966, min: 4.1, max: 13.8 },
  { year: 1967, min: 3.8, max: 14.0 },
  { year: 1968, min: 2.9, max: 12.1 },
]);
</script>

<style scoped>
.table-container {
  /* Das ist der wichtigste Teil für den Scrollbar */
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(15, 23, 42, 0.5); /* Sehr dunkles Blau-Transparent */
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  color: #ffffff;
  font-size: 0.95rem;
  text-align: left;
}

/* Sticky Header: Bleibt beim Scrollen oben */
thead th {
  position: sticky;
  top: 0;
  background-color: #0f172a;
  padding: 0.75rem 1rem;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1;
}

tbody td {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Farben für die Werte */
.val-cold { color: #ffffff; }
.val-warm { color: #ffffff; }

.icon-cold { font-size: 0.8rem; }
.icon-warm { font-size: 0.8rem; }

/* Scrollbar-Styling für Chrome/Safari/Edge */
.table-container::-webkit-scrollbar {
  width: 6px;
}
.table-container::-webkit-scrollbar-track {
  background: transparent;
}
.table-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
</style>