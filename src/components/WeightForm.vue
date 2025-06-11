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
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "儲存中..." : "儲存" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
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

    let updatedRecord;
    if (todayRecordStore.state.todayRecord?.id) {
      // 如果是今天的記錄，使用相同的 ID 更新
      updatedRecord = {
        ...record,
        id: todayRecordStore.state.todayRecord.id,
        createdAt: todayRecordStore.state.todayRecord.createdAt || now,
      };
      await db.updateRecord(updatedRecord);
      window.showToast("記錄已更新", "success");
    } else {
      // 如果是新記錄，創建新的
      updatedRecord = await db.addRecord(record);
      window.showToast("記錄已新增", "success");
    }

    // 更新 store 中的今日資料
    todayRecordStore.updateTodayRecord(updatedRecord);

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

.input-with-calculator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-calculator input {
  flex: 1;
}
</style>
