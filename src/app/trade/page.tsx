'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { STOCKS, NEWS_SCRIPT } from '@/lib/gameData'

type GameState = { status: string; current_day: number; current_minute: number; phase_ends_at: string }
type StockPrice = { symbol: string; name: string; sector: string; price: number }
type Holding = { symbol: string; quantity: number; avg_buy_price: number }
type TeamData = { cash: number }
type News = { headline: string; detail: string } | null

export default function TradePage() {
  const router = useRouter()
  const [team, setTeam] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [prices, setPrices] = useState<StockPrice[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [news, setNews] = useState<News>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState(10)
  const [tradeMsg, setTradeMsg] = useState('')
  const [tradeMsgType, setTradeMsgType] = useState<'ok' | 'err'>('ok')
  const [timeLeft, setTimeLeft] = useState(0)
  const [filterSector, setFilterSector] = useState('All')
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market')
  const [prevPrices, setPrevPrices] = useState<{ [sym: string]: number }>({})

  useEffect(() => {
    const t = localStorage.getItem('team')
    if (!t) { router.push('/'); return }
    setTeam(t)
  }, [router])

  const fetchAll = useCallback(async () => {
    if (!team) return
    const [gs, sp, hld, td] = await Promise.all([
      supabase.from('game_state').select('*').eq('id', 1).single(),
      supabase.from('stock_prices').select('*'),
      supabase.from('holdings').select('*').eq('team_name', team),
      supabase.from('teams').select('cash').eq('name', team).single()
    ])
    if (gs.data) setGameState(gs.data)
    if (sp.data) {
      setPrevPrices(prev => {
        const next: { [s: string]: number } = {}
        sp.data!.forEach((s: StockPrice) => { next[s.symbol] = prev[s.symbol] ?? s.price })
        return next
      })
      setPrices(sp.data)
    }
    if (hld.data) setHoldings(hld.data)
    if (td.data) setTeamData(td.data)
  }, [team])

  useEffect(() => {
    if (!team) return
    fetchAll()

    const gs = supabase.channel('gs').on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, (p) => {
      const d = p.new as GameState
      setGameState(d)
      if (d.current_minute > 0) {
        const n = NEWS_SCRIPT.find(x => x.day === d.current_day && x.minute === d.current_minute)
        if (n) {
          setNews({ headline: n.headline, detail: n.detail })
          setTimeout(() => setNews(null), 12000)
        }
      }
    }).subscribe()

    const sp = supabase.channel('sp').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_prices' }, () => {
      supabase.from('stock_prices').select('*').then(r => {
        if (r.data) {
          setPrevPrices(prev => {
            const next: { [s: string]: number } = {}
            r.data!.forEach((s: StockPrice) => { next[s.symbol] = prices.find(p => p.symbol === s.symbol)?.price ?? s.price })
            return next
          })
          setPrices(r.data)
        }
      })
    }).subscribe()

    const hld = supabase.channel('hld').on('postgres_changes', { event: '*', schema: 'public', table: 'holdings', filter: `team_name=eq.${team}` }, () => {
      supabase.from('holdings').select('*').eq('team_name', team).then(r => { if (r.data) setHoldings(r.data) })
      supabase.from('teams').select('cash').eq('name', team).single().then(r => { if (r.data) setTeamData(r.data) })
    }).subscribe()

    return () => { gs.unsubscribe(); sp.unsubscribe(); hld.unsubscribe() }
  }, [team, fetchAll])

  // Countdown timer
  useEffect(() => {
    if (!gameState?.phase_ends_at) return
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(gameState.phase_ends_at).getTime() - Date.now()) / 1000))
      setTimeLeft(left)
    }, 500)
    return () => clearInterval(interval)
  }, [gameState?.phase_ends_at])

  async function executeTrade() {
    if (!selectedStock || !team || !gameState) return
    if (gameState.status !== 'trading') return setMsg('Market is closed', 'err')
    if (quantity < 10 || quantity % 10 !== 0) return setMsg('Min 10 shares, multiples of 10 only', 'err')
    if (quantity > 100) return setMsg('Max 100 shares per trade', 'err')

    const price = prices.find(p => p.symbol === selectedStock)?.price
    if (!price) return

    const res = await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: team, symbol: selectedStock, tradeType, quantity, price, day: gameState.current_day, minute: gameState.current_minute })
    })
    const data = await res.json()
    if (data.error) setMsg(data.error, 'err')
    else {
      setMsg(`${tradeType === 'buy' ? 'Bought' : 'Sold'} ${quantity} × ${selectedStock} @ ₹${price.toFixed(0)}`, 'ok')
      fetchAll()
    }
  }

  function setMsg(m: string, t: 'ok' | 'err') {
    setTradeMsg(m); setTradeMsgType(t)
    setTimeout(() => setTradeMsg(''), 4000)
  }

  const sectors = ['All', ...Array.from(new Set(STOCKS.map(s => s.sector)))]
  const filteredPrices = prices.filter(p => filterSector === 'All' || p.sector === filterSector)

  const portfolioValue = holdings.reduce((sum, h) => {
    const price = prices.find(p => p.symbol === h.symbol)?.price ?? 0
    return sum + price * h.quantity
  }, 0)
  const totalValue = (teamData?.cash ?? 0) + portfolioValue
  const pnl = totalValue - 1000000
  const pnlPct = (pnl / 1000000) * 100

  const isTrading = gameState?.status === 'trading'
  const isBreak = gameState?.status === 'break'
  const isWaiting = gameState?.status === 'waiting'
  const isFinished = gameState?.status === 'finished'

  const selectedPrice = prices.find(p => p.symbol === selectedStock)
  const selectedHolding = holdings.find(h => h.symbol === selectedStock)
  const tradeCost = selectedPrice ? quantity * selectedPrice.price : 0
  const canBuy = (teamData?.cash ?? 0) >= tradeCost
  const canSell = (selectedHolding?.quantity ?? 0) >= quantity

  const fmt = (n: number) => n >= 100000
    ? `₹${(n / 100000).toFixed(2)}L`
    : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* News Popup */}
      {news && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, maxWidth: '520px', width: 'calc(100% - 32px)',
          background: '#1a1200', border: '1px solid var(--amber)',
          borderRadius: '12px', padding: '16px 20px',
          boxShadow: '0 0 40px rgba(255,171,0,0.3)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--amber)', marginBottom: '6px' }}>📰 MARKET NEWS</div>
          <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.3 }}>{news.headline}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>{news.detail}</div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>TEAM</div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>{team}</div>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          {isWaiting && <div style={{ color: 'var(--amber)', fontWeight: 600, fontSize: '14px' }}>⏳ Waiting for Admin to Start</div>}
          {isTrading && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>DAY {gameState?.current_day} · MIN {gameState?.current_minute}</div>
              <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '18px', fontFamily: 'var(--mono)' }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          )}
          {isBreak && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ANALYSIS BREAK</div>
              <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '18px', fontFamily: 'var(--mono)' }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          )}
          {isFinished && <div style={{ color: 'var(--amber)', fontWeight: 700 }}>🏁 SIMULATION ENDED</div>}
        </div>

        {/* P&L */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>TOTAL VALUE</div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>{fmt(totalValue)}</div>
          <div style={{ fontSize: '12px', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
            {pnl >= 0 ? '+' : ''}{fmt(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Market Closed Overlay */}
      {!isTrading && !isFinished && (
        <div style={{
          background: isBreak ? '#1a1000' : '#0f0f1a',
          border: `1px solid ${isBreak ? 'var(--amber)' : 'var(--border)'}`,
          margin: '16px 16px 0', borderRadius: '12px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>{isBreak ? '📊' : isWaiting ? '⏳' : '🏁'}</span>
          <div>
            <div style={{ fontWeight: 600, color: isBreak ? 'var(--amber)' : 'var(--text-dim)' }}>
              {isBreak ? 'Market Closed — Analysis Time' : isWaiting ? 'Market not started yet' : 'Simulation Complete'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {isBreak ? 'Review your portfolio. Trading resumes soon.' : isWaiting ? 'Wait for the admin to start.' : 'Check your final returns below.'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 16px 0', gap: '8px' }}>
        {(['market', 'portfolio'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: activeTab === tab ? 'var(--blue)' : 'var(--surface2)',
            color: activeTab === tab ? '#fff' : 'var(--text-dim)',
            fontWeight: 600, fontSize: '13px', textTransform: 'capitalize'
          }}>
            {tab === 'market' ? '📈 Market' : '💼 Portfolio'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: selectedStock ? '1fr 300px' : '1fr', gap: '16px' }}>

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div>
            {/* Sector Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {sectors.map(s => (
                <button key={s} onClick={() => setFilterSector(s)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap',
                  background: filterSector === s ? 'var(--surface2)' : 'transparent',
                  color: filterSector === s ? 'var(--text)' : 'var(--text-dim)',
                  fontSize: '12px', fontWeight: 500,
                  outline: filterSector === s ? '1px solid var(--border)' : 'none'
                }}>{s}</button>
              ))}
            </div>

            {/* Stock Table */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
                fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px'
              }}>
                <span>STOCK</span><span style={{ textAlign: 'right' }}>PRICE</span>
                <span style={{ textAlign: 'right' }}>CHANGE</span><span style={{ textAlign: 'right' }}>HELD</span>
              </div>
              {filteredPrices.map(stock => {
                const prev = prevPrices[stock.symbol] ?? stock.price
                const change = stock.price - prev
                const changePct = prev > 0 ? (change / prev) * 100 : 0
                const holding = holdings.find(h => h.symbol === stock.symbol)
                const isSelected = selectedStock === stock.symbol
                return (
                  <div key={stock.symbol}
                    onClick={() => setSelectedStock(isSelected ? null : stock.symbol)}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: isSelected ? 'var(--surface2)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--blue)' : '3px solid transparent'
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#15151f' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--mono)' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{stock.sector}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600 }}>
                      ₹{stock.price.toFixed(0)}
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '12px', color: changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: holding?.quantity ? 'var(--blue)' : 'var(--text-dim)' }}>
                      {holding?.quantity ?? 0}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Cash', value: fmt(teamData?.cash ?? 0), color: 'var(--text)' },
                { label: 'Invested', value: fmt(portfolioValue), color: 'var(--blue)' },
                { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}${fmt(pnl)}`, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }
              ].map(c => (
                <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: c.color, fontFamily: 'var(--mono)' }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Holdings */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '13px' }}>Holdings</div>
              {holdings.filter(h => h.quantity > 0).length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>No holdings yet</div>
              ) : holdings.filter(h => h.quantity > 0).map(h => {
                const p = prices.find(x => x.symbol === h.symbol)
                const currentVal = (p?.price ?? 0) * h.quantity
                const costVal = h.avg_buy_price * h.quantity
                const gain = currentVal - costVal
                const gainPct = costVal > 0 ? (gain / costVal) * 100 : 0
                return (
                  <div key={h.symbol} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--mono)', fontSize: '13px' }}>{h.symbol}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{h.quantity} shares</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--mono)' }}>{fmt(currentVal)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>avg ₹{h.avg_buy_price.toFixed(0)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {gain >= 0 ? '+' : ''}{fmt(gain)}
                      </div>
                      <div style={{ fontSize: '11px', color: gain >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
                        {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Trade Panel */}
        {selectedStock && activeTab === 'market' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', fontFamily: 'var(--mono)' }}>{selectedStock}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{selectedPrice?.name}</div>
              </div>
              <button onClick={() => setSelectedStock(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: '20px' }}>
              ₹{selectedPrice?.price.toFixed(2)}
            </div>

            {/* Buy/Sell Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {(['buy', 'sell'] as const).map(t => (
                <button key={t} onClick={() => setTradeType(t)} style={{
                  padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '13px',
                  background: tradeType === t ? (t === 'buy' ? 'var(--green)' : 'var(--red)') : 'var(--surface2)',
                  color: tradeType === t ? '#000' : 'var(--text-dim)',
                  textTransform: 'uppercase', letterSpacing: '1px'
                }}>{t}</button>
              ))}
            </div>

            {/* Quantity */}
            <label style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px' }}>QUANTITY</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', marginBottom: '6px' }}>
              {[10, 20, 50, 100].map(q => (
                <button key={q} onClick={() => setQuantity(q)} style={{
                  flex: 1, padding: '8px 0', borderRadius: '6px', border: 'none', fontSize: '12px',
                  background: quantity === q ? 'var(--blue)' : 'var(--surface2)',
                  color: quantity === q ? '#fff' : 'var(--text-dim)', fontWeight: 600
                }}>{q}</button>
              ))}
            </div>
            <input type="number" value={quantity} min={10} max={100} step={10}
              onChange={e => setQuantity(parseInt(e.target.value) || 10)}
              style={{
                width: '100%', padding: '10px', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '15px', fontFamily: 'var(--mono)', outline: 'none'
              }}
            />

            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total Cost</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>₹{tradeCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Cash Available</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{fmt(teamData?.cash ?? 0)}</span>
              </div>
              {selectedHolding && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>You Hold</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{selectedHolding.quantity} shares</span>
                </div>
              )}
            </div>

            {tradeMsg && (
              <div style={{
                marginTop: '10px', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center',
                background: tradeMsgType === 'ok' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
                color: tradeMsgType === 'ok' ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${tradeMsgType === 'ok' ? 'var(--green)' : 'var(--red)'}`
              }}>{tradeMsg}</div>
            )}

            <button
              onClick={executeTrade}
              disabled={!isTrading || (tradeType === 'buy' ? !canBuy : !canSell)}
              style={{
                width: '100%', marginTop: '12px', padding: '14px', borderRadius: '10px', border: 'none',
                background: !isTrading ? 'var(--border)' : tradeType === 'buy' ? 'var(--green)' : 'var(--red)',
                color: !isTrading ? 'var(--text-dim)' : '#000',
                fontWeight: 700, fontSize: '14px', letterSpacing: '0.5px',
                opacity: (!isTrading || (tradeType === 'buy' ? !canBuy : !canSell)) ? 0.5 : 1
              }}
            >
              {!isTrading ? 'Market Closed' : `${tradeType === 'buy' ? 'BUY' : 'SELL'} ${quantity} × ${selectedStock}`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}
