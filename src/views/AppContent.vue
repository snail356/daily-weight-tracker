<template>
  <div class="app">
    <header class="header">
      <h1 class="title">每日體重追蹤</h1>
    </header>

    <TabBar
      v-model="activeTab"
      :tabs="[
        { id: 'form', label: '體重記錄' },
        { id: 'list', label: '記錄列表' },
        { id: 'chart', label: '趨勢圖表' },
        { id: 'settings', label: '設定' },
      ]"
    />
    <main class="main">
      <div v-if="!isDbInitialized" class="loading text-center p-5">
        <p class="text-secondary">正在初始化資料庫...</p>
      </div>
      <div v-else>
        <TodaySummary
          v-if="activeTab === 'form'"
          :record="todayRecordStore.state.todayRecord"
          @click="handleTodaySummaryClick"
          @deselect="handleTodaySummaryDeselect"
          @update="handleTodaySummaryUpdate"
        />
        <WeightForm
          v-if="activeTab === 'form'"
          :is-db-initialized="isDbInitialized"
          @record-added="handleRecordAdded"
          ref="weightFormRef"
        />
        <WeightList
          v-if="activeTab === 'list'"
          :is-db-initialized="isDbInitialized"
          @refresh="handleRefresh"
        />
        <WeightChart
          v-show="activeTab === 'chart'"
          :is-db-initialized="isDbInitialized"
          ref="weightChart"
        />
        <SettingsPage
          v-if="activeTab === 'settings'"
          :is-db-initialized="isDbInitialized"
        />
      </div>
    </main>
    <Toast ref="toast" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import WeightForm from "../components/WeightForm.vue";
import WeightList from "../components/WeightList.vue";
import WeightChart from "../components/WeightChart.vue";
import SettingsPage from "../components/SettingsPage.vue";
import TodaySummary from "../components/TodaySummary.vue";
import { db } from "../services/db";
import { useSettingsStore } from "../stores/settingsStore";
import { useTodayRecordStore } from "../stores/todayRecordStore";
import { Toast, TabBar } from "@/components/Common";

const isDbInitialized = ref(false);
const activeTab = ref("form");
const weightChart = ref<InstanceType<typeof WeightChart> | null>(null);
const settingsStore = useSettingsStore();
const todayRecordStore = useTodayRecordStore();
const toast = ref<InstanceType<typeof Toast> | null>(null);
const weightFormRef = ref<InstanceType<typeof WeightForm> | null>(null);

// 提供全局的 toast 方法
const showToast = (
  message: string,
  type: "error" | "success" | "info" | "warning" = "info"
) => {
  toast.value?.show(message, type);
};

// 將 toast 方法添加到 window 對象
declare global {
  interface Window {
    showToast: typeof showToast;
  }
}
window.showToast = showToast;

const handleRecordAdded = async () => {
  await todayRecordStore.loadTodayRecord();
  // 重置編輯狀態
  todayRecordStore.setEditing(false);
  // 更新列表和圖表
  if (activeTab.value === "list") {
    const event = new CustomEvent("refresh-records");
    window.dispatchEvent(event);
  } else if (activeTab.value === "chart" && weightChart.value) {
    await weightChart.value.loadRecords();
  }
};

const handleRefresh = async () => {
  await todayRecordStore.loadTodayRecord();
  if (activeTab.value === "chart" && weightChart.value) {
    await weightChart.value.loadRecords();
  }
};

const handleTodaySummaryClick = (data: {
  weight: number;
  protein: number;
  calories: number;
  date: string;
  note?: string;
}) => {
  weightFormRef.value?.setData(data);
};

const handleTodaySummaryDeselect = () => {
  weightFormRef.value?.resetForm();
};

const handleTodaySummaryUpdate = (data: {
  calories: number;
  protein: number;
}) => {
  if (weightFormRef.value) {
    // 獲取當前表單數據
    const currentData = {
      weight: parseFloat(weightFormRef.value.weight) || 0,
      protein: parseFloat(weightFormRef.value.protein) || 0,
      calories: parseFloat(weightFormRef.value.calories) || 0,
      date: weightFormRef.value.date,
      note: weightFormRef.value.note || "",
    };

    // 只更新匯入的數據項目
    const updatedData = {
      ...currentData,
      calories: data.calories,
      protein: data.protein,
    };

    weightFormRef.value.setData(updatedData);
  }
};

onMounted(async () => {
  try {
    await db.init();
    isDbInitialized.value = true;
    await settingsStore.loadSettings();
    await todayRecordStore.loadTodayRecord();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
});

// 監聽設定變化
watch(
  () => settingsStore.settings,
  async () => {
    if (todayRecordStore.todayRecord) {
      await todayRecordStore.loadTodayRecord();
    }
  },
  { deep: true }
);

watch(activeTab, async (newTab) => {
  if (newTab === "form") {
    await todayRecordStore.loadTodayRecord();
  }
});
</script>

<style>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--p-5);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: var(--mb-5);
  flex-shrink: 0;
}

.title {
  color: var(--text-primary);
  margin: 0;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--p-5);
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--gap-2);
}
</style>
