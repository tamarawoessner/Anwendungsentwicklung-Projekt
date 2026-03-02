<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps<{
  selections: string[]
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let myChart: Chart | null = null;

const dummyData = {
  labels: [1990, 1991, 1992, 1993, 1994, 1995],
  datasets: {
    'Ganzes Jahr': [14.8, 13.5, 15.2, null, 15.5, 14.9], // null erzwingt die Lücke!
    'Winter': [0.1, -1.2, 1.5, null, 2.1, 0.8],
    'Winter-Kalt': [-5.2, -8.4, -3.1, null, -2.5, -4.1],
    'Sommer-Warm': [32.1, 30.5, 34.2, null, 35.0, 33.2]
  }
};

const getColor = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return '#38bdf8'; // Blau
  if (selection.includes('Warm') || selection.includes('Sommer')) return '#f87171'; // Rot
  return '#a78bfa';
};

const updateChart = () => {
  if (!chartCanvas.value) return;

  if (myChart) {
    myChart.destroy();
  }

  const activeDatasets = props.selections
    .filter(sel => dummyData.datasets[sel as keyof typeof dummyData.datasets])
    .map(sel => ({
      label: sel,
      data: dummyData.datasets[sel as keyof typeof dummyData.datasets],
      borderColor: getColor(sel),
      backgroundColor: getColor(sel),
      spanGaps: false // DAS IST DER ZAUBERBEFEHL: Keine Glättung über Lücken!
  }));

  myChart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: dummyData.labels,
      datasets: activeDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      color: '#ffffff',
      scales: {
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
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

watch(() => props.selections, () => {
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