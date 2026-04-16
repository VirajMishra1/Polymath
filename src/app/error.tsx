'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full text-center space-y-4 border border-terminal-red p-6 bg-black">
        <h1 className="text-xl font-bold text-terminal-red glow-text">
          // TERMINAL ERROR
        </h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can retry or navigate away.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 border border-terminal-green text-terminal-green hover:bg-terminal-green/10 text-xs"
          >
            Retry
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-border text-muted-foreground hover:text-terminal-green text-xs"
          >
            Home
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-3 text-left">
            <summary className="cursor-pointer text-[10px] text-muted-foreground">
              Error details
            </summary>
            <pre className="mt-2 text-[10px] bg-black border border-border p-2 overflow-auto text-terminal-red">
              {error.message}
              {error.stack && <span className="block mt-2 opacity-60">{error.stack}</span>}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
