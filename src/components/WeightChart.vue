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
    <div v-else class="chart-container">
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
    let chartUpdateTimeout: number | null = null;

    const destroyChart = () => {
      if (chart.value) {
        chart.value.destroy();
        chart.value = null;
      }
    };

    const handleTabChange = async (type: "weight" | "protein" | "calories") => {
      if (chartUpdateTimeout) {
        clearTimeout(chartUpdateTimeout);
      }
      console.log("handleTabChange", type);
      activeChart.value = type;
      chartUpdateTimeout = window.setTimeout(() => {
        destroyChart();
        updateChart();
        chartUpdateTimeout = null;
      }, 100);
    };

    const loadRecords = async () => {
      if (!props.isDbInitialized) return;

      try {
        loading.value = true;
        records.value = await db.getAllRecords();
        await nextTick();
        destroyChart();
        updateChart();
      } catch (error) {
        console.error("Failed to load records:", error);
        alert("載入記錄失敗");
      } finally {
        loading.value = false;
      }
    };

    const updateChart = () => {
      if (!chartCanvas.value || records.value.length === 0) return;

      const sortedRecords = [...records.value].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      console.log("sortedRecords", sortedRecords);
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
      console.log("ctx", ctx);
      if (!ctx) return;

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
              min: min,
              max: max,
              grid: {
                display: true,
              },
              title: {
                display: true,
                text: unit,
              },
            },
          },
          elements: {
            line: {
              tension: 0.4,
            },
            point: {
              radius: 3,
              hoverRadius: 5,
            },
          },
        },
      });
    };

    watch(
      () => props.isDbInitialized,
      async (newValue) => {
        if (newValue) {
          await loadRecords();
        }
      }
    );

    onMounted(async () => {
      if (props.isDbInitialized) {
        await loadRecords();
      }
    });

    onBeforeUnmount(() => {
      if (chartUpdateTimeout) {
        clearTimeout(chartUpdateTimeout);
      }
      destroyChart();
    });
    handleTabChange("weight");
    return {
      chartCanvas,
      records,
      loading,
      activeChart,
      handleTabChange,
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
  padding: 8px 16px;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-tab:hover {
  background-color: #e8e8e8;
}

.chart-tab.active {
  background-color: #4caf50;
  color: white;
}

.chart-container {
  height: 400px;
  position: relative;
}

.loading,
.no-records {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
