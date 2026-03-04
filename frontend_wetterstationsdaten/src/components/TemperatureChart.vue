<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Chart from 'chart.js/auto';
import type { StationDataResponse } from '../types';

const props = defineProps<{
  selections: string[],
  data: StationDataResponse | null // NEU: Die echten Daten
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let myChart: Chart | null = null;

// Hilfsfunktion: Holt die Werte für eine bestimmte Auswahl (analog zur Tabelle)
const getDatasetValues = (years: number[], selection: string) => {
  if (!props.data) return [];

  return years.map(year => {
    // 1. Ganzes Jahr
    if (selection === 'Ganzes Jahr') {
      return props.data?.year.data.find(p => p.year === year)?.tmax_mean_c ?? null;
    }

    // 2. Saisons Mapping
    const seasonMapping: Record<string, string> = {
      'Winter': 'WINTER',
      'Winter-Kalt': 'WINTER',
      'Frühling': 'SPRING',
      'Sommer': 'SUMMER',
      'Sommer-Warm': 'SUMMER',
      'Herbst': 'AUTUMN'
    };

    const apiKey = seasonMapping[selection];
    if (apiKey && props.data?.seasons[apiKey]) {
      const point = props.data.seasons[apiKey].data.find(p => p.year === year);
      return selection.includes('Kalt') ? (point?.tmin_mean_c ?? null) : (point?.tmax_mean_c ?? null);
    }
    return null;
  });
};

const getColor = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return '#38bdf8'; 
  if (selection.includes('Warm') || selection.includes('Sommer')) return '#f87171'; 
  return '#a78bfa';
};

const updateChart = () => {
  if (!chartCanvas.value || !props.data) return;

  if (myChart) {
    myChart.destroy();
  }

  // Wir holen uns alle verfügbaren Jahre und sortieren sie aufsteigend für die Zeitachse
  const labels = props.data.year.data.map(p => p.year).sort((a, b) => a - b);

  const activeDatasets = props.selections.map(sel => ({
    label: sel,
    data: getDatasetValues(labels, sel),
    borderColor: getColor(sel),
    backgroundColor: getColor(sel),
    tension: 0.3, // Macht die Kurve etwas geschmeidiger
    spanGaps: false 
  }));

  myChart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: activeDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          ticks: { color: '#94a3b8' }, 
          grid: { color: 'rgba(255,255,255,0.1)' },
          title: { display: true, text: 'Temperatur (°C)', color: '#ffffff' }
        },
        x: { 
          ticks: { color: '#94a3b8' }, 
          grid: { color: 'rgba(255,255,255,0.1)' } 
        }
      },
      plugins: {
        legend: { labels: { color: '#ffffff' } }
      }
    }
  });
};

onMounted(() => {
  updateChart();
});

// WICHTIG: Reagiere auf Änderungen der Auswahl UND der Daten
watch([() => props.selections, () => props.data], () => {
  updateChart();
}, { deep: true });

</script>

<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>