<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  selections: string[],
  data?: any
}>();

const formatTemp = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const tableData = computed(() => {
  if (!props.data) return [];

  const rowsByYear: Record<number, { year: number, values: Record<string, string> }> = {};

  const getRow = (year: number) => {
    if (!rowsByYear[year]) {
      rowsByYear[year] = { year, values: {} };
    }
    return rowsByYear[year];
  };

  if (props.data.year?.data) {
    props.data.year.data.forEach((p: any) => {
      const row = getRow(p.year);
      row.values['Ganzes Jahr-kalt'] = formatTemp(p.tmin_mean_c);
      row.values['Ganzes Jahr-warm'] = formatTemp(p.tmax_mean_c);
      
      if (p.tmin_mean_c !== null || p.tmax_mean_c !== null) {
        row.values['Ganzes Jahr'] = `Min: ${formatTemp(p.tmin_mean_c)} / Max: ${formatTemp(p.tmax_mean_c)}`;
      }
    });
  }

  const seasonMap: Record<string, { min: string, max: string, both: string }> = {
    'WINTER': { min: 'Winter-Kalt', max: 'Winter-Warm', both: 'Winter' },
    'SPRING': { min: 'Frühling-Kalt', max: 'Frühling-Warm', both: 'Frühling' },
    'SUMMER': { min: 'Sommer-Kalt', max: 'Sommer-Warm', both: 'Sommer' },
    'AUTUMN': { min: 'Herbst-Kalt', max: 'Herbst-Warm', both: 'Herbst' }
  };

  if (props.data.seasons) {
    for (const [seasonKey, mapping] of Object.entries(seasonMap)) {
      const seasonData = props.data.seasons[seasonKey]?.data;
      if (seasonData) {
        seasonData.forEach((p: any) => {
          const row = getRow(p.year);
          row.values[mapping.min] = formatTemp(p.tmin_mean_c);
          row.values[mapping.max] = formatTemp(p.tmax_mean_c);
          
          if (p.tmin_mean_c !== null || p.tmax_mean_c !== null) {
            row.values[mapping.both] = `${formatTemp(p.tmin_mean_c)} / ${formatTemp(p.tmax_mean_c)}`;
          }
        });
      }
    }
  }

  return Object.values(rowsByYear).sort((a, b) => b.year - a.year);
});

const getColorClass = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return 'val-cold';
  if (selection.includes('Warm') || selection.includes('Sommer')) return 'val-warm';
  return 'val-neutral';
};

const getValue = (row: any, sel: string) => {
  return row.values[sel] || '-';
};
</script>

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
        <tr v-if="!data || tableData.length === 0">
          <td :colspan="selections.length + 1" style="text-align: center; color: #94a3b8; padding: 1rem;">
            Keine Daten verfügbar. Bitte wähle Parameter aus.
          </td>
        </tr>
        
        <tr v-else v-for="row in tableData" :key="row.year">
          <td>{{ row.year }}</td>
          
          <td v-for="sel in selections" :key="sel" :class="getColorClass(sel)">
            {{ getValue(row, sel) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

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