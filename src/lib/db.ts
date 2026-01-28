import mysql from 'mysql2/promise';
import { memoryStore } from './memory-store';
import { env } from '../config/env';
import { createScopedLogger } from './logger';

const logger = createScopedLogger('Database');

const pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

let isMySQLDown = false;

// Mock Query logic
function mockQuery(sql: string, params: any[]) {
    // LIST THREADS
    if (sql.includes('SELECT DISTINCT thread_id')) {
        const rows = memoryStore.listThreads(params[0] || 20).map(t => ({
            thread_id: t.threadId,
            last_active: t.lastActive
        }));
        return [rows, []];
    }

    // GET HISTORY / CHECKPOINT
    if (sql.includes('FROM checkpoints') && sql.includes('SELECT') && !sql.includes('DISTINCT')) {
        const threadId = params[0];
        // Check if getting specific checkpoint (params: [thread_id, ns, checkpoint_id?])
        const checkpointId = params.length >= 3 ? params[2] : undefined;
        const row = memoryStore.getCheckpoint(threadId, checkpointId);
        return [row ? [row] : [], []];
    }

    // SAVE CHECKPOINT
    if (sql.includes('INSERT INTO checkpoints')) {
        // VALUES (?, ?, ?, ?, ?, ?)
        memoryStore.addCheckpoint({
            thread_id: params[0],
            checkpoint_ns: params[1],
            checkpoint_id: params[2],
            parent_checkpoint_id: params[3],
            checkpoint: params[4],
            metadata: params[5]
        });
        return [{ insertId: 1 }, []];
    }

    // INSERT FEEDBACK
    if (sql.includes('INSERT INTO feedback')) {
        memoryStore.addFeedback({
            id: params[0],
            thread_id: params[1],
            score: params[2],
            comment: params[3],
            run_id: params[4],
            message_id: params[5],
            user_input: params[6],
            model_output: params[7]
        });
        return [{ insertId: 1 }, []];
    }

    // ANALYSIS RESULTS (Mock for cache fallback)
    if (sql.includes('ces_analysis_results')) {
        return [[], []];
    }

    // COMMITS / FILES (Mock for analysis)
    if (sql.includes('FROM commits') || sql.includes('FROM commit_files')) {
        return [[], []];
    }

    return [[], []];
}

const queryFn = async (sql: string, params: any[] = []) => {
    if (isMySQLDown) {
        if (env.STRICT_DB_MODE) {
            throw new Error("Database is down and STRICT_DB_MODE is enabled.");
        }
        return mockQuery(sql, params);
    }

    try {
        return await pool.query(sql, params);
    } catch (e: any) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT') {
            logger.warn({ err: e }, 'MySQL Connection Failed.');

            if (env.STRICT_DB_MODE) {
                throw e; // Fail hard
            }

            if (!isMySQLDown) {
                logger.warn('Switching to In-Memory Persistence for Demo Session.');
                isMySQLDown = true;
            }
            return mockQuery(sql, params);
        }
        logger.error({ err: e, sql }, 'Database Query Error');
        throw e;
    }
};

export const db = {
    query: queryFn,
    execute: queryFn
};

export default db;
