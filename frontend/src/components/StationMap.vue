<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Station } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon paths for Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const props = defineProps<{
  stations: Station[];
  centerLat?: number | null; 
  centerLng?: number | null; 
  radiusKm?: number | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markersLayer = L.featureGroup();

const updateMarkers = () => {
  if (!map) return;

  markersLayer.clearLayers();

  if (props.centerLat != null && props.centerLng != null) {
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
      .bindPopup(`<b>${station.name || station.station_id}</b><br>Distanz: ${station.distance_km.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`)
      .addTo(markersLayer);
  });

  if (markersLayer.getLayers().length > 0 && map) {
    map.fitBounds(markersLayer.getBounds(), { padding: [50, 50] });
  }
};

onMounted(() => {

  if (!mapContainer.value) return;
  map = L.map(mapContainer.value).setView([51.1657, 10.4515], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markersLayer.addTo(map);

  updateMarkers();
});

watch(
  () => [props.stations, props.centerLat, props.centerLng, props.radiusKm],
  updateMarkers,
  { deep: true }
);
</script>

<template>
  <div class="leaflet-wrapper" ref="mapContainer"></div>
</template>

<style scoped>
.leaflet-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  z-index: 1;
}
</style>