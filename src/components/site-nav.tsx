import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export function SiteNav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-semibold text-gray-900">
            Websales
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">
            Dashboard
          </Link>
          <Link href="/businesses" className="text-sm text-gray-600 hover:text-black">
            Businesses
          </Link>
          <Link href="/outreach" className="text-sm text-gray-600 hover:text-black">
            Outreach
          </Link>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-black"
          >
            Log out
          </button>
        </form>
      </div>
    </nav>
  )
}
