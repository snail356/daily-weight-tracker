export interface WeightRecord {
  id?: number;
  weight: number;
  protein?: number; // 蛋白質 (g)
  calories?: number; // 熱量 (kcal)
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeightStats {
  currentWeight: number;
  startWeight: number;
  lowestWeight: number;
  highestWeight: number;
  totalChange: number;
  averageWeight: number;
  averageProtein?: number; // 平均蛋白質攝取
  averageCalories?: number; // 平均熱量攝取
}
