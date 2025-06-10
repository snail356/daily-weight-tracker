<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', type]">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);
const message = ref("");
const type = ref<"error" | "success" | "info" | "warning">("info");
let timer: number | null = null;

const show = (
  msg: string,
  toastType: "error" | "success" | "info" | "warning" = "info",
  duration: number = 3000
) => {
  message.value = msg;
  type.value = toastType;
  visible.value = true;

  if (timer) {
    clearTimeout(timer);
  }

  timer = window.setTimeout(() => {
    visible.value = false;
  }, duration);
};

defineExpose({
  show,
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.error {
  background-color: #f44336;
}

.success {
  background-color: #4caf50;
}

.info {
  background-color: #2196f3;
}

.warning {
  background-color: #ff9800;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
