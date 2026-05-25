import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteNav } from '@/components/site-nav'
import { queueOutreach } from './actions'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'none', label: 'No website' },
  { value: 'outdated', label: 'Outdated' },
  { value: 'modern', label: 'Modern' },
]

const STATUS_BADGE: Record<string, string> = {
  none: 'bg-red-50 text-red-700',
  outdated: 'bg-yellow-50 text-yellow-700',
  modern: 'bg-green-50 text-green-700',
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: { status?: string; error?: string; message?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('businesses')
    .select('id, name, type, website_status, email, created_at, outreach(stage, email_1_sent_at)')
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('website_status', searchParams.status)
  }

  const { data: businesses, error } = await query

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Businesses</h1>
          <Link
            href="/businesses/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Add business
          </Link>
        </header>

        <div className="mb-4 flex gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = (searchParams.status ?? '') === f.value
            const href = f.value ? `/businesses?status=${f.value}` : '/businesses'
            return (
              <Link
                key={f.label}
                href={href}
                className={`rounded-full px-3 py-1 text-sm ${
                  active
                    ? 'bg-black text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        {searchParams.error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.error}</p>
        )}
        {searchParams.message && (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{searchParams.message}</p>
        )}
        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Outreach</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses && businesses.length > 0 ? (
                businesses.map((b) => {
                  const lastOutreach = Array.isArray(b.outreach) && b.outreach.length > 0 ? b.outreach[0] : null
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.type ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {b.website_status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_BADGE[b.website_status] ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {b.website_status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.email ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {lastOutreach ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {lastOutreach.stage}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!lastOutreach && b.email && (
                          <form action={queueOutreach}>
                            <input type="hidden" name="business_id" value={b.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Queue outreach
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No businesses yet. <Link href="/businesses/new" className="text-black underline">Add one</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
