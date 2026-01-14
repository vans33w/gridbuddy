"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeaderAuth from "./HeaderAuth";

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src="/logo1.png"
            alt="Grid Buddy"
            width={60}
            height={60}
            className="w-12 h-12 object-contain"
          />
        </Link>

        <div className="flex items-center gap-3">
          <HeaderAuth />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-[var(--secondary)] hover:text-[var(--primary)] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-[var(--border)] bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/emissions"
              className="block py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Emissions Calculator
            </Link>
            <Link
              href="/moments"
              className="block py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Diary
            </Link>
            <Link
              href="/tracks"
              className="block py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Tracks
            </Link>
            <Link
              href="/races"
              className="block py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Races
            </Link>
            <Link
              href="/bucket-list"
              className="block py-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--accent-hover)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Bucket List
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
