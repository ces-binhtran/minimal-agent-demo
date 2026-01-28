'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ErrorState } from '@/components/ErrorState';

export default function ChatSidebar() {
    const selectedRepoId = "demo-repo"; // Fixed for demo
    const [isOpen, setIsOpen] = useState(true); // Default open for demo

    // Draggable State (Simplified for demo, just fixed sidebar)
    const sidebarRef = useRef<HTMLDivElement>(null);

    const suggestedQuestions = [
        "Who knows the most about the payment module?",
        "What are the highest risk modules?",
        "Show me the bus factor for auth service."
    ];

    const {
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
    } = useChat(selectedRepoId);

    const [showHistory, setShowHistory] = useState(false);
    const hasMessages = messages.length > 0;

    return (
        <>
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center relative"
                        aria-label="Toggle chat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {messages.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                {messages.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Chat Panel */}
            <div
                className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-600 text-white">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-white/20 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h2 className="font-semibold text-lg">Pradar AI (Demo)</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            title="History"
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-1 rounded hover:bg-white/20 transition-colors ${showHistory ? 'bg-white/20' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button
                            title="New Chat"
                            onClick={createNewThread}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages area or History */}
                {showHistory ? (
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                        <h3 className="text-sm font-bold text-gray-500 mb-4 px-2">Recent Threads</h3>
                        <div className="space-y-2">
                            {threads.length === 0 ? (
                                <p className="text-gray-400 text-sm px-2">No history found.</p>
                            ) : (
                                threads.map(t => (
                                    <button
                                        key={t.threadId}
                                        onClick={() => {
                                            loadThread(t.threadId);
                                            setShowHistory(false);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${currentThreadId === t.threadId
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="font-mono text-xs opacity-70 mb-1">{t.threadId.substring(0, 8)}...</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(t.lastActive).toLocaleString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50">
                        {!hasMessages && (
                            <div className="space-y-4">
                                {/* Welcome & Suggestions */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                                        AI
                                    </div>
                                    <div className="bg-white rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-gray-100">
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                            Hello! I'm your Pradar Assistant (Demo Mode). I use Mock Tools but Real Persistence!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                                        AI
                                    </div>
                                    <div className="bg-white rounded-2xl px-4 py-3 max-w-[85%] shadow-sm border border-gray-100">
                                        <p className="text-sm text-gray-800 mb-2 font-medium">Try asking me:</p>
                                        <ul className="space-y-2">
                                            {suggestedQuestions.map((q, i) => (
                                                <li key={i}>
                                                    <button
                                                        onClick={() => sendMessage(q)}
                                                        className="text-left text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors w-full"
                                                    >
                                                        "{q}"
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {error && (
                            <div className="mt-4">
                                <ErrorState error={{ message: error }} onRetry={clearMessages} context="processing" />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input area */}
                {!showHistory && (
                    <div className="border-t border-gray-200 p-4 bg-white">
                        <ChatInput onSend={sendMessage} isLoading={isLoading} />
                    </div>
                )}
            </div>
        </>
    );
}
