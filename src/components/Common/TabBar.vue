<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-btn', { active: modelValue === tab.id }]"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string;
  label: string;
}

const props = defineProps<{
  modelValue: string;
  tabs: Tab[];
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<style scoped>
.tab-bar {
  display: flex;
  justify-content: center;
  gap: var(--gap-2);
  margin-bottom: var(--mb-5);
  flex-shrink: 0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: var(--bg-light);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--rounded);
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: var(--bg-hover);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
}
</style>
