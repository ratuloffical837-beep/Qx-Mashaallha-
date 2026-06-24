// ══════════════════════════════════════════
//   MASTER AI — SIGNAL ENGINE (7 Indicators)
// ══════════════════════════════════════════

export const markets = [
  { name: "EUR/USD",       id: "frxEURUSD",  tv: "FX:EURUSD" },
  { name: "GBP/USD",       id: "frxGBPUSD",  tv: "FX:GBPUSD" },
  { name: "USD/JPY",       id: "frxUSDJPY",  tv: "FX:USDJPY" },
  { name: "AUD/USD",       id: "frxAUDUSD",  tv: "FX:AUDUSD" },
  { name: "USD/CAD",       id: "frxUSDCAD",  tv: "FX:USDCAD" },
  { name: "EUR/JPY",       id: "frxEURJPY",  tv: "FX:EURJPY" },
  { name: "GBP/JPY",       id: "frxGBPJPY",  tv: "FX:GBPJPY" },
  { name: "Gold",          id: "frxXAUUSD",  tv: "OANDA:XAUUSD" },
  { name: "Bitcoin",       id: "cryBTCUSD",  tv: "BINANCE:BTCUSDT" },
  { name: "Ethereum",      id: "cryETHUSD",  tv: "BINANCE:ETHUSDT" },
  { name: "Nasdaq 100",    id: "OTCIXNDX",   tv: "CURRENCYCOM:US100" },
  { name: "S&P 500",       id: "OTCSPC",     tv: "FOREXCOM:SPX500" },
  { name: "Volatility 100",id: "R_100",      tv: "DERIV:R_100" },
  { name: "Volatility 75", id: "R_75",       tv: "DERIV:R_75" },
  { name: "EUR/GBP",       id: "frxEURGBP",  tv: "FX:EURGBP" },
  { name: "AUD/JPY",       id: "frxAUDJPY",  tv: "FX:AUDJPY" },
  { name: "EUR/AUD",       id: "frxEURAUD",  tv: "FX:EURAUD" },
  { name: "USD/CHF",       id: "frxUSDCHF",  tv: "FX:USDCHF" },
  { name: "Silver",        id: "frxXAGUSD",  tv: "OANDA:XAGUSD" },
  { name: "Crude Oil",     id: "frxWTI",     tv: "TVC:USOIL" },
  { name: "AUD/CAD",       id: "frxAUDCAD",  tv: "FX:AUDCAD" },
  { name: "AUD/CHF",       id: "frxAUDCHF",  tv: "FX:AUDCHF" },
  { name: "CHF/JPY",       id: "frxCHFJPY",  tv: "FX:CHFJPY" },
  { name: "EUR/CHF",       id: "frxEURCHF",  tv: "FX:EURCHF" },
  { name: "GBP/AUD",       id: "frxGBPAUD",  tv: "FX:GBPAUD" },
  { name: "CAD/JPY",       id: "frxCADJPY",  tv: "FX:CADJPY" },
  { name: "USD/CNY",       id: "frxUSDCNY",  tv: "FX:USDCNY" },
  { name: "China A50",     id: "OTCIXCHINA", tv: "FX:CHINAA50" },
  { name: "DAX 40",        id: "OTCIXDAX",   tv: "FOREXCOM:GRXEUR" },
]

// ── Indicator math ────────────────────────────────────────────

const ema = (arr, p) => {
  if (arr.length < p) return null
  const k = 2 / (p + 1)
  let val = arr.slice(0, p).reduce((a, b) => a + b, 0) / p
  for (let i = p; i < arr.length; i++) val = arr[i] * k + val * (1 - k)
  return val
}

const sma = (arr, p) => {
  if (arr.length < p) return null
  return arr.slice(-p).reduce((a, b) => a + b, 0) / p
}

