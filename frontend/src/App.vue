<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
import NearbyCard from './components/NearbyCard.vue';
</script>

<template>
  <div class="app-layout">

    <Sidebar />

    <main class="map-area">
      <div class="map-wrapper">
        <div id="map-container">Platzhalter Karte
        </div>
      </div>

      <div class="nearby-area">
        <div class="nearby-header">
          <h2>Stationen in der Nähe</h2>
        </div>
        <div class="nearby-wrapper">
          <NearbyCard />
          <NearbyCard />
          <NearbyCard />
        </div>
      </div>
    

    
    
    
    
    
    
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
  flex-direction: column;
}

.map-wrapper {
  flex: 1;
  min-height: 300px;
  border-radius: 12px;
  margin: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e293b;
}

.nearby-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 100px;
  padding: 15px;
}




.nearby-header{
  margin-left: 15px;
}



</style>