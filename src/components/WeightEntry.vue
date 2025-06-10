<template>
  <div class="weight-entry">
    <h2>每日體重記錄</h2>
    <input type="number" v-model="weight" placeholder="輸入體重" />
    <button @click="submitWeight">提交</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'WeightEntry',
  setup() {
    const weight = ref<number | null>(null);

    const submitWeight = () => {
      if (weight.value !== null) {
        // 在這裡處理提交的體重，例如發送到伺服器或更新狀態
        console.log(`提交的體重: ${weight.value}`);
        weight.value = null; // 提交後清空輸入
      }
    };

    return {
      weight,
      submitWeight,
    };
  },
});
</script>

<style scoped>
.weight-entry {
  display: flex;
  flex-direction: column;
  margin: 20px;
}

input {
  margin-bottom: 10px;
  padding: 8px;
  font-size: 16px;
}

button {
  padding: 8px;
  font-size: 16px;
  cursor: pointer;
}
</style>