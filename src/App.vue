<script setup lang="ts">
import SectionsList from './components/SectionsList.vue'
import SectionEditor from './components/SectionEditor.vue'
import PatternEditor from './components/PatternEditor.vue'
import './assets/barrel.css'
</script>

<template>
  <PatternEditor></PatternEditor>
  <main class="flex-col">
    <header>
      <div class="" tool-bar>
        <button popovertarget="pattern-editor">Pattern Editor</button>
      </div>
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
