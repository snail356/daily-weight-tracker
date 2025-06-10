<template>
  <div class="weight-form">
    <h2>記錄體重</h2>
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
        <input
          type="number"
          id="calories"
          v-model="calories"
          step="1"
          min="0"
          max="10000"
        />
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

<script lang="ts">
import { defineComponent, ref } from "vue";
import { db } from "../services/db";

export default defineComponent({
  name: "WeightForm",
  props: {
    isDbInitialized: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["record-added"],
  setup(props, { emit }) {
    const weight = ref("");
    const protein = ref("");
    const calories = ref("");
    const date = ref(new Date().toISOString().split("T")[0]);
    const note = ref("");
    const isSubmitting = ref(false);

    const handleSubmit = async () => {
      if (!props.isDbInitialized) {
        alert("數據庫尚未初始化，請稍候...");
        return;
      }

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

        await db.addRecord(record);
        emit("record-added");

        // Reset form
        weight.value = "";
        protein.value = "";
        calories.value = "";
        note.value = "";
        date.value = new Date().toISOString().split("T")[0];
      } catch (error) {
        console.error("Failed to save record:", error);
        alert("儲存失敗，請重試");
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      weight,
      protein,
      calories,
      date,
      note,
      isSubmitting,
      handleSubmit,
    };
  },
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
</style>
