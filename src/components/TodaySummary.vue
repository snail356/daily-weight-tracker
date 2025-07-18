<template>
  <div
    class="today-summary bg-light rounded-lg p-4 mb-5 shadow-sm"
    :class="{ 'is-editing': todayRecordStore.state.isEditing }"
    @click="handleClick"
  >
    <div class="flex justify-between items-center mb-4">
      <h3 class="title text-primary" style="margin-right: 20px">今日摘要</h3>
      <button
        @click.stop="showImportDialog = true"
        class="btn btn-primary text-sm"
      >
        匯入餐點
      </button>
    </div>
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

    <ImportMealDialog v-model="showImportDialog" @import="handleImport" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import PercentageDisplay from "./PercentageDisplay.vue";
import { useTodayRecordStore } from "../stores/todayRecordStore";
import ImportMealDialog from "./ImportMealDialog.vue";

const props = defineProps<{
  record: {
    weight: number;
    protein: number;
    calories: number;
    date: string;
    note?: string;
  } | null;
}>();

const emit = defineEmits<{
  (
    e: "click",
    data: {
      weight: number;
      protein: number;
      calories: number;
      date: string;
      note?: string;
    }
  ): void;
  (e: "deselect"): void;
  (e: "update", data: { calories: number; protein: number }): void;
}>();

const settingsStore = useSettingsStore();
const todayRecordStore = useTodayRecordStore();
const showImportDialog = ref(false);

const handleClick = () => {
  todayRecordStore.setEditing(!todayRecordStore.state.isEditing);
  if (todayRecordStore.state.isEditing && props.record) {
    emit("click", {
      weight: props.record.weight,
      protein: props.record.protein,
      calories: props.record.calories,
      date: props.record.date,
      note: props.record.note,
    });
  } else {
    emit("deselect");
  }
};

const handleImport = (data: {
  meals: any[];
  totals: { calories: number; protein: number };
}) => {
  emit("update", {
    calories: data.totals.calories,
    protein: data.totals.protein,
  });
};

const parseTableData = (tableText: string) => {
  // 移除 Markdown 表格格式
  const lines = tableText
    .split("\n")
    .filter((line) => line.trim() && !line.includes("---"))
    .map((line) => line.replace(/^\| | \|$/g, "").split(" | "));

  // 解析表頭
  const headers = lines[0];
  const data = [];

  // 解析數據行
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row[0].toLowerCase().includes("總計")) continue; // 跳過總計行

    const meal = {
      name: row[0].trim(),
      calories: parseInt(row[1].replace(/[^0-9]/g, "")),
      protein: parseFloat(row[2].replace(/[^0-9.-]/g, "")),
    };
    data.push(meal);
  }

  // 計算總和
  const totals = data.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
    }),
    { calories: 0, protein: 0 }
  );

  return {
    meals: data,
    totals,
  };
};

// 導出方法供外部使用
defineExpose({
  parseTableData,
});
</script>

<style scoped>
.today-summary {
  margin-bottom: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: var(--bg-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.today-summary:hover {
  background: var(--bg-hover);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  z-index: 2;
}

.today-summary.is-editing {
  border-color: var(--primary-color);
  background: var(--bg-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.title {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.today-summary:hover .title {
  color: var(--primary-color);
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  transition: opacity 0.3s ease;
}

.today-summary:hover .summary-content {
  opacity: 0.9;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: transform 0.2s ease;
}

.today-summary:hover .summary-item {
  transform: translateX(2px);
}

.label {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.today-summary:hover .label {
  color: var(--text-primary);
}

.value {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.today-summary:hover .value {
  color: var(--primary-color);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--primary-color);
  color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-record {
  color: var(--text-secondary);
  text-align: center;
  padding: var(--spacing-lg);
  font-style: italic;
  transition: color 0.3s ease;
}

.today-summary:hover .no-record {
  color: var(--text-primary);
}
</style>
