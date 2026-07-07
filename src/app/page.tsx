'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TEAMS } from '@/lib/gameData'

export default function JoinPage() {
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin() {
    const name = teamName.trim()
    if (!name) return setError('Enter your team name')
    if (!TEAMS.includes(name)) return setError('Team not found. Check your team name.')

    setLoading(true)
    setError('')

    const { error: dbErr } = await supabase
      .from('teams')
      .upsert({ name }, { onConflict: 'name' })

    if (dbErr) {
      setError('Connection error. Try again.')
      setLoading(false)
      return
    }

    localStorage.setItem('team', name)
    router.push('/trade')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: 'radial-gradient(ellipse at 50% 0%, #0f1a2e 0%, #0a0a0f 60%)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '4px',
          color: 'var(--green)', textTransform: 'uppercase', marginBottom: '16px'
        }}>
          ◆ Live Trading Simulation
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700,
          letterSpacing: '-2px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #6b6b80 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Market Mayhem
        </h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '12px', fontSize: '15px' }}>
          5 trading days. 1 winner. Can you beat the market?
        </p>
      </div>

      {/* Join Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '400px'
      }}>
        <label style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Team Name
        </label>
        <input
          value={teamName}
          onChange={e => { setTeamName(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="Enter your team name..."
          list="team-list"
          style={{
            width: '100%', marginTop: '8px', padding: '14px 16px',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: '10px', color: 'var(--text)', fontSize: '16px',
            outline: 'none', transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <datalist id="team-list">
          {TEAMS.map(t => <option key={t} value={t} />)}
        </datalist>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            width: '100%', marginTop: '20px', padding: '14px',
            background: loading ? 'var(--border)' : 'var(--green)',
            color: '#000', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px',
            transition: 'all 0.2s', transform: loading ? 'none' : undefined
          }}
        >
          {loading ? 'Joining...' : 'Enter Market →'}
        </button>

        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface2)', borderRadius: '10px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Teams</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TEAMS.map(t => (
              <span key={t} onClick={() => setTeamName(t)} style={{
                fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                background: 'var(--border)', color: 'var(--text-dim)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text)'; (e.target as HTMLElement).style.background = '#3a3a4a' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-dim)'; (e.target as HTMLElement).style.background = 'var(--border)' }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-dim)' }}>
        Admin? <a href="/admin" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Go to Admin Panel →</a>
      </p>
    </div>
  )
}
