import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', url: !!url, key: !!key })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('game_state').select('*').eq('id', 1).single()

  return NextResponse.json({ 
    url: url.substring(0, 30), 
    hasKey: !!key,
    data, 
    error 
  })
}
