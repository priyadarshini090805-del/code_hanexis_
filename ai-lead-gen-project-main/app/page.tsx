import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-4">HaneXes</h1>
        <p className="text-gray-600 text-lg mb-8">Enterprise Sales Intelligence Platform</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-black text-white rounded-md font-semibold hover:bg-gray-900 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-black text-black rounded-md font-semibold hover:bg-gray-50 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
