import { WeightRecord, WeightStats } from "../types/weight";

const DB_NAME = "weight-tracker-db";
const DB_VERSION = 2;
const RECORDS_STORE = "weight-records";
const SETTINGS_STORE = "settings";

interface Settings {
  targetWeight: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
}

class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        if (oldVersion < 1) {
          const store = db.createObjectStore(RECORDS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("date", "date", { unique: false });
        }

        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
          }
        }
      };
    });
  }

  async addRecord(record: Omit<WeightRecord, "id">): Promise<WeightRecord> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([RECORDS_STORE], "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.add(record);

      request.onsuccess = (event) => {
        const id = (event.target as IDBRequest).result;
        resolve({ ...record, id });
      };

      request.onerror = () => {
        reject(new Error("Failed to add record"));
      };
    });
  }

  async getAllRecords(): Promise<WeightRecord[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([RECORDS_STORE], "readonly");
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get records"));
      };
    });
  }

  async updateRecord(record: WeightRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([RECORDS_STORE], "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to update record"));
      };
    });
  }

  async deleteRecord(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([RECORDS_STORE], "readwrite");
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete record"));
      };
    });
  }

  async getStats(): Promise<WeightStats> {
    const records = await this.getAllRecords();
    if (records.length === 0) {
      return {
        currentWeight: 0,
        startWeight: 0,
        lowestWeight: 0,
        highestWeight: 0,
        totalChange: 0,
        averageWeight: 0,
      };
    }

    const weights = records.map((r) => r.weight);
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      currentWeight: weights[weights.length - 1],
      startWeight: weights[0],
      lowestWeight: Math.min(...weights),
      highestWeight: Math.max(...weights),
      totalChange: weights[weights.length - 1] - weights[0],
      averageWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([SETTINGS_STORE], "readwrite");
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ id: "user-settings", ...settings });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to save settings"));
      };
    });
  }

  async getSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([SETTINGS_STORE], "readonly");
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get("user-settings");

      request.onsuccess = () => {
        resolve(
          request.result || {
            targetWeight: null,
            targetCalories: null,
            targetProtein: null,
          }
        );
      };

      request.onerror = () => {
        reject(new Error("Failed to get settings"));
      };
    });
  }

  async getAllFromIndex(
    indexName: string,
    key: IDBValidKey,
    value: IDBValue
  ): Promise<WeightRecord[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([RECORDS_STORE], "readonly");
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.index(indexName).getAll(value);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to get records from index"));
      };
    });
  }
}

export const db = new DatabaseService();

export const getTodayRecord = async () => {
  const database = await db.init();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await database.getAllFromIndex("date", today);
  return records[0] || null;
};
