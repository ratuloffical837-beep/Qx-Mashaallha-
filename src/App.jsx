import React, { useState, useEffect, useRef, useCallback } from 'react';

const markets = [
  { name: "EUR/USD", id: "frxEURUSD", tv: "FX:EURUSD" },
  { name: "GBP/USD", id: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "USD/JPY", id: "frxUSDJPY", tv: "FX:USDJPY" },
  { name: "AUD/USD", id: "frxAUDUSD", tv: "FX:AUDUSD" },
  { name: "USD/CAD", id: "frxUSDCAD", tv: "FX:USDCAD" },
  { name: "EUR/JPY", id: "frxEURJPY", tv: "FX:EURJPY" },
  { name: "GBP/JPY", id: "frxGBPJPY", tv: "FX:GBPJPY" },
  { name: "Gold", id: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "Bitcoin", id: "cryBTCUSD", tv: "BINANCE:BTCUSDT" },
  { name: "Ethereum", id: "cryETHUSD", tv: "BINANCE:ETHUSDT" },
  { name: "Nasdaq 100", id: "OTCIXNDX", tv: "CURRENCYCOM:US100" },
  { name: "S&P 500", id: "OTCSPC", tv: "FOREXCOM:SPX500" },
  { name: "Volatility 100", id: "R_100", tv: "DERIV:R_100" },
  { name: "Volatility 75", id: "R_75", tv: "DERIV:R_75" },
  { name: "EUR/GBP", id: "frxEURGBP", tv: "FX:EURGBP" },
  { name: "AUD/JPY", id: "frxAUDJPY", tv: "FX:AUDJPY" },
  { name: "EUR/AUD", id: "frxEURAUD", tv: "FX:EURAUD" },
  { name: "USD/CHF", id: "frxUSDCHF", tv: "FX:USDCHF" },
  { name: "Silver", id: "frxXAGUSD", tv: "OANDA:XAGUSD" },
  { name: "Crude Oil", id: "frxWTI", tv: "TVC:USOIL" },
  { name: "AUD/CAD", id: "frxAUDCAD", tv: "FX:AUDCAD" },
  { name: "AUD/CHF", id: "frxAUDCHF", tv: "FX:AUDCHF" },
  { name: "CHF/JPY", id: "frxCHFJPY", tv: "FX:CHFJPY" },
  { name: "EUR/CHF", id: "frxEURCHF", tv: "FX:EURCHF" },
  { name: "GBP/AUD", id: "frxGBPAUD", tv: "FX:GBPAUD" },
  { name: "CAD/JPY", id: "frxCADJPY", tv: "FX:CADJPY" },
  { name: "USD/CNY", id: "frxUSDCNY", tv: "FX:USDCNY" },
  { name: "China A50", id: "OTCIXCHINA", tv: "FX:CHINAA50" },
  { name: "DAX 40", id: "OTCIXDAX", tv: "FOREXCOM:GRXEUR" },
];

// ─── SIGNAL ENGINE ──────────────────────────────────────────────────────────

/** Simple Moving Average */
const calcSMA = (closes, period) => {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

/** Exponential Moving Average */
const calcEMA = (closes, period) => {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
};

/** RSI (14) */
const calcRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return null;
  const changes = closes.slice(-period - 1).map((v, i, arr) =>
    i === 0 ? 0 : v - arr[i - 1]
  ).slice(1);
  const gains = changes.map(c => (c > 0 ? c : 0));
  const losses = changes.map(c => (c < 0 ? -c : 0));
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

/** Bollinger Bands (20, 2σ) */
const calcBB = (closes, period = 20) => {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period);
  return { upper: mid + 2 * std, mid, lower: mid - 2 * std };
};

/** MACD (12, 26, 9) */
const calcMACD = (closes) => {
  if (closes.length < 35) return null;
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12 || !ema26) return null;
  const macdLine = ema12 - ema26;
  // Signal line needs 9 prior MACD values — approximate with current only
  return { macd: macdLine };
};

