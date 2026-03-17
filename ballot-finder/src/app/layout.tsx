import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ballot Finder - Find Your Next Election",
  description:
    "Enter your address to find upcoming elections, see what's on your ballot, and get voter registration information.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white antialiased">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
                BF
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">
                  Ballot Finder
                </h1>
                <p className="text-xs text-slate-400">
                  Your guide to upcoming elections
                </p>
              </div>
            </a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-white/10 bg-white/5 mt-16">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 text-center text-sm text-slate-400">
            <p>
              Data provided by the{" "}
              <a
                href="https://developers.google.com/civic-information"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Google Civic Information API
              </a>
              . Election data may not be complete for all jurisdictions.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
