<script setup lang="ts">
import { ref } from 'vue';

const seasons = ['Frühling', 'Sommer', 'Herbst', 'Winter'];

const selectedSeasons = ref<string[]>([]);

const toggleSeason = (season: string) => {
  const index = selectedSeasons.value.indexOf(season);
  if (index === -1) {
    selectedSeasons.value.push(season);
  } else {
    selectedSeasons.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="menu-wrapper">
    <div class="radial-container">
      <button 
        v-for="season in seasons" 
        :key="season"
        @click="toggleSeason(season)"
        :class="['segment-btn', { active: selectedSeasons.includes(season) }]"
      >
        {{ season }}
      </button>
    </div>

    <p class="debug-text">Ausgewählt: {{ selectedSeasons.join(', ') || 'Keine' }}</p>
  </div>
</template>

<style scoped>
.menu-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.radial-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 4px solid #fff;
}

.segment-btn {
  border: 1px solid #e5e7eb;
  background-color: #f3f4f6;
  color: #6b7280;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.segment-btn:hover {
  background-color: #e5e7eb;
}

.segment-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.debug-text {
  font-size: 0.875rem;
  color: #666;
}
</style>