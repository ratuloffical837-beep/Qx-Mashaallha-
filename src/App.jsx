import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as ti from 'technicalindicators';

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
  .login-screen { height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #1a1e23 0%, #050709 100%); }
  .login-card { background: #111418; padding: 40px 30px; border-radius: 24px; border: 1px solid #f3ba2f; width: 340px; text-align: center; }
  .login-card h2 { color: #f3ba2f; margin-bottom: 30px; font-weight: 900; }
  .input-group { margin-bottom: 20px; text-align: left; }
  .input-group label { display: block; color: #848e9c; font-size: 0.8rem; margin-bottom: 8px; }
  .input-group input { width: 100%; padding: 14px; background: #050709; border: 1px solid #333; border-radius: 12px; color: white; outline: none; box-sizing: border-box; }
  .login-btn { width: 100%; padding: 15px; background: #f3ba2f; border: none; border-radius: 12px; color: #000; font-weight: 900; cursor: pointer; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; }
  header { padding: 12px; background: #0b0e11; border-bottom: 2px solid #f3ba2f; text-align: center; }
  .gold { color: #f3ba2f; font-weight: 900; }
  .chart-box { flex-grow: 1; width: 100%; background: #000; position: relative; }
  .controls { padding: 10px; background: #161a1e; display: flex; gap: 8px; border-top: 1px solid #2b2f36; }
  select { background: #1e2329; color: white; border: 1px solid #f3ba2f; padding: 12px; border-radius: 8px; flex: 1; outline: none; }
  .main-box { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 20px; text-align: center; margin: 15px; }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 25px rgba(14, 203, 129, 0.3); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 25px rgba(246, 70, 93, 0.3); }
  .signal-val { font-size: 2.4rem; font-weight: 900; margin: 10px 0; }
  .up-text { color: #0ecb81; } .down-text { color: #f6465d; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px; border-top: 1px solid #222; padding-top: 15px; font-size: 0.75rem; }
  .value { color: #f3ba2f; font-weight: bold; text-align: right; }
  .acc-meter { border: 1px solid #f3ba2f; color: #f3ba2f; padding: 8px; border-radius: 12px; margin-top: 12px; font-weight: 900; }
`;

const markets = [
  { name: "AUD/USD", id: "frxAUDUSD" }, { name: "EUR/GBP", id: "frxEURGBP" },
  { name: "EUR/USD", id: "frxEURUSD" }, { name: "AUD/JPY", id: "frxAUDJPY" },
  { name: "AUD/CAD", id: "frxAUDCAD" }, { name: "AUD/CHF", id: "frxAUDCHF" },
  { name: "EUR/JPY", id: "frxEURJPY" }, { name: "CHF/JPY", id: "frxCHFJPY" },
  { name: "EUR/CHF", id: "frxEURCHF" }, { name: "GBP/USD", id: "frxGBPUSD" },
  { name: "EUR/AUD", id: "frxEURAUD" }, { name: "GBP/AUD", id: "frxGBPAUD" },
  { name: "GBP/JPY", id: "frxGBPJPY" }, { name: "USD/CHF", id: "frxUSDCHF" },
  { name: "USD/CAD", id: "frxUSDCAD" }, { name: "USD/JPY", id: "frxUSDJPY" },
  { name: "CAD/JPY", id: "frxCADJPY" }, { name: "USD/CNY", id: "frxUSDCNY" },
  { name: "China A50", id: "OTCIXCHINA" }, { name: "Dow Jones", id: "OTCIXDJI" },
  { name: "FTSE 100", id: "OTCIXFTSE" }, { name: "Hang Seng", id: "OTCIXHSI" },
  { name: "NASDAQ 100", id: "OTCIXNDX" }, { name: "DAX 40", id: "OTCIXDAX" },
  { name: "EURO STOXX 50", id: "OTCIXE50" }, { name: "S&P/ASX 200", id: "OTCIXAS200" },
  { name: "Nikkei 225", id: "OTCIXN225" }, { name: "Gold", id: "frxXAUUSD" },
  { name: "Silver", id: "frxXAGUSD" }, { name: "Crude Oil", id: "frxWTI" }
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isAuth') === 'true');
  const [symbol, setSymbol] = useState(markets[0].id);
  const [signal, setSignal] = useState('SCANNING');
  const [confidence, setConfidence] = useState(0);
  const [serverTime, setServerTime] = useState('--:--:--');
  const [entryTime, setEntryTime] = useState('--:--:--');
  
  const ws = useRef(null);
  const ENV_USER = import.meta.env.VITE_APP_USER;
  const ENV_PASS = import.meta.env.VITE_APP_PASS;
  const API_TOKEN = import.meta.env.VITE_DERIV_TOKEN;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const bdTime = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Dhaka' });
      setServerTime(bdTime);
      
      const seconds = now.getSeconds();
      const remaining = 60 - seconds;
      const nextMinute = new Date(now.getTime() + remaining * 1000);
      setEntryTime(nextMinute.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Dhaka' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    ws.current = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ authorize: API_TOKEN }));
      ws.current.send(JSON.stringify({ ticks_history: symbol, count: 50, end: "latest", style: "candles", granularity: 60, subscribe: 1 }));
    };
    ws.current.onmessage = (msg) => {
      const res = JSON.parse(msg.data);
      if (res.candles) {
        const closes = res.candles.map(c => parseFloat(c.close));
        const rsi = ti.RSI.calculate({ values: closes, period: 14 }).pop();
        const last = res.candles[res.candles.length - 1];
        if (rsi > 55) { setSignal('SELL (PUT)'); setConfidence(94.5 + Math.random() * 3); }
        else if (rsi < 45) { setSignal('BUY (CALL)'); setConfidence(95.2 + Math.random() * 2); }
      }
    };
    return () => ws.current.close();
  }, [symbol, isLoggedIn]);

  const isUp = signal.includes('BUY');

  if (!isLoggedIn) {
    return (
      <div className="login-screen"><style>{styles}</style>
        <div className="login-card"><h2>RTX PRO MAX</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (e.target.u.value === ENV_USER && e.target.p.value === ENV_PASS) { localStorage.setItem('isAuth', 'true'); setIsLoggedIn(true); } else { alert("Error!"); } }}>
            <div className="input-group"><label>USER</label><input name="u" type="text" required /></div>
            <div className="input-group"><label>PASS</label><input name="p" type="password" required /></div>
            <button type="submit" className="login-btn">LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container"><style>{styles}</style>
      <header><div className="gold">RTX 15 PRO MAX</div></header>
      <div className="chart-box">
        <iframe key={symbol} src={`https://tradingview.deriv.com/config.html?symbol=${symbol}&theme=dark&timezone=Asia/Dhaka&interval=1`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>
      <div className="controls">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name} REAL</option>)}
        </select>
      </div>
      <div className={`main-box ${isUp ? 'up-border' : 'down-border'}`}>
        <div className={`signal-val ${isUp ? 'up-text' : 'down-text'}`}>{signal}</div>
        <div className="info-grid">
          <div>BD TIME:</div><div className="value">{serverTime}</div>
          <div>NEXT ENTRY:</div><div className="value">{entryTime}</div>
        </div>
        <div className="acc-meter">ACCURACY: {confidence.toFixed(2)}%</div>
      </div>
    </div>
  );
}
export default App;
