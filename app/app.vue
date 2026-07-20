<script setup lang="ts">
import { ref, computed } from 'vue'

interface Entry {
  id: string
  player: string
  score: number
  power: string
  createdAt: string
}

const entries = ref<Entry[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const flashScore = ref<Entry | null>(null)
const appError = ref('')

// Cached password so user is not re-prompted on each delete
const cachedPassword = ref<{ current: string | null }>({ current: null })

const scoreFormRef = ref<InstanceType<typeof import('./components/ScoreForm.vue').default> | null>(null)
const leaderboardRef = ref<InstanceType<typeof import('./components/Leaderboard.vue').default> | null>(null)

// Fetch initial scores
const loadScores = async () => {
  try {
    const result = await $fetch<Entry[]>('/api/scores')
    entries.value = result
  } catch {
    appError.value = 'Failed to load scores. Try again soon.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadScores)

const sortedEntries = computed(() =>
  [...entries.value].sort((a, b) => b.score - a.score)
)

const handleSubmit = async (
  form: { player: string; score: string; power: string },
  password: string
) => {
  appError.value = ''
  isSubmitting.value = true

  try {
    const created = await $fetch<Entry>('/api/scores', {
      method: 'POST',
      headers: {
        'x-submit-password': password,
      },
      body: {
        player: form.player,
        score: Number(form.score),
        power: form.power,
      },
    })

    cachedPassword.value.current = password
    entries.value = [created, ...entries.value]
    scoreFormRef.value?.resetForm()

    flashScore.value = created
    setTimeout(() => {
      flashScore.value = null
    }, 1600)
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode ?? 0
    if (status === 401) {
      // Wrong password — tell form to shake and re-open
      scoreFormRef.value?.handleReject()
    } else {
      appError.value = 'Score upload interrupted. Retry your punch.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id: string, password: string) => {
  appError.value = ''
  try {
    await $fetch(`/api/scores?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-submit-password': password,
      },
    })
    cachedPassword.value.current = password
    entries.value = entries.value.filter((e) => e.id !== id)
    leaderboardRef.value?.closeGate()
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode ?? 0
    if (status === 401) {
      leaderboardRef.value?.triggerError()
    } else {
      appError.value = 'Failed to delete entry. Try again.'
    }
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="ambient-glow" aria-hidden="true" />

    <header class="hero">
      <p class="badge">Arcade Ring</p>
      <h1>Punching Machine Leaderboard</h1>
      <p class="subtitle">
        Track every hit, rise through the rankings, and own the neon arena.
      </p>
    </header>

    <main>
      <ScoreStats :entries="sortedEntries" />

      <section v-if="flashScore" class="impact-banner" role="status">
        <p>
          <strong>{{ flashScore.player }}</strong> landed a {{ flashScore.score }} impact!
        </p>
      </section>

      <section v-if="appError" class="error-banner" role="alert">
        {{ appError }}
      </section>

      <section class="arena-grid">
        <ScoreForm
          ref="scoreFormRef"
          :is-submitting="isSubmitting"
          @submit="handleSubmit"
        />
        <p v-if="isLoading" class="loading">Powering the scoreboard...</p>
        <Leaderboard
          v-else
          ref="leaderboardRef"
          :entries="sortedEntries"
          :cached-password="cachedPassword"
          @delete="handleDelete"
        />
      </section>
    </main>
  </div>
</template>
