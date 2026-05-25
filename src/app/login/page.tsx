import Link from 'next/link'
import { login } from '../auth/actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Log in</h1>

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          {searchParams.error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
          )}
          {searchParams.message && (
            <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{searchParams.message}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account?{' '}
          <Link href="/signup" className="font-medium text-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
