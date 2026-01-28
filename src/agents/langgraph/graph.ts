import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import {
    intentParserNode,
    queryPlannerNode,
    toolExecutorNode,
    responseGeneratorNode,
    guardrailNode,
    orchestratorNode,
    reflectorNode
} from "./nodes";

/**
 * Conditional edge to check if we need to execute tools
 */
function shouldExecuteTools(state: typeof AgentState.State) {
    const plan = state.queryPlan;
    if (!plan || plan.toolCalls.length === 0) {
        return "response_generator";
    }
    return "tool_executor";
}

// Define the graph
const workflow = new StateGraph(AgentState)
    .addNode("orchestrator", orchestratorNode)
    .addNode("guardrail_node", guardrailNode)
    .addNode("intent_parser", intentParserNode)
    .addNode("query_planner", queryPlannerNode)
    .addNode("tool_executor", toolExecutorNode)
    .addNode("reflector_node", reflectorNode)
    .addNode("response_generator", responseGeneratorNode)

    // Define edges
    .addEdge(START, "orchestrator")
    .addEdge("orchestrator", "guardrail_node")
    .addConditionalEdges(
        "guardrail_node",
        (state) => state.guardrail?.allowed ? "intent_parser" : END
    )
    .addConditionalEdges(
        "intent_parser",
        (state) => {
            const intent = state.intent?.type;
            const entities = state.intent?.entities || {};

            // Slot Validation Logic
            if (intent === 'module_ownership') {
                const hasContext = !!state.clientContext?.activeFile;
                if (!entities.module && !entities.file && !hasContext) {
                    return "response_generator"; // Missing required slots -> Ask for clarification
                }
            }
            if (intent === 'departure_impact') {
                if (!entities.developer) {
                    return "response_generator";
                }
            }

            if (intent === 'ambiguous' || intent === 'explanation' || intent === 'refusal' || intent === 'greeting') {
                return "response_generator";
            }
            return "query_planner";
        },
        ["query_planner", "response_generator"]
    )
    .addConditionalEdges(
        "query_planner",
        shouldExecuteTools,
        ["tool_executor", "response_generator"]
    )
    .addEdge("tool_executor", "reflector_node")
    .addConditionalEdges(
        "reflector_node",
        (state) => {
            // If we have reflection feedback, loop back to plan
            if (state.reflection && state.reflection !== "Sufficient data gathered." && state.reflection !== "Max iterations limit reached.") {
                return "query_planner";
            }
            return "response_generator";
        },
        ["query_planner", "response_generator"]
    )
    .addEdge("response_generator", END);

import { MySQLSaver } from "./mysql-saver";

// Persistence (MySQL)
export const checkpointer = new MySQLSaver();

// Compile the graph
// Compile the graph
export const graph = workflow.compile({
    checkpointer,
    // interruptBefore: ["tool_executor"], // Disabled for demo continuity as UI lacks resume button
});
