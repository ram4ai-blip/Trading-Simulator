import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STOCKS, NEWS_SCRIPT, TOTAL_DAYS, TRADING_MINUTES, BREAK_MINUTES } from '@/lib/gameData'

const ADMIN_PASSWORD = 'marketadmin2024'

const supabase = createClient(
  'https://skvwmspkbunmukuhmrda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdndtc3BrYnVubXVrdWhtcmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzE0NjgsImV4cCI6MjA5OTAwNzQ2OH0.qewOoU7oMqyI8fCLp4l0it7INfaMYz4VC67udbgTv7E'
)

function applyPriceChanges(currentPrices: { symbol: string; price: number }[], day: number, minute: number) {
  const newsEvent = NEWS_SCRIPT.find(n => n.day === day && n.minute === minute)
  if (!newsEvent) return currentPrices

  return currentPrices.map(stock => {
    const stockMeta = STOCKS.find(s => s.symbol === stock.symbol)
    if (!stockMeta) return stock

    const sectorImpact = newsEvent.impact[stockMeta.sector] ?? 0
    const otherImpact = sectorImpact * 0.2
    const actualImpact = newsEvent.impact[stockMeta.sector] !== undefined ? sectorImpact : otherImpact
    const jitter = (Math.random() - 0.5) * 0.4
    const changePct = (actualImpact + jitter) / 100

    const newPrice = Math.max(stock.price * (1 + changePct), 1)
    return { ...stock, price: Math.round(newPrice * 100) / 100 }
  })
}

export async function POST(req: NextRequest) {
  const { action, password } = await req.json()

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: gs } = await supabase.from('game_state').select('*').eq('id', 1).single()
  if (!gs) return NextResponse.json({ error: 'Game state not found' })

  if (action === 'start') {
    const initialPrices = STOCKS.map(s => ({
      symbol: s.symbol, name: s.name, sector: s.sector,
      price: s.basePrice, base_price: s.basePrice
    }))
    await supabase.from('stock_prices').upsert(initialPrices, { onConflict: 'symbol' })

    const phaseEnds = new Date(Date.now() + TRADING_MINUTES * 60 * 1000)
    await supabase.from('game_state').update({
      status: 'trading', current_day: 1, current_minute: 1,
      phase_ends_at: phaseEnds.toISOString(), started_at: new Date().toISOString()
    }).eq('id', 1)

    return NextResponse.json({ success: true, message: 'Game started' })
  }

  if (action === 'next_minute') {
    if (gs.status !== 'trading') return NextResponse.json({ error: 'Not in trading phase' })

    const nextMinute = gs.current_minute + 1

    const { data: currentPrices } = await supabase.from('stock_prices').select('symbol, price')
    if (currentPrices) {
      const updated = applyPriceChanges(currentPrices, gs.current_day, gs.current_minute)
      for (const p of updated) {
        await supabase.from('stock_prices').update({ price: p.price, updated_at: new Date().toISOString() }).eq('symbol', p.symbol)
      }
    }

    if (nextMinute > TRADING_MINUTES) {
      if (gs.current_day >= TOTAL_DAYS) {
        await supabase.from('game_state').update({ status: 'finished', phase_ends_at: null }).eq('id', 1)
        return NextResponse.json({ success: true, message: 'Game finished' })
      }
      const phaseEnds = new Date(Date.now() + BREAK_MINUTES * 60 * 1000)
      await supabase.from('game_state').update({ status: 'break', phase_ends_at: phaseEnds.toISOString() }).eq('id', 1)
      return NextResponse.json({ success: true, message: 'Break started' })
    }

    const phaseEnds = new Date(Date.now() + 60 * 1000)
    await supabase.from('game_state').update({ current_minute: nextMinute, phase_ends_at: phaseEnds.toISOString() }).eq('id', 1)
    return NextResponse.json({ success: true, message: `Minute ${nextMinute}` })
  }

  if (action === 'next_day') {
    if (gs.status !== 'break') return NextResponse.json({ error: 'Not in break phase' })

    const nextDay = gs.current_day + 1
    const phaseEnds = new Date(Date.now() + TRADING_MINUTES * 60 * 1000)
    await supabase.from('game_state').update({
      status: 'trading', current_day: nextDay, current_minute: 1,
      phase_ends_at: phaseEnds.toISOString()
    }).eq('id', 1)
    return NextResponse.json({ success: true, message: `Day ${nextDay} started` })
  }

  if (action === 'reset') {
    await supabase.from('game_state').update({ status: 'waiting', current_day: 1, current_minute: 0, phase_ends_at: null, started_at: null }).eq('id', 1)
    await supabase.from('trades').delete().neq('id', 0)
    await supabase.from('holdings').delete().neq('id', 0)
    await supabase.from('teams').update({ cash: 1000000 }).neq('name', '')
    await supabase.from('stock_prices').delete().neq('symbol', '')
    return NextResponse.json({ success: true, message: 'Game reset' })
  }

  return NextResponse.json({ error: 'Unknown action' })
}
