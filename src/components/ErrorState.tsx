import React from 'react';

interface ErrorStateProps {
    error: { message: string };
    onRetry?: () => void;
    context?: string;
}

export function ErrorState({ error, onRetry, context }: ErrorStateProps) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                    <p className="font-semibold">Error {context ? `while ${context}` : ''}</p>
                    <p className="mt-1 opacity-90">{error.message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-xs font-bold uppercase tracking-wide text-red-700 hover:text-red-900 underline"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
