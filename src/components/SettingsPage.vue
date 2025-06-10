<template>
  <div class="settings-page">
    <h2>目標設定</h2>
    <form @submit.prevent="saveSettings" class="settings-form">
      <div class="form-group">
        <label for="targetWeight">目標體重 (kg)</label>
        <input
          type="number"
          id="targetWeight"
          v-model.number="settings.targetWeight"
          step="0.1"
          min="0"
          placeholder="請輸入目標體重"
        />
      </div>

      <div class="form-group">
        <label for="targetCalories">每日目標熱量 (kcal)</label>
        <input
          type="number"
          id="targetCalories"
          v-model.number="settings.targetCalories"
          min="0"
          placeholder="請輸入每日目標熱量"
        />
      </div>

      <div class="form-group">
        <label for="targetProtein">每日目標蛋白質 (g)</label>
        <input
          type="number"
          id="targetProtein"
          v-model.number="settings.targetProtein"
          min="0"
          placeholder="請輸入每日目標蛋白質"
        />
      </div>

      <div class="form-actions">
        <button type="submit" class="save-btn">儲存設定</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db } from "../services/db";
import { useSettingsStore } from "../stores/settingsStore";

const props = defineProps<{
  isDbInitialized: boolean;
}>();

const settingsStore = useSettingsStore();
const settings = ref({
  targetWeight: null as number | null,
  targetProtein: null as number | null,
  targetCalories: null as number | null,
});

const loadSettings = async () => {
  if (props.isDbInitialized) {
    try {
      const savedSettings = await db.getSettings();
      if (savedSettings) {
        settings.value = savedSettings;
        await settingsStore.saveSettings(savedSettings);
      }
    } catch (error) {
      window.showToast("載入設定失敗", "error");
    }
  }
};

const saveSettings = async () => {
  if (props.isDbInitialized) {
    try {
      await db.saveSettings(settings.value);
      await settingsStore.saveSettings(settings.value);
      window.showToast("設定已儲存", "success");
    } catch (error) {
      window.showToast("儲存設定失敗", "error");
    }
  }
};

onMounted(loadSettings);
</script>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.settings-form {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #4caf50;
}

.form-actions {
  margin-top: 24px;
  text-align: center;
}

.save-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:active {
  background-color: #3d8b40;
}
</style>
