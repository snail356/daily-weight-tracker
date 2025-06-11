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
          v-if="activeTab === 'chart'"
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
import Toast from "../components/Toast.vue";
import PercentageDisplay from "../components/PercentageDisplay.vue";
import TabBar from "../components/TabBar.vue";
import TodaySummary from "../components/TodaySummary.vue";
import { db } from "../services/db";
import { useSettingsStore } from "../stores/settingsStore";
import { useTodayRecordStore } from "../stores/todayRecordStore";

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
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
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
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--gap-2);
}
</style>
