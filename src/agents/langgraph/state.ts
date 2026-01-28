import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { ParsedIntent } from "../sub-agents";
import { QueryPlan } from "../sub-agents";
import { ValidationResult } from "../sub-agents";
import { ResponseGeneratorResult } from "../sub-agents";

/**
 * Global State for the Knowledge Ownership Agent
 */
export const AgentState = Annotation.Root({
    /**
     * Conversation history
     */
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
    }),

    /**
     * Selected Repository ID (context)
     */
    repoId: Annotation<string | undefined>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Parsed User Intent
     */
    // Agent Logic State
    intent: Annotation<ParsedIntent>({
        reducer: (current, next) => next ?? current, // Keeps current if next is undefined/null? No, let's keep this but Orchestrator will send a value.
        default: () => ({ type: 'ambiguous', confidence: 0, entities: {} }),
    }),
    queryPlan: Annotation<QueryPlan | null>({
        reducer: (current, next) => next === null ? null : (next ?? current),
        default: () => null,
    }),
    toolResults: Annotation<Record<string, unknown>>({
        reducer: (current, next) => {
            if (next === null) return {};
            return { ...current, ...next };
        },
        default: () => ({}),
    }),

    // Agentic Loop State
    iterations: Annotation<number>({
        reducer: (current, next) => next ?? current,
        default: () => 0,
    }),
    reflection: Annotation<string>({
        reducer: (current, next) => next ?? current,
        default: () => "",
    }),

    // Ambient Context State
    clientContext: Annotation<{ activeFile?: string | null }>({
        reducer: (current, next) => next ?? current,
        default: () => ({ activeFile: null }),
    }),
    /**
     * Validation results
     */
    validation: Annotation<ValidationResult | undefined>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Final generated response
     */
    finalResponse: Annotation<ResponseGeneratorResult | undefined>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Guardrail Check Result
     */
    guardrail: Annotation<{ allowed: boolean; reason?: string } | undefined>({
        reducer: (x, y) => y ?? x,
    }),
});
