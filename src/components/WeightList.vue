<template>
  <div class="weight-list">
    <div class="list-header">
      <h2>體重記錄</h2>
      <button
        v-if="records.length > 0"
        @click="handleExport"
        class="export-btn"
      >
        導出記錄
      </button>
    </div>
    <div v-if="loading" class="loading">載入中...</div>
    <div v-else-if="records.length === 0" class="no-records">
      還沒有記錄，請新增第一筆體重記錄。
    </div>
    <div v-else class="records">
      <div v-for="record in sortedRecords" :key="record.id" class="record-item">
        <div class="record-header">
          <div class="record-date">{{ formatDate(record.date) }}</div>
          <div class="record-actions">
            <button @click="handleDelete(record.id!)" class="delete-btn">
              刪除
            </button>
          </div>
        </div>
        <div class="record-content">
          <div class="record-main">
            <div class="record-weight">{{ record.weight }} kg</div>
            <div class="record-details">
              <div v-if="record.protein" class="record-protein">
                <span class="label">蛋白質:</span>
                <span class="value">{{ record.protein }}g</span>
              </div>
              <div v-if="record.calories" class="record-calories">
                <span class="label">熱量:</span>
                <span class="value">{{ record.calories }}kcal</span>
              </div>
            </div>
          </div>
          <div v-if="record.note" class="record-note">
            <span class="label">備註:</span>
            <span class="value">{{ record.note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { WeightRecord } from "../types/weight";
import { db } from "../services/db";

export default defineComponent({
  name: "WeightList",
  props: {
    isDbInitialized: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["refresh"],
  setup(props, { emit }) {
    const records = ref<WeightRecord[]>([]);
    const loading = ref(true);

    const sortedRecords = computed(() => {
      return [...records.value].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    const loadRecords = async () => {
      if (!props.isDbInitialized) {
        return;
      }

      try {
        loading.value = true;
        records.value = await db.getAllRecords();
        emit("refresh");
      } catch (error) {
        console.error("Failed to load records:", error);
        alert("載入記錄失敗");
      } finally {
        loading.value = false;
      }
    };

    const handleDelete = async (id: number) => {
      if (!confirm("確定要刪除這筆記錄嗎？")) {
        return;
      }

      try {
        await db.deleteRecord(id);
        await loadRecords();
      } catch (error) {
        console.error("Failed to delete record:", error);
        alert("刪除失敗");
      }
    };

    const handleExport = () => {
      try {
        // 準備導出數據
        const exportData = {
          records: records.value,
          exportDate: new Date().toISOString(),
          totalRecords: records.value.length,
        };

        // 創建 Blob
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });

        // 創建下載連結
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // 設置文件名（使用當前日期）
        const date = new Date();
        const fileName = `weight-records-${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.json`;
        link.download = fileName;

        // 觸發下載
        document.body.appendChild(link);
        link.click();

        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to export records:", error);
        alert("導出失敗，請重試");
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
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

    return {
      records,
      loading,
      sortedRecords,
      handleDelete,
      handleExport,
      formatDate,
      loadRecords,
    };
  },
});
</script>

<style scoped>
.weight-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading,
.no-records {
  text-align: center;
  padding: 20px;
  color: #666;
}

.record-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-date {
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-main {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.record-weight {
  font-size: 1.4em;
  color: #4caf50;
  font-weight: bold;
  min-width: 80px;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.record-protein,
.record-calories,
.record-note {
  display: flex;
  gap: 8px;
  align-items: center;
}

.record-protein .label {
  color: #2196f3;
  font-weight: bold;
}

.record-calories .label {
  color: #ff9800;
  font-weight: bold;
}

.record-note {
  color: #666;
  font-style: italic;
  margin-top: 5px;
}

.record-note .label {
  color: #666;
  font-weight: bold;
}

.record-actions {
  display: flex;
  gap: 10px;
}

.delete-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.delete-btn:hover {
  background-color: #cc0000;
}

@media (max-width: 600px) {
  .record-main {
    flex-direction: column;
    gap: 10px;
  }

  .record-weight {
    font-size: 1.2em;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.export-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn:hover {
  background-color: #1976d2;
}

.export-btn:active {
  background-color: #1565c0;
}
</style>
