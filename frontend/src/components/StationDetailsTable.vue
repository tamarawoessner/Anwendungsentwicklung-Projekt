<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  selections: string[],
  data?: any
}>();

const formatTemp = (val: number | null | undefined) => {
  if (val === null || val === undefined) return '-';
  return `${Number(val).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
};

const tableData = computed(() => {
  if (!props.data) return [];
  const rowsByYear: Record<number, any> = {};

  const getRow = (year: number) => {
    if (!rowsByYear[year]) rowsByYear[year] = { year, values: {} };
    return rowsByYear[year];
  };

  props.data.year?.data.forEach((p: any) => {
    const row = getRow(p.year);
    row.values['Ganzes Jahr Tmin'] = formatTemp(p.tmin_mean_c);
    row.values['Ganzes Jahr Tmax'] = formatTemp(p.tmax_mean_c);
  });

  const seasonMap: Record<string, any> = {
    WINTER: { min: 'Winter Tmin', max: 'Winter Tmax' },
    SPRING: { min: 'Frühling Tmin', max: 'Frühling Tmax' },
    SUMMER: { min: 'Sommer Tmin', max: 'Sommer Tmax' },
    AUTUMN: { min: 'Herbst Tmin', max: 'Herbst Tmax' }
  };

  if (props.data.seasons) {
    Object.entries(seasonMap).forEach(([key, mapping]) => {
      props.data.seasons[key]?.data.forEach((p: any) => {
        const row = getRow(p.year);
        row.values[mapping.min] = formatTemp(p.tmin_mean_c);
        row.values[mapping.max] = formatTemp(p.tmax_mean_c);
      });
    });
  }

  return Object.values(rowsByYear).sort((a: any, b: any) => b.year - a.year);
});

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
          
          <td v-for="sel in selections" :key="sel">
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