const rsi = (arr, p = 14) => {
  if (arr.length < p + 1) return null
  const ch = arr.slice(-(p + 1)).map((v, i, a) => i === 0 ? 0 : v - a[i - 1]).slice(1)
  const ag = ch.filter(c => c > 0).reduce((a, b) => a + b, 0) / p
  const al = ch.filter(c => c < 0).reduce((a, b) => a - b, 0) / p
  if (al === 0) return 100
  return 100 - 100 / (1 + ag / al)
}

const bb = (arr, p = 20) => {
  if (arr.length < p) return null
  const sl = arr.slice(-p)
  const mid = sl.reduce((a, b) => a + b, 0) / p
  const std = Math.sqrt(sl.reduce((a, b) => a + (b - mid) ** 2, 0) / p)
  return { upper: mid + 2 * std, mid, lower: mid - 2 * std }
}

const macdFull = (arr) => {
  if (arr.length < 35) return null
  const series = []
  for (let i = arr.length - 9; i < arr.length; i++) {
    const sl = arr.slice(0, i + 1)
    const e12 = ema(sl, 12), e26 = ema(sl, 26)
    if (e12 && e26) series.push(e12 - e26)
  }
  if (series.length < 9) return null
  const sig = series.reduce((a, b) => a + b, 0) / 9
  const line = series[series.length - 1]
  return { line, signal: sig, hist: line - sig }
}

const stoch = (candles, p = 14) => {
  if (candles.length < p) return null
  const sl = candles.slice(-p)
  const hh = Math.max(...sl.map(c => parseFloat(c.high)))
  const ll = Math.min(...sl.map(c => parseFloat(c.low)))
  const cl = parseFloat(candles[candles.length - 1].close)
  if (hh === ll) return 50
  return ((cl - ll) / (hh - ll)) * 100
}

const atr = (candles, p = 14) => {
  if (candles.length < p + 1) return null
  const trs = candles.slice(-(p + 1)).map((c, i, a) => {
    if (i === 0) return 0
    const h = parseFloat(c.high), l = parseFloat(c.low), pc = parseFloat(a[i - 1].close)
    return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc))
  }).slice(1)
  return trs.reduce((a, b) => a + b, 0) / p
}

const patternScore = (candles) => {
  if (candles.length < 3) return 0
  const last = candles.slice(-3).map(c => {
    const o = parseFloat(c.open), cl = parseFloat(c.close)
    const h = parseFloat(c.high), l = parseFloat(c.low)
    return { o, cl, h, l, body: Math.abs(cl - o), bull: cl > o }
  })
  const [c2, c1, c0] = last
  const lw = Math.min(c0.o, c0.cl) - c0.l
  const uw = c0.h - Math.max(c0.o, c0.cl)

  // Bullish Engulfing
  if (c0.bull && !c1.bull && c0.o <= c1.cl && c0.cl >= c1.o && c0.body > c1.body) return 2
  // Bearish Engulfing
  if (!c0.bull && c1.bull && c0.o >= c1.cl && c0.cl <= c1.o && c0.body > c1.body) return -2
  // Hammer
  if (lw > c0.body * 2 && uw < c0.body * 0.3) return 1
  // Shooting Star
  if (uw > c0.body * 2 && lw < c0.body * 0.3) return -1
  // Morning Star
  if (!c2.bull && c1.body < c2.body * 0.3 && c0.bull && c0.cl > (c2.o + c2.cl) / 2) return 2
  // Evening Star
  if (c2.bull && c1.body < c2.body * 0.3 && !c0.bull && c0.cl < (c2.o + c2.cl) / 2) return -2
  // 3 consecutive
  if (last.every(c => c.bull)) return 1
  if (last.every(c => !c.bull)) return -1
  return 0
}

