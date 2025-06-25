<template>
  <BaseDialog
    v-model="dialogVisible"
    title="匯入餐點"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <div class="import-content">
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <label class="block text-sm font-medium"
            >請貼上 Markdown 格式的表格：</label
          >
          <button type="button" class="paste-btn" @click="handlePaste">
            <i class="fas fa-paste"></i> 貼上
          </button>
        </div>
      </div>

      <textarea
        v-model="tableText"
        class="table-input"
        placeholder="請貼上餐點表格內容..."
        rows="10"
      ></textarea>

      <div v-if="parsedData" class="preview-section">
        <h4 class="text-md font-medium mb-2">預覽：</h4>
        <div class="flex flex-col gap-4">
          <div class="bg-gray-50 p-3 rounded">
            <div class="mb-2 font-medium">表格預覽：</div>
            <div class="markdown-preview" v-html="renderedTable"></div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="mb-2">
              總熱量：{{ parsedData.totals.calories }} kcal
            </div>
            <div>總蛋白質：{{ parsedData.totals.protein }}g</div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button
          class="btn btn-primary"
          @click="handleImport"
          :disabled="!parsedData"
        >
          匯入
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { marked } from "marked";
import BaseDialog from "./BaseDialog.vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (
    e: "import",
    data: { meals: any[]; totals: { calories: number; protein: number } }
  ): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const tableText = ref("");

// 監聽彈窗關閉，清空資料
watch(dialogVisible, (newValue) => {
  if (!newValue) {
    tableText.value = "";
  }
});

const renderedTable = computed(() => {
  if (!tableText.value) return "";
  return marked(tableText.value);
});

const parsedData = computed(() => {
  if (!tableText.value) return null;

  try {
    // 移除 Markdown 表格格式
    const lines = tableText.value
      .split("\n")
      .filter((line) => line.trim() && !line.includes("---"))
      .map((line) => line.replace(/^\| | \|$/g, "").split(" | "));

    if (lines.length < 2) return null;

    // 解析表頭
    const headers = lines[0].map((h) => h.toLowerCase());
    let totals = { calories: 0, protein: 0 };

    // 檢查是否有總計/小計行
    const totalRow = lines.find((row, index) => {
      if (index === 0) return false;
      const firstCell = row[0].toLowerCase();
      return (
        firstCell.includes("總計") ||
        firstCell.includes("總合計") ||
        firstCell.includes("小計") ||
        firstCell.includes("total") ||
        firstCell.includes("subtotal")
      );
    });

    // 如果有總計/小計行，直接使用該行的數據
    if (totalRow) {
      const caloriesIndex = headers.findIndex(
        (h) => h.includes("熱量") || h.includes("calories")
      );
      const proteinIndex = headers.findIndex(
        (h) => h.includes("蛋白質") || h.includes("protein")
      );

      if (caloriesIndex !== -1) {
        const calories = parseInt(
          totalRow[caloriesIndex].replace(/[^0-9]/g, "")
        );
        if (!isNaN(calories)) {
          totals.calories = calories;
        }
      }

      if (proteinIndex !== -1) {
        const protein = parseFloat(
          totalRow[proteinIndex].replace(/[^0-9.-]/g, "")
        );
        if (!isNaN(protein)) {
          totals.protein = protein;
        }
      }
    } else {
      // 如果沒有總計行，計算所有行的總和
      let totalCalories = 0;
      let totalProtein = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < 3) continue;

        const calories = parseInt(row[1].replace(/[^0-9]/g, ""));
        const protein = parseFloat(row[2].replace(/[^0-9.-]/g, ""));

        if (!isNaN(calories)) totalCalories += calories;
        if (!isNaN(protein)) totalProtein += protein;
      }

      totals = {
        calories: totalCalories,
        protein: totalProtein,
      };
    }

    // 只要有任一有效數據就返回
    if (totals.calories > 0 || totals.protein > 0) {
      return {
        meals: [], // 不需要返回 meals
        totals,
      };
    }

    return null;
  } catch (error) {
    console.error("解析表格失敗:", error);
    return null;
  }
});

const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      window.showToast("剪貼簿為空", "error");
      return;
    }

    // 檢查是否為 Markdown 表格格式
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 3) {
      window.showToast(
        "剪貼簿內容不是有效的 Markdown 表格格式（至少需要表頭、分隔行和一行數據）",
        "error"
      );
      return;
    }

    const isMarkdownTable = lines.every(
      (line) => line.trim().startsWith("|") && line.trim().endsWith("|")
    );
    if (!isMarkdownTable) {
      window.showToast(
        "剪貼簿內容不是有效的 Markdown 表格格式（每行必須以 | 開始和結束）",
        "error"
      );
      return;
    }

    // 檢查表頭是否包含必要的列
    const headers = lines[0]
      .replace(/^\| | \|$/g, "")
      .split(" | ")
      .map((h) => h.toLowerCase());
    const hasCalories = headers.some(
      (h) => h.includes("熱量") || h.includes("calories")
    );
    const hasProtein = headers.some(
      (h) => h.includes("蛋白質") || h.includes("protein")
    );

    if (!hasCalories && !hasProtein) {
      window.showToast("表格中未找到熱量或蛋白質數據列", "error");
      return;
    }

    // 更新文本並解析
    tableText.value = text;

    // 如果解析失敗，顯示錯誤
    if (!parsedData.value) {
      window.showToast("解析表格數據失敗，請檢查格式是否正確", "error");
      return;
    }

    window.showToast("成功讀取表格數據", "success");
  } catch (error) {
    console.error("Error reading clipboard:", error);
    window.showToast("讀取剪貼簿失敗", "error");
  }
};

const handleImport = () => {
  if (parsedData.value) {
    const { totals } = parsedData.value;

    // 檢查是否有有效的總計數據
    if (!totals.calories && !totals.protein) {
      window.showToast("沒有有效的數據可以匯入", "error");
      return;
    }

    // 發送匯入事件
    emit("import", {
      meals: [], // 不需要傳送 meals
      totals: {
        calories: totals.calories || 0,
        protein: totals.protein || 0,
      },
    });

    // 關閉對話框並清空數據
    dialogVisible.value = false;
    tableText.value = "";

    // 顯示成功訊息
    window.showToast("成功匯入餐點數據", "success");
  } else {
    window.showToast("請先輸入有效的表格數據", "error");
  }
};
</script>

<style scoped>
.import-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: hidden;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.markdown-preview {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
  word-wrap: break-word;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  text-align: left;
}

.markdown-preview :deep(th) {
  background-color: #f1f5f9;
  font-weight: 600;
}

.markdown-preview :deep(tr:nth-child(even)) {
  background-color: #f8fafc;
}

.markdown-preview :deep(tr:hover) {
  background-color: #f1f5f9;
}

.paste-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #e5e7eb;
  color: #666;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.paste-btn:hover {
  background-color: #f0f0f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
}
</style>
