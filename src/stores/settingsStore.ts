import { defineStore } from "pinia";
import { db } from "../services/db";

interface Settings {
  targetWeight: number | null;
  targetProtein: number | null;
  targetCalories: number | null;
}

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    settings: {
      targetWeight: null,
      targetProtein: null,
      targetCalories: null,
    } as Settings,
  }),

  actions: {
    async loadSettings() {
      try {
        const settings = await db.getSettings();
        if (settings) {
          this.settings = settings;
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    },

    async saveSettings(settings: Settings) {
      try {
        await db.saveSettings(settings);
        this.settings = settings;
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },

    calculateProteinPercentage(protein: number): number | null {
      console.log("calculateProteinPercentage", this.settings);
      if (!this.settings.targetProtein) return null;
      return Math.round((protein / this.settings.targetProtein) * 100);
    },

    calculateCaloriesPercentage(calories: number): number | null {
      if (!this.settings.targetCalories) return null;
      return Math.round((calories / this.settings.targetCalories) * 100);
    },
  },
});
