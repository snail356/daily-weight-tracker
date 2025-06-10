<template>
  <div class="calorie-calculator">
    <div class="calculator-trigger" @click="toggleCalculator">
      <i class="fas fa-calculator"></i>
    </div>

    <div v-if="showCalculator" class="calculator-popup">
      <div class="calculator-header">
        <h3>熱量計算機</h3>
        <button class="close-btn" @click="toggleCalculator">×</button>
      </div>
      <div class="calculator-content">
        <div class="meal-input">
          <label>早餐 (kcal)</label>
          <input
            type="number"
            v-model.number="mealCalories.breakfast"
            min="0"
            @input="calculateTotalCalories"
          />
        </div>
        <div class="meal-input">
          <label>午餐 (kcal)</label>
          <input
            type="number"
            v-model.number="mealCalories.lunch"
            min="0"
            @input="calculateTotalCalories"
          />
        </div>
        <div class="meal-input">
          <label>晚餐 (kcal)</label>
          <input
            type="number"
            v-model.number="mealCalories.dinner"
            min="0"
            @input="calculateTotalCalories"
          />
        </div>
        <div class="meal-input">
          <label>點心 (kcal)</label>
          <input
            type="number"
            v-model.number="mealCalories.snack"
            min="0"
            @input="calculateTotalCalories"
          />
        </div>
        <div class="total-calories">總熱量: {{ totalCalories }} kcal</div>
        <button class="apply-btn" @click="applyCalories">套用熱量</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "CalorieCalculator",
  emits: ["update:calories"],
  setup(props, { emit }) {
    const showCalculator = ref(false);
    const mealCalories = ref({
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    });
    const totalCalories = ref(0);

    const toggleCalculator = () => {
      showCalculator.value = !showCalculator.value;
    };

    const calculateTotalCalories = () => {
      totalCalories.value = Object.values(mealCalories.value).reduce(
        (sum, calories) => sum + (calories || 0),
        0
      );
    };

    const applyCalories = () => {
      emit("update:calories", totalCalories.value);
      showCalculator.value = false;
      mealCalories.value = {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0,
      };
      totalCalories.value = 0;
    };

    return {
      showCalculator,
      mealCalories,
      totalCalories,
      toggleCalculator,
      calculateTotalCalories,
      applyCalories,
    };
  },
});
</script>

<style scoped>
.calorie-calculator {
  position: relative;
  display: inline-block;
}

.calculator-trigger {
  cursor: pointer;
  padding: 4px;
  color: #666;
  transition: color 0.3s;
}

.calculator-trigger:hover {
  color: #4caf50;
}

.calculator-popup {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 280px;
  z-index: 1000;
  margin-top: 8px;
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.calculator-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.calculator-content {
  padding: 16px;
}

.meal-input {
  margin-bottom: 12px;
}

.meal-input label {
  display: block;
  margin-bottom: 4px;
  color: #666;
  font-size: 14px;
}

.meal-input input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.total-calories {
  margin: 16px 0;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  color: #333;
}

.apply-btn {
  width: 100%;
  padding: 10px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.apply-btn:hover {
  background: #45a049;
}
</style>
