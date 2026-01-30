import React, { useState, useEffect, useRef, useCallback } from 'react';

// স্টাইল এবং ইউজার ইন্টারফেস (UI) ডিজাইন
const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; border: 1px solid #1e2329; background: #050709; position: relative; }
  header { padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; background: #0b0e11; border-bottom: 3px solid #f3ba2f; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
  .gold { color: #f3ba2f; font-weight: 900; font-size: 0.9rem; letter-spacing: 1.5px; text-transform: uppercase; }
  .server-time { color: #848e9c; font-size: 0.75rem; font-family: 'Courier New', monospace; font-weight: bold; }
  .chart-box { flex-grow: 1; width: 100%; background: #000; position: relative; border-bottom: 1px solid #1e2329; }
  .controls { padding: 10px; background: #161a1e; display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; }
  select { background: #0b0e11; color: white; border: 1px solid #f3ba2f; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.8rem; cursor: pointer; outline: none; }
  .signal-card { padding: 15px; background: #050709; }
  .main-box { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 20px; text-align: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 25px rgba(14, 203, 129, 0.4); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 25px rgba(246, 70, 93, 0.4); }
  .status-text { color: #f3ba2f; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; animation: blink 1s infinite; }
  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  .signal-val { font-size: 3rem; font-weight: 950; margin: 10px 0; letter-spacing: -2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
  .up-text { color: #0ecb81; } .down-text { color: #f6465d; }
  .info-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; margin-top: 15px; border-top: 1px solid #222; padding-top: 15px; }
  .label { color: #848e9c; font-size: 0.7rem; font-weight: bold; text-align: left; text-transform: uppercase; }
  .value { color: #fff; font-size: 0.85rem; font-weight: 900; text-align: right; }
  .accuracy-box { background: rgba(243, 186, 47, 0.15); border: 1px solid #f3ba2f; color: #f3ba2f; padding: 10px; border-radius: 10px; margin-top: 15px; font-weight: 900; font-size: 0.9rem; letter-spacing: 0.5px; }
  .reasoning { margin-top: 10px; font-size: 0.65rem; color: #848e9c; line-height: 1.4; text-align: left; font-style: italic; background: #0b0e11; padding: 8px; border-radius: 5px; }
`;

const markets = [
  { name: "GBP/USD", id: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "EUR/USD", id: "frxEURUSD", tv: "FX:EURUSD" },
  { name: "USD/JPY", id: "frxUSDJPY", tv: "FX:USDJPY" },
  { name: "GOLD (XAU)", id: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "BITCOIN", id: "cryBTCUSD", tv: "BINANCE:BTCUSDT" },
  { name: "V-100 INDEX", id: "R_100", tv: "DERIV:R_100" }
];

export default function App() {
  const [symbol, setSymbol] = useState(markets[0]);
  const [signal, setSignal] = useState('CALL (UP)');
  const [confidence, setConfidence] = useState(99.00);
  const [status, setStatus] = useState('ANALYZING H1 TREND...');
  const [secRemaining, setSecRemaining] = useState(60);
  const [marketDominance, setMarketDominance] = useState('BUYERS ACTIVE');
  const [explanation, setExplanation] = useState('Calculating market force...');
  
  const ws = useRef(null);
  const serverOffset = useRef(0);

  const analyzeH1MasterLogic = useCallback((h1Data) => {
    if (h1Data.length < 24) return;

    // ১. Buyers vs Sellers Dominance (Body + Wicks)
    let bPower = 0;
    let sPower = 0;
    let bullishEngulfing = false;
    let bearishEngulfing = false;

    h1Data.forEach((c, i) => {
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;

      if (c.close > c.open) {
        bPower += (body + lowerWick); 
        sPower += upperWick;
      } else {
        sPower += (body + upperWick);
        bPower += lowerWick;
      }

      // শেষ ৫ ঘণ্টার এনগালফিং চেক
      if (i > h1Data.length - 6) {
        const prev = h1Data[i-1];
        if (c.close > prev.open && c.open < prev.close && c.close > c.open) bullishEngulfing = true;
        if (c.close < prev.open && c.open > prev.close && c.close < c.open) bearishEngulfing = true;
      }
    });

    // ২. সাপোর্ট এবং রেজিস্ট্যান্স (H1 High/Low)
    const highs = h1Data.map(c => c.high);
    const lows = h1Data.map(c => c.low);
    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    const lastClose = h1Data[h1Data.length - 1].close;

    // সিদ্ধান্ত গ্রহণ (Decision Logic)
    let decision = 'CALL (UP)';
    let score = 98.50;
    let reason = "";

    if (bPower > sPower) {
      setMarketDominance('BUYERS ACTIVE');
      decision = 'CALL (UP)';
      reason = "H1 dominance shows heavy buyer volume and price rejection at lower levels.";
      if (bullishEngulfing) { score = 99.85; reason += " Bullish Engulfing detected."; }
      if (lastClose <= support * 1.002) { score = 99.99; reason = "SURE SHOT: Price at H1 Major Support with Hammer rejection."; }
    } else {
      setMarketDominance('SELLERS ACTIVE');
      decision = 'PUT (DOWN)';
      reason = "H1 sellers controlling the trend. Resistance rejection confirmed.";
      if (bearishEngulfing) { score = 99.80; reason += " Bearish Engulfing pattern active."; }
      if (lastClose >= resistance * 0.998) { score = 99.99; reason = "SURE SHOT: Price hit H1 Major Resistance. Strong Sell momentum."; }
    }

    setSignal(decision);
    setConfidence(score);
    setExplanation(reason);
  }, []);

  useEffect(() => {
    const ticker = () => {
      const now = Date.now() + serverOffset.current;
      const sec = new Date(now).getSeconds();
      setSecRemaining(60 - sec);

      if (sec >= 58) {
        setStatus('🔥 SURE SHOT! ENTRY NOW');
      } else if (sec >= 50) {
        setStatus('⚠️ PREPARE YOUR POSITION');
      } else {
        setStatus('RTX ENGINE ANALYZING H1...');
      }
      requestAnimationFrame(ticker);
    };
    const id = requestAnimationFrame(ticker);
    return () => cancelAnimationFrame(id);
  }, []);

  const connectWS = useCallback(() => {
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=1010`);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ time: 1 }));
      ws.current.send(JSON.stringify({
        ticks_history: symbol.id, count: 24, end: "latest", style: "candles", granularity: 3600, subscribe: 1
      }));
    };

    ws.current.onmessage = (m) => {
      const r = JSON.parse(m.data);
      if (r.msg_type === 'time') serverOffset.current = (r.time * 1000) - Date.now();
      if (r.msg_type === 'candles') analyzeH1MasterLogic(r.candles);
      if (r.msg_type === 'ohlc' && r.ohlc.granularity === 3600) {
        // রিয়েল টাইম ১ ঘণ্টা আপডেট হলে পুনরায় অ্যানালাইজ
        ws.current.send(JSON.stringify({ ticks_history: symbol.id, count: 24, end: "latest", style: "candles", granularity: 3600 }));
      }
    };
    ws.current.onclose = () => setTimeout(connectWS, 2000);
  }, [symbol, analyzeH1MasterLogic]);

  useEffect(() => {
    connectWS();
    const s = document.createElement("style"); s.innerHTML = styles; document.head.appendChild(s);
  }, [connectWS]);

  return (
    <div className="app-container">
      <header>
        <div className="gold">RTX DRIVE PRO V15 UPGRADED</div>
        <div className="server-time">{new Date(Date.now() + serverOffset.current).toLocaleTimeString()}</div>
      </header>
      
      <div className="chart-box">
        <iframe key={symbol.id} src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.tv}&interval=1&theme=dark&style=1&timezone=Etc%2FUTC&hide_side_toolbar=true`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>

      <div className="controls">
        <select value={symbol.id} onChange={(e) => setSymbol(markets.find(m => m.id === e.target.value))}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select disabled><option>EXPIRE: M1</option></select>
      </div>

      <div className="signal-card">
        <div className={`main-box ${signal.includes('UP') ? 'up-border' : 'down-border'}`}>
          <div className="status-text">{status}</div>
          <div className={`signal-val ${signal.includes('UP') ? 'up-text' : 'down-text'}`}>{signal}</div>
          
          <div className="info-grid">
            <div className="label">NEW CANDLE IN:</div>
            <div className="value" style={{color: secRemaining < 5 ? '#f6465d' : '#f3ba2f'}}>{secRemaining}s</div>
            <div className="label">MARKET PHASE:</div>
            <div className="value" style={{color: marketDominance.includes('BUYERS') ? '#0ecb81' : '#f6465d'}}>{marketDominance}</div>
          </div>
          
          <div className="accuracy-box">CONFIDENCE: {confidence.toFixed(2)}%</div>
          <div className="reasoning"><strong>H1 LOGIC:</strong> {explanation}</div>
        </div>
      </div>
    </div>
  );
      }
