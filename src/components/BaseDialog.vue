<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="dialog-overlay" @click="handleOverlayClick">
        <div class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">{{ title }}</h3>
            <button
              class="close-button"
              @click="$emit('update:modelValue', false)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="dialog-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  title: string;
  closeOnOverlayClick?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick !== false) {
    emit("update:modelValue", false);
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  background: white;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #333;
}

.dialog-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
