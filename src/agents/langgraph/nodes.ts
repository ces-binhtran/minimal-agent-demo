import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./state";
import { generateJSON } from "../../lib/gemini";
import {
    ParsedIntent,
    QueryPlan,
    ResponseGeneratorResult
} from "../sub-agents";
import { moduleOwnershipTool, busFactorTool, riskModulesTool, modulesListTool } from "../tools/ownership-tools";
import { createScopedLogger } from "../../lib/logger";
import { promptManager } from "../../lib/prompt-manager";

const logger = createScopedLogger('AgentNodes');

const TOOLS: Record<string, any> = {
    'get_module_ownership': moduleOwnershipTool,
    'get_bus_factor': busFactorTool,
    'get_risk_modules': riskModulesTool,
    'get_modules_list': modulesListTool,
};

const TOOL_DESCRIPTIONS = Object.entries(TOOLS)
    .map(([name, tool]) => {
        let params = "";
        if (name === 'get_modules_list') params = " (Required: repoId)";
        else if (name === 'get_module_ownership') params = " (Required: repoId. Optional: moduleName, filePath)";
        else if (name === 'get_bus_factor') params = " (Required: repoId. Optional: module)";
        else if (name === 'get_risk_modules') params = " (Required: repoId)";
        return `${name}: ${tool.description}${params}`;
    })
    .join('\n');

function getLastHumanMessageContent(messages: any[]): string {
    const userMessage = [...messages].reverse().find(m => {
        if (typeof m.getType === 'function') return m.getType() === 'human';
        if (m.type === 'human' || m.type === 'user') return true;
        // Check constructor name safely if it exists
        if (m.constructor && m.constructor.name === 'HumanMessage') return true;
        return false;
    });
    return userMessage ? (userMessage.content as string) : '';
}

// getFormattedHistory removed

/**
 * Node: Orchestrator
 * Defines the role and persona for the agent session.
 */
export async function orchestratorNode(state: typeof AgentState.State) {
    logger.info('[Orchestrator] Initializing session context');

    // Check if system message already exists to avoid duplication
    const hasSystemMessage = state.messages.some(m => {
        if (typeof m.getType === 'function') return m.getType() === 'system';
        if ('type' in m) return (m as any).type === 'system';
        return (m as any).constructor?.name === 'SystemMessage';
    });
    if (hasSystemMessage) {
        return {};
    }

    const systemPrompt = promptManager.load('orchestrator');
    const systemMessage = new SystemMessage(systemPrompt);

    return {
        messages: [systemMessage],
        // Reset execution state for new turn
        queryPlan: null,
        toolResults: null,
        intent: { type: 'ambiguous', confidence: 0, entities: {} },
        iterations: 0,
        reflection: "",
        validation: undefined,
        guardrail: undefined
    };
}

/**
 * Node: Guardrail
 * Filters out irrelevant or unsafe queries.
 */
export async function guardrailNode(state: typeof AgentState.State) {
    const userQuery = getLastHumanMessageContent(state.messages);

    if (!userQuery) {
        logger.warn('[Guardrail] No human message found to validate');
        return { guardrail: { allowed: true } };
    }

    logger.info({ userQuery }, '[Guardrail] Checking query');

    const promptTemplate = promptManager.load('guardrail', { userQuery });
    const messages = [
        new SystemMessage(promptTemplate),
        ...state.messages.filter(m => {
            const type = typeof m.getType === 'function' ? m.getType() : m.type;
            if (type === 'system') return false;
            if (m.id && Array.isArray(m.id) && m.id.includes('SystemMessage')) return false;
            return true;
        })
    ];

    try {
        const result = await generateJSON<{ allowed: boolean; reason: string; suggestedResponse?: string }>(messages);
        logger.info({ allowed: result.allowed, reason: result.reason }, '[Guardrail] Result');

        if (!result.allowed) {
            return {
                guardrail: { allowed: false, reason: result.reason },
                messages: [new AIMessage(result.suggestedResponse || "I can only assist with questions about your codebase, knowledge ownership, and software risk.")],
                finalResponse: {
                    answer: result.suggestedResponse || "I can only assist with questions about your codebase, knowledge ownership, and software risk.",
                    keyMetrics: {}
                }
            };
        }

        return { guardrail: { allowed: true } };

    } catch (e) {
        logger.error({ err: e }, 'Guardrail Error');
        return { guardrail: { allowed: true, reason: "Guardrail error, failing open" } };
    }
}

