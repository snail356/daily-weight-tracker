<template>
  <span
    v-if="percentage !== null"
    :class="['percentage', getPercentageClass(percentage)]"
  >
    ({{ percentage }}%)
  </span>
</template>

<script lang="ts">
// 顏色列舉
export enum PercentageColor {
  DANGER = "#f44336", // 紅色
  WARNING = "#ff9800", // 橙色
  NORMAL = "#4CAF50", // 綠色
  GOOD = "#2196F3", // 藍色
}

// 閾值介面
export interface Thresholds {
  warning: number;
  danger: number;
  good?: number; // 可選的 good 閾值
  direction?: "asc" | "desc"; // 判斷方向：asc(越大越危險) 或 desc(越小越危險)
}

// 預設閾值
export const DEFAULT_THRESHOLDS: Thresholds = {
  warning: 90,
  danger: 60,
  direction: "asc",
};
</script>

<script setup lang="ts">
import { computed } from "vue";
import { Thresholds, DEFAULT_THRESHOLDS } from "./PercentageDisplay.vue";

// Props 介面
interface Props {
  /** 要顯示的百分比值 */
  percentage: number | null;
  /** 自定義閾值 */
  thresholds?: Thresholds;
}

const props = withDefaults(defineProps<Props>(), {
  thresholds: () => DEFAULT_THRESHOLDS,
});

const getPercentageClass = (percentage: number): string => {
  const isAscending = props.thresholds.direction === "asc";

  if (isAscending) {
    // 越大越危險的邏輯
    if (percentage >= props.thresholds.danger) return "percentage-danger";
    if (percentage >= props.thresholds.warning) return "percentage-warning";
    if (props.thresholds.good && percentage <= props.thresholds.good)
      return "percentage-good";
    return "percentage-normal";
  } else {
    // 越小越危險的邏輯
    if (percentage <= props.thresholds.danger) return "percentage-danger";
    if (percentage <= props.thresholds.warning) return "percentage-warning";
    if (props.thresholds.good && percentage >= props.thresholds.good)
      return "percentage-good";
    return "percentage-normal";
  }
};
</script>

<style scoped>
.percentage {
  font-size: 0.9em;
  margin-left: 4px;
}

.percentage-danger {
  color: var(--percentage-danger, #f44336);
}

.percentage-warning {
  color: var(--percentage-warning, #ff9800);
}

.percentage-normal {
  color: var(--percentage-normal, #4caf50);
}

.percentage-good {
  color: var(--percentage-good, #2196f3);
}
</style>

<style>
:root {
  --percentage-danger: #f44336;
  --percentage-warning: #ff9800;
  --percentage-normal: #4caf50;
  --percentage-good: #2196f3;
}
</style>
