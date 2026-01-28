import { rootAgent } from '@/agents/orchestrator';

export async function POST(request: Request) {
    try {
        const { question, repoId, threadId } = await request.json();

        if (!question) {
            return new Response(JSON.stringify({ error: 'Question is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const result = await rootAgent.chat(question, {
                        repoId,
                        threadId,
                        clientContext: { activeFile: 'src/config/env.ts' } // MOCK CONTEXT
                    });

                    const responsePayload = {
                        answer: result.finalResponse.answer,
                        keyMetrics: result.finalResponse.keyMetrics,
                        sources: Object.entries(result.toolResults).map(([tool, data]) => ({
                            tool,
                            data: data as Record<string, unknown>
                        })),
                        agentTrace: {
                            intent: result.parsedIntent,
                            plan: result.queryPlan,
                            validation: result.validation,
                            executionMetadata: result.executionMetadata
                        }
                    };

                    controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify(responsePayload)}\n\n`)
                    );
                } catch (error) {
                    console.error('Agent processing error:', error);
                    controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n\n`)
                    );
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
