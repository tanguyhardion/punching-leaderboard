<script setup lang="ts">
import { computed } from 'vue'

interface Entry {
  id: string
  player: string
  score: number
  power: string
  createdAt: string
}

const props = defineProps<{
  entries: Entry[]
}>()

const formatScore = (value: number) => new Intl.NumberFormat('en-US').format(value)

const topScore = computed(() => {
  if (props.entries.length === 0) return 0
  return props.entries[0]?.score ?? 0
})

const averageScore = computed(() => {
  if (props.entries.length === 0) return 0
  const sum = props.entries.reduce((total, entry) => total + entry.score, 0)
  return Math.round(sum / props.entries.length)
})
</script>

<template>
  <section class="stats-grid" aria-label="Score overview">
    <article>
      <h3>High Score</h3>
      <p>{{ formatScore(topScore) }}</p>
    </article>
    <article>
      <h3>Average</h3>
      <p>{{ formatScore(averageScore) }}</p>
    </article>
    <article>
      <h3>Players</h3>
      <p>{{ entries.length }}</p>
    </article>
  </section>
</template>
