import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteNav } from '@/components/site-nav'

const STAGE_BADGE: Record<string, string> = {
  email_1_sent: 'bg-blue-50 text-blue-700',
  email_2_sent: 'bg-indigo-50 text-indigo-700',
  replied: 'bg-purple-50 text-purple-700',
  interested: 'bg-green-50 text-green-700',
  uninterested: 'bg-gray-100 text-gray-700',
}

export default async function OutreachPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows, error } = await supabase
    .from('outreach')
    .select('id, stage, email_1_sent_at, email_2_sent_at, reply_at, reply_sentiment, is_interested, businesses(name, email)')
    .order('email_1_sent_at', { ascending: false, nullsFirst: false })

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Outreach</h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Business</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Stage</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email 1 sent</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Email 2 sent</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Reply</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Interested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows && rows.length > 0 ? (
                rows.map((r) => {
                  const biz = Array.isArray(r.businesses) ? r.businesses[0] : r.businesses
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {biz?.name ?? '—'}
                        {biz?.email && (
                          <span className="block text-xs text-gray-500">{biz.email}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {r.stage ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STAGE_BADGE[r.stage] ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r.stage}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.email_1_sent_at ? new Date(r.email_1_sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.email_2_sent_at ? new Date(r.email_2_sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.reply_at ? (
                          <>
                            {new Date(r.reply_at).toLocaleString()}
                            {r.reply_sentiment && (
                              <span className="ml-2 text-xs text-gray-400">({r.reply_sentiment})</span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.is_interested === true ? 'Yes' : r.is_interested === false ? 'No' : '—'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No outreach yet. Go to <a href="/businesses" className="text-black underline">Businesses</a> and send one.
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
