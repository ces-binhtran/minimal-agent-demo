import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("WARN: GEMINI_API_KEY is not set in environment variables. Agents will fail.");
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

async function executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            console.warn(`[Gemini] Attempt ${attempt} failed: ${error.message}`);
            // Check for retryable errors (503 Service Unavailable, 429 Too Many Requests)
            if (attempt < MAX_RETRIES && (error.message.includes('503') || error.message.includes('429'))) {
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
                console.log(`[Gemini] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

export async function generateText(input: string | BaseMessage[], modelName: string = "gemini-2.0-flash"): Promise<string> {
    return executeWithRetry(async () => {
        try {
            const model = new ChatGoogleGenerativeAI({
                model: modelName,
                apiKey: apiKey,
                maxRetries: 0
            });

            const messages = typeof input === 'string' ? [new HumanMessage(input)] : input;
            const response = await model.invoke(messages);
            return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error(`Failed to generate content from Gemini API: ${error}`);
        }
    });
}

export async function generateJSON<T>(input: string | BaseMessage[], modelName: string = "gemini-2.0-flash"): Promise<T> {
    return executeWithRetry(async () => {
        let text = "";
        try {
            const model = new ChatGoogleGenerativeAI({
                model: modelName,
                apiKey: apiKey,
                maxRetries: 0
            });

            console.log(`[Gemini] Generating JSON with model: ${modelName}`);

            const messages = typeof input === 'string' ? [new HumanMessage(input)] : input;
            const response = await model.invoke(messages);
            text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

            // Robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                text = jsonMatch[0];
            }

            return JSON.parse(text) as T;
        } catch (error) {
            console.error("Gemini JSON Generation Error:", error);
            console.error("Failed contents:", text);
            throw new Error(`Failed to generate JSON from Gemini API: ${error}`);
        }
    });
}

export function getGeminiModel(modelName: string = "gemini-2.0-flash") {
    return new ChatGoogleGenerativeAI({
        model: modelName,
        apiKey: apiKey
    });
}
