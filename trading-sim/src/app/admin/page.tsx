'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { STOCKS, TEAMS, NEWS_SCRIPT, TRADING_MINUTES, BREAK_MINUTES } from '@/lib/gameData'

type GameState = { status: string; current_day: number; current_minute: number; phase_ends_at: string }
type Team = { name: string; cash: number }
type Holding = { team_name: string; symbol: string; quantity: number; avg_buy_price: number }
type StockPrice = { symbol: string; price: number; sector: string }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authErr, setAuthErr] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [prices, setPrices] = useState<StockPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(false)

  const fetchAll = useCallback(async () => {
    const [gs, tm, hld, sp] = await Promise.all([
      supabase.from('game_state').select('*').eq('id', 1).single(),
      supabase.from('teams').select('*'),
      supabase.from('holdings').select('*'),
      supabase.from('stock_prices').select('*')
    ])
    if (gs.data) setGameState(gs.data)
    if (tm.data) setTeams(tm.data)
    if (hld.data) setHoldings(hld.data)
    if (sp.data) setPrices(sp.data)
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchAll()
    const ch = supabase.channel('admin-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holdings' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_prices' }, fetchAll)
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [authed, fetchAll])

  useEffect(() => {
    if (!gameState?.phase_ends_at) return
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(gameState.phase_ends_at).getTime() - Date.now()) / 1000))
      setTimeLeft(left)
    }, 500)
    return () => clearInterval(interval)
  }, [gameState?.phase_ends_at])

  // Auto-advance logic
  useEffect(() => {
    if (!autoAdvance || !gameState) return
    if (timeLeft > 0) return
    if (gameState.status === 'finished') return

    const timer = setTimeout(async () => {
      if (gameState.status === 'trading') {
        await gameAction('next_minute')
      } else if (gameState.status === 'break') {
        await gameAction('next_day')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [timeLeft, autoAdvance, gameState?.status])

  async function gameAction(action: string) {
    setLoading(true)
    const res = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password })
    })
    const data = await res.json()
    if (data.error) setMsg('❌ ' + data.error)
    else { setMsg('✓ ' + data.message); fetchAll() }
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  // Leaderboard calculation
  const leaderboard = teams.map(team => {
    const teamHoldings = holdings.filter(h => h.team_name === team.name && h.quantity > 0)
    const portfolioValue = teamHoldings.reduce((sum, h) => {
      const price = prices.find(p => p.symbol === h.symbol)?.price ?? 0
      return sum + price * h.quantity
    }, 0)
    const totalValue = team.cash + portfolioValue
    const pnl = totalValue - 1000000
    const pnlPct = (pnl / 1000000) * 100
    return { name: team.name, cash: team.cash, portfolioValue, totalValue, pnl, pnlPct }
  }).sort((a, b) => b.totalValue - a.totalValue)

  const fmt = (n: number) => `₹${(n / 100000).toFixed(2)}L`
  const currentNews = gameState ? NEWS_SCRIPT.find(n => n.day === gameState.current_day && n.minute === gameState.current_minute) : null

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '360px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: '8px' }}>ADMIN ACCESS</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Market Mayhem</h2>
        <input
          type="password" placeholder="Admin password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (password === 'marketadmin2024' ? (setAuthed(true), setAuthErr('')) : setAuthErr('Wrong password'))}
          style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '15px', outline: 'none', marginBottom: '8px' }}
        />
        {authErr && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '8px' }}>{authErr}</p>}
        <button onClick={() => password === 'marketadmin2024' ? (setAuthed(true), setAuthErr('')) : setAuthErr('Wrong password')}
          style={{ width: '100%', padding: '12px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
          Enter Admin Panel
        </button>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '12px', textAlign: 'center' }}>Default: marketadmin2024</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', fontFamily: 'var(--sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-dim)' }}>ADMIN PANEL</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Market Mayhem</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {msg && <span style={{ fontSize: '13px', color: msg.includes('❌') ? 'var(--red)' : 'var(--green)' }}>{msg}</span>}
          <div style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            background: gameState?.status === 'trading' ? 'rgba(0,230,118,0.15)' : gameState?.status === 'break' ? 'rgba(255,171,0,0.15)' : 'var(--surface2)',
            color: gameState?.status === 'trading' ? 'var(--green)' : gameState?.status === 'break' ? 'var(--amber)' : 'var(--text-dim)',
            textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            {gameState?.status ?? 'loading'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Game Status */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '12px' }}>GAME STATUS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Day</div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{gameState?.current_day ?? '-'}/5</div>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Minute</div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)' }}>{gameState?.current_minute ?? '-'}/6</div>
              </div>
            </div>
            {gameState?.phase_ends_at && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {gameState.status === 'trading' ? 'MINUTE ENDS IN' : 'BREAK ENDS IN'}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--mono)', color: gameState.status === 'trading' ? 'var(--green)' : 'var(--amber)' }}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Auto Advance Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px', background: 'var(--surface2)', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px' }}>Auto Advance</span>
              <button onClick={() => setAutoAdvance(!autoAdvance)} style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                background: autoAdvance ? 'var(--green)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}>
                <span style={{
                  position: 'absolute', top: '2px', left: autoAdvance ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
                }} />
              </button>
            </div>

            {/* Control Buttons */}
            {gameState?.status === 'waiting' && (
              <button onClick={() => gameAction('start')} disabled={loading} style={{
                width: '100%', padding: '14px', background: 'var(--green)', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px'
              }}>▶ Start Simulation</button>
            )}
            {gameState?.status === 'trading' && (
              <button onClick={() => gameAction('next_minute')} disabled={loading} style={{
                width: '100%', padding: '12px', background: 'var(--blue)', color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px'
              }}>⏭ Next Minute</button>
            )}
            {gameState?.status === 'break' && (
              <button onClick={() => gameAction('next_day')} disabled={loading} style={{
                width: '100%', padding: '12px', background: 'var(--amber)', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px'
              }}>▶ Start Day {(gameState?.current_day ?? 0) + 1}</button>
            )}
            {gameState?.status === 'finished' && (
              <div style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 700 }}>🏁 Simulation Complete</div>
            )}
            <button onClick={() => { if (confirm('Reset everything?')) gameAction('reset') }} style={{
              width: '100%', marginTop: '8px', padding: '10px', background: 'transparent',
              color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '10px', fontSize: '13px'
            }}>↺ Reset Game</button>
          </div>

          {/* Current News */}
          {currentNews && (
            <div style={{ background: '#1a1200', border: '1px solid var(--amber)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--amber)', marginBottom: '8px' }}>CURRENT NEWS</div>
              <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.4 }}>{currentNews.headline}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{currentNews.detail}</div>
            </div>
          )}

          {/* Teams Joined */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '12px' }}>TEAMS JOINED ({teams.length}/7)</div>
            {teams.map(t => (
              <div key={t.name} style={{ fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.name}</span>
                <span style={{ color: 'var(--green)', fontSize: '11px' }}>●</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Leaderboard + Prices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Leaderboard */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>🏆 Live Leaderboard</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Updates in real time</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
              <span>#</span><span>TEAM</span><span style={{ textAlign: 'right' }}>CASH</span><span style={{ textAlign: 'right' }}>PORTFOLIO</span><span style={{ textAlign: 'right' }}>TOTAL / P&L</span>
            </div>
            {leaderboard.map((t, i) => (
              <div key={t.name} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 1fr',
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                background: i === 0 ? 'rgba(0,230,118,0.05)' : 'transparent'
              }}>
                <span style={{ fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <span style={{ fontWeight: 600 }}>{t.name}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '13px' }}>{fmt(t.cash)}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--blue)' }}>{fmt(t.portfolioValue)}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>{fmt(t.totalValue)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Prices */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '15px' }}>📊 Live Prices</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--border)' }}>
              {prices.map(p => {
                const base = STOCKS.find(s => s.symbol === p.symbol)?.basePrice ?? p.price
                const chg = ((p.price - base) / base) * 100
                return (
                  <div key={p.symbol} style={{ background: 'var(--surface)', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>{p.symbol}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--mono)' }}>₹{p.price.toFixed(0)}</div>
                    <div style={{ fontSize: '11px', color: chg >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
                      {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
