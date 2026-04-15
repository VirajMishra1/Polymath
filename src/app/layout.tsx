import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Providers } from "@/components/providers";
import { TerminalHeader } from "@/components/terminal-header";
import { GlobalKeyboardHandler } from "@/components/global-keyboard-handler";

export const metadata: Metadata = {
  title: "Polymath | Prediction Market Analytics",
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
        <ErrorReporter />
        <Providers>
          <GlobalKeyboardHandler />
          <TerminalHeader />
          <main className="grid-bg min-h-[calc(100vh-72px)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
