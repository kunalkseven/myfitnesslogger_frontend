import { SQLiteDatabase } from 'expo-sqlite';

export interface SyncOperation {
  id?: number;
  entity_type: 'session' | 'plan' | 'set' | 'user';
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string
  status: 'pending' | 'syncing' | 'failed';
  created_at?: string;
}

export class SyncQueueRepository {
  constructor(private db: SQLiteDatabase) {}

  async enqueue(op: Omit<SyncOperation, 'id' | 'status' | 'created_at'>) {
    await this.db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [op.entity_type, op.entity_id, op.operation, op.payload]
    );
  }

  async getPending(): Promise<SyncOperation[]> {
    return await this.db.getAllAsync<SyncOperation>(
      "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY id ASC"
    );
  }

  async updateStatus(id: number, status: 'pending' | 'syncing' | 'failed') {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = ? WHERE id = ?",
      [status, id]
    );
  }

  async remove(id: number) {
    await this.db.runAsync("DELETE FROM sync_queue WHERE id = ?", [id]);
  }

  async clear() {
    await this.db.runAsync("DELETE FROM sync_queue");
  }
}