/** Candle pattern score: returns +1 (bullish) / -1 (bearish) / 0 */
const candlePatternScore = (candles) => {
  if (candles.length < 3) return 0;
  const [c2, c1, c0] = candles.slice(-3).map(c => ({
    o: parseFloat(c.open),
    h: parseFloat(c.high),
    cl: parseFloat(c.close),
    l: parseFloat(c.low),
    body: Math.abs(parseFloat(c.close) - parseFloat(c.open)),
    bull: parseFloat(c.close) > parseFloat(c.open),
  }));

  // Engulfing
  if (c0.bull && !c1.bull && c0.o < c1.cl && c0.cl > c1.o) return 1;  // Bullish engulf
  if (!c0.bull && c1.bull && c0.o > c1.cl && c0.cl < c1.o) return -1; // Bearish engulf

  // Hammer / Shooting Star (last candle)
  const lowerWick = Math.min(c0.o, c0.cl) - c0.l;
  const upperWick = c0.h - Math.max(c0.o, c0.cl);
  if (lowerWick > c0.body * 2 && upperWick < c0.body * 0.5) return 1;  // Hammer
  if (upperWick > c0.body * 2 && lowerWick < c0.body * 0.5) return -1; // Shooting star

  // Three consecutive same-colour (trend continuation)
  const last3 = candles.slice(-3).map(c => parseFloat(c.close) > parseFloat(c.open));
  if (last3.every(Boolean)) return 1;
  if (last3.every(v => !v)) return -1;

  // Doji (indecision — no signal)
  if (c0.body < (c0.h - c0.l) * 0.1) return 0;

  return 0;
};

/**
 * MASTER SIGNAL ENGINE
 * Returns { direction: 'CALL'|'PUT'|null, strength: 0-100, breakdown: {} }
 */
