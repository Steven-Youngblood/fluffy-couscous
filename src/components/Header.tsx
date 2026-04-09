import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-gray-900">
          Insight to Action
        </Link>
        <p className="text-sm text-gray-500">Book a meeting</p>
      </div>
    </header>
  );
}
