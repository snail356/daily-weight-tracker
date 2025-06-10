<template>
  <div class="app">
    <header>
      <h1>每日體重追蹤</h1>
    </header>

    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'form' }]"
        @click="activeTab = 'form'"
      >
        體重記錄
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'list' }]"
        @click="activeTab = 'list'"
      >
        記錄列表
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'chart' }]"
        @click="activeTab = 'chart'"
      >
        趨勢圖表
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'settings' }]"
        @click="activeTab = 'settings'"
      >
        設定
      </button>
    </div>

    <main>
      <div v-if="!isDbInitialized" class="loading">
        <p>正在初始化資料庫...</p>
      </div>
      <div v-else>
        <div v-if="activeTab === 'form'" class="today-summary">
          <h3>今日摘要</h3>
          <div v-if="todayRecord" class="summary-content">
            <div class="summary-item">
              <span class="label">體重：</span>
              <span class="value">{{ todayRecord.weight }} kg</span>
            </div>
            <div class="summary-item">
              <span class="label">蛋白質：</span>
              <span class="value">
                {{ todayRecord.protein }} g
                <span
                  v-if="
                    settingsStore.calculateProteinPercentage(
                      todayRecord.protein
                    )
                  "
                  class="percentage"
                >
                  ({{
                    settingsStore.calculateProteinPercentage(
                      todayRecord.protein
                    )
                  }}%)
                </span>
              </span>
            </div>
            <div class="summary-item">
              <span class="label">熱量：</span>
              <span class="value">{{ todayRecord.calories }} kcal</span>
            </div>
          </div>
          <div v-else class="no-record">今日尚未記錄</div>
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
import WeightForm from "./components/WeightForm.vue";
import WeightList from "./components/WeightList.vue";
import WeightChart from "./components/WeightChart.vue";
import SettingsPage from "./components/SettingsPage.vue";
import Toast from "./components/Toast.vue";
import { db } from "./services/db";
import { useSettingsStore } from "./stores/settingsStore";

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
  padding: 20px;
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

header {
  text-align: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

h1 {
  color: #2c3e50;
  margin: 0;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-shrink: 0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: #e0e0e0;
}

.tab-btn.active {
  background: #4caf50;
  color: white;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
  -webkit-overflow-scrolling: touch;
}

.today-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.today-summary h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item .label {
  color: #666;
  font-size: 14px;
}

.summary-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.no-record {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 10px;
}

.percentage {
  color: #4caf50;
  font-size: 0.9em;
  margin-left: 4px;
}
</style>
