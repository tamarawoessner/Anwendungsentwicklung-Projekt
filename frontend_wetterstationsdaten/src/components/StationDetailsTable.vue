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
            {{ getValue(row, sel) !== null && getValue(row, sel) !== undefined ? getValue(row, sel).toLocaleString('de-DE') : '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  selections: string[],
  data?: any
}>();

// Verwende echte Daten oder Dummy-Daten
const tableData = computed(() => {
  if (props.data?.year?.data && Array.isArray(props.data.year.data)) {
    return props.data.year.data; // Echte Daten vom Backend
  }

  // Fallback: Dummy-Datenstruktur
  return Array.from({ length: 50 }, (_, index) => {
    const currentYear = 2024 - index;
    
    // SIMULATION EINER DATENLÜCKE
    if (currentYear === 1999 || currentYear === 2000) {
      return {
        year: currentYear,
        values: { 'Ganzes Jahr': null, 'Winter': null, 'Winter-Kalt': null, 'Sommer-Warm': null }
      };
    }

    // SIMULATION DER NULL-GRAD-FALLE
    if (currentYear === 1995) {
       return {
        year: currentYear,
        values: { 'Ganzes Jahr': 12.0, 'Winter': 0, 'Winter-Kalt': -4.5, 'Sommer-Warm': 30.0 }
      };
    }

    return {
      year: currentYear,
      values: {
        'Ganzes Jahr': +(10 + Math.random() * 5).toFixed(1),
        'Winter': +(-2 + Math.random() * 5).toFixed(1),
        'Winter-Kalt': +(-10 + Math.random() * 8).toFixed(1),
        'Sommer-Warm': +(28 + Math.random() * 8).toFixed(1)
      }
    };
  });
});

const getColorClass = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return 'val-cold';
  if (selection.includes('Warm') || selection.includes('Sommer')) return 'val-warm';
  return 'val-neutral';
};

// Sichere Wertabruf mit Fallback
const getValue = (row: any, sel: string) => {
  if (!row?.values) return null;
  return row.values[sel] ?? null;
};
</script>

<style scoped>
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