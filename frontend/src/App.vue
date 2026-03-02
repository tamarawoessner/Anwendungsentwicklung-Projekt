<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
</script>

<template>
  <div class="app-layout">

    <Sidebar />

    <main class="map-area">
      <div id="map-container">Platzhalter Karte</div>
    </main>

  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #0b1120; 
  color: white;
  font-family: sans-serif;
}

.map-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>