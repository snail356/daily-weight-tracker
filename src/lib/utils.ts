/**
 * 防抖函數
 * @param func 要執行的函數
 * @param wait 等待時間（毫秒）
 * @returns 防抖處理後的函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * 節流函數
 * @param func 要執行的函數
 * @param wait 等待時間（毫秒）
 * @returns 節流處理後的函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      func(...args);
      lastCall = now;
    }
  };
}

/**
 * 格式化日期
 * @param date 日期對象或日期字符串
 * @param format 格式化模板，默認為 'YYYY-MM-DD'
 * @returns 格式化後的日期字符串
 */
export function formatDate(
  date: Date | string,
  format: string = "YYYY-MM-DD"
): string {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * 深拷貝對象
 * @param obj 要拷貝的對象
 * @returns 拷貝後的新對象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const copy = {} as T;
    Object.keys(obj).forEach((key) => {
      copy[key as keyof T] = deepClone(obj[key as keyof T]);
    });
    return copy;
  }

  return obj;
}

/**
 * 延遲執行
 * @param ms 延遲時間（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成指定範圍的隨機數
 * @param min 最小值
 * @param max 最大值
 * @returns 隨機數
 */
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 檢查是否為空值
 * @param value 要檢查的值
 * @returns 是否為空值
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
