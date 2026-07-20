<script setup lang="ts">
import { ref } from 'vue'

interface Entry {
  id: string
  player: string
  score: number
  power: string
  createdAt: string
}

const props = defineProps<{
  entries: Entry[]
  cachedPassword: { current: string | null }
}>()

const emit = defineEmits<{
  (e: 'delete', id: string, password: string): void
}>()

const deletingId = ref<string | null>(null)
const showGate = ref(false)
const pwd = ref('')
const error = ref('')
const shaking = ref(false)

const formatScore = (value: number) => new Intl.NumberFormat('en-US').format(value)
const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

const handleDeleteClick = (id: string) => {
  if (props.cachedPassword?.current) {
    emit('delete', id, props.cachedPassword.current)
  } else {
    deletingId.value = id
    showGate.value = true
  }
}

const handleUnlock = () => {
  if (!pwd.value.trim()) return
  error.value = ''
  emit('delete', deletingId.value!, pwd.value)
}

const triggerError = () => {
  error.value = 'Wrong password — try again.'
  shaking.value = true
  setTimeout(() => (shaking.value = false), 600)
  pwd.value = ''
}

const closeGate = () => {
  showGate.value = false
  deletingId.value = null
  pwd.value = ''
  error.value = ''
}

defineExpose({ triggerError, closeGate })
</script>

<template>
  <section class="leaderboard" aria-label="Punching machine leaderboard">
    <!-- Password Gate Overlay for Delete -->
    <div v-if="showGate" class="pwd-gate-overlay" role="dialog" aria-modal="true" aria-label="Confirm deletion password">
      <div class="pwd-gate-card glass" :class="{ shake: shaking }">
        <div class="pwd-gate-icon" aria-hidden="true">⚠️</div>
        <h2 class="pwd-gate-title">Authorize Delete</h2>
        <p class="pwd-gate-subtitle">
          Enter the master password to delete this entry.
        </p>
        <p v-if="error" class="pwd-error" role="alert">{{ error }}</p>
        <form @submit.prevent="handleUnlock" class="pwd-gate-form">
          <input
            type="password"
            class="pwd-gate-input"
            v-model="pwd"
            placeholder="Master password"
            autocomplete="current-password"
            required
            autofocus
          />
          <div style="display: flex; gap: 0.5rem">
            <button type="submit" class="pwd-gate-btn">Confirm</button>
            <button
              type="button"
              class="pwd-gate-btn"
              style="background: linear-gradient(95deg, #ff5f6d, #ffc371); color: #fff;"
              @click="closeGate"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="leaderboard-header">
      <h2>Arcade Rankings</h2>
      <span>Live board</span>
    </div>

    <ol>
      <li
        v-for="(entry, index) in entries"
        :key="entry.id"
        :class="{ podium: index < 3 }"
      >
        <span class="position">#{{ index + 1 }}</span>
        <div class="fighter-details">
          <strong>{{ entry.player }}</strong>
          <small>{{ entry.power }}</small>
        </div>
        <span class="score">{{ formatScore(entry.score) }}</span>
        <time>{{ formatTime(entry.createdAt) }}</time>
        <button
          class="delete-btn"
          @click="handleDeleteClick(entry.id)"
          :title="`Delete score for ${entry.player}`"
          :aria-label="`Delete score for ${entry.player}`"
        >
          🗑️
        </button>
      </li>
    </ol>
  </section>
</template>
