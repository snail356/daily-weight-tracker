<template>
  <div v-if="modelValue" class="dialog-overlay">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3 class="text-lg font-medium">匯入餐點資料</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="dialog-body">
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
      </div>

      <div class="dialog-footer">
        <button @click="close" class="btn btn-secondary mr-2">取消</button>
        <button
          @click="handleImport"
          class="btn btn-primary"
          :disabled="!parsedData"
        >
          匯入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { marked } from "marked";

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

const tableText = ref("");

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

    // 解析表頭
    const headers = lines[0].map((h) => h.toLowerCase());
    const data = [];
    let totals = { calories: 0, protein: 0 };
    let hasTotals = false;

    // 檢查是否有總計/小計行
    const totalRow = lines.find((row, index) => {
      if (index === 0) return false; // 跳過表頭
      const firstCell = row[0].toLowerCase();
      return (
        firstCell.includes("總計") ||
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
          hasTotals = true;
        }
      }

      if (proteinIndex !== -1) {
        const protein = parseFloat(
          totalRow[proteinIndex].replace(/[^0-9.-]/g, "")
        );
        if (!isNaN(protein)) {
          totals.protein = protein;
          hasTotals = true;
        }
      }
    }

    // 如果沒有找到總計/小計行，則計算所有行的總和
    if (!hasTotals) {
      // 解析數據行
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const firstCell = row[0].toLowerCase();
        if (
          firstCell.includes("總計") ||
          firstCell.includes("小計") ||
          firstCell.includes("total") ||
          firstCell.includes("subtotal")
        )
          continue;

        const meal = {
          name: row[0].trim(),
          calories: parseInt(row[1].replace(/[^0-9]/g, "")),
          protein: parseFloat(row[2].replace(/[^0-9.-]/g, "")),
        };
        data.push(meal);
      }

      // 計算總和
      totals = data.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
        }),
        { calories: 0, protein: 0 }
      );
    }

    return {
      meals: data,
      totals,
    };
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

const close = () => {
  emit("update:modelValue", false);
  tableText.value = "";
};

const handleImport = () => {
  if (parsedData.value) {
    emit("import", parsedData.value);
    close();
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-body {
  padding: 1rem;
  overflow-y: auto;
}

.dialog-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.close-btn {
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem;
  color: #6b7280;
}

.close-btn:hover {
  color: #374151;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
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
  background-color: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
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

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.gap-4 {
  gap: 1rem;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
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
