/**
 * Mock Sub-Agents Definitions
 */

// --- Intent Parser ---
export interface ParsedIntent {
    type: string;
    confidence: number;
    entities: any;
}
export const intentParserAgent = { name: 'intent_parser' };
export function parseIntentResponse(res: string): ParsedIntent {
    return JSON.parse(res);
}

// --- Query Planner ---
export interface QueryPlan {
    steps: any[];
    toolCalls: { tool: string; params: any }[];
}
export const queryPlannerAgent = { name: 'query_planner' };
export function parseQueryPlanResponse(res: string): QueryPlan {
    return JSON.parse(res);
}

// --- Validator ---
export interface ValidationResult {
    valid: boolean;
    issues: string[];
    sanitizedData: any;
}
export const validatorAgent = { name: 'validator' };
export function parseValidationResponse(res: string): ValidationResult {
    return JSON.parse(res);
}

// --- Response Generator ---
export interface ResponseGeneratorResult {
    answer: string;
    keyMetrics: any;
}
export const responseGeneratorAgent = { name: 'response_generator' };
export function parseResponseGeneratorOutput(res: string): ResponseGeneratorResult {
    return JSON.parse(res);
}
