import {
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    PendingWrite,
    CheckpointTuple,
    SerializerProtocol,
} from "@langchain/langgraph-checkpoint";
import { db } from "../../lib/db";
import { RunnableConfig } from "@langchain/core/runnables";

interface CheckpointRow {
    thread_id: string;
    checkpoint_ns: string;
    checkpoint_id: string;
    parent_checkpoint_id?: string;
    type?: string;
    checkpoint: any;
    metadata: any;
}

export class MySQLSaver extends BaseCheckpointSaver {
    constructor(serde?: SerializerProtocol) {
        super(serde);
    }

    async getTuple(config: any): Promise<CheckpointTuple | undefined> {
        const thread_id = config.configurable?.thread_id;
        const checkpoint_ns = config.configurable?.checkpoint_ns || "";
        const checkpoint_id = config.configurable?.checkpoint_id;

        if (!thread_id) return undefined;

        let sql = `SELECT checkpoint, metadata, parent_checkpoint_id FROM checkpoints WHERE thread_id = ? AND checkpoint_ns = ?`;
        const params: any[] = [thread_id, checkpoint_ns];

        if (checkpoint_id) {
            sql += " AND checkpoint_id = ?";
            params.push(checkpoint_id);
        } else {
            sql += " ORDER BY created_at DESC LIMIT 1";
        }

        const [rows] = await db.query(sql, params) as any;
        if (!rows || rows.length === 0) return undefined;

        const row = rows[0];
        return {
            config,
            checkpoint: typeof row.checkpoint === 'string' ? JSON.parse(row.checkpoint) : row.checkpoint,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
            parentConfig: row.parent_checkpoint_id ? { configurable: { thread_id, checkpoint_ns, checkpoint_id: row.parent_checkpoint_id } } : undefined
        };
    }

    async *list(
        config: RunnableConfig,
        options?: { before?: RunnableConfig; limit?: number }
    ): AsyncGenerator<CheckpointTuple> {
        const thread_id = config.configurable?.thread_id;
        const checkpoint_ns = config.configurable?.checkpoint_ns || "";

        if (!thread_id) return;

        let sql = `
        SELECT thread_id, checkpoint_id, parent_checkpoint_id, checkpoint, metadata
        FROM checkpoints
        WHERE thread_id = ? AND checkpoint_ns = ?
      `;
        const params: any[] = [thread_id, checkpoint_ns];

        if (options?.before?.configurable?.checkpoint_id) {
            sql += " AND created_at < (SELECT created_at FROM checkpoints WHERE thread_id = ? AND checkpoint_id = ?)";
            params.push(thread_id, options.before.configurable.checkpoint_id);
        }

        sql += " ORDER BY created_at DESC";

        if (options?.limit) {
            sql += " LIMIT ?";
            params.push(options.limit);
        }

        const [rows] = await db.query(sql, params) as any;

        for (const row of rows) {
            yield {
                config: {
                    configurable: {
                        thread_id: row.thread_id,
                        checkpoint_ns: row.checkpoint_ns,
                        checkpoint_id: row.checkpoint_id,
                    }
                },
                checkpoint: (typeof row.checkpoint === 'string' ? JSON.parse(row.checkpoint) : row.checkpoint) as Checkpoint,
                metadata: (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) as CheckpointMetadata,
                parentConfig: row.parent_checkpoint_id ? {
                    configurable: {
                        thread_id,
                        checkpoint_ns,
                        checkpoint_id: row.parent_checkpoint_id
                    }
                } : undefined,
            };
        }
    }

    async put(
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        newVersions: Record<string, string | number>
    ): Promise<RunnableConfig> {
        const thread_id = config.configurable?.thread_id;
        const checkpoint_ns = config.configurable?.checkpoint_ns || "";
        const checkpoint_id = checkpoint.id;
        const parent_checkpoint_id = config.configurable?.checkpoint_id; // Current ID becomes parent

        if (!thread_id) throw new Error("Thread ID required for saving checkpoint");

        const query = `
        INSERT INTO checkpoints 
        (thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, checkpoint, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE checkpoint = VALUES(checkpoint), metadata = VALUES(metadata)
      `;

        await db.query(query, [
            thread_id,
            checkpoint_ns,
            checkpoint_id,
            parent_checkpoint_id || null,
            JSON.stringify(checkpoint),
            JSON.stringify(metadata)
        ]);

        return {
            configurable: {
                thread_id,
                checkpoint_ns,
                checkpoint_id,
            },
        };
    }

    async putWrites(
        config: RunnableConfig,
        writes: PendingWrite[],
        taskId: string
    ): Promise<void> {
        // Implementation for putting writes to the usage storage
        // This is required for advanced graph features but successful basic persistence can skip it for now
        // if we aren't using strict stream modes that rely on it immediately.
        // However, base class requires it.

        const thread_id = config.configurable?.thread_id;
        const checkpoint_ns = config.configurable?.checkpoint_ns || "";
        const checkpoint_id = config.configurable?.checkpoint_id;

        if (!thread_id || !checkpoint_id) return; // Can't write without context

        for (const [idx, write] of writes.entries()) {
            // simplified write storage
            await db.query(`
                INSERT INTO checkpoint_writes
                (thread_id, checkpoint_ns, checkpoint_id, task_id, idx, channel, type, value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             `, [
                thread_id,
                checkpoint_ns,
                checkpoint_id,
                taskId,
                idx,
                write[0], // channel
                'json', // simplified type
                JSON.stringify(write[1]) // saving value as blob/string
            ]);
        }
    }

    async deleteThread(
        thread_id: string
    ): Promise<void> {
        if (!thread_id) return;

        await db.query("DELETE FROM checkpoints WHERE thread_id = ?", [thread_id]);
        await db.query("DELETE FROM checkpoint_writes WHERE thread_id = ?", [thread_id]);
    }
}
