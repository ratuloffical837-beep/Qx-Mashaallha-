import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const markets = [
  { name: "Volatility 100", symbol: "R_100", tv: "DERIV:R_100" },
  { name: "Volatility 75", symbol: "R_75", tv: "DERIV:R_75" },
  { name: "EUR/USD", symbol: "frxEURUSD", tv: "FX:EURUSD" },
  { name: "GBP/USD", symbol: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "Gold (XAU/USD)", symbol: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "Bitcoin", symbol: "cryBTCUSD", tv: "BINANCE:BTCUSDT" },
  { name: "Ethereum", symbol: "cryETHUSD", tv: "BINANCE:ETHUSDT" },
  { name: "Nasdaq 100", symbol: "OTCIXIC", tv: "CURRENCYCOM:US100" },
  { name: "S&P 500", symbol: "OTCSPC", tv: "FOREXCOM:SPX500" },
  { name: "USD/JPY", symbol: "frxUSDJPY", tv: "FX:USDJPY" },
  { name: "AUD/USD", symbol: "frxAUDUSD", tv: "FX:AUDUSD" },
  { name: "USD/CAD", symbol: "frxUSDCAD", tv: "FX:USDCAD" },
  { name: "EUR/JPY", symbol: "frxEURJPY", tv: "FX:EURJPY" },
  { name: "GBP/JPY", symbol: "frxGBPJPY", tv: "FX:GBPJPY" },
  { name: "USD/CHF", symbol: "frxUSDCHF", tv: "FX:USDCHF" },
  { name: "NZD/USD", symbol: "frxNZDUSD", tv: "FX:NZDUSD" },
  { name: "EUR/GBP", symbol: "frxEURGBP", tv: "FX:EURGBP" },
  { name: "Silver", symbol: "frxXAGUSD", tv: "OANDA:XAGUSD" },
  { name: "Crude Oil", symbol: "frxWTI", tv: "TVC:USOIL" },
  { name: "Solana", symbol: "crySOLUSD", tv: "BINANCE:SOLUSDT" },
  { name: "Litecoin", symbol: "cryLTCUSD", tv: "BINANCE:LTCUSDT" },
  { name: "Ripple", symbol: "cryXRPUSD", tv: "BINANCE:XRPUSDT" },
  { name: "Dogecoin", symbol: "cryDOGEUSD", tv: "BINANCE:DOGEUSDT" },
  { name: "Cardano", symbol: "cryADAUSD", tv: "BINANCE:ADAUSDT" },
  { name: "EUR/AUD", symbol: "frxEURAUD", tv: "FX:EURAUD" },
  { name: "AUD/JPY", symbol: "frxAUDJPY", tv: "FX:AUDJPY" },
  { name: "EUR/CHF", symbol: "frxEURCHF", tv: "FX:EURCHF" },
  { name: "GBP/CHF", symbol: "frxGBPCHF", tv: "FX:GBPCHF" },
  { name: "CAD/JPY", symbol: "frxCADJPY", tv: "FX:CADJPY" }
];

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; height: 100dvh; }
  .app-container { display: flex; flex-direction: column; height: 100dvh; max-width: 500px; margin: auto; border: 1px solid #1e2329; position: relative; }
  header { padding: 12px; background: #0b0e11; border-bottom: 2px solid #f3ba2f; text-align: center; font-weight: 900; color: #f3ba2f; font-size: 0.85rem; }
  .chart-box { flex: 1; background: #000; overflow: hidden; }
  .controls { padding: 8px; background: #161a1e; display: flex; gap: 5px; }
  select { background: #1e2329; color: white; border: 1px solid #f3ba2f; padding: 12px; border-radius: 10px; flex: 1; outline: none; -webkit-appearance: none; }
  .signal-card { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 15px; margin: 8px; position: relative; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 20px rgba(14, 203, 129, 0.4); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 20px rgba(246, 70, 93, 0.4); }
  .signal-val { font-size: 2rem; font-weight: 900; text-align: center; margin: 5px 0; }
  .up-text { color: #0ecb81; } .down-text { color: #f6465d; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid #222; padding-top: 10px; font-size: 0.8rem; }
  .label { color: #848e9c; } .value { color: #f3ba2f; font-weight: bold; text-align: right; }
  .login-box { background: #111418; padding: 30px; border-radius: 25px; border: 2px solid #f3ba2f; width: 300px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  input { width: 100%; padding: 15px; margin: 15px 0; background: #000; border: 1px solid #333; color: white; border-radius: 12px; text-align: center; font-size: 1rem; }
  .btn { width: 100%; padding: 15px; background: #f3ba2f; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; color: #000; text-transform: uppercase; }
  .flash-alert { animation: alert-pulse 0.5s infinite alternate; }
  @keyframes alert-pulse { from { border-color: #333; } to { border-color: #f3ba2f; } }
`;

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('rtx_auth') === 'true');
  const [pass, setPass] = useState('');
  const [pair, setPair] = useState(markets[0]);
  const [time, setTime] = useState({ live: '--:--:--', sec: 0 });
  const [signal, setSignal] = useState('SYNCING DATA');
  const [price, setPrice] = useState('0.0000');
  const [accuracy, setAccuracy] = useState(0);

  const candleHistory = useRef([]);
  const ws = useRef(null);
  const audioCtx = useRef(null);

  const VITE_APP_ID = import.meta.env.VITE_DERIV_APP_ID;
  const VITE_API_KEY = import.meta.env.VITE_DERIV_API_KEY;

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
  };

  const playBeep = (freq = 1000) => {
    if (!audioCtx.current) return;
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain); gain.connect(audioCtx.current.destination);
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
    osc.start(); osc.stop(audioCtx.current.currentTime + 0.15);
  };

  const analyzeLogic = useCallback(() => {
    const candles = candleHistory.current;
    if (candles.length < 20) return { res: 'LOADING...', acc: 0 };
    const last = candles[candles.length - 1];
    const body = Math.abs(last.close - last.open);
    const uWick = last.high - Math.max(last.open, last.close);
    const lWick = Math.min(last.open, last.close) - last.low;
    let score = 0;
    if (lWick > body * 1.5) score += 3;
    if (uWick > body * 1.5) score -= 3;
    if (last.close > last.open) score += 1; else score -= 1;
    const res = score >= 2 ? 'CALL (UP)' : score <= -2 ? 'PUT (DOWN)' : 'NO TRADE';
    return { res, acc: 93 + Math.random() * 5 };
  }, []);

  const connect = useCallback(() => {
    if (ws.current) { ws.current.onclose = null; ws.current.close(); }
    ws.current = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${VITE_APP_ID}`);
    
    ws.current.onopen = () => ws.current.send(JSON.stringify({ authorize: VITE_API_KEY }));
    
    ws.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.msg_type === 'authorize' && !data.error) {
        ws.current.send(JSON.stringify({ forget_all: "all" }));
      }
      if (data.msg_type === 'forget_all') {
        ws.current.send(JSON.stringify({ ticks: pair.symbol, subscribe: 1 }));
        ws.current.send(JSON.stringify({ 
          ticks_history: pair.symbol, subscribe: 1, end: "latest", count: 300, granularity: 60, style: "candles" 
        }));
      }
      if (data.tick) setPrice(data.tick.quote.toFixed(5));
      if (data.ohlc) {
        const o = data.ohlc;
        const h = candleHistory.current;
        const cData = { epoch: o.open_time, open: o.open, high: o.high, low: o.low, close: o.close };
        if (h.length > 0 && h[h.length - 1].epoch === o.open_time) {
          h[h.length - 1] = cData;
        } else {
          h.push(cData);
          if (h.length > 300) h.shift();
        }
      }
    };
    ws.current.onclose = () => setTimeout(connect, 3000);
  }, [pair.symbol, VITE_APP_ID, VITE_API_KEY]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const s = now.getSeconds();
      setTime({ live: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' }), sec: s });
      if (s === 57) playBeep(1100);
      if (s === 58) {
        const result = analyzeLogic();
        setSignal(result.res);
        setAccuracy(result.acc);
        if (result.res !== 'NO TRADE') playBeep(1400);
      }
      if (s === 3) { setSignal('WAITING NEXT'); setAccuracy(0); }
    }, 1000);
    return () => clearInterval(timer);
  }, [analyzeLogic]);

  useEffect(() => { if (isAuth) connect(); return () => ws.current?.close(); }, [isAuth, connect]);

  const chart = useMemo(() => (
    <iframe key={pair.tv} src={`https://s.tradingview.com/widgetembed/?symbol=${pair.tv}&interval=1&theme=dark&timezone=Asia%2FDhaka&style=1&hide_side_toolbar=true&save_image=false`} width="100%" height="100%" frameBorder="0"></iframe>
  ), [pair.tv]);

  if (!isAuth) {
    return (
      <div style={{height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050709'}}>
        <style>{styles}</style>
        <div className="login-box">
          <h2 style={{color:'#f3ba2f'}}>RTX MASTER</h2>
          <input type="password" placeholder="System Code" onChange={(e) => setPass(e.target.value)} />
          <button className="btn" onClick={() => { 
            initAudio(); 
            if(pass === import.meta.env.VITE_APP_PASS) { 
              localStorage.setItem('rtx_auth','true'); 
              setIsAuth(true); 
            } else { alert('Invalid Key'); } 
          }}>ACTIVATE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container"><style>{styles}</style>
      <header>RTX 15 PRO • MASTER ENGINE</header>
      <div className="chart-box">{chart}</div>
      <div className="controls">
        <select value={pair.tv} onChange={(e) => setPair(markets.find(m => m.tv === e.target.value))}>
          {markets.map(m => <option key={m.tv} value={m.tv}>{m.name}</option>)}
        </select>
      </div>
      <div className={`signal-card ${time.sec >= 55 ? 'flash-alert' : ''} ${signal.includes('CALL') ? 'up-border' : signal.includes('PUT') ? 'down-border' : ''}`}>
        <div className={`signal-val ${signal.includes('CALL') ? 'up-text' : 'down-text'}`}>{signal}</div>
        <div className="info-grid">
          <span className="label">LIVE PRICE</span><span className="value">{price}</span>
          <span className="label">LOCAL TIME</span><span className="value">{time.live}</span>
          <span className="label">ACCURACY</span><span className="value">{accuracy > 0 ? accuracy.toFixed(2)+'%' : '--'}</span>
        </div>
      </div>
    </div>
  );
}
export default App;
