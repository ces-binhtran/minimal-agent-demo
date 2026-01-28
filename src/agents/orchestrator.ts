import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from 'uuid';
import { graph } from './langgraph/graph';
import {
    ParsedIntent,
    QueryPlan,
    ValidationResult,
    ResponseGeneratorResult
} from './sub-agents';
import { db } from '../lib/db';

/**
 * Orchestration Pipeline Result
 */
export interface OrchestrationResult {
    userQuery: string;
    parsedIntent: ParsedIntent;
    queryPlan: QueryPlan;
    toolResults: Record<string, unknown>;
    validation: ValidationResult;
    finalResponse: ResponseGeneratorResult;
    executionMetadata: {
        totalTime: number;
        stagesCompleted: string[];
        threadId: string;
    };
}

export class AgentOrchestrator {

    async chat(userQuery: string, context?: { repoId?: string | null, threadId?: string, clientContext?: { activeFile?: string | null } }): Promise<OrchestrationResult> {
        const startTime = Date.now();
        const threadId = context?.threadId || uuidv4();
        const config = { configurable: { thread_id: threadId } };

        console.log(`[Orchestrator] Starting graph execution (Thread: ${threadId})`);

        const input = {
            messages: [new HumanMessage(userQuery)],
            repoId: context?.repoId || undefined,
            clientContext: context?.clientContext || undefined
        };

        let currentState = await graph.invoke(input, config);

        // Mock Human-in-the-loop support (Simplified)
        const snapshot = await graph.getState(config);
        if (snapshot.next.includes("tool_executor")) {
            console.log("[Orchestrator] Auto-approving tools...");
            currentState = await graph.invoke(null, config);
        }

        const executionTime = Date.now() - startTime;

        if (!currentState.intent || !currentState.finalResponse) {
            console.warn("[Orchestrator] Incomplete state:", currentState);
            // Allow partial state to flow through, or create a minimal error response based on what we have
            if (!currentState.finalResponse) {
                return {
                    userQuery,
                    parsedIntent: currentState.intent || { type: 'ambiguous', confidence: 0, entities: {} },
                    queryPlan: currentState.queryPlan || { steps: [], toolCalls: [] },
                    toolResults: currentState.toolResults || {},
                    validation: currentState.validation || { valid: false, issues: ["Incomplete execution"], sanitizedData: {} },
                    finalResponse: { answer: "I stopped processing early. Please check the logs.", keyMetrics: {} },
                    executionMetadata: { totalTime: executionTime, stagesCompleted: [], threadId }
                }
            }
        }

        return {
            userQuery,
            parsedIntent: currentState.intent || { type: 'ambiguous', confidence: 0, entities: {} },
            queryPlan: currentState.queryPlan || { steps: [], toolCalls: [] },
            toolResults: currentState.toolResults || {},
            validation: currentState.validation || { valid: true, issues: [], sanitizedData: {} },
            finalResponse: currentState.finalResponse,
            executionMetadata: {
                totalTime: executionTime,
                stagesCompleted: Object.keys(currentState),
                threadId,
            },
        };
    }

    async submitFeedback(
        threadId: string,
        score: number,
        comment?: string,
        context?: { runId?: string, messageId?: string, input?: string, output?: string }
    ): Promise<void> {
        const feedbackId = uuidv4();
        // Using simple query
        await db.query(
            `INSERT INTO feedback 
       (id, thread_id, score, comment, run_id, message_id, user_input, model_output) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                feedbackId,
                threadId,
                score,
                comment || null,
                context?.runId || null,
                context?.messageId || null,
                context?.input || null,
                context?.output || null
            ]
        );
        console.log(`[Orchestrator] Feedback submitted for thread ${threadId}`);
    }

    async listThreads(limit = 20): Promise<{ threadId: string, lastActive: Date }[]> {
        const sql = `
        SELECT DISTINCT thread_id, MAX(created_at) as last_active 
        FROM checkpoints 
        GROUP BY thread_id 
        ORDER BY last_active DESC 
        LIMIT ?
     `;
        const [rows] = await db.query(sql, [limit]) as any;
        return rows.map((r: any) => ({
            threadId: r.thread_id,
            lastActive: new Date(r.last_active)
        }));
    }

    async getThreadHistory(threadId: string): Promise<any[]> {
        const sql = `SELECT checkpoint FROM checkpoints WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1`;
        const [rows] = await db.query(sql, [threadId]) as any;
        if (!rows || rows.length === 0) return [];

        const row = rows[0];
        const checkpoint = typeof row.checkpoint === 'string' ? JSON.parse(row.checkpoint) : row.checkpoint;
        const messages = checkpoint?.channel_values?.messages || [];

        return messages.map((m: any) => {
            const isUser = m.id?.includes('HumanMessage') || m.lc === 1 && m.id?.includes('HumanMessage') || m.type === 'human';
            return {
                id: m.id || uuidv4(),
                role: isUser ? 'user' : 'assistant',
                content: m.kwargs?.content || m.content || '',
                timestamp: Date.now(),
                threadId
            };
        });
    }
}

export const rootAgent = new AgentOrchestrator();
