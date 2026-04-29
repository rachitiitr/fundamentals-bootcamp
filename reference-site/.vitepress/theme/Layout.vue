<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import ReadAloudHeadings from './ReadAloudHeadings.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <ReadAloudHeadings />
    </template>
  </DefaultTheme.Layout>
</template>
