import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from './firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import PaymentPage from './PaymentPage'
import { markets, runSignalEngine } from './signalEngine'

// ── Telegram WebApp ───────────────────────────────────────────
const tg = window.Telegram?.WebApp
if (tg) { tg.ready(); tg.expand() }

const getTgUser = () => {
  if (tg?.initDataUnsafe?.user) return tg.initDataUnsafe.user
  // Dev-এ test user
  return { id: 12345, first_name: 'Test', last_name: '', username: 'testuser' }
}

const BACKEND_URL = 'https://master-ai-backend.onrender.com'

// ── Colors ─────────────────────────────────────────────────────
const C = {
  bg: '#0b0e11', card: '#141820', panel: '#1a1f2e',
  border: '#2b3139', text: '#e0e0e0', muted: '#555',
  green: '#0ecb81', red: '#f6465d', gold: '#f3ba2f', blue: '#60a5fa',
}

export default function App() {
  const tgUser = getTgUser()

  // ── Auth ──────────────────────────────────────────────────────
  const [authStatus, setAuthStatus] = useState('loading')

  // ── Trading ───────────────────────────────────────────────────
  const [selected, setSelected]   = useState(markets[0])
  const [dToken, setDToken]       = useState(localStorage.getItem('d_token') || '')
  const [dAppId, setDAppId]       = useState(localStorage.getItem('d_app_id') || '1089')
  const [isSaved, setIsSaved]     = useState(!!localStorage.getItem('d_token'))
  const [liveTime, setLiveTime]   = useState('--:--:--')
  const [connStatus, setConnStatus] = useState('OFFLINE')
  const [sigData, setSigData]     = useState({ direction: null, strength: 50, breakdown: {}, confidence: 0 })
  const [lastPred, setLastPred]   = useState(null)
  const [mLevel, setMLevel]       = useState(1)
  const [scanning, setScanning]   = useState(false)
  const [score, setScore]         = useState(JSON.parse(localStorage.getItem('trade_score')) || { win: 0, loss: 0, profit: 0 })
  const [unlockTime, setUnlockTime] = useState(localStorage.getItem('unlock_time') || null)
  const [isLocked, setIsLocked]   = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const wsRef = useRef(null)

  const dailyTarget = (() => {
    if (!localStorage.getItem('start_date')) localStorage.setItem('start_date', new Date().toISOString())
    const days = Math.floor((Date.now() - new Date(localStorage.getItem('start_date'))) / 86400000)
    return days < 3 ? 6 : days < 6 ? 12 : 20
  })()

  // ── Firestore auth listener ───────────────────────────────────
  useEffect(() => {
    const uid = String(tgUser.id)
    if (!uid || uid === '0') { setAuthStatus('new'); return }

    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (!snap.exists()) { setAuthStatus('new'); return }
      const d = snap.data()
      if (d.status === 'approved') {
        const exp = d.expiresAt?.toDate?.()
        if (exp && exp < new Date()) setAuthStatus('expired')
        else setAuthStatus('approved')
      } else if (d.status === 'rejected') {
        setAuthStatus('rejected')
      } else if (d.status === 'disconnected') {
        setAuthStatus('expired')
      } else {
        setAuthStatus('pending')
      }
    }, (err) => {
      console.error('Firestore error:', err)
      setAuthStatus('new')
    })
    return () => unsub()
  }, [tgUser.id])

  // ── Fetch candles ─────────────────────────────────────────────
  const fetchMarketData = useCallback(() => {
    if (!isSaved || isLocked) return
    if (wsRef.current) { try { wsRef.current.close() } catch (_) {} }
    setScanning(true)

    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${dAppId}`)
    wsRef.current = ws

    ws.onopen = () => ws.send(JSON.stringify({ authorize: dToken }))

    ws.onmessage = (e) => {
      try {
        const res = JSON.parse(e.data)

        if (res.error) {
          const c = res.error.code
          setConnStatus(c === 'InvalidToken' ? 'TOKEN ERROR ❌' : c === 'InvalidAppID' ? 'APP ID ERROR ❌' : 'ERROR ❌')
          setScanning(false); ws.close(); return
        }

        if (res.msg_type === 'authorize') {
          setConnStatus('CONNECTED ✅')
          ws.send(JSON.stringify({
            ticks_history: selected.id, count: 80,
            end: 'latest', style: 'candles', granularity: 60,
          }))
        }

        if (res.msg_type === 'candles' && res.candles) {
          const completed = res.candles.slice(0, -1)
          const result = runSignalEngine(completed)
          setSigData(result)
          if (result.direction) {
            setLastPred(result.direction)
            try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play() } catch (_) {}
          }
          setScanning(false); ws.close()
        }
      } catch (err) {
        setScanning(false); ws.close()
      }
    }

    ws.onerror = () => { setConnStatus('NETWORK ERROR ❌'); setScanning(false); try { ws.close() } catch (_) {} }
    ws.onclose = () => setScanning(false)
  }, [isSaved, isLocked, dToken, dAppId, selected])

  // ── Auto result check ─────────────────────────────────────────
  const checkResult = useCallback(() => {
    if (!lastPred) return
    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${dAppId}`)

    ws.onopen = () => ws.send(JSON.stringify({
      ticks_history: selected.id, count: 3,
      end: 'latest', style: 'candles', granularity: 60,
    }))

    ws.onmessage = (e) => {
      try {
        const res = JSON.parse(e.data)
        if (res.msg_type === 'candles' && res.candles) {
          const closed = res.candles[res.candles.length - 2]
          if (!closed) { ws.close(); return }

          const actual = parseFloat(closed.close) > parseFloat(closed.open) ? 'CALL' : 'PUT'
          const isWin = lastPred === actual

          setScore(prev => {
            const change = isWin ? parseFloat((mLevel * 0.85).toFixed(2)) : -mLevel
            const updated = {
              win:    isWin ? prev.win + 1 : prev.win,
              loss:   isWin ? prev.loss : prev.loss + 1,
              profit: parseFloat((prev.profit + change).toFixed(2)),
            }
            localStorage.setItem('trade_score', JSON.stringify(updated))
            if (updated.profit >= dailyTarget) {
              const lock = new Date(Date.now() + 12 * 3600 * 1000).toISOString()
              setUnlockTime(lock); localStorage.setItem('unlock_time', lock)
            }
            return updated
          })

          setMLevel(prev => isWin ? 1 : prev === 1 ? 2.5 : prev === 2.5 ? 5.5 : 1)
          setLastPred(null)
          setSigData({ direction: null, strength: 50, breakdown: {}, confidence: 0 })
          ws.close()
        }
      } catch (_) { ws.close() }
    }

    ws.onerror = () => { try { ws.close() } catch (_) {} }
  }, [lastPred, mLevel, dAppId, selected, dailyTarget])

  // ── Clock ─────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date()
      setLiveTime(now.toLocaleTimeString('en-GB'))
      const sec = now.getSeconds()

      if (unlockTime) {
        if (now < new Date(unlockTime)) setIsLocked(true)
        else { setIsLocked(false); setUnlockTime(null); localStorage.removeItem('unlock_time') }
      }

      if (authStatus !== 'approved') return
      if (sec === 56 && isSaved && !isLocked) fetchMarketData()
      if (sec === 4  && isSaved && !isLocked && lastPred) checkResult()
    }, 1000)
    return () => clearInterval(tick)
  }, [fetchMarketData, checkResult, isSaved, isLocked, unlockTime, lastPred, authStatus])

  // ── Auth guards ───────────────────────────────────────────────
  if (authStatus === 'loading') {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 32 }}>💹</div>
        <div style={{ color: C.muted, fontSize: 13 }}>লোড হচ্ছে...</div>
      </div>
    )
  }

  if (['new', 'pending', 'rejected', 'expired'].includes(authStatus)) {
    return <PaymentPage tgUser={tgUser} status={authStatus} />
  }

  // ── Trading UI ────────────────────────────────────────────────
  const dir    = sigData.direction
  const str    = sigData.strength
  const conf   = sigData.confidence
  const isCall = dir === 'CALL'
  const isPut  = dir === 'PUT'
  const sigColor = isCall ? C.green : isPut ? C.red : C.muted
  const sigLabel =
    scanning   ? '⟳  স্ক্যান হচ্ছে...' :
    isCall     ? '▲  CALL  (UP)' :
    isPut      ? '▼  PUT  (DOWN)' :
    lastPred   ? '⏳  রেজাল্ট আসছে...' :
                 '—  সিগনাল অপেক্ষায়'

  const handleSave = () => {
    localStorage.setItem('d_token', dToken)
    localStorage.setItem('d_app_id', dAppId)
    setIsSaved(true); setShowSettings(false)
  }

  const handleReset = () => {
    if (!window.confirm('স্কোর রিসেট করবেন?')) return
    const e = { win: 0, loss: 0, profit: 0 }
    setScore(e)
    localStorage.removeItem('trade_score')
    localStorage.removeItem('start_date')
  }

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter',sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: C.card, borderBottom: `1px solid ${C.border}`,
        fontSize: 11, fontWeight: 700,
      }}>
        <span style={{ color: connStatus.includes('✅') ? C.green : C.red }}>{connStatus}</span>
        <span style={{ color: C.gold }}>🎯 লক্ষ্য: ৳{dailyTarget}</span>
        <span style={{ color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{liveTime}</span>
      </header>

      {/* ── CHART ── */}
      <div style={{ height: '34vh', background: '#0d1117' }}>
        <iframe
          key={selected.id}
          src={`https://s.tradingview.com/widgetembed/?symbol=${selected.tv}&theme=dark&hide_top_toolbar=1&save_image=0`}
          width="100%" height="100%" style={{ border: 'none', display: 'block' }}
          title="chart"
        />
      </div>

      {/* ── SCORE ROW ── */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px 0' }}>
        {[
          { l: 'WIN',    v: score.win,        c: C.green },
          { l: 'LOSS',   v: score.loss,       c: C.red   },
          { l: 'PROFIT', v: `$${score.profit}`, c: C.gold },
        ].map(x => (
          <div key={x.l} style={{
            flex: 1, padding: '9px 4px', borderRadius: 8, textAlign: 'center',
            background: C.panel, border: `1px solid ${x.c}22`,
            color: x.c, fontSize: 11, fontWeight: 800,
          }}>
            <div style={{ color: '#444', fontSize: 9, marginBottom: 3 }}>{x.l}</div>
            {x.v}
          </div>
        ))}
        <button onClick={handleReset} style={{
          padding: '0 10px', borderRadius: 8, background: C.panel,
          border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, cursor: 'pointer',
        }}>↺</button>
      </div>

      {/* ── MAIN ── */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {isLocked ? (
          <div style={{
            background: 'rgba(243,186,47,0.08)', border: `2px solid ${C.gold}`,
            borderRadius: 14, padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>লক্ষ্য অর্জিত!</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
              আনলক: {new Date(unlockTime).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <>
            {/* ── SIGNAL CARD ── */}
            <div style={{
              borderRadius: 14, padding: '16px', background: C.card,
              border: `2px solid ${isCall ? C.green : isPut ? C.red : C.border}`,
              boxShadow: isCall ? `0 0 24px ${C.green}33` : isPut ? `0 0 24px ${C.red}33` : 'none',
              transition: 'all 0.4s',
            }}>
              {/* Signal label */}
              <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, color: sigColor, marginBottom: 10, letterSpacing: '0.04em' }}>
                {sigLabel}
              </div>

              {/* Confidence badge */}
              {dir && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <span style={{
                    background: conf >= 80 ? `${C.green}22` : `${C.gold}22`,
                    color:      conf >= 80 ? C.green : C.gold,
                    border:     `1px solid ${conf >= 80 ? C.green : C.gold}55`,
                    borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700,
                  }}>{conf}% কনফিডেন্স</span>
                </div>
              )}

              {/* Strength bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginBottom: 3 }}>
                  <span>PUT ↓</span>
                  <span style={{ color: C.gold, fontWeight: 700 }}>শক্তি {str}%</span>
                  <span>↑ CALL</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: '#0d1117', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, 50 - str)}%`, background: str <= 35 ? C.red : `${C.red}44`, borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${Math.max(0, str - 50)}%`, background: str >= 65 ? C.green : `${C.green}44`, borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
                  <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: C.border, transform: 'translateX(-50%)' }} />
                </div>
              </div>

              {/* Breakdown */}
              {Object.keys(sigData.breakdown).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: 8 }}>
                  {Object.entries(sigData.breakdown).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '4px 8px', borderRadius: 5, background: '#0d1117' }}>
                      <span style={{ color: '#444' }}>{k}</span>
                      <span style={{ color: v.includes('BULL') ? C.green : v.includes('BEAR') ? C.red : C.muted, fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {mLevel > 1 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: C.gold, fontWeight: 700 }}>
                  💰 মার্টিঙ্গেল: {mLevel}x
                </div>
              )}
            </div>

            {/* ── MARKET SELECT ── */}
            <select value={selected.id} onChange={e => setSelected(markets.find(m => m.id === e.target.value))}
              style={{ padding: '11px 12px', borderRadius: 8, background: C.panel, color: C.text, border: `1px solid ${C.border}`, fontSize: 12 }}>
              {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            {/* ── ACTION BUTTONS ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={fetchMarketData}
                disabled={scanning || !isSaved}
                style={{
                  flex: 2, padding: '14px', borderRadius: 8, fontWeight: 800, fontSize: 13,
                  border: 'none', cursor: scanning || !isSaved ? 'not-allowed' : 'pointer',
                  background: scanning ? C.panel : C.green,
                  color:      scanning ? C.muted : '#000',
                  opacity:    !isSaved ? 0.5 : 1,
                  transition: '0.2s',
                }}>
                {scanning ? '⟳ স্ক্যান হচ্ছে...' : '🔍 সিগনাল জেনারেট'}
              </button>
              <button onClick={() => setShowSettings(s => !s)} style={{
                flex: 1, padding: '14px', borderRadius: 8, background: C.panel,
                color: C.blue, fontWeight: 700, fontSize: 12,
                border: `1px solid ${C.border}`, cursor: 'pointer',
              }}>⚙️</button>
            </div>

            {/* ── SETTINGS ── */}
            {showSettings && (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Deriv API সেটিং
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" placeholder="App ID (default: 1089)" value={dAppId}
                    onChange={e => setDAppId(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, background: '#0d1117', color: C.text, border: `1px solid ${C.border}`, fontSize: 12, outline: 'none' }} />
                  <input type="password" placeholder="Deriv API Token" value={dToken}
                    onChange={e => setDToken(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 8, background: '#0d1117', color: C.text, border: `1px solid ${C.border}`, fontSize: 12, outline: 'none' }} />
                  <button onClick={handleSave} style={{
                    padding: 11, borderRadius: 8, background: C.gold,
                    color: '#000', fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                  }}>
                    {isSaved ? '✅ সেভ আছে' : '💾 সেভ করুন'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
  }