/**
 * Node: Intent Parser
 */
export async function intentParserNode(state: typeof AgentState.State) {
    const userQuery = getLastHumanMessageContent(state.messages);
    logger.info({ userQuery }, '[IntentParser] Analyzing');

    const promptTemplate = promptManager.load('intent_parser', { userQuery });
    const messages = [
        new SystemMessage(promptTemplate),
        ...state.messages.filter(m => {
            const type = typeof m.getType === 'function' ? m.getType() : m.type;
            if (type === 'system') return false;
            if (m.id && Array.isArray(m.id) && m.id.includes('SystemMessage')) return false;
            return true;
        })
    ];

    try {
        const parsedIntent = await generateJSON<ParsedIntent>(messages);
        logger.info({ intent: parsedIntent.type }, '[IntentParser] Intent parsed');

        // Context Injection: If repo is mentioned, update the state
        const repoEntity = parsedIntent.entities?.repo;
        const updates: any = { intent: parsedIntent };
        if (repoEntity) {
            updates.repoId = repoEntity;
            logger.info({ repoId: repoEntity }, '[IntentParser] Updated Repo ID');
        }

        return updates;
    } catch (e) {
        logger.error({ err: e }, "Intent Parser Error");
        return { intent: { type: 'ambiguous', confidence: 0, entities: {} } };
    }
}

/**
 * Node: Query Planner
 */
export async function queryPlannerNode(state: typeof AgentState.State) {
    const userQuery = getLastHumanMessageContent(state.messages);
    // History is implicitly passed via state.messages

    const intent = state.intent;
    const feedback = state.reflection || "None";
    const activeFile = state.clientContext?.activeFile || "None";

    const promptTemplate = promptManager.load('query_planner', {
        userQuery,
        repoId: state.repoId || 'Unknown',
        intent: JSON.stringify(intent),
        feedback,
        activeFile,
        toolDescriptions: TOOL_DESCRIPTIONS
    });

    const messages = [
        new SystemMessage(promptTemplate),
        ...state.messages.filter(m => {
            const type = typeof m.getType === 'function' ? m.getType() : m.type;
            if (type === 'system') return false;
            if (m.id && Array.isArray(m.id) && m.id.includes('SystemMessage')) return false;
            return true;
        })
    ];

    logger.info('[QueryPlanner] Planning...');
    try {
        const plan = await generateJSON<QueryPlan>(messages);
        return {
            queryPlan: plan,
            // Reset tool results when replanning to avoid stagnation, 
            // but in this architecture we merge them. The planner should request new tools.
            // But we must increment iterations to avoid infinite loops, typically done in the Reflector or here? 
            // Let's do it in Reflector or a dedicated node. Annotations reduce state, so we update here?
            // Actually, we increment invalidation/reflection node.
        };
    } catch (e) {
        logger.error({ err: e }, "Query Planner Error");
        return { queryPlan: { steps: [], toolCalls: [] } };
    }
}

/**
 * Node: Tool Executor
 */
export async function toolExecutorNode(state: typeof AgentState.State) {
    const plan = state.queryPlan;
    if (!plan) return { toolResults: {} };

    const results: Record<string, unknown> = {};

    for (const toolCall of plan.toolCalls) {
        try {
            const tool = TOOLS[toolCall.tool];
            if (!tool) {
                results[toolCall.tool] = { status: 'error', message: 'Tool not found' };
                continue;
            }

            logger.info({ tool: toolCall.tool }, `[ToolExecutor] Executing...`);
            const result = await tool.execute(toolCall.params);
            results[toolCall.tool] = result;
        } catch (err) {
            logger.error({ err, tool: toolCall.tool }, `[ToolExecutor] Error`);
            results[toolCall.tool] = { status: 'error', message: String(err) };
        }
    }

    return { toolResults: results };
}

