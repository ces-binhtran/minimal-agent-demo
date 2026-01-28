import { NextResponse } from 'next/server';
import { rootAgent } from '@/agents/orchestrator';

export async function GET() {
    try {
        const threads = await rootAgent.listThreads();
        return NextResponse.json(threads);
    } catch (error) {
        console.error('Failed to list threads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
