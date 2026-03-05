<script setup lang="ts">
import type { Station } from '../types';

const props = defineProps<{
    station?: Station
}>();

const emit = defineEmits<{
    (e: 'select', station: Station): void
}>();

const handleClick = () => {
    if (props.station) {
        emit('select', props.station);
    }
};
</script>

<template>
    <div class="nearby-card" :class="{ 'is-skeleton': !station }" @click="handleClick">
        <div class="card-header">
            <span class="stationid" v-if="station">#{{ station.station_id }}</span>
            <span class="stationid" v-else>#---</span>

            <div class="top-right" v-if="station">
                <img src="../assets/distance.png" alt="Distanz" class="small-icon">
                <span>{{ station.distance_km.toFixed(1) }} km</span>
            </div>
        </div>
        <div class="card-body">
            <h3 class="station-title" v-if="station">{{ station.name || station.station_id }}</h3>
            <h3 class="station-title skeleton-text" v-else>Warten auf Suche...</h3>
        </div>
    </div>
</template>

<style scoped>
.nearby-card {
    width: 300px;
    height: 100px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    box-sizing: border-box;
    flex-shrink: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    color: #cbd5e1;
    font-size: 0.85rem;
    font-weight: 500;
}

.card-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nearby-card:hover {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.station-title {
    margin: 0;
    color: white;
    font-size: 1.15rem;
    font-weight: 600;
}

.top-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.small-icon {
    width: 16px;
    height: auto;
}

.is-skeleton {
    opacity: 0.4;
    cursor: default;
}

.is-skeleton:hover {
    transform: none;
    box-shadow: none;
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);
}

.skeleton-text {
    color: #94a3b8;
    font-style: italic;
    font-weight: 400;
}
</style>