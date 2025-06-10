<template>
  <div class="home">
    <h1>每日體重記錄</h1>
    <WeightEntry @weight-submitted="addWeightEntry" />
    <div v-if="weightEntries.length">
      <h2>體重條目</h2>
      <ul>
        <li v-for="entry in weightEntries" :key="entry.date">
          {{ entry.date }}: {{ entry.weight }} kg
        </li>
      </ul>
    </div>
    <div v-else>
      <p>尚未記錄任何體重條目。</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import WeightEntry from '../components/WeightEntry.vue';
import { WeightEntry as WeightEntryType } from '../types';

export default defineComponent({
  name: 'HomeView',
  components: {
    WeightEntry,
  },
  setup() {
    const weightEntries = ref<WeightEntryType[]>([]);

    const addWeightEntry = (weight: number) => {
      const date = new Date().toLocaleDateString();
      weightEntries.value.push({ date, weight });
    };

    return {
      weightEntries,
      addWeightEntry,
    };
  },
});
</script>

<style scoped>
.home {
  padding: 20px;
}
</style>