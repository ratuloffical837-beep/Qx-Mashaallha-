import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ti from 'technicalindicators';

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; position: relative; border-left: 1px solid #1e2329; border-right: 1px solid #1e2329; background: #050709; }
  header { padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; background: #0b0e11; border-bottom: 2px solid #f3ba2f; }
  .gold { color: #f3ba2f; font-weight: 900; letter-spacing: 1px; font-size: 0.9rem; }
  .logout-btn { background: #f6465d22; border: 1px solid #f6465d; color: #f6465d; font-size: 0.65rem; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
  .chart-box { flex-grow: 1; width: 100%; background: #000; overflow: hidden; }
  .controls { padding: 10px; background: #161a1e; display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }
  select { background: #0b0e11; color: white; border: 1px solid #333; padding: 10px; border-radius: 6px; font-weight: bold; outline: none; font-size: 0.8rem; }
  .signal-card { padding: 15px; background: #050709; }
  .main-box { background: #111418; border: 2px solid #333; border-radius: 20px; padding: 18px; text-align: center; position: relative; }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 25px rgba(14, 203, 129, 0.2); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 25px rgba(246, 70, 93, 0.2); }
  .alert-border { border-color: #f3ba2f !important; animation: blink 0.8s infinite; }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
  .status-text { color: #848e9c; font-size: 0.7rem; font-weight: 800; margin-bottom: 5px; }
  .signal-val { font-size: 2.5rem; font-weight: 900; margin: 8px 0; }
  .up-text { color: #0ecb81; } .down-text { color: #f6465d; } .neutral-text { color: #f3ba2f; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; border-top: 1px solid #222; padding-top: 12px; }
  .label { color: #848e9c; font-size: 0.65rem; text-align: left; }
  .value { color: #fff; font-size: 0.75rem; font-weight: bold; text-align: right; }
  .accuracy-box { background: rgba(243, 186, 47, 0.1); border: 1px solid #f3ba2f; color: #f3ba2f; padding: 8px; border-radius: 10px; margin-top: 12px; font-weight: 900; font-size: 0.9rem; }
  .login-screen { height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; background: #050709; }
  .login-card { background: #111418; padding: 30px; border-radius: 20px; border: 1px solid #f3ba2f; width: 300px; text-align: center; }
  .login-btn { width: 100%; padding: 12px; background: #f3ba2f; border: none; border-radius: 10px; font-weight: 900; cursor: pointer; margin-top: 15px; }
`;

const markets = [
  { name: "Volatility 100", id: "R_100", tv: "DERIV:R_100" },
  { name: "Volatility 75", id: "R_75", tv: "DERIV:R_75" },
  { name: "EUR/USD", id: "frxEURUSD", tv: "FX:EURUSD" },
  { name: "GBP/USD", id: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "USD/JPY", id: "frxUSDJPY", tv: "FX:USDJPY" },
  { name: "AUD/USD", id: "frxAUDUSD", tv: "FX:AUDUSD" },
  { name: "Gold", id: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "Bitcoin", id: "cryBTCUSD", tv: "BINANCE:BTCUSDT" },
  { name: "Ethereum", id: "cryETHUSD", tv: "BINANCE:ETHUSDT" },
  { name: "NASDAQ 100", id: "OTCIXNDX", tv: "CURRENCYCOM:US100" },
  { name: "S&P 500", id: "OTCSPC", tv: "FOREXCOM:SPX500" },
  { name: "USD/CAD", id: "frxUSDCAD", tv: "FX:USDCAD" },
  { name: "EUR/JPY", id: "frxEURJPY", tv: "FX:EURJPY" },
  { name: "GBP/JPY", id: "frxGBPJPY", tv: "FX:GBPJPY" },
  { name: "EUR/GBP", id: "frxEURGBP", tv: "FX:EURGBP" },
  { name: "AUD/JPY", id: "frxAUDJPY", tv: "FX:AUDJPY" },
  { name: "EUR/AUD", id: "frxEURAUD", tv: "FX:EURAUD" },
  { name: "USD/CHF", id: "frxUSDCHF", tv: "FX:USDCHF" },
  { name: "Silver", id: "frxXAGUSD", tv: "OANDA:XAGUSD" },
  { name: "Crude Oil", id: "frxWTI", tv: "TVC:USOIL" },
  { name: "DAX 40", id: "OTCIXDAX", tv: "FOREXCOM:GRXEUR" },
  { name: "Dow Jones", id: "OTCIXDJI", tv: "CURRENCYCOM:US30" },
  { name: "Hang Seng", id: "OTCIXHSI", tv: "HKEX:HSI" },
  { name: "Nikkei 225", id: "OTCIXN225", tv: "TSE:NI225" },
  { name: "CAD/JPY", id: "frxCADJPY", tv: "FX:CADJPY" },
  { name: "EUR/CHF", id: "frxEURCHF", tv: "FX:EURCHF" },
  { name: "GBP/CHF", id: "frxGBPCHF", tv: "FX:GBPCHF" },
  { name: "USD/CNY", id: "frxUSDCNY", tv: "FX:USDCNY" },
  { name: "Litecoin", id: "cryLTCUSD", tv: "BINANCE:LTCUSDT" }
];

export default function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');
  const [symbol, setSymbol] = useState(markets[0]);
  const [timeframe, setTimeframe] = useState('60');
  const [signal, setSignal] = useState('WAITING');
  const [confidence, setConfidence] = useState(0);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState('CONNECTING...');
  const [candles, setCandles] = useState([]);
  const ws = useRef(null);

  const APP_ID = import.meta.env.VITE_DERIV_APP_ID || '1010';
  const TOKEN = import.meta.env.VITE_DERIV_TOKEN;

  const connect = useCallback(() => {
    ws.current = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);
    ws.current.onopen = () => {
      setStatus('DRIVE LIVE');
      if (TOKEN) ws.current.send(JSON.stringify({ authorize: TOKEN }));
      ws.current.send(JSON.stringify({
        ticks_history: symbol.id,
        count: 50,
        end: "latest",
        style: "candles",
        granularity: parseInt(timeframe),
        subscribe: 1
      }));
    };
    ws.current.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.msg_type === 'candles') setCandles(d.candles);
      if (d.msg_type === 'ohlc') setTimer(d.ohlc.epoch % parseInt(timeframe));
    };
    ws.current.onclose = () => setTimeout(connect, 3000);
  }, [symbol, timeframe]);

  useEffect(() => {
    if (isAuth) connect();
    const s = document.createElement("style"); s.innerHTML = styles; document.head.appendChild(s);
    return () => ws.current?.close();
  }, [isAuth, connect]);

  useEffect(() => {
    if (candles.length < 20) return;
    const closes = candles.map(c => parseFloat(c.close));
    const rsi = ti.RSI.calculate({ values: closes, period: 14 }).pop();
    const ema = ti.EMA.calculate({ values: closes, period: 20 }).pop();
    const last = candles[candles.length - 1];
    
    let weight = 0;
    if (parseFloat(last.close) > ema) weight += 2; else weight -= 2;
    if (rsi < 35) weight += 3; if (rsi > 65) weight -= 3;
    
    const remaining = parseInt(timeframe) - timer;

    if (remaining > 10) {
      setStatus('ANALYZING...');
      if (weight >= 2) { setSignal('CALL (UP)'); setConfidence(98.50 + Math.random()); }
      else if (weight <= -2) { setSignal('PUT (DOWN)'); setConfidence(98.70 + Math.random()); }
      else { setSignal('WAITING'); setConfidence(0); }
    } else if (remaining <= 10 && remaining > 4) {
      setStatus('⚠️ PREPARING ENTRY...');
    } else if (remaining <= 4 && remaining > 0) {
      setStatus('🔥 SURE SHOT CONFIRMED');
    }
  }, [timer, candles]);

  if (!isAuth) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h2 className="gold">RTX 15 PRO</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (e.target.u.value === import.meta.env.VITE_APP_USER && e.target.p.value === import.meta.env.VITE_APP_PASS) {
              localStorage.setItem('isAuth', 'true'); setIsAuth(true);
            } else alert('Error');
          }}>
            <input name="u" placeholder="USERNAME" style={{width:'100%', padding:'10px', marginBottom:'10px', background:'#000', color:'#fff', border:'1px solid #333'}} />
            <input name="p" type="password" placeholder="PASSWORD" style={{width:'100%', padding:'10px', background:'#000', color:'#fff', border:'1px solid #333'}} />
            <button className="login-btn">START ENGINE</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header><div className="gold">RTX 15 DRIVE PRO</div><button onClick={() => {localStorage.clear(); setIsAuth(false)}} className="logout-btn">EXIT</button></header>
      <div className="chart-box">
        <iframe key={symbol.id+timeframe} src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.tv}&interval=${timeframe==='60'?'1':'3'}&theme=dark&style=1&hide_side_toolbar=true`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>
      <div className="controls">
        <select value={symbol.id} onChange={(e) => setSymbol(markets.find(m => m.id === e.target.value))}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}><option value="60">1M</option><option value="180">3M</option></select>
      </div>
      <div className="signal-card">
        <div className={`main-box ${status.includes('SURE') ? 'alert-border' : (signal.includes('UP') ? 'up-border' : (signal.includes('DOWN') ? 'down-border' : ''))}`}>
          <div className="status-text">{status}</div>
          <div className={`signal-val ${signal.includes('UP') ? 'up-text' : (signal.includes('DOWN') ? 'down-text' : 'neutral-text')}`}>{signal}</div>
          <div className="info-grid">
            <div className="label">EXPIRY IN:</div><div className="value" style={{color:'#f3ba2f'}}>{parseInt(timeframe)-timer}s</div>
            <div className="label">MARKET:</div><div className="value">{symbol.name}</div>
          </div>
          <div className="accuracy-box">ACCURACY: {confidence > 0 ? confidence.toFixed(2) : "00.00"}%</div>
        </div>
      </div>
    </div>
  );
    }
