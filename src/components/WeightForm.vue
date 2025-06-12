<template>
  <div class="weight-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="weight">體重 (kg)</label>
        <input
          type="number"
          id="weight"
          v-model="weight"
          step="0.1"
          required
          min="0"
          max="500"
        />
      </div>
      <div class="form-group">
        <label for="protein">蛋白質 (g)</label>
        <input
          type="number"
          id="protein"
          v-model="protein"
          step="0.1"
          min="0"
          max="1000"
        />
      </div>
      <div class="form-group">
        <label for="calories">熱量 (kcal)</label>
        <div class="input-with-calculator">
          <input
            type="number"
            id="calories"
            v-model.number="calories"
            min="0"
            max="10000"
            step="1"
          />
          <CalorieCalculator @update:calories="updateCalories" />
        </div>
      </div>
      <div class="form-group">
        <label for="date">日期</label>
        <input type="date" id="date" v-model="date" required />
      </div>
      <div class="form-group">
        <label for="note">備註</label>
        <textarea id="note" v-model="note" rows="3"></textarea>
      </div>
      <!-- 桌面版按鈕 -->
      <button type="submit" :disabled="isSubmitting" class="normal-submit-btn">
        {{ isSubmitting ? "儲存中..." : "儲存" }}
      </button>
      <!-- 手機版固定按鈕 -->
      <button type="submit" :disabled="isSubmitting" class="fixed-submit-btn">
        {{ isSubmitting ? "..." : "儲存" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTodayRecordStore } from "../stores/todayRecordStore";
import { db } from "../services/db";
import CalorieCalculator from "./CalorieCalculator.vue";

const props = defineProps<{
  showCalorieCalculator?: boolean;
}>();

const emit = defineEmits<{
  (e: "record-added"): void;
  (e: "success"): void;
  (e: "error", error: any): void;
}>();

const todayRecordStore = useTodayRecordStore();

const weight = ref("");
const protein = ref("");
const calories = ref("");
const note = ref("");
const date = ref(new Date().toISOString().split("T")[0]);
const isSubmitting = ref(false);

const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

const isValid = computed(() => {
  return weight.value !== "" && !isNaN(parseFloat(weight.value));
});

const handleSubmit = async () => {
  if (!isValid.value) return;

  try {
    isSubmitting.value = true;
    const now = new Date().toISOString();
    const record = {
      weight: parseFloat(weight.value),
      protein: protein.value ? parseFloat(protein.value) : undefined,
      calories: calories.value ? parseInt(calories.value) : undefined,
      date: date.value,
      note: note.value,
      createdAt: now,
      updatedAt: now,
    };

    // 檢查選擇的日期是否已有記錄
    const existingRecords = await db.getAllRecords();
    const existingRecord = existingRecords.find((r) => r.date === date.value);

    let updatedRecord;
    if (existingRecord) {
      // 如果選擇的日期已有記錄，則更新該記錄
      updatedRecord = {
        ...record,
        id: existingRecord.id,
        createdAt: existingRecord.createdAt || now,
      };
      await db.updateRecord(updatedRecord);
      window.showToast("記錄已更新", "success");
    } else {
      // 如果是新日期，創建新的記錄
      updatedRecord = await db.addRecord(record);
      window.showToast("記錄已新增", "success");
    }

    // 如果更新的是今天的記錄，則更新 store 中的今日資料
    const today = new Date().toISOString().split("T")[0];
    if (date.value === today) {
      todayRecordStore.updateTodayRecord(updatedRecord);
    }

    // 重置表單
    resetForm();

    // 觸發成功事件
    emit("success");
  } catch (error) {
    console.error("Error saving record:", error);
    window.showToast("儲存失敗，請重試", "error");
    emit("error", error);
  } finally {
    isSubmitting.value = false;
    todayRecordStore.setEditing(false);
  }
};

const resetForm = () => {
  weight.value = "";
  protein.value = "";
  calories.value = "";
  note.value = "";
  date.value = new Date().toISOString().split("T")[0];
};

const setData = (data: {
  weight: number;
  protein: number;
  calories: number;
  date: string;
  note?: string;
}) => {
  // 先重置表單
  resetForm();

  // 設置新數據
  weight.value = data.weight.toString();
  protein.value = data.protein.toString();
  calories.value = data.calories.toString();
  date.value = data.date;
  note.value = data.note || "";
};

const updateCalories = (value: number) => {
  calories.value = value;
};

defineExpose({
  setData,
  resetForm,
});
</script>

<style scoped>
.weight-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 80px; /* 為固定按鈕留出空間 */
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

/* 新增固定按鈕樣式 */
.fixed-submit-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
  margin: 0;
  left: auto;
  max-width: none;
}

/* 手機版按鈕樣式 */
@media (max-width: 768px) {
  .fixed-submit-btn {
    width: 70px;
    height: 70px;
    bottom: 30px;
    right: 30px;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .normal-submit-btn {
    display: none;
  }
}

/* 桌面版按鈕樣式 */
@media (min-width: 769px) {
  .fixed-submit-btn {
    display: none;
  }

  .normal-submit-btn {
    display: block;
  }
}

.fixed-submit-btn:disabled,
.normal-submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.fixed-submit-btn:hover:not(:disabled) {
  background-color: #45a049;
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.normal-submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.input-with-calculator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-calculator input {
  flex: 1;
}
</style>
