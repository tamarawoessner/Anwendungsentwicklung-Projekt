<script setup lang="ts">
</script>

<template>
    <div class="nearby-card">
        <div class="card-header">
            <span class="stationid">#GME00105229</span>
            <div class="top-right">
                <img src="../assets/distance.png" alt="Distanz" class="small-icon">
                <span>6 km</span>
            </div>
        </div>
        <div class="card-body">
            <h3 class="station-title">Villingen-Schwenningen</h3>
        </div>
    </div>
</template>

<style scoped>
.nearby-card {
    height: 120px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    color: #cbd5e1;
    font-size: 1.15rem;
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
    font-size: 1.4rem;
}

.top-right {
    display: flex;
    align-items: center;
    gap: 6px;
}

.small-icon {
    width: 20px;
    height: auto;
}
</style>