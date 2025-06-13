<template>
  <div class="weight-chart">
    <div class="chart-header">
      <h2>趨勢圖表</h2>
      <div class="chart-tabs">
        <button
          :class="['chart-tab', { active: activeChart === 'weight' }]"
          @click="handleTabChange('weight')"
        >
          體重趨勢
        </button>
        <button
          :class="['chart-tab', { active: activeChart === 'protein' }]"
          @click="handleTabChange('protein')"
        >
          蛋白質趨勢
        </button>
        <button
          :class="['chart-tab', { active: activeChart === 'calories' }]"
          @click="handleTabChange('calories')"
        >
          熱量趨勢
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">載入中...</div>
    <div v-else-if="records.length === 0" class="no-records">
      還沒有記錄，請新增第一筆體重記錄。
    </div>
    <div
      v-else
      class="chart-container"
      :class="{ updating: isUpdating || isTabChanging }"
    >
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  nextTick,
  onBeforeUnmount,
} from "vue";
import { Chart, registerables } from "chart.js";
import { WeightRecord } from "../types/weight";
import { db } from "../services/db";

Chart.register(...registerables);

// 防抖函數
const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null;
  return function (...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

export default defineComponent({
  name: "WeightChart",
  props: {
    isDbInitialized: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    const chart = ref<Chart | null>(null);
    const records = ref<WeightRecord[]>([]);
    const loading = ref(true);
    const activeChart = ref<"weight" | "protein" | "calories">("weight");
    const isUpdating = ref(false);
    const isTabChanging = ref(false);

    const destroyChart = () => {
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }
    };

    const updateChart = () => {
      if (!chartCanvas.value || records.value.length === 0 || isUpdating.value)
        return;

      isUpdating.value = true;
      try {
        const sortedRecords = [...records.value].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const labels = sortedRecords.map((record) =>
          new Date(record.date).toLocaleDateString("zh-TW", {
            month: "short",
            day: "numeric",
          })
        );

        let data: number[] = [];
        let label = "";
        let color = "";
        let unit = "";
        let min = 0;
        let max = 0;

        switch (activeChart.value) {
          case "weight":
            data = sortedRecords.map((record) => record.weight);
            label = "體重";
            color = "#4CAF50";
            unit = "kg";
            min = Math.min(...data) - 1;
            max = Math.max(...data) + 1;
            break;
          case "protein":
            data = sortedRecords.map((record) => record.protein || 0);
            label = "蛋白質";
            color = "#2196F3";
            unit = "g";
            min = 0;
            max = Math.max(...data) + 10;
            break;
          case "calories":
            data = sortedRecords.map((record) => record.calories || 0);
            label = "熱量";
            color = "#FF9800";
            unit = "kcal";
            min = 0;
            max = Math.max(...data) + 100;
            break;
        }

        const ctx = chartCanvas.value.getContext("2d");
        if (!ctx) return;

        destroyChart();

        chart.value = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: `${label} (${unit})`,
                data,
                borderColor: color,
                backgroundColor: color + "20",
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: "index",
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `${label}: ${context.parsed.y} ${unit}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: true,
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                },
              },
              y: {
                min,
                max,
                grid: {
                  display: true,
                },
              },
            },
          },
        });
      } finally {
        isUpdating.value = false;
      }
    };

    // 使用共用的防抖函數
    const debouncedUpdateChart = debounce(updateChart, 800);

    const handleTabChange = (type: "weight" | "protein" | "calories") => {
      if (isUpdating.value || isTabChanging.value) return;

      isTabChanging.value = true;
      activeChart.value = type;

      // 添加一個延遲，讓用戶看到切換效果
      setTimeout(() => {
        debouncedUpdateChart();
        isTabChanging.value = false;
      }, 100);
    };

    const loadRecords = async () => {
      if (!props.isDbInitialized) return;

      try {
        loading.value = true;
        records.value = await db.getAllRecords();
        await nextTick();
        debouncedUpdateChart();
      } catch (error) {
        console.error("Failed to load records:", error);
        alert("載入記錄失敗");
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => props.isDbInitialized,
      (newValue) => {
        if (newValue) {
          loadRecords();
        }
      }
    );

    onMounted(() => {
      if (props.isDbInitialized) {
        loadRecords();
      }
    });

    onBeforeUnmount(() => {
      destroyChart();
    });

    return {
      chartCanvas,
      records,
      loading,
      activeChart,
      handleTabChange,
      loadRecords,
      isUpdating,
      isTabChanging,
    };
  },
});
</script>

<style scoped>
.weight-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-tabs {
  display: flex;
  gap: 1px;
  background-color: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.chart-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  font-weight: 500;
}

.chart-tab:hover {
  color: var(--primary-color);
}

.chart-tab.active {
  color: var(--primary-color);
}

.chart-tab.active::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  transform: scaleX(1);
  transition: transform 0.3s ease;
}

.chart-tab:not(.active)::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.chart-container {
  position: relative;
  height: 400px;
  transition: opacity 0.3s ease;
}

.chart-container.updating {
  opacity: 0.5;
  pointer-events: none;
}

.loading,
.no-records {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
