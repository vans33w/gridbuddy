import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-bold">Grid Buddy</h1>
        <p className="text-sm opacity-80 mt-2">
          Your motorsport journal + track bucket list.
        </p>

        <div className="flex flex-wrap gap-4 mt-4">
          <Link className="btn-text" href="/moments">
            Moments
          </Link>
          <Link className="btn-text" href="/tracks">
            Tracks
          </Link>
          <Link className="btn-text" href="/races">
            Races
          </Link>
          <Link className="btn-text" href="/bucket-list">
            My Bucket List
          </Link>
        </div>
      </div>
    </main>
  );
}
