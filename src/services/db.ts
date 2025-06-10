import { WeightRecord, WeightStats } from "../types/weight";

const DB_NAME = "weight-tracker-db";
const DB_VERSION = 1;
const STORE_NAME = "weight-records";

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("date", "date", { unique: false });
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

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
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

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
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

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
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

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
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
}

export const db = new DatabaseService();
