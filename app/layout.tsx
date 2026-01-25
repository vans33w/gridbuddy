import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import HeaderAuth from "./components/HeaderAuth";
import MobileHeader from "./components/MobileHeader";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/next";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-white text-[var(--secondary)]`}
      >
        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="font-bold text-lg tracking-tight  text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-2"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              <Image src="/logo1.png" alt="Grid Buddy" width={120} unoptimized height={120} className="w-40 object-cox" />
            </Link>

            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-5 text-sm font-medium">
                <Link href="/emissions" className="btn-text-danger whitespace-nowrap">
                  Emissions Calculator
                </Link>
                <Link href="/moments" className="btn-text-danger">
                  Diary
                </Link>
                <Link href="/tracks" className="btn-text-danger">
                  Tracks
                </Link>
                <Link href="/races" className="btn-text-danger">
                  Races
                </Link>
                <Link href="/bucket-list" className="btn-text-danger">
                  Bucket List
                </Link>
              </nav>

              <HeaderAuth />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">{children}</main>

        <footer className="border-t border-[var(--border)] mt-16">
          <div className="mx-auto max-w-5xl px-6 py-6 text-xs opacity-60">
            © {new Date().getFullYear()} Grid Buddy
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
