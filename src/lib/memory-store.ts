/**
 * In-Memory Fallback Store
 * Used when MySQL is unavailable.
 */

interface CheckpointRow {
    thread_id: string;
    checkpoint_ns: string;
    checkpoint_id: string;
    checkpoint: string; // JSON
    parent_checkpoint_id?: string;
    metadata?: string; // JSON
    created_at: string; // ISO string
}

interface FeedbackRow {
    id: string;
    thread_id: string;
    score: number;
    comment?: string;
    run_id?: string;
    message_id?: string;
    user_input?: string;
    model_output?: string;
    created_at: string;
}

class InMemoryStore {
    public checkpoints: CheckpointRow[] = [];
    public feedback: FeedbackRow[] = [];

    // Simulate SQL INSERT
    addCheckpoint(row: any) {
        this.checkpoints.push({
            ...row,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
    }

    addFeedback(row: any) {
        this.feedback.push({
            ...row,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
    }

    // Simulate SQL SELECT
    getLatestCheckpoint(threadId: string) {
        return this.checkpoints
            .filter(c => c.thread_id === threadId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    }

    getCheckpoint(threadId: string, checkpointId?: string) {
        if (checkpointId) {
            return this.checkpoints.find(c => c.thread_id === threadId && c.checkpoint_id === checkpointId);
        }
        return this.getLatestCheckpoint(threadId);
    }

    listThreads(limit: number) {
        const threadMap = new Map<string, string>();
        this.checkpoints.forEach(c => {
            if (!threadMap.has(c.thread_id) || c.created_at > threadMap.get(c.thread_id)!) {
                threadMap.set(c.thread_id, c.created_at);
            }
        });

        return Array.from(threadMap.entries())
            .map(([threadId, lastActive]) => ({ threadId, lastActive }))
            .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
            .slice(0, limit);
    }
}

export const memoryStore = new InMemoryStore();
