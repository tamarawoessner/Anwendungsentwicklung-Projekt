<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps<{
  selections: string[],
  data?: any 
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let myChart: Chart | null = null;

const getColor = (selection: string) => {
  if (selection.includes('Kalt') || selection.includes('Winter')) return '#38bdf8';
  if (selection.includes('Warm') || selection.includes('Sommer')) return '#f87171';
  return '#a78bfa';
};

const buildChartData = () => {
  if (!props.data) return { labels: [], datasets: [] };

  const labels = new Set<number>();
  const datasetMap: Record<string, {x: number, y: number}[]> = {};

  const extractPoints = (block: any, keyTmin: string, keyTmax: string, keyBoth: string) => {
    if (!block || !block.data) return;
    block.data.forEach((p: any) => {
      labels.add(p.year);
      if (p.tmin_mean_c !== null && p.tmin_mean_c !== undefined) {
        if (!datasetMap[keyTmin]) datasetMap[keyTmin] = [];
        datasetMap[keyTmin].push({ x: p.year, y: p.tmin_mean_c });
        if (props.selections.includes(keyBoth)) {
          const bothMinKey = keyBoth + '_min';
          const bothMinArr = datasetMap[bothMinKey] ?? (datasetMap[bothMinKey] = []);
          bothMinArr.push({ x: p.year, y: p.tmin_mean_c });
        }
      }
      if (p.tmax_mean_c !== null && p.tmax_mean_c !== undefined) {
        if (!datasetMap[keyTmax]) datasetMap[keyTmax] = [];
        datasetMap[keyTmax].push({ x: p.year, y: p.tmax_mean_c });
        if (props.selections.includes(keyBoth)) {
          const bothMaxKey = keyBoth + '_max';
          const bothMaxArr = datasetMap[bothMaxKey] ?? (datasetMap[bothMaxKey] = []);
          bothMaxArr.push({ x: p.year, y: p.tmax_mean_c });
        }
      }
    });
  };

  extractPoints(props.data.year, 'Ganzes Jahr-kalt', 'Ganzes Jahr-warm', 'Ganzes Jahr');
  
  if (props.data.seasons) {
    extractPoints(props.data.seasons.WINTER, 'Winter-Kalt', 'Winter-Warm', 'Winter');
    extractPoints(props.data.seasons.SPRING, 'Frühling-Kalt', 'Frühling-Warm', 'Frühling');
    extractPoints(props.data.seasons.SUMMER, 'Sommer-Kalt', 'Sommer-Warm', 'Sommer');
    extractPoints(props.data.seasons.AUTUMN, 'Herbst-Kalt', 'Herbst-Warm', 'Herbst');
  }

  const sortedLabels = Array.from(labels).sort();
  const finalDatasets = [];
  
  for (const [key, points] of Object.entries(datasetMap)) {
    const isBothDerivative = key.endsWith('_min') || key.endsWith('_max');
    const originalSelection = isBothDerivative ? key.replace('_min', '').replace('_max', '') : key;

    if (props.selections.includes(originalSelection)) {
      finalDatasets.push({
        label: key.replace('_min', ' (Min)').replace('_max', ' (Max)'),
        data: points,
        borderColor: getColor(key),
        backgroundColor: getColor(key),
        spanGaps: false 
      });
    }
  }

  return { labels: sortedLabels, datasets: finalDatasets };
};

const updateChart = () => {
  if (!chartCanvas.value) return;

  if (myChart) {
    myChart.destroy();
  }

  const chartData = buildChartData();

  myChart = new Chart(chartCanvas.value, {
    type: 'line',
    data: chartData,
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

watch(() => [props.selections, props.data], () => {
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