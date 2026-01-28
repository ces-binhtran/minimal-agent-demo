/**
 * Chat component types
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
    confidence?: 'High' | 'Medium' | 'Low' | 'Unknown';
    keyMetrics?: Record<string, unknown>;
    sources?: ChatSource[];
    agentTrace?: AgentTrace;
    timestamp: number;
    threadId?: string;
}

export interface ChatSource {
    tool: string;
    data: Record<string, unknown>;
}

export interface ParsedIntent {
    type: string;
    confidence: number;
    entities: Record<string, string | null>;
}

export interface QueryPlan {
    steps: string[];
    toolCalls: { tool: string; params: unknown }[];
}

export interface TraceMetadata {
    totalTime?: number;
    threadId?: string;
    [key: string]: unknown;
}

export interface AgentTrace {
    intent: ParsedIntent;
    plan: QueryPlan;
    validation?: Record<string, unknown>;
    executionMetadata: TraceMetadata;
}

export interface ChatResponse {
    answer: string;
    keyMetrics?: Record<string, unknown>;
    sources?: ChatSource[];
    agentTrace?: AgentTrace;
    error?: string;
}

export interface ChatContextType {
    messages: ChatMessage[];
    isLoading: boolean;
    error?: string;
    sendMessage: (question: string) => Promise<void>;
    clearMessages: () => void;
}