/**
 * Node: Reflector (replaces Validator in cyclic graph)
 */
export async function reflectorNode(state: typeof AgentState.State) {
    const userQuery = getLastHumanMessageContent(state.messages);
    const iterations = state.iterations || 0;
    const toolResults = state.toolResults;

    logger.info({ iterations }, '[Reflector] Analyzing progress...');

    // Hard Stop
    if (iterations >= 3) {
        logger.warn('[Reflector] Max iterations reached. Forcing response.');
        return { reflection: "Max iterations limit reached." };
    }

    const promptTemplate = promptManager.load('reflector', {
        userQuery,
        iterations,
        toolResults: JSON.stringify(toolResults, null, 2)
    });

    const messages = [
        new SystemMessage(promptTemplate),
        ...state.messages.filter(m => {
            const type = typeof m.getType === 'function' ? m.getType() : m.type;
            if (type === 'system') return false;
            if (m.id && Array.isArray(m.id) && m.id.includes('SystemMessage')) return false;
            return true;
        })
    ];

    try {
        const result = await generateJSON<{ route: 'plan' | 'respond'; feedback: string }>(messages);
        logger.info({ route: result.route, feedback: result.feedback }, '[Reflector] Decision');

        if (result.route === 'plan') {
            return {
                reflection: result.feedback,
                iterations: iterations + 1
            };
        }

        // If respond, we don't need to change state much, just pass through
        return { reflection: "Sufficient data gathered." };

    } catch (e) {
        logger.error({ err: e }, "Reflector Logic Error");
        return { reflection: "Error in reflection, proceeding to response." };
    }
}

/**
 * Node: Response Generator
 */
export async function responseGeneratorNode(state: typeof AgentState.State) {
    const userQuery = getLastHumanMessageContent(state.messages);
    const toolResults = state.toolResults;
    const intent = state.intent;

    const promptTemplate = promptManager.load('response_generator', {
        userQuery,
        intent: JSON.stringify(intent),
        toolResults: JSON.stringify(toolResults, null, 2),
        queryPlan: JSON.stringify(state.queryPlan)
    });

    const messages = [
        new SystemMessage(promptTemplate),
        ...state.messages.filter(m => {
            const type = typeof m.getType === 'function' ? m.getType() : m.type;
            if (type === 'system') return false;
            if (m.id && Array.isArray(m.id) && m.id.includes('SystemMessage')) return false;
            return true;
        })
    ];

    logger.info('[ResponseGenerator] Generating response...');
    try {
        const result = await generateJSON<ResponseGeneratorResult>(messages);
        return {
            finalResponse: result,
            messages: [new AIMessage(result.answer)]
        };
    } catch (e) {
        logger.error({ err: e }, "Response Generator Error");

        // Robust Fallback
        if (toolResults && Object.keys(toolResults).length > 0) {
            let fallbackAnswer = "I couldn't generate a full analysis due to high service load, but here is the data I found:\n\n";
            for (const [tool, result] of Object.entries(toolResults)) {
                const data = (result as any).data;
                if (data) {
                    if (tool === 'get_module_ownership') {
                        fallbackAnswer += `**Module**: ${data.module}\n**Owner**: ${data.owner}\n**Maintainers**: ${data.maintainers?.join(', ') || 'None'}\n\n`;
                    } else if (tool === 'get_bus_factor') {
                        fallbackAnswer += `**Bus Factor**: ${data.busFactor} (${data.riskLevel})\n**Authors**: ${data.authors?.join(', ')}\n\n`;
                    } else {
                        fallbackAnswer += `**${tool}**: ${JSON.stringify(data)}\n\n`;
                    }
                }
            }
            return {
                finalResponse: { answer: fallbackAnswer, keyMetrics: {} },
                messages: [new AIMessage(fallbackAnswer)]
            };
        }

        const errorMsg = `I encountered an error generating the response: ${(e as Error).message}`;
        return {
            finalResponse: { answer: errorMsg, keyMetrics: {} },
            messages: [new AIMessage(errorMsg)]
        };
    }
}
