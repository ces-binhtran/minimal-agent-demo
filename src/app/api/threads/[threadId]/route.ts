import { NextResponse } from 'next/server';
import { rootAgent } from '@/agents/orchestrator';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const { threadId } = await params;
        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
        }

        const messages = await rootAgent.getThreadHistory(threadId);
        return NextResponse.json({ messages });
    } catch (error) {
        console.error(`Failed to get thread history`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