const runSignalEngine = (candles) => {
  // Need at least 30 candles for all indicators
  if (candles.length < 30) return { direction: null, strength: 0, breakdown: {} };

  const closes = candles.map(c => parseFloat(c.close));
  const last = closes[closes.length - 1];

  // ── Indicator values ──────────────────────────────────────
  const ema8   = calcEMA(closes, 8);
  const ema21  = calcEMA(closes, 21);
  const rsi    = calcRSI(closes, 14);
  const bb     = calcBB(closes, 20);
  const macd   = calcMACD(closes);
  const sma50  = calcSMA(closes, Math.min(50, closes.length));
  const pat    = candlePatternScore(candles);

  // ── Weighted vote system ──────────────────────────────────
  // Each indicator votes: +weight (CALL) or -weight (PUT) or 0 (neutral)
  let total = 0;
  let maxTotal = 0;
  const breakdown = {};

  // 1. EMA cross (weight: 25)
  if (ema8 !== null && ema21 !== null) {
    const vote = ema8 > ema21 ? 25 : -25;
    total += vote;
    maxTotal += 25;
    breakdown['EMA 8/21'] = vote > 0 ? '↑ BULL' : '↓ BEAR';
  }

  // 2. RSI (weight: 20)
  if (rsi !== null) {
    let vote = 0;
    if (rsi < 30) vote = 20;        // Oversold → CALL
    else if (rsi > 70) vote = -20;  // Overbought → PUT
    else if (rsi < 45) vote = 10;   // Lean bullish
    else if (rsi > 55) vote = -10;  // Lean bearish
    total += vote;
    maxTotal += 20;
    breakdown[`RSI ${rsi.toFixed(1)}`] = vote > 0 ? '↑ BULL' : vote < 0 ? '↓ BEAR' : '→ NEUTRAL';
  }

  // 3. Bollinger Bands (weight: 20)
  if (bb !== null) {
    let vote = 0;
    if (last <= bb.lower) vote = 20;       // Price at lower band → CALL
    else if (last >= bb.upper) vote = -20; // Price at upper band → PUT
    else if (last < bb.mid) vote = 8;
    else if (last > bb.mid) vote = -8;
    total += vote;
    maxTotal += 20;
    breakdown['Bollinger'] = vote > 0 ? '↑ BULL' : vote < 0 ? '↓ BEAR' : '→ MID';
  }

  // 4. MACD (weight: 20)
  if (macd !== null) {
    const vote = macd.macd > 0 ? 20 : -20;
    total += vote;
    maxTotal += 20;
    breakdown['MACD'] = vote > 0 ? '↑ BULL' : '↓ BEAR';
  }

  // 5. Price vs SMA50 (weight: 15)
  if (sma50 !== null) {
    const vote = last > sma50 ? 15 : -15;
    total += vote;
    maxTotal += 15;
    breakdown['SMA 50'] = vote > 0 ? '↑ BULL' : '↓ BEAR';
  }

  // 6. Candle Pattern (weight: 20)
  if (pat !== 0) {
    const vote = pat * 20;
    total += vote;
    maxTotal += 20;
    breakdown['Pattern'] = vote > 0 ? '↑ BULL' : '↓ BEAR';
  } else {
    breakdown['Pattern'] = '→ NEUTRAL';
  }

  // ── Final score: normalize to 0-100 ──────────────────────
  if (maxTotal === 0) return { direction: null, strength: 0, breakdown };

  const normalized = ((total / maxTotal) + 1) / 2 * 100; // 0–100
  const strength = Math.round(normalized);

  // Only fire signal if ≥60% confident (bias-adjusted threshold)
  let direction = null;
  if (strength >= 62) direction = 'CALL';
  else if (strength <= 38) direction = 'PUT';

  return { direction, strength, breakdown };
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected] = useState(markets[0]);
  const [token, setToken]       = useState(localStorage.getItem('d_token') || '');
  const [appId, setAppId]       = useState(localStorage.getItem('d_app_id') || '1089');
  const [isSaved, setIsSaved]   = useState(!!localStorage.getItem('d_token'));
  const [liveTime, setLiveTime] = useState('--:--:--');
  const [connStatus, setConnStatus] = useState('OFFLINE');
  const [signalData, setSignalData] = useState({ direction: null, strength: 50, breakdown: {} });
  const [score, setScore]       = useState(
    JSON.parse(localStorage.getItem('trade_score')) || { win: 0, loss: 0, profit: 0 }
  );
  const [unlockTime, setUnlockTime]     = useState(localStorage.getItem('unlock_time') || null);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [mLevel, setMLevel]     = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const wsRef = useRef(null);

  // Daily target based on days since start
  const dailyTarget = (() => {
    const key = 'start_date';
    if (!localStorage.getItem(key)) localStorage.setItem(key, new Date().toISOString());
    const days = Math.floor((new Date() - new Date(localStorage.getItem(key))) / 86400000);
    return days < 3 ? 6 : days < 6 ? 12 : 20;
  })();

  // ── Fetch market data via Deriv WS ────────────────────────
  const fetchMarketData = useCallback(() => {
    if (!isSaved || isLocked) return;
    if (wsRef.current) wsRef.current.close();
    setScanning(true);

    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));

    ws.onmessage = (msg) => {
      const res = JSON.parse(msg.data);

      if (res.error) {
        const code = res.error.code;
        setConnStatus(
          code === 'InvalidToken' ? 'TOKEN ERROR ❌' :
          code === 'InvalidAppID' ? 'APP ID ERROR ❌' : `ERROR: ${code}`
        );
        setScanning(false);
        ws.close();
        return;
      }

      if (res.msg_type === 'authorize') {
        setConnStatus('CONNECTED ✅');
        // Fetch last 60 completed candles (1-minute)
        ws.send(JSON.stringify({
          ticks_history: selected.id,
          count: 60,
          end: 'latest',
          style: 'candles',
          granularity: 60,
        }));
      }

      if (res.msg_type === 'candles' && res.candles) {
        // Drop the last (potentially incomplete) candle
        const completed = res.candles.slice(0, -1);
        const result = runSignalEngine(completed);
        setSignalData(result);

        if (result.direction) {
          setLastPrediction(result.direction);
          try {
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
          } catch (_) {}
        }

        setScanning(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setConnStatus('NETWORK ERROR ❌');
      setScanning(false);
    };
  }, [isSaved, isLocked, token, appId, selected]);

  // ── Auto result check at second :04 ──────────────────────
  const checkAutoResult = useCallback(() => {
    if (!lastPrediction) return;

    const ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);
    ws.onopen = () =>
      ws.send(JSON.stringify({
        ticks_history: selected.id,
        count: 3,
        end: 'latest',
        style: 'candles',
        granularity: 60,
      }));

    ws.onmessage = (msg) => {
      const res = JSON.parse(msg.data);
      if (res.msg_type === 'candles' && res.candles) {
        // The last COMPLETED candle (second-to-last in array)
        const closed = res.candles[res.candles.length - 2];
        if (!closed) { ws.close(); return; }

        const actualDir = parseFloat(closed.close) > parseFloat(closed.open) ? 'CALL' : 'PUT';
        const isWin = lastPrediction === actualDir;

        setScore(prev => {
          const profitChange = isWin ? parseFloat((mLevel * 0.85).toFixed(2)) : -mLevel;
          const updated = {
            win:    isWin ? prev.win + 1 : prev.win,
            loss:   isWin ? prev.loss : prev.loss + 1,
            profit: parseFloat((prev.profit + profitChange).toFixed(2)),
          };
          localStorage.setItem('trade_score', JSON.stringify(updated));

          if (updated.profit >= dailyTarget) {
            const lock = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
            setUnlockTime(lock);
            localStorage.setItem('unlock_time', lock);
          }
          return updated;
        });

        // Martingale: 1x → 2.5x → 5.5x → reset
        if (isWin) {
          setMLevel(1);
        } else {
          setMLevel(prev =>
            prev === 1 ? 2.5 : prev === 2.5 ? 5.5 : 1
          );
        }

        setLastPrediction(null);
        setSignalData({ direction: null, strength: 50, breakdown: {} });
        ws.close();
      }
    };

    ws.onerror = () => ws.close();
  }, [lastPrediction, mLevel, appId, selected, dailyTarget]);

  // ── Clock + auto-scan timer ───────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-GB'));
      const sec = now.getSeconds();

      // Lock check
      if (unlockTime) {
        if (now < new Date(unlockTime)) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
          setUnlockTime(null);
          localStorage.removeItem('unlock_time');
        }
      }

      // Auto scan at :56 (4 seconds before new candle)
      if (sec === 56 && isSaved && !isLocked) fetchMarketData();

      // Auto result at :04 of next minute
      if (sec === 4 && isSaved && !isLocked && lastPrediction) checkAutoResult();
    }, 1000);

    return () => clearInterval(tick);
  }, [fetchMarketData, checkAutoResult, isSaved, isLocked, unlockTime, lastPrediction]);

  // ── Helpers ───────────────────────────────────────────────
  const handleSave = () => {
    localStorage.setItem('d_token', token);
    localStorage.setItem('d_app_id', appId);
    setIsSaved(true);
  };

  const handleReset = () => {
    if (!window.confirm('Score রিসেট করবেন?')) return;
    const empty = { win: 0, loss: 0, profit: 0 };
    setScore(empty);
    localStorage.removeItem('trade_score');
    localStorage.removeItem('start_date');
  };

  const dir = signalData.direction;
  const str = signalData.strength;
  const isCall = dir === 'CALL';
  const isPut  = dir === 'PUT';

  // Signal label
  const signalLabel =
    scanning      ? 'SCANNING...' :
    isCall        ? '▲  CALL  (UP)' :
    isPut         ? '▼  PUT  (DOWN)' :
    lastPrediction ? 'WAITING RESULT...' :
                    'WAITING SIGNAL';

  return (
    <div style={{ background: '#0b0e11', color: '#e0e0e0', fontFamily: "'Inter', sans-serif", minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: '#141820',
        borderBottom: '1px solid #2b3139', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.05em',
      }}>
        <span style={{ color: connStatus.includes('✅') ? '#0ecb81' : '#f6465d' }}>
          {connStatus}
        </span>
        <span style={{ color: '#f3ba2f' }}>🎯 GOAL: ${dailyTarget}</span>
        <span style={{ color: '#9ba3af', fontVariantNumeric: 'tabular-nums' }}>{liveTime}</span>
      </header>

      {/* ── CHART ── */}
      <div style={{ height: '36vh', background: '#0d1117' }}>
        <iframe
          key={selected.id}
          src={`https://s.tradingview.com/widgetembed/?symbol=${selected.tv}&theme=dark&hide_top_toolbar=1&save_image=0`}
          width="100%" height="100%"
          style={{ border: 'none', display: 'block' }}
          title="chart"
        />
      </div>

      {/* ── SCORE ROW ── */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px 0' }}>
        {[
          { label: 'WIN',    value: score.win,    color: '#0ecb81' },
          { label: 'LOSS',   value: score.loss,   color: '#f6465d' },
          { label: 'PROFIT', value: `$${score.profit}`, color: '#f3ba2f' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, padding: '10px 6px', borderRadius: 8, textAlign: 'center',
            background: '#1a1f2e', border: `1px solid ${color}22`,
            color, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
          }}>
            <div style={{ color: '#555', fontSize: 9, marginBottom: 4 }}>{label}</div>
            {value}
          </div>
        ))}
        <button onClick={handleReset} style={{
          padding: '0 10px', borderRadius: 8, background: '#1a1f2e',
          border: '1px solid #2b3139', color: '#555', fontSize: 9, cursor: 'pointer',
        }}>RESET</button>
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {isLocked ? (
          /* ── LOCKED STATE ── */
          <div style={{
            background: 'rgba(243,186,47,0.08)', border: '2px solid #f3ba2f',
            borderRadius: 14, padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
            <div style={{ color: '#f3ba2f', fontWeight: 800, fontSize: 16 }}>TARGET ACHIEVED</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
              Unlock at {new Date(unlockTime).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <>
            {/* ── SIGNAL CARD ── */}
            <div style={{
              borderRadius: 14, padding: '18px 16px',
              background: '#141820',
              border: `2px solid ${isCall ? '#0ecb81' : isPut ? '#f6465d' : '#2b3139'}`,
              boxShadow: isCall ? '0 0 20px #0ecb8133' : isPut ? '0 0 20px #f6465d33' : 'none',
              transition: 'all 0.4s',
            }}>
              {/* Direction */}
              <div style={{
                textAlign: 'center', fontSize: 22, fontWeight: 900, letterSpacing: '0.06em',
                color: isCall ? '#0ecb81' : isPut ? '#f6465d' : '#555',
                marginBottom: 12,
              }}>
                {signalLabel}
              </div>

              {/* Strength bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginBottom: 4 }}>
                  <span>PUT</span>
                  <span style={{ color: '#f3ba2f', fontWeight: 700 }}>STRENGTH {str}%</span>
                  <span>CALL</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#0d1117', position: 'relative', overflow: 'hidden' }}>
                  {/* PUT side (left) */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${Math.max(0, 50 - str)}%`,
                    background: str <= 38 ? '#f6465d' : '#f6465d44',
                    borderRadius: '4px 0 0 4px', transition: 'width 0.5s',
                  }} />
                  {/* CALL side (right) */}
                  <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: `${Math.max(0, str - 50)}%`,
                    background: str >= 62 ? '#0ecb81' : '#0ecb8144',
                    borderRadius: '0 4px 4px 0', transition: 'width 0.5s',
                  }} />
                  {/* Center line */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
                    background: '#2b3139', transform: 'translateX(-50%)',
                  }} />
                </div>
              </div>

              {/* Indicator breakdown */}
              {Object.keys(signalData.breakdown).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
                  {Object.entries(signalData.breakdown).map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10, padding: '4px 8px', borderRadius: 6,
                      background: '#0d1117',
                    }}>
                      <span style={{ color: '#666' }}>{k}</span>
                      <span style={{
                        color: v.includes('BULL') ? '#0ecb81' : v.includes('BEAR') ? '#f6465d' : '#555',
                        fontWeight: 700,
                      }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Martingale level */}
              {(lastPrediction || mLevel > 1) && (
                <div style={{
                  marginTop: 10, textAlign: 'center', fontSize: 11,
                  color: '#f3ba2f', fontWeight: 700,
                }}>
                  💰 Investment Level: {mLevel}x
                </div>
              )}
            </div>

            {/* ── CONTROLS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Market selector */}
              <select
                value={selected.id}
                onChange={e => setSelected(markets.find(m => m.id === e.target.value))}
                style={{
                  padding: '11px 12px', borderRadius: 8,
                  background: '#1a1f2e', color: '#e0e0e0',
                  border: '1px solid #2b3139', fontSize: 12,
                }}
              >
                {markets.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              {/* Inputs */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text" placeholder="App ID" value={appId}
                  onChange={e => setAppId(e.target.value)}
                  style={{
                    flex: 1, padding: '11px 12px', borderRadius: 8,
                    background: '#1a1f2e', color: '#e0e0e0',
                    border: '1px solid #2b3139', fontSize: 12,
                  }}
                />
                <input
                  type="password" placeholder="API Token" value={token}
                  onChange={e => setToken(e.target.value)}
                  style={{
                    flex: 2, padding: '11px 12px', borderRadius: 8,
                    background: '#1a1f2e', color: '#e0e0e0',
                    border: '1px solid #2b3139', fontSize: 12,
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 2, padding: '13px', borderRadius: 8,
                    background: isSaved ? '#0ecb81' : '#f3ba2f',
                    color: '#000', fontWeight: 800, fontSize: 13,
                    border: 'none', cursor: 'pointer', letterSpacing: '0.05em',
                  }}
                >
                  {isSaved ? '✅ AI ACTIVE' : '▶ RUN MASTER AI'}
                </button>
                {isSaved && (
                  <button
                    onClick={fetchMarketData}
                    disabled={scanning}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 8,
                      background: scanning ? '#2b3139' : '#1e3a5f',
                      color: scanning ? '#555' : '#60a5fa',
                      fontWeight: 700, fontSize: 12,
                      border: '1px solid #2b3139', cursor: scanning ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {scanning ? '...' : '🔍 SCAN'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
