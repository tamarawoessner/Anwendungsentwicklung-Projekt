<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Chart.js Module registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Dummy-Daten für Diagramm
const chartData = {
  labels: ['1990', '1995', '2000', '2005', '2010', '2015', '2020'],
  datasets: [
    {
      label: 'TMAX (Höchstwerte)',
      backgroundColor: '#f87171',
      borderColor: '#f87171',
      data: [14.5, 15.2, 16.0, 15.8, 16.5, 17.1, 17.8],
      tension: 0.3
    },
    {
      label: 'TMIN (Tiefstwerte)',
      backgroundColor: '#38bdf8',
      borderColor: '#38bdf8',
      data: [4.2, 4.8, 5.1, 5.0, 5.6, 6.2, 6.5],
      tension: 0.3
    }
  ]
}

// Konfiguration für das Aussehen des Diagramms
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}
</script>

<template>
  <div class="chart-wrapper">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
}
</style>