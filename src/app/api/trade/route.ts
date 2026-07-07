import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { teamName, symbol, tradeType, quantity, price, day, minute } = await req.json()

  if (!teamName || !symbol || !tradeType || !quantity || !price) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (quantity < 10 || quantity % 10 !== 0 || quantity > 100) {
    return NextResponse.json({ error: 'Invalid quantity. Min 10, max 100, multiples of 10.' })
  }

  // Get team
  const { data: team, error: teamErr } = await supabase
    .from('teams').select('cash').eq('name', teamName).single()
  if (teamErr || !team) return NextResponse.json({ error: 'Team not found' })

  const totalCost = quantity * price

  if (tradeType === 'buy') {
    if (team.cash < totalCost) return NextResponse.json({ error: 'Insufficient cash' })

    // Deduct cash
    const { error: cashErr } = await supabase
      .from('teams').update({ cash: team.cash - totalCost }).eq('name', teamName)
    if (cashErr) return NextResponse.json({ error: 'Trade failed' })

    // Update holdings
    const { data: existing } = await supabase
      .from('holdings').select('*').eq('team_name', teamName).eq('symbol', symbol).single()

    if (existing) {
      const newQty = existing.quantity + quantity
      const newAvg = ((existing.avg_buy_price * existing.quantity) + totalCost) / newQty
      await supabase.from('holdings').update({ quantity: newQty, avg_buy_price: newAvg })
        .eq('team_name', teamName).eq('symbol', symbol)
    } else {
      await supabase.from('holdings').insert({ team_name: teamName, symbol, quantity, avg_buy_price: price })
    }
  } else {
    // Sell
    const { data: holding } = await supabase
      .from('holdings').select('*').eq('team_name', teamName).eq('symbol', symbol).single()

    if (!holding || holding.quantity < quantity) return NextResponse.json({ error: 'Not enough shares to sell' })

    const proceeds = quantity * price
    await supabase.from('teams').update({ cash: team.cash + proceeds }).eq('name', teamName)
    await supabase.from('holdings').update({ quantity: holding.quantity - quantity })
      .eq('team_name', teamName).eq('symbol', symbol)
  }

  // Log trade
  await supabase.from('trades').insert({ team_name: teamName, symbol, trade_type: tradeType, quantity, price, day, minute })

  return NextResponse.json({ success: true })
}
