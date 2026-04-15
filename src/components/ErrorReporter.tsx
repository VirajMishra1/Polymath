"use client";

type ReporterProps = {
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorReporter({ error, reset }: ReporterProps) {
  if (!error) return null;

  return (
    <html>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please refresh the page and try again.
            </p>
          </div>
          {reset && (
            <button
              onClick={reset}
              className="px-4 py-2 border border-border text-foreground hover:bg-muted transition-colors text-sm"
            >
              Try again
            </button>
          )}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <span className="block mt-2 text-muted-foreground">{error.stack}</span>
                )}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
