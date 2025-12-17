import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderAuth from "./components/HeaderAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grid Buddy",
  description: "Motorsport journal and track bucket list",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-neutral-900`}
      >
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="font-bold text-lg tracking-tight text-red-600 hover:text-red-700 transition-colors"
            >
              Grid Buddy
            </Link>

            <div className="flex items-center gap-6">
              <nav className="flex flex-wrap gap-5 text-sm font-medium">
                <Link href="/moments" className="btn-text-danger">
                  Moments
                </Link>
                <Link href="/tracks" className="btn-text-danger">
                  Tracks
                </Link>
                <Link href="/races" className="btn-text-danger">
                  Races
                </Link>
                <Link href="/bucket-list" className="btn-text-danger">
                  My Bucket List
                </Link>
              </nav>

              <HeaderAuth />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>

        <footer className="border-t border-[var(--border)] mt-16">
          <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-neutral-500">
            © {new Date().getFullYear()} Grid Buddy
          </div>
        </footer>
      </body>
    </html>
  );
}
