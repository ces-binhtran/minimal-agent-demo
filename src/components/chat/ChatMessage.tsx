'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage as ChatMessageType, AgentTrace } from './types';

// Mock Badge for demo
function KnowledgeConfidenceBadge({ level }: { level: string }) {
    const colors = {
        High: 'bg-green-100 text-green-800',
        Medium: 'bg-yellow-100 text-yellow-800',
        Low: 'bg-orange-100 text-orange-800',
        Unknown: 'bg-gray-100 text-gray-800'
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[level as keyof typeof colors] || colors.Unknown}`}>
            {level} Confidence
        </span>
    );
}

// Mock SourceCard
function SourceCard({ source }: { source: any }) {
    return (
        <div className="text-xs bg-gray-50 border border-gray-200 rounded p-2 font-mono">
            <div className="font-bold text-gray-500 mb-1">{source.tool}</div>
            <pre className="overflow-x-auto">{JSON.stringify(source.data, null, 2)}</pre>
        </div>
    );
}

import { TraceTimeline } from '../visualization/TraceTimeline';

// Agent Thought Process Visualization
function ThoughtProcess({ trace }: { trace: AgentTrace }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border border-indigo-100 rounded-lg overflow-hidden bg-white/50 mb-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
                <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">Agent Thought Process</span>
                </div>
                <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="px-3 py-4 bg-slate-50 border-t border-indigo-100 animate-in fade-in slide-in-from-top-1">
                    <TraceTimeline trace={trace} />
                </div>
            )}
        </div>
    );
}

interface ChatMessageProps {
    message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when content updates
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [message.content]);

    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : ''} group`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs font-semibold mt-1">
                    AI
                </div>
            )}

            <div className={`flex flex-col max-w-[85%] gap-1.5`}>

                {/* Agent Thought Visualization (Only for completed assistant messages with trace) */}
                {!isUser && message.agentTrace && !message.streaming && (
                    <ThoughtProcess trace={message.agentTrace} />
                )}

                {/* Main message content */}
                <div className="relative">
                    <div
                        className={`rounded-2xl px-5 py-3 ${isUser
                            ? 'bg-indigo-600 text-white'
                            : message.role === 'assistant' && message.streaming && !message.content
                                ? 'bg-white border border-gray-100 shadow-sm' // Thinking state style
                                : 'bg-gray-100/80 text-gray-900 border border-transparent'
                            }`}
                    >
                        {message.role === 'assistant' && message.streaming && !message.content ? (
                            <div className="flex items-center gap-1.5 py-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className="text-xs text-gray-400 ml-2 font-medium">Thinking, organizing knowledge...</span>
                            </div>
                        ) : (
                            <div ref={contentRef} className="text-sm leading-7 whitespace-pre-wrap break-words font-sans">
                                {message.content}
                                {message.streaming && <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle" />}
                            </div>
                        )}
                    </div>
                </div>

                {/* Meta info row: Confidence, Source, and Feedback */}
                {!isUser && !message.streaming && message.content && (
                    <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-3">
                            {message.confidence && <KnowledgeConfidenceBadge level={message.confidence} />}
                            {message.sources && message.sources.length > 0 && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {message.sources.length} Source{message.sources.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Feedback Controls - Now nicely aligned at the bottom right of the message block */}
                        <FeedbackButtons
                            threadId={message.threadId}
                            messageId={message.id}
                            output={message.content}
                        />
                    </div>
                )}

                {/* Expanded Source Details */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-1 px-1">
                        <details className="text-xs group/sources">
                            <summary className="text-gray-400 hover:text-indigo-600 cursor-pointer list-none font-medium flex items-center gap-1 select-none">
                                <svg className="w-3 h-3 transition-transform group-open/sources:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                View Sources Data
                            </summary>
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-indigo-50">
                                {message.sources.map((source, idx) => (
                                    <SourceCard key={`${message.id}-source-${idx}`} source={source} />
                                ))}
                            </div>
                        </details>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 text-xs font-bold mt-1 shadow-sm border border-white">
                    You
                </div>
            )}
        </div>
    );
}

function FeedbackButtons({
    threadId,
    messageId,
    output
}: {
    threadId?: string,
    messageId?: string,
    output?: string
}) {
    const [status, setStatus] = React.useState<'up' | 'down' | null>(null);
    const [showComment, setShowComment] = React.useState(false);
    const [comment, setComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);

    const handleVote = (vote: 'up' | 'down') => {
        setStatus(vote);
        setShowComment(true);
    };

    const submitFeedback = async () => {
        if (!threadId || !status) return;
        setIsSubmitting(true);
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    score: status === 'up' ? 1 : -1,
                    comment: comment,
                    messageId,
                    output
                })
            });
            setSubmitted(true);
            setShowComment(false);
        } catch (e) {
            console.error('Feedback failed', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <span className="text-[10px] text-gray-400 italic flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Feedback sent
            </span>
        );
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => handleVote('up')}
                    className={`p-1 rounded-full transition-colors ${status === 'up' ? 'text-green-600 bg-green-50 ring-1 ring-green-200' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                    title="Helpful"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                </button>
                <button
                    onClick={() => handleVote('down')}
                    className={`p-1 rounded-full transition-colors ${status === 'down' ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                    title="Not Helpful"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                </button>
            </div>

            {showComment && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Help us improve</div>
                    <textarea
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                        rows={3}
                        placeholder="What could be better? (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            onClick={() => setShowComment(false)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submitFeedback}
                            disabled={isSubmitting}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                        >
                            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

