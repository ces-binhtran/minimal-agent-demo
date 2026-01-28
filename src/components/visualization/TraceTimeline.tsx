import React from 'react';
import { AgentTrace } from '../chat/types';

export function TraceTimeline({ trace }: { trace: AgentTrace }) {
    // 1. Intent Step
    const intent = trace.intent;
    const isAmbiguous = intent?.type === 'ambiguous';

    return (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            {/* Step 1: User Intent */}
            <TimelineItem
                icon="🎯"
                title="User Intent"
                status={isAmbiguous ? 'warning' : 'success'}
            >
                <div className="text-xs font-mono text-slate-700">
                    <span className="font-bold">{intent?.type || 'Unknown'}</span>
                    {intent?.confidence !== undefined && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${intent.confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {Math.round(intent.confidence * 100)}%
                        </span>
                    )}
                </div>
            </TimelineItem>

            {/* Step 2: Plan */}
            {trace.plan && trace.plan.steps && trace.plan.steps.length > 0 && (
                <TimelineItem icon="📝" title="Execution Plan" status="success">
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                        {trace.plan.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))}
                    </ul>
                </TimelineItem>
            )}

            {/* Step 3: Tool Execution */}
            {trace.plan && trace.plan.toolCalls && trace.plan.toolCalls.length > 0 && (
                <TimelineItem icon="🛠️" title="Tool Execution" status="success">
                    <div className="space-y-2">
                        {trace.plan.toolCalls.map((call, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                <div className="font-mono font-medium text-indigo-600">{call.tool}</div>
                                <div className="text-slate-500 mt-1 truncate">{JSON.stringify(call.params)}</div>
                            </div>
                        ))}
                    </div>
                </TimelineItem>
            )}

            {/* Step 4: Metadata */}
            <TimelineItem icon="⏱️" title="Performance">
                <div className="flex gap-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    {trace.executionMetadata?.totalTime && (
                        <span>Time: {trace.executionMetadata.totalTime}ms</span>
                    )}
                    {trace.executionMetadata?.threadId && (
                        <span>Thread: {trace.executionMetadata.threadId.slice(0, 8)}...</span>
                    )}
                </div>
            </TimelineItem>
        </div>
    );
}

function TimelineItem({
    icon,
    title,
    children,
    status = 'default'
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
    status?: 'success' | 'warning' | 'error' | 'default';
}) {
    const statusColors = {
        success: 'bg-green-50 border-green-200 ring-green-100',
        warning: 'bg-yellow-50 border-yellow-200 ring-yellow-100',
        error: 'bg-red-50 border-red-200 ring-red-100',
        default: 'bg-white border-slate-200 ring-slate-50'
    };

    return (
        <div className="relative group">
            {/* Dot on the line */}
            <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center text-[8px] z-10
                ${status === 'success' ? 'border-green-500 text-green-500' :
                    status === 'warning' ? 'border-yellow-500 text-yellow-500' :
                        'border-slate-300 text-slate-400'}
            `}>
                {status === 'success' ? '✓' : '•'}
            </div>

            <div className={`rounded-lg border p-3 ${statusColors[status]} transition-all hover:shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{icon}</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h4>
                </div>
                {children}
            </div>
        </div>
    );
}