// ── MASTER ENGINE ─────────────────────────────────────────────
export const runSignalEngine = (candles) => {
  const EMPTY = { direction: null, strength: 50, breakdown: {}, confidence: 0 }
  if (candles.length < 40) return EMPTY

  const closes = candles.map(c => parseFloat(c.close))
  const last = closes[closes.length - 1]
  let score = 0, maxScore = 0
  const bd = {}

  // 1. EMA 8/21 — weight 20
  const e8 = ema(closes, 8), e21 = ema(closes, 21)
  if (e8 && e21) {
    const gap = Math.abs((e8 - e21) / e21) * 100
    const w = Math.min(20, gap * 300)
    const v = e8 > e21 ? w : -w
    score += v; maxScore += 20
    bd['EMA 8/21'] = v > 0 ? '↑ BULL' : '↓ BEAR'
  }

  // 2. EMA 21/50 trend filter — weight 15
  const e50 = ema(closes, 50)
  if (e21 && e50) {
    const v = e21 > e50 ? 15 : -15
    score += v; maxScore += 15
    bd['EMA 21/50'] = v > 0 ? '↑ BULL' : '↓ BEAR'
  }

  // 3. RSI — weight 20
  const r = rsi(closes, 14)
  if (r !== null) {
    let v = 0
    if (r < 25) v = 20
    else if (r < 35) v = 13
    else if (r < 45) v = 5
    else if (r > 75) v = -20
    else if (r > 65) v = -13
    else if (r > 55) v = -5
    score += v; maxScore += 20
    bd[`RSI ${r.toFixed(0)}`] = v > 2 ? '↑ BULL' : v < -2 ? '↓ BEAR' : '→ NEUTRAL'
  }

  // 4. Bollinger Bands — weight 18
  const b = bb(closes, 20)
  if (b) {
    const pct = (last - b.lower) / (b.upper - b.lower)
    let v = 0
    if (pct < 0.05) v = 18
    else if (pct < 0.2) v = 10
    else if (pct < 0.4) v = 4
    else if (pct > 0.95) v = -18
    else if (pct > 0.8) v = -10
    else if (pct > 0.6) v = -4
    score += v; maxScore += 18
    bd['Bollinger'] = v > 0 ? '↑ BULL' : v < 0 ? '↓ BEAR' : '→ MID'
  }

  // 5. MACD — weight 18
  const m = macdFull(closes)
  if (m) {
    const cv = m.line > m.signal ? 10 : -10
    const hv = m.hist > 0 ? 8 : -8
    score += cv + hv; maxScore += 18
    bd['MACD'] = (cv + hv) > 0 ? '↑ BULL' : '↓ BEAR'
  }

  // 6. Stochastic — weight 15
  const st = stoch(candles, 14)
  if (st !== null) {
    let v = 0
    if (st < 20) v = 15
    else if (st < 35) v = 8
    else if (st > 80) v = -15
    else if (st > 65) v = -8
    score += v; maxScore += 15
    bd[`Stoch ${st.toFixed(0)}`] = v > 0 ? '↑ BULL' : v < 0 ? '↓ BEAR' : '→ NEUTRAL'
  }

  // 7. Candle Pattern — weight 14
  const pat = patternScore(candles)
  if (pat !== 0) {
    const v = pat * 7
    score += v; maxScore += 14
    bd['Pattern'] = v > 0 ? '↑ BULL' : '↓ BEAR'
  } else {
    bd['Pattern'] = '→ NEUTRAL'
  }

  // ATR volatility gate
  const a = atr(candles, 14)
  const s20 = sma(closes, 20)
  const atrPct = a && s20 ? (a / s20) * 100 : 999
  if (atrPct < 0.015) {
    return { direction: null, strength: 50, breakdown: { 'ATR Gate': '⛔ কম ভোলাটিলিটি' }, confidence: 0 }
  }

  // Final
  if (maxScore === 0) return EMPTY
  const strength = Math.round(((score / maxScore) + 1) / 2 * 100)
  const bulls = Object.values(bd).filter(v => v.includes('BULL')).length
  const bears = Object.values(bd).filter(v => v.includes('BEAR')).length
  const total = bulls + bears
  const confidence = total > 0 ? Math.round((Math.max(bulls, bears) / total) * 100) : 0

  let direction = null
  if (strength >= 65 && confidence >= 70) direction = 'CALL'
  else if (strength <= 35 && confidence >= 70) direction = 'PUT'

  return { direction, strength, breakdown: bd, confidence }
   }
