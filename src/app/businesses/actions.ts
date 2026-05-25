'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createBusiness(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    redirect('/businesses/new?error=Name%20is%20required')
  }

  const websiteStatus = formData.get('website_status') as string
  const { error } = await supabase.from('businesses').insert({
    name,
    type: (formData.get('type') as string) || null,
    address: (formData.get('address') as string) || null,
    website: (formData.get('website') as string) || null,
    website_status: websiteStatus || null,
    email: (formData.get('email') as string) || null,
  })

  if (error) {
    redirect(`/businesses/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/businesses')
  redirect('/businesses')
}

export async function queueOutreach(formData: FormData) {
  const businessId = formData.get('business_id') as string
  if (!businessId) {
    redirect('/businesses?error=Missing%20business%20id')
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: business, error: bErr } = await supabase
    .from('businesses')
    .select('id, name, email')
    .eq('id', businessId)
    .single()

  if (bErr || !business) {
    redirect(`/businesses?error=${encodeURIComponent(bErr?.message ?? 'Business not found')}`)
  }
  if (!business.email) {
    redirect(`/businesses?error=${encodeURIComponent(`${business.name} has no email`)}`)
  }

  const { error: insertErr } = await supabase.from('outreach').insert({
    business_id: business.id,
    stage: 'pending',
  })

  if (insertErr) {
    redirect(`/businesses?error=${encodeURIComponent(insertErr.message)}`)
  }

  revalidatePath('/businesses')
  revalidatePath('/outreach')
  redirect(`/businesses?message=${encodeURIComponent(`Queued outreach for ${business.name}`)}`)
}
