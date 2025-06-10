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
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import WeightForm from "./components/WeightForm.vue";
import WeightList from "./components/WeightList.vue";
import WeightChart from "./components/WeightChart.vue";
import { db } from "./services/db";

export default defineComponent({
  name: "App",
  components: {
    WeightForm,
    WeightList,
    WeightChart,
  },
  setup() {
    const isDbInitialized = ref(false);
    const activeTab = ref("form");
    const weightChart = ref<InstanceType<typeof WeightChart> | null>(null);

    const initializeDb = async () => {
      try {
        await db.init();
        isDbInitialized.value = true;
      } catch (error) {
        console.error("Failed to initialize database:", error);
        alert("初始化數據庫失敗，請刷新頁面重試");
      }
    };

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

    onMounted(() => {
      initializeDb();
    });

    return {
      isDbInitialized,
      activeTab,
      weightChart,
      handleRecordAdded,
      handleRefresh,
    };
  },
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
}

header {
  background-color: #4caf50;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 1px;
  background-color: #e0e0e0;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 200px;
}

.tab-btn:hover {
  background-color: #e8e8e8;
}

.tab-btn.active {
  background-color: #4caf50;
  color: white;
}

.tab-btn:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.tab-btn:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

main {
  margin-top: 20px;
}
</style>
