<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', form: { player: string; score: string; power: string }, password: string): void
}>()

const form = ref({
  player: '',
  score: '',
  power: '',
})

const gateOpen = ref(false)
const pwd = ref('')
const passwordError = ref('')
const shaking = ref(false)

const handleFormSubmit = () => {
  passwordError.value = ''
  gateOpen.value = true
}

const handleUnlock = () => {
  if (!pwd.value.trim()) return
  passwordError.value = ''
  emit('submit', { ...form.value }, pwd.value)
}

const handleReject = () => {
  passwordError.value = 'Wrong password — try again.'
  shaking.value = true
  pwd.value = ''
  setTimeout(() => {
    shaking.value = false
  }, 600)
}

const closeGate = () => {
  gateOpen.value = false
  pwd.value = ''
  passwordError.value = ''
}

const resetForm = () => {
  form.value = { player: '', score: '', power: '' }
  closeGate()
}

// Expose handleReject and resetForm so parent can command them
defineExpose({
  handleReject,
  resetForm,
})
</script>

<template>
  <div>
    <!-- Password Gate Overlay -->
    <div v-if="gateOpen" class="pwd-gate-overlay" role="dialog" aria-modal="true" aria-label="Score submission locked">
      <div class="pwd-gate-card glass" :class="{ shake: shaking }">
        <div class="pwd-gate-icon" aria-hidden="true">🔒</div>
        <h2 class="pwd-gate-title">Secure Zone</h2>
        <p class="pwd-gate-subtitle">
          Enter the master password to submit your punch score.
        </p>
        <p v-if="passwordError" class="pwd-error" role="alert">{{ passwordError }}</p>
        <form @submit.prevent="handleUnlock" class="pwd-gate-form">
          <input
            id="pwd-gate-input"
            type="password"
            class="pwd-gate-input"
            v-model="pwd"
            placeholder="Master password"
            autocomplete="current-password"
            required
          />
          <div style="display: flex; gap: 0.5rem">
            <button type="submit" class="pwd-gate-btn">
              Unlock &amp; Submit
            </button>
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

    <!-- Main Score Form -->
    <form class="score-form" @submit.prevent="handleFormSubmit">
      <h2>Log Your Punch</h2>
      <p>Drop your best hit and challenge the leaderboard.</p>

      <label>
        Fighter Name
        <input
          name="player"
          v-model="form.player"
          placeholder="e.g. Neon Crusher"
          maxlength="20"
          required
        />
      </label>

      <label>
        Punch Score
        <input
          name="score"
          v-model="form.score"
          type="number"
          min="1"
          max="999"
          placeholder="0 - 999"
          required
        />
      </label>

      <label>
        Signature Move
        <input
          name="power"
          v-model="form.power"
          maxlength="28"
          placeholder="Meteor Uppercut"
        />
      </label>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Charging...' : 'Submit Score 🔒' }}
      </button>
    </form>
  </div>
</template>
