<template>
  <div class="today-summary bg-light rounded-lg p-4 mb-5 shadow-sm">
    <h3 class="title mb-4 text-primary">今日摘要</h3>
    <div v-if="record" class="summary-content">
      <div class="summary-item flex items-center gap-2">
        <span class="label text-secondary">體重：</span>
        <span class="value text-primary">{{ record.weight }} kg</span>
      </div>
      <div class="summary-item flex items-center gap-2">
        <div class="label text-secondary">蛋白質</div>
        <div class="value text-primary">
          {{ record.protein }}g
          <PercentageDisplay
            :percentage="
              settingsStore.calculateProteinPercentage(record.protein)
            "
            :thresholds="{
              danger: 60,
              warning: 80,
              good: 90,
              direction: 'desc',
            }"
          />
        </div>
      </div>
      <div class="summary-item flex items-center gap-2">
        <div class="label text-secondary">熱量</div>
        <div class="value text-primary">
          {{ record.calories }}kcal
          <PercentageDisplay
            :percentage="
              settingsStore.calculateCaloriesPercentage(record.calories)
            "
            :thresholds="{
              danger: 100,
              warning: 90,
              direction: 'asc',
            }"
          />
        </div>
      </div>
    </div>
    <div v-else class="no-record text-secondary text-center p-4">
      今日尚未記錄
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "../stores/settingsStore";
import PercentageDisplay from "./PercentageDisplay.vue";

const props = defineProps<{
  record: {
    weight: number;
    protein: number;
    calories: number;
  } | null;
}>();

const settingsStore = useSettingsStore();
</script>

<style scoped>
.today-summary {
  margin-bottom: var(--spacing-lg);
}

.title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.label {
  font-size: var(--font-size-md);
}

.value {
  font-size: var(--font-size-md);
  font-weight: 500;
}
</style>
