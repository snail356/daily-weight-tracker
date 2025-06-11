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
        <div
          v-if="activeTab === 'form'"
          class="today-summary bg-light rounded-lg p-4 mb-5 shadow-sm"
        >
          <h3 class="title mb-4">今日摘要</h3>
          <div v-if="todayRecord" class="summary-content">
            <div class="summary-item flex items-center gap-2">
              <span class="label text-secondary">體重：</span>
              <span class="value text-primary"
                >{{ todayRecord.weight }} kg</span
              >
            </div>
            <div class="summary-item flex items-center gap-2">
              <div class="summary-label text-secondary">蛋白質</div>
              <div class="summary-value text-primary">
                {{ todayRecord.protein }}g
                <PercentageDisplay
                  :percentage="
                    settingsStore.calculateProteinPercentage(
                      todayRecord.protein
                    )
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
              <div class="summary-label text-secondary">熱量</div>
              <div class="summary-value text-primary">
                {{ todayRecord.calories }}kcal
                <PercentageDisplay
                  :percentage="
                    settingsStore.calculateCaloriesPercentage(
                      todayRecord.calories
                    )
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
        <WeightForm
          v-if="activeTab === 'form'"
          :is-db-initialized="isDbInitialized"
          @record-added="handleRecordAdded"
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
import { ref, onMounted, watch, onUnmounted } from "vue";
import WeightForm from "../components/WeightForm.vue";
import WeightList from "../components/WeightList.vue";
import WeightChart from "../components/WeightChart.vue";
import SettingsPage from "../components/SettingsPage.vue";
import Toast from "../components/Toast.vue";
import PercentageDisplay from "../components/PercentageDisplay.vue";
import TabBar from "../components/TabBar.vue";
import { db } from "../services/db";
import { useSettingsStore } from "../stores/settingsStore";

const isDbInitialized = ref(false);
const activeTab = ref("form");
const weightChart = ref<InstanceType<typeof WeightChart> | null>(null);
const todayRecord = ref<any>(null);
const settingsStore = useSettingsStore();
const toast = ref<InstanceType<typeof Toast> | null>(null);

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

const loadTodayRecord = async () => {
  if (isDbInitialized.value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await db.getAllRecords();
    const todayRecords = records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= today && recordDate < tomorrow;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    todayRecord.value = todayRecords[0] || null;
  }
};

const handleRecordAdded = async () => {
  await loadTodayRecord();
  // 更新列表和圖表
  if (activeTab.value === "list") {
    const event = new CustomEvent("refresh-records");
    window.dispatchEvent(event);
  } else if (activeTab.value === "chart" && weightChart.value) {
    await weightChart.value.loadRecords();
  }
};

const handleRefresh = async () => {
  await loadTodayRecord();
  if (activeTab.value === "chart" && weightChart.value) {
    await weightChart.value.loadRecords();
  }
};

// 監聽設定變化
watch(
  () => settingsStore.settings,
  async () => {
    if (todayRecord.value) {
      // 重新計算蛋白質百分比
      await loadTodayRecord();
    }
  },
  { deep: true }
);

onMounted(async () => {
  try {
    await db.init();
    isDbInitialized.value = true;
    await settingsStore.loadSettings();
    await loadTodayRecord();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
});

watch(activeTab, async (newTab) => {
  if (newTab === "form") {
    await loadTodayRecord();
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
