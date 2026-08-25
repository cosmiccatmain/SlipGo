import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SlipGo",
    template: "%s · SlipGo",
  },
  description:
    "Find a slip by what actually matters: who you tie up next to, and how well the marina looks after your boat.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="border-b border-hull-800/80 bg-hull-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">SlipGo</span>
              <span className="text-xs text-foam-400">slips, with context</span>
            </Link>
            <nav className="text-sm text-foam-300">
              <Link
                href="/"
                className="rounded px-2 py-1 transition hover:bg-hull-800 hover:text-foam-100"
              >
                Marinas
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-5 pb-10 pt-6 text-xs text-foam-400">
          Neighbor profiles are opt-in and shown only at the visibility their
          owner chose. Security figures combine marina-reported data with
          member reports.
        </footer>
      </body>
    </html>
  );
}
