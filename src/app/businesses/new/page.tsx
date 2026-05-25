import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteNav } from '@/components/site-nav'
import { createBusiness } from '../actions'

export default async function NewBusinessPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/businesses" className="hover:text-black">
            Businesses
          </Link>
          <span>/</span>
          <span className="text-gray-900">New</span>
        </div>

        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Add business</h1>

        <form action={createBusiness} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <input
                id="type"
                name="type"
                type="text"
                placeholder="restaurant, salon, plumber…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="website_status" className="mb-1 block text-sm font-medium text-gray-700">
                Website status
              </label>
              <select
                id="website_status"
                name="website_status"
                defaultValue=""
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              >
                <option value="">—</option>
                <option value="none">No website</option>
                <option value="outdated">Outdated</option>
                <option value="modern">Modern</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="website" className="mb-1 block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {searchParams.error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/businesses"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
