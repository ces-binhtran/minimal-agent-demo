'use client';

import ChatSidebar from '@/components/chat/ChatSidebar';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Pradar Agent Demo</h1>
            <p className="text-lg text-gray-600 max-w-2xl text-center mb-8">
                This is a minimal demonstration of the Agent Architecture.
                The UI and Agent Logic are real, but the heavy Data Tools are mocked for speed and portability.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2">Features</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>LangGraph Orchestration</li>
                        <li>MySQL Thread Persistence</li>
                        <li>Chat History & Feedback</li>
                        <li>Mock Data Sources</li>
                    </ul>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2">Instructions</h2>
                    <p className="text-gray-600">
                        Open the chat bubble in the bottom right corner to interact with the agent.
                        Try asking about <strong>ownership</strong> or <strong>risk</strong>.
                    </p>
                </div>
            </div>

            <ChatSidebar />
        </div>
    );
}
