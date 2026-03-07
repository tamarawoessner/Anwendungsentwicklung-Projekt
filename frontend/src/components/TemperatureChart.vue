<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps<{
  selections: string[],
  data?: any 
}>();

const emit = defineEmits(['toggle-selection']);

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let myChart: Chart | null = null;

const getColor = (selection: string) => {
  if (selection.includes('Tmin')) return '#38bdf8';
  if (selection.includes('Tmax')) return '#f87171';
  return '#a78bfa';
};

const buildYearRange = (data: any, fallbackYears: number[]) => {
  const requestStart = Number(data?.request?.start_year);
  const requestEnd = Number(data?.request?.end_year);

  if (Number.isFinite(requestStart) && Number.isFinite(requestEnd) && requestStart <= requestEnd) {
    return Array.from({ length: requestEnd - requestStart + 1 }, (_, i) => requestStart + i);
  }

  if (fallbackYears.length > 0) {
    return [...fallbackYears].sort((a, b) => a - b);
  }

  return [];
};

const buildChartData = () => {
  if (!props.data) return { labels: [], datasets: [] };

  const labels = new Set<number>();
  const datasetMap: Record<string, Map<number, number>> = {};

  const extractPoints = (block: any, keyTmin: string, keyTmax: string) => {
    if (!block || !block.data) return;
    block.data.forEach((p: any) => {
      labels.add(p.year);
      
      if (p.tmin_mean_c !== null && p.tmin_mean_c !== undefined) {
        if (!datasetMap[keyTmin]) datasetMap[keyTmin] = new Map<number, number>();
        datasetMap[keyTmin].set(p.year, p.tmin_mean_c);
      }
      
      if (p.tmax_mean_c !== null && p.tmax_mean_c !== undefined) {
        if (!datasetMap[keyTmax]) datasetMap[keyTmax] = new Map<number, number>();
        datasetMap[keyTmax].set(p.year, p.tmax_mean_c);
      }
    });
  };

  extractPoints(props.data.year, 'Ganzes Jahr Tmin', 'Ganzes Jahr Tmax');
  if (props.data.seasons) {
    extractPoints(props.data.seasons.WINTER, 'Winter Tmin', 'Winter Tmax');
    extractPoints(props.data.seasons.SPRING, 'Frühling Tmin', 'Frühling Tmax');
    extractPoints(props.data.seasons.SUMMER, 'Sommer Tmin', 'Sommer Tmax');
    extractPoints(props.data.seasons.AUTUMN, 'Herbst Tmin', 'Herbst Tmax');
  }

  const sortedLabels = buildYearRange(props.data, Array.from(labels));
  const finalDatasets = [];
  
  for (const key of props.selections) {
    const pointsByYear = datasetMap[key] ?? new Map<number, number>();
    finalDatasets.push({
      label: key,
      data: sortedLabels.map((year) => pointsByYear.get(year) ?? null),
      borderColor: getColor(key),
      backgroundColor: getColor(key),
      spanGaps: false
    });
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
        tooltip: {
          callbacks: {
            label: (context) => {
              const rawValue = context.parsed?.y;
              if (rawValue === null || rawValue === undefined || Number.isNaN(rawValue)) {
                return `${context.dataset.label}: -`;
              }
              return `${context.dataset.label}: ${Number(rawValue).toFixed(1)} °C`;
            }
          }
        },
        legend: { 
          labels: { color: '#ffffff' },
          onClick: (_e, legendItem) => {
            const label = legendItem.text;
            emit('toggle-selection', label);
          }
        }
      }
    }
  });
};

onMounted(() => updateChart());

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
