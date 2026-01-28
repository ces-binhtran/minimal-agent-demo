import { NextResponse } from 'next/server';
import { rootAgent } from '@/agents/orchestrator';

export async function POST(request: Request) {
    try {
        const { threadId, score, comment, runId, messageId, input, output } = await request.json();

        if (!threadId || score === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await rootAgent.submitFeedback(threadId, score, comment, {
            runId,
            messageId,
            input,
            output
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
