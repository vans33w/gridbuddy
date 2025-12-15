import Link from "next/link";

export default function BackHome() {
  return (
    <Link href="/" className="underline text-sm">
      ← Back to Home
    </Link>
  );
}
