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
        <h2 class="pwd-gate-title">Ref Check</h2>
        <p class="pwd-gate-subtitle">
          Enter the password to save this score.
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
          <div class="pwd-gate-actions">
            <button type="submit" class="pwd-gate-btn">
              Save
            </button>
            <button
              type="button"
              class="pwd-gate-btn cancel"
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
      <h2>Throw a Punch</h2>
      <p>Hit the machine? Log it.</p>

      <label>
        Name
        <input
          name="player"
          v-model="form.player"
          placeholder="Fighter name"
          maxlength="20"
          required
        />
      </label>

      <label>
        Score
        <input
          name="score"
          v-model="form.score"
          type="number"
          min="1"
          max="999"
          placeholder="1 - 999"
          required
        />
      </label>

      <label>
        Move name
        <input
          name="power"
          v-model="form.power"
          maxlength="28"
          placeholder="Optional"
        />
      </label>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Winding up...' : '🥊 Punch it!' }}
      </button>
    </form>
  </div>
</template>
