<script setup lang="ts">
import { ref, computed } from 'vue'

interface Entry {
  id: string
  player: string
  score: number
  power: string
  createdAt: string
}

// Fetch initial scores via useFetch for smooth SSR & hydration
const { data: scoreData, status, error: fetchError, refresh: refreshScores } = await useFetch<Entry[]>('/api/scores', {
  default: () => [],
})

const entries = ref<Entry[]>([])
watch(scoreData, (val) => {
  if (val) entries.value = [...val]
}, { immediate: true })

const isLoading = computed(() => status.value === 'pending')
const isSubmitting = ref(false)
const flashScore = ref<Entry | null>(null)
const appError = ref('')
const podiumAlert = ref<{ rank: number; player: string; score: number } | null>(null)
let podiumTimer: ReturnType<typeof setTimeout> | undefined

const podiumTitles: Record<number, string> = {
  1: 'NEW CHAMP!',
  2: 'SO CLOSE! 2ND PLACE',
  3: 'ON THE PODIUM! 3RD PLACE',
}

// Cached password so user is not re-prompted on each delete
const cachedPassword = ref<{ current: string | null }>({ current: null })

const scoreFormRef = ref<InstanceType<typeof import('./components/ScoreForm.vue').default> | null>(null)
const leaderboardRef = ref<InstanceType<typeof import('./components/Leaderboard.vue').default> | null>(null)

watch(fetchError, (err) => {
  if (err) {
    appError.value = "Couldn't load scores. Try again."
  }
})

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

    const rank = sortedEntries.value.findIndex((e) => e.id === created.id) + 1
    if (rank >= 1 && rank <= 3) {
      clearTimeout(podiumTimer)
      podiumAlert.value = { rank, player: created.player, score: created.score }
      podiumTimer = setTimeout(() => {
        podiumAlert.value = null
      }, 3500)
    }

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
      appError.value = "Score didn't save. Try again."
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
    <Transition name="podium">
      <div v-if="podiumAlert" class="podium-alert" :class="`rank-${podiumAlert.rank}`" role="status">
        <span class="podium-alert-title">{{ podiumTitles[podiumAlert.rank] }}</span>
        <span class="podium-alert-sub">{{ podiumAlert.player }} · {{ podiumAlert.score }}</span>
      </div>
    </Transition>

    <header class="hero">
      <h1><span class="glove" aria-hidden="true">🥊</span> Punch Machine <span class="glove flip" aria-hidden="true">🥊</span></h1>
      <p class="subtitle">
        Throw a punch. Take the belt.
      </p>
    </header>

    <main>
      <ScoreStats :entries="sortedEntries" />

      <section v-if="flashScore" class="impact-banner" role="status">
        <p>
          <span class="pow" aria-hidden="true">POW!</span>
          <strong>{{ flashScore.player }}</strong> just hit {{ flashScore.score }}!
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
        <p v-if="isLoading" class="loading">LOADING...</p>
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
