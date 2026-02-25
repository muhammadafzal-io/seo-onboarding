'use server'

import { supabase } from "../lib/supabase"



export async function createClientAction(fd: FormData) {
  try {
    const data = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      domain: fd.get('domain') as string,
      niche: fd.get('niche') as string,
      competitors: fd.get('competitors') as string,
      keywords: fd.get('keywords') as string,
      tone: fd.get('tone') as string,
      blog_id: fd.get('blog_id') as string,
      schedule: fd.get('schedule') as string,
      notes: fd.get('notes') as string,
      status: 'active'
    }

    // 1️⃣ Save client in Supabase
    const { data: client, error } = await supabase
      .from('clients')
      .insert([data])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // 2️⃣ Trigger n8n WF1 webhook
    try {
      await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (err) {
      console.error('n8n trigger failed:', err)
    }

    // 3️⃣ Return success
    return { success: true, clientId: client.id }

  } catch (err: any) {
    return { success: false, error: err.message }
  }
}