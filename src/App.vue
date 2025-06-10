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
      <div v-if="!isDbInitialized" class="loading">初始化數據庫...</div>
      <div v-else>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import WeightForm from "./components/WeightForm.vue";
import WeightList from "./components/WeightList.vue";
import WeightChart from "./components/WeightChart.vue";
import SettingsPage from "./components/SettingsPage.vue";
import { db } from "./services/db";

const isDbInitialized = ref(false);
const activeTab = ref("form");
const weightChart = ref<InstanceType<typeof WeightChart> | null>(null);

const handleRecordAdded = async () => {
  // 更新列表和圖表
  if (activeTab.value === "list") {
    // 如果當前在列表頁面，觸發列表更新
    const event = new CustomEvent("refresh-records");
    window.dispatchEvent(event);
  } else if (activeTab.value === "chart" && weightChart.value) {
    // 如果當前在圖表頁面，觸發圖表更新
    await weightChart.value.loadRecords();
  }
};

const handleRefresh = async () => {
  if (activeTab.value === "chart" && weightChart.value) {
    await weightChart.value.loadRecords();
  }
};

onMounted(async () => {
  try {
    await db.init();
    isDbInitialized.value = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
});
</script>

<style>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
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
  color: #666;
  margin-top: 20px;
}
</style>
