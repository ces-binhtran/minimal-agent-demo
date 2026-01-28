'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatResponse } from './types';

function extractConfidence(response: Partial<ChatResponse>): 'High' | 'Medium' | 'Low' | 'Unknown' {
    if (response.keyMetrics?.confidence) {
        const conf = response.keyMetrics.confidence;
        if (conf === 'High' || conf === 'Medium' || conf === 'Low') {
            return conf;
        }
    }
    return 'Unknown';
}

export function useChat(repoId: string | null = "demo-repo") {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [threads, setThreads] = useState<{ threadId: string, lastActive: Date }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load threads on mount
    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            const res = await fetch('/api/threads');
            if (res.ok) {
                const data = await res.json();
                setThreads(data);
            }
        } catch (e) {
            console.error('Failed to fetch threads', e);
        }
    };

    const createNewThread = useCallback(() => {
        setCurrentThreadId(null);
        setMessages([]);
        setError(undefined);
        localStorage.removeItem('pradar_thread_id');
    }, []);

    const loadThread = useCallback(async (threadId: string) => {
        setCurrentThreadId(threadId);
        localStorage.setItem('pradar_thread_id', threadId);
        setMessages([]); // Clear current view
        setIsLoading(true);

        try {
            const res = await fetch(`/api/threads/${threadId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages) {
                    setMessages(data.messages);
                }
            }
        } catch (e) {
            console.error('Failed to load thread messages', e);
            setError('Failed to load conversation history');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load last active thread from storage
    useEffect(() => {
        const savedThreadId = localStorage.getItem('pradar_thread_id');
        if (savedThreadId) {
            loadThread(savedThreadId);
        }
    }, [loadThread]); // Verify dependency cycle here? standard implementation



    const sendMessage = useCallback(async (question: string) => {
        if (!question.trim()) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: question,
            timestamp: Date.now(),
            threadId: currentThreadId || undefined
        };

        setMessages((prev) => [...prev, userMessage]);
        setError(undefined);
        setIsLoading(true);

        // Create assistant message for streaming
        const assistantId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            streaming: true,
            timestamp: Date.now(),
            threadId: currentThreadId || undefined
        };

        setMessages((prev) => [...prev, assistantMessage]);

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    repoId,
                    threadId: currentThreadId // Pass current thread ID if exists
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Stream the response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = '';
            let chatResponse: Partial<ChatResponse> = {};
            let hasError = false;
            let newThreadId = currentThreadId;

            while (true) {
                const { done, value } = await reader.read();
                if (done || hasError) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (jsonStr.trim()) {
                            try {
                                chatResponse = JSON.parse(jsonStr);

                                // Capture thread ID from response if it's new
                                if (chatResponse.agentTrace?.executionMetadata?.threadId) {
                                    const tId = chatResponse.agentTrace.executionMetadata.threadId as string;
                                    if (tId !== newThreadId) {
                                        newThreadId = tId;
                                        setCurrentThreadId(tId);
                                        // Refresh threads list
                                        fetchThreads();
                                    }
                                }

                                if (chatResponse.error) {
                                    setError(chatResponse.error);
                                    // Remove the assistant message if there was an error in the response
                                    setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
                                    hasError = true;
                                    await reader.cancel();
                                    break;
                                } else {
                                    streamedContent = chatResponse.answer || '';

                                    // Update assistant message with streamed content
                                    setMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === assistantId
                                                ? {
                                                    ...msg,
                                                    content: streamedContent,
                                                    streaming: false,
                                                    confidence: extractConfidence(chatResponse),
                                                    keyMetrics: chatResponse.keyMetrics,
                                                    sources: chatResponse.sources,
                                                    agentTrace: chatResponse.agentTrace,
                                                    threadId: newThreadId || undefined // Associate with thread
                                                }
                                                : msg
                                        )
                                    );
                                }
                            } catch (parseError) {
                                console.error('Failed to parse SSE data:', parseError);
                                // Continue despite parse error in chunk
                            }
                        }
                    }
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);

            // Remove the assistant message if there was an error
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
        } finally {
            setIsLoading(false);
        }
    }, [repoId, currentThreadId]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(undefined);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        messagesEndRef,
        createNewThread,
        threads,
        loadThread,
        currentThreadId
    };
}
