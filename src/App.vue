<script setup lang="ts">
import SectionsList from './components/SectionsList.vue'
import SectionEditor from './components/SectionEditor.vue'
import './assets/barrel.css'
</script>

<template>
  <main class="flex-col">
    <header>
      <div class="" tool-bar></div>
    </header>
    <div id="editor-main-area" class="flex-row">
      <SectionsList></SectionsList>
      <SectionEditor></SectionEditor>
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
}
</style>
