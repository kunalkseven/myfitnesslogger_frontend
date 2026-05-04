import { SyncQueueRepository, SyncOperation } from '../database/repositories/SyncQueueRepository';
import { SQLiteDatabase } from 'expo-sqlite';
import { PlanRepository } from '../database/repositories/PlanRepository';
import { WorkoutRepository } from '../database/repositories/WorkoutRepository';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export class SyncService {
  private repo: SyncQueueRepository;

  constructor(db: SQLiteDatabase) {
    this.repo = new SyncQueueRepository(db);
  }

  /**
   * Sync the local queue with the remote backend
   */
  async sync(clerkToken: string | null) {
    if (!clerkToken) {
      console.log('Sync skipped: No auth token');
      return;
    }

    const pendingOps = await this.repo.getPending();
    if (pendingOps.length === 0) return;

    try {
      // Mark all as syncing
      for (const op of pendingOps) {
        if (op.id) await this.repo.updateStatus(op.id, 'syncing');
      }

      const response = await fetch(`${API_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`
        },
        body: JSON.stringify({ queue: pendingOps })
      });

      if (response.ok) {
        // Success: Remove from local queue
        for (const op of pendingOps) {
          if (op.id) await this.repo.remove(op.id);
        }
        console.log(`Sync completed: Processed ${pendingOps.length} items`);
      } else {
        // Error: Revert status to pending
        for (const op of pendingOps) {
          if (op.id) await this.repo.updateStatus(op.id, 'pending');
        }
        console.error('Sync failed:', await response.text());
      }
    } catch (error) {
      // Network error or other: Revert status
      for (const op of pendingOps) {
        if (op.id) await this.repo.updateStatus(op.id, 'pending');
      }
      console.error('Sync network error:', error);
    }
  }

  async pull(clerkToken: string | null) {
    if (!clerkToken) return;

    try {
      const response = await fetch(`${API_URL}/api/sync/pull`, {
        headers: {
          'Authorization': `Bearer ${clerkToken}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        
        // Ensure repos are initialized
        const planRepo = new PlanRepository(this.repo['db']); // Accessing private db from SyncQueueRepository or passing it in constructor
        const workoutRepo = new WorkoutRepository(this.repo['db']);

        if (data.plans && data.plans.length > 0) {
          for (const plan of data.plans) {
             await planRepo.upsertPlanFull(plan);
          }
        }

        if (data.sessions && data.sessions.length > 0) {
          for (const session of data.sessions) {
             await workoutRepo.upsertSessionFull(session);
          }
        }

        console.log(`Pull successful: ${data.plans?.length || 0} plans, ${data.sessions?.length || 0} sessions merged.`);
      }
    } catch (error) {
      console.error('Pull sync error:', error);
    }
  }
}
