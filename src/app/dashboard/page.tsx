import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteNav } from '@/components/site-nav'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const [{ count: businessesCount }, { count: outreachCount }, { count: websitesCount }] =
    await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('outreach').select('*', { count: 'exact', head: true }),
      supabase.from('websites').select('*', { count: 'exact', head: true }),
    ])

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Businesses" value={businessesCount ?? 0} />
          <Stat label="Outreach" value={outreachCount ?? 0} />
          <Stat label="Websites" value={websitesCount ?? 0} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Account</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{profile?.email ?? user.email}</dd>

            <dt className="text-gray-500">Plan</dt>
            <dd className="text-gray-900 capitalize">{profile?.plan ?? 'free'}</dd>

            <dt className="text-gray-500">Analyses used</dt>
            <dd className="text-gray-900">
              {profile?.analyses_used ?? 0} / {profile?.analyses_limit ?? 10}
            </dd>
          </dl>
        </section>
      </main>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
