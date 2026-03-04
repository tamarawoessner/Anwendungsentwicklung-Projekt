<template>
  <div class="table-container">
    <table class="details-table">
      <thead>
        <tr>
          <th>Jahr</th>
          <th v-for="sel in selections" :key="sel">
            {{ sel }} 
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in tableData" :key="row.year">
          <td>{{ row.year }}</td>
          
          <td v-for="sel in selections" :key="sel" :class="getColorClass(sel)">
            {{ row.values[sel] !== null && row.values[sel] !== undefined 
               ? row.values[sel].toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' °C' 
               : '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StationDataResponse } from '../types';

const props = defineProps<{
  selections: string[],
  data: StationDataResponse | null // Hier kommen die echten Daten rein
}>();

// Mapping: Welche Auswahl-Bezeichnung gehört zu welchem Datenfeld im Backend?
const getValFromData = (year: number, selection: string) => {
  if (!props.data) return null;

  // 1. Ganzes Jahr
  if (selection === 'Ganzes Jahr') {
    const point = props.data.year.data.find(p => p.year === year);
    return point?.tmax_mean_c ?? null; // Wir nehmen hier den Max-Schnitt
  }

  // 2. Saisons (Backend nutzt englische Keys: WINTER, SPRING, SUMMER, AUTUMN)
  const seasonMapping: Record<string, string> = {
    'Winter': 'WINTER',
    'Winter-Kalt': 'WINTER',
    'Frühling': 'SPRING',
    'Sommer': 'SUMMER',
    'Sommer-Warm': 'SUMMER',
    'Herbst': 'AUTUMN'
  };

  const apiSeasonKey = seasonMapping[selection];
  if (apiSeasonKey && props.data.seasons[apiSeasonKey]) {
    const point = props.data.seasons[apiSeasonKey].data.find(p => p.year === year);
    
    // Logik für "Kalt" vs "Warm"
    if (selection.includes('Kalt')) return point?.tmin_mean_c ?? null;
    return point?.tmax_mean_c ?? null;
  }

  return null;
};

// Berechnet die Tabellenzeilen dynamisch basierend auf den Props
const tableData = computed(() => {
  if (!props.data || !props.data.year || !props.data.year.data) {
    console.log("Tabelle; Warte noch auf korrekte Datenstruktur...");
  return [];
  }

  // Wir nehmen alle Jahre, die das Backend liefert
  return props.data.year.data.map(point => {
    const year = point.year;
    
    // Wir bauen das "values" Objekt für jede Zeile zusammen
    const values: Record<string, number | null> = {};
    props.selections.forEach(sel => {
      values[sel] = getValFromData(year, sel);
    });

    return {
      year,
      values
    };
  }).sort((a, b) => b.year - a.year); // Neueste Jahre oben
});

const getColorClass = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return 'val-cold';
  if (selection.includes('Warm') || selection.includes('Sommer')) return 'val-warm';
  return 'val-neutral';
};
</script>

<style scoped>
/* Dein bestehendes CSS bleibt komplett erhalten! */
.val-cold { color: #60a5fa; } /* Blau für kalt */
.val-warm { color: #f87171; } /* Rot für warm */
.val-neutral { color: #ffffff; }

.table-container {
  flex: 1; 
  min-height: 0; 
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(15, 23, 42, 0.5);
}

.details-table {
  min-width: 100%;
  width: max-content;
  border-collapse: collapse;
  color: #ffffff;
  font-size: 0.9rem;
  text-align: left;
}

th, td {
  white-space: nowrap; 
}

thead th {
  position: sticky;
  top: 0;
  background-color: #0f172a;
  padding: 0.25rem 0.75rem;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1;
}

tbody td {
  padding: 0.25rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.table-container::-webkit-scrollbar { 
  width: 6px;
  height: 6px;
}
.table-container::-webkit-scrollbar-track { 
  background: transparent; 
}
.table-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>