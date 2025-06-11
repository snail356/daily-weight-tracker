import { defineStore } from "pinia";
import { reactive } from "vue";
import { db } from "../services/db";

interface TodayRecordState {
  todayRecord: {
    id?: number;
    weight: number;
    protein: number;
    calories: number;
    date: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  lastLoadDate: string;
  isEditing: boolean;
}

export const useTodayRecordStore = defineStore("todayRecord", () => {
  const state = reactive<TodayRecordState>({
    todayRecord: null,
    lastLoadDate: "",
    isEditing: false,
  });

  const isToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return state.lastLoadDate === today;
  };

  const loadTodayRecord = async () => {
    if (isToday() && state.todayRecord !== null) {
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await db.getAllRecords();
    const todayRecords = records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= today && recordDate < tomorrow;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newRecord = todayRecords[0] || null;
    updateTodayRecord(newRecord);
  };

  const updateTodayRecord = (record: any) => {
    state.todayRecord = record;
    state.lastLoadDate = new Date().toISOString().split("T")[0];
  };

  const setEditing = (value: boolean) => {
    state.isEditing = value;
  };

  return {
    state,
    loadTodayRecord,
    updateTodayRecord,
    setEditing,
  };
});
