<script setup lang="ts">
const props = defineProps<{
  activeSelections: string[]
}>();

const emit = defineEmits(['selection-changed']);

const select = (bereich: string) => {
  emit('selection-changed', bereich);
}

const isActive = (bereich: string) => {
  const relations: Record<string, string[]> = {
    'Ganzes Jahr': ['Ganzes Jahr Tmin', 'Ganzes Jahr Tmax'],
    'Winter': ['Winter Tmin', 'Winter Tmax'],
    'Frühling': ['Frühling Tmin', 'Frühling Tmax'],
    'Sommer': ['Sommer Tmin', 'Sommer Tmax'],
    'Herbst': ['Herbst Tmin', 'Herbst Tmax']
  };

  if (relations[bereich]) {
    return relations[bereich].some(s => props.activeSelections.includes(s));
  }

  return props.activeSelections.includes(bereich);
};
</script>

<template>
  <div class="menus-container">
    
    <div class="wheel-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="interactive-wheel">
        <defs>
          <mask id="cutout_gaps1">
            <rect width="200" height="200" fill="white" />
            <circle cx="100" cy="100" r="100" fill="none" stroke="black" stroke-width="2.6" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="black" stroke-width="2.6" />
            <line x1="29.29" y1="29.29" x2="170.71" y2="170.71" stroke="black" stroke-width="2.6" />
            <line x1="29.29" y1="170.71" x2="170.71" y2="29.29" stroke="black" stroke-width="2.6" />
            <line x1="100" y1="38" x2="100" y2="162" stroke="black" stroke-width="0.7" />
            <line x1="38" y1="100" x2="162" y2="100" stroke="black" stroke-width="0.7" />
          </mask>

          <path id="txt_winter" d="M 42.7, 42.7 A 81,81 0 0 1 157.3, 42.7" />
          <path id="txt_fruehling" d="M 157.3, 42.7 A 81,81 0 0 1 157.3, 157.3" />
          <path id="txt_sommer" d="M 42.7, 157.3 A 81,81 0 0 0 157.3, 157.3" />
          <path id="txt_herbst" d="M 42.7, 157.3 A 81,81 0 0 1 42.7, 42.7" />
        </defs>

        <g mask="url(#cutout_gaps1)">
          <path d="M 100 100 L 29.29 29.29 A 100 100 0 0 1 170.71 29.29 Z" fill="#22d3ee" class="wheel-slice" :class="{ 'active': isActive('Winter') }" @click="select('Winter')" />
          <path d="M 100 100 L 170.71 29.29 A 100 100 0 0 1 170.71 170.71 Z" fill="#4ade80" class="wheel-slice" :class="{ 'active': isActive('Frühling') }" @click="select('Frühling')" />
          <path d="M 100 100 L 170.71 170.71 A 100 100 0 0 1 29.29 170.71 Z" fill="#fbbf24" class="wheel-slice" :class="{ 'active': isActive('Sommer') }" @click="select('Sommer')" />
          <path d="M 100 100 L 29.29 170.71 A 100 100 0 0 1 29.29 29.29 Z" fill="#fb923c" class="wheel-slice" :class="{ 'active': isActive('Herbst') }" @click="select('Herbst')" />

          <path d="M 100 100 L 56.16 56.16 A 62 62 0 0 1 100 38 Z" fill="#38bdf8" class="wheel-slice" :class="{ 'active': isActive('Winter Tmin') }" @click="select('Winter Tmin')" />
          <path d="M 100 100 L 100 38 A 62 62 0 0 1 143.84 56.16 Z" fill="#f87171" class="wheel-slice" :class="{ 'active': isActive('Winter Tmax') }" @click="select('Winter Tmax')" />
          <path d="M 100 100 L 143.84 56.16 A 62 62 0 0 1 162 100 Z" fill="#38bdf8" class="wheel-slice" :class="{ 'active': isActive('Frühling Tmin') }" @click="select('Frühling Tmin')" />
          <path d="M 100 100 L 162 100 A 62 62 0 0 1 143.84 143.84 Z" fill="#f87171" class="wheel-slice" :class="{ 'active': isActive('Frühling Tmax') }" @click="select('Frühling Tmax')" />
          <path d="M 100 100 L 143.84 143.84 A 62 62 0 0 1 100 162 Z" fill="#38bdf8" class="wheel-slice" :class="{ 'active': isActive('Sommer Tmin') }" @click="select('Sommer Tmin')" />
          <path d="M 100 100 L 100 162 A 62 62 0 0 1 56.16 143.84 Z" fill="#f87171" class="wheel-slice" :class="{ 'active': isActive('Sommer Tmax') }" @click="select('Sommer Tmax')" />
          <path d="M 100 100 L 56.16 143.84 A 62 62 0 0 1 38 100 Z" fill="#38bdf8" class="wheel-slice" :class="{ 'active': isActive('Herbst Tmin') }" @click="select('Herbst Tmin')" />
          <path d="M 100 100 L 38 100 A 62 62 0 0 1 56.16 56.16 Z" fill="#f87171" class="wheel-slice" :class="{ 'active': isActive('Herbst Tmax') }" @click="select('Herbst Tmax')" />
        </g>

        <g class="wheel-text-group" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">
          <text dy="6"><textPath href="#txt_winter" startOffset="50%">Winter</textPath></text>
          <text dy="6"><textPath href="#txt_fruehling" startOffset="50%">Frühling</textPath></text>
          <text dy="6"><textPath href="#txt_sommer" startOffset="50%">Sommer</textPath></text>
          <text dy="6"><textPath href="#txt_herbst" startOffset="50%">Herbst</textPath></text>
        </g>
      </svg>
    </div>

    <div class="wheel-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="interactive-wheel">
        <defs>
          <mask id="cutout_gaps2">
            <rect width="200" height="200" fill="white" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="black" stroke-width="2.6" />
            <line x1="38" y1="100" x2="162" y2="100" stroke="black" stroke-width="0.7" />
          </mask>
          <path id="txt_jahr" d="M 42.7, 42.7 A 81,81 0 0 1 157.3, 42.7" />
        </defs>

        <g mask="url(#cutout_gaps2)">
          <circle cx="100" cy="100" r="100" fill="#a78bfa" class="wheel-slice" :class="{ 'active': isActive('Ganzes Jahr') }" @click="select('Ganzes Jahr')" />
          <path d="M 38 100 A 62 62 0 0 1 162 100 Z" fill="#38bdf8" class="wheel-slice" :class="{ 'active': isActive('Ganzes Jahr Tmin') }" @click="select('Ganzes Jahr Tmin')" />
          <path d="M 162 100 A 62 62 0 0 1 38 100 Z" fill="#f87171" class="wheel-slice" :class="{ 'active': isActive('Ganzes Jahr Tmax') }" @click="select('Ganzes Jahr Tmax')" />
        </g>

        <g class="wheel-text-group" fill="#ffffff" font-size="20" font-weight="bold" text-anchor="middle">
          <text dy="8"><textPath href="#txt_jahr" startOffset="50%">Jahr</textPath></text>
        </g>
      </svg>
    </div>

  </div>
</template>

<style scoped>
.menus-container {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  width: 100%;
}

.wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 130px;
}

.interactive-wheel {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.5));
  overflow: visible;
}

.wheel-slice {
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.wheel-slice.active {
  opacity: 1; 
}

.wheel-slice:hover {
  opacity: 0.8; 
}

.wheel-text-group {
  pointer-events: none;
  user-select: none;
}
</style>
