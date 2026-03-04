<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Station } from '../App.vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 


const props = defineProps<{
  stations: Station[];
  centerLat?: number | null; 
  centerLng?: number | null; 
  radiusKm?: number | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markersLayer = L.featureGroup();

onMounted(() => {

  if (!mapContainer.value) return;
  map = L.map(mapContainer.value).setView([51.1657, 10.4515], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markersLayer.addTo(map);
});

watch(() => props, () => {
  if (!map) return;

  markersLayer.clearLayers();

  if (props.centerLat && props.centerLng) {
    L.circleMarker([props.centerLat, props.centerLng], {
      color: '#ef4444',     
      fillColor: '#ef4444',
      fillOpacity: 0.8,
      radius: 8,            
      weight: 2              
    })
    .bindPopup('<b>Dein Suchpunkt</b>')
    .addTo(markersLayer);
    if (props.radiusKm) {
      L.circle([props.centerLat, props.centerLng], {
        color: '#6366f1',   
        weight: 1,            
        fillColor: '#6366f1', 
        fillOpacity: 0.1,     
        radius: props.radiusKm * 1000
      }).addTo(markersLayer);
    }
  }

  props.stations.forEach(station => {
    L.marker([station.lat, station.lon])
      .bindPopup(`<b>${station.name || station.station_id}</b><br>Distanz: ${station.distance_km.toFixed(1)} km`)
      .addTo(markersLayer);
  });

  if (markersLayer.getLayers().length > 0 && map) {
    map.fitBounds(markersLayer.getBounds(), { padding: [50, 50] });
  }
}, { deep: true });
</script>

<template>
  <div class="leaflet-wrapper" ref="mapContainer"></div>
</template>

<style scoped>
.leaflet-wrapper {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 12px;
  z-index: 1;
}
</style>