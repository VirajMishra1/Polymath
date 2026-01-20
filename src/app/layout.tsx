import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { TerminalHeader } from "@/components/terminal-header";
import { GlobalKeyboardHandler } from "@/components/global-keyboard-handler";

export const metadata: Metadata = {
  title: "Poly-Terminal | Prediction Market Analytics",
  description: "Professional-grade prediction market terminal with real-time analytics, risk tools, and AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen scanlines crt-effect">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="cb49f154-7aa1-4623-8510-e518b09e0e99"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <Providers>
          <GlobalKeyboardHandler />
          <TerminalHeader />
          <main className="grid-bg min-h-[calc(100vh-72px)]">
            {children}
          </main>
        </Providers>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
