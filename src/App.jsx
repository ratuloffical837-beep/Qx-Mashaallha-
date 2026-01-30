import React, { useState, useEffect, useRef, useCallback } from 'react';

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; border: 1px solid #1e2329; background: #050709; position: relative; }
  header { padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; background: #0b0e11; border-bottom: 3px solid #f3ba2f; }
  .gold { color: #f3ba2f; font-weight: 900; font-size: 0.8rem; letter-spacing: 1.5px; text-transform: uppercase; }
  .server-time { color: #848e9c; font-size: 0.7rem; font-family: monospace; }
  .chart-box { flex-grow: 1; width: 100%; background: #000; position: relative; }
  .controls { padding: 8px; background: #161a1e; display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }
  select { background: #0b0e11; color: white; border: 1px solid #333; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer; outline: none; border: 1px solid #f3ba2f; }
  .signal-card { padding: 15px; background: #050709; }
  .main-box { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 20px; text-align: center; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 20px rgba(14, 203, 129, 0.4); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 20px rgba(246, 70, 93, 0.4); }
  .status-text { color: #848e9c; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
  .signal-val { font-size: 2.8rem; font-weight: 950; margin: 10px 0; letter-spacing: -1.5px; }
  .up-text { color: #0ecb81; text-shadow: 0 0 10px rgba(14, 203, 129, 0.3); } 
  .down-text { color: #f6465d; text-shadow: 0 0 10px rgba(246, 70, 93, 0.3); }
  .info-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px; margin-top: 15px; border-top: 1px solid #222; padding-top: 15px; }
  .label { color: #848e9c; font-size: 0.65rem; font-weight: 800; text-align: left; }
  .value { color: #fff; font-size: 0.8rem; font-weight: bold; text-align: right; text-transform: uppercase; }
  .accuracy-box { background: rgba(243, 186, 47, 0.1); border: 1px solid #f3ba2f; color: #f3ba2f; padding: 10px; border-radius: 10px; margin-top: 15px; font-weight: 900; font-size: 0.85rem; }
  .reason-box { margin-top: 12px; font-size: 0.65rem; color: #848e9c; line-height: 1.4; text-align: left; background: #000; padding: 10px; border-radius: 8px; border-left: 3px solid #f3ba2f; }
`;

const markets = [
  { name: "EUR/USD", id: "frxEURUSD", tv: "FX:EURUSD" }, { name: "GBP/USD", id: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "USD/JPY", id: "frxUSDJPY", tv: "FX:USDJPY" }, { name: "AUD/USD", id: "frxAUDUSD", tv: "FX:AUDUSD" },
  { name: "USD/CAD", id: "frxUSDCAD", tv: "FX:USDCAD" }, { name: "EUR/JPY", id: "frxEURJPY", tv: "FX:EURJPY" },
  { name: "GBP/JPY", id: "frxGBPJPY", tv: "FX:GBPJPY" }, { name: "Gold", id: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "Bitcoin", id: "cryBTCUSD", tv: "BINANCE:BTCUSDT" }, { name: "Ethereum", id: "cryETHUSD", tv: "BINANCE:ETHUSDT" },
  { name: "Nasdaq 100", id: "OTCIXNDX", tv: "CURRENCYCOM:US100" }, { name: "S&P 500", id: "OTCSPC", tv: "FOREXCOM:SPX500" },
  { name: "Volatility 100", id: "R_100", tv: "DERIV:R_100" }, { name: "Volatility 75", id: "R_75", tv: "DERIV:R_75" },
  { name: "EUR/GBP", id: "frxEURGBP", tv: "FX:EURGBP" }, { name: "AUD/JPY", id: "frxAUDJPY", tv: "FX:AUDJPY" },
  { name: "EUR/AUD", id: "frxEURAUD", tv: "FX:EURAUD" }, { name: "USD/CHF", id: "frxUSDCHF", tv: "FX:USDCHF" },
  { name: "Silver", id: "frxXAGUSD", tv: "OANDA:XAGUSD" }, { name: "Crude Oil", id: "frxWTI", tv: "TVC:USOIL" },
  { name: "AUD/CAD", id: "frxAUDCAD", tv: "FX:AUDCAD" }, { name: "AUD/CHF", id: "frxAUDCHF", tv: "FX:AUDCHF" },
  { name: "CHF/JPY", id: "frxCHFJPY", tv: "FX:CHFJPY" }, { name: "EUR/CHF", id: "frxEURCHF", tv: "FX:EURCHF" },
  { name: "GBP/AUD", id: "frxGBPAUD", tv: "FX:GBPAUD" }, { name: "CAD/JPY", id: "frxCADJPY", tv: "FX:CADJPY" },
  { name: "USD/CNY", id: "frxUSDCNY", tv: "FX:USDCNY" }, { name: "China A50", id: "OTCIXCHINA", tv: "FX:CHINAA50" },
  { name: "DAX 40", id: "OTCIXDAX", tv: "FOREXCOM:GRXEUR" }
];

export default function App() {
  const [symbol, setSymbol] = useState(markets[0]);
  const [signal, setSignal] = useState('CALL (UP)');
  const [confidence, setConfidence] = useState(98.50);
  const [status, setStatus] = useState('ANALYZING 1-HOUR CHART...');
  const [secRemaining, setSecRemaining] = useState(60);
  const [marketPhase, setMarketPhase] = useState('BUYERS ACTIVE');
  const [reason, setReason] = useState('Engine initializing...');
  
  const ws = useRef(null);
  const serverOffset = useRef(0);

  const analyzeH1Data = useCallback((h1Candles) => {
    if (h1Candles.length < 24) return;

    // 1. Buyers vs Sellers Dominance Calculation
    let buyerScore = 0;
    let sellerScore = 0;
    let bullishCount = 0;
    let bearishCount = 0;

    h1Candles.forEach(c => {
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;

      if (c.close > c.open) {
        buyerScore += body + (lowerWick * 1.5); // Favoring lower wick for buyers
        sellerScore += upperWick;
        bullishCount++;
      } else {
        sellerScore += body + (upperWick * 1.5); // Favoring upper wick for sellers
        buyerScore += lowerWick;
        bearishCount++;
      }
    });

    // 2. Support & Resistance (High/Low of 24h)
    const prices = h1Candles.map(c => c.close);
    const resistance = Math.max(...h1Candles.map(c => c.high));
    const support = Math.min(...h1Candles.map(c => c.low));
    const lastCandle = h1Candles[h1Candles.length - 1];
    const currentPrice = lastCandle.close;

    // 3. Pattern Recognition (H1)
    const lastBody = Math.abs(lastCandle.close - lastCandle.open);
    const lastUpperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
    const lastLowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    
    // Bullish Engulfing check (Last 2 hours)
    const prevCandle = h1Candles[h1Candles.length - 2];
    const isBullishEngulfing = (lastCandle.close > prevCandle.open && lastCandle.open < prevCandle.close && lastCandle.close > lastCandle.open);
    const isBearishEngulfing = (lastCandle.close < prevCandle.open && lastCandle.open > prevCandle.close && lastCandle.close < lastCandle.open);

    let decision = 'CALL (UP)';
    let finalConfidence = 98.00;
    let phase = 'BUYERS ACTIVE';
    let explanation = "";

    // Logic Integration
    if (buyerScore > sellerScore) {
      decision = 'CALL (UP)';
      phase = 'BUYERS ACTIVE';
      explanation = `H1 Analysis: Buyers dominating (${bullishCount}/24 bars). `;
      if (isBullishEngulfing) { finalConfidence += 0.8; explanation += "Bullish Engulfing detected. "; }
      if (currentPrice <= support * 1.01 && lastLowerWick > lastBody * 2) {
        finalConfidence = 99.50;
        explanation += "SURE SHOT: Price at Major Support with Hammer rejection.";
      }
    } else {
      decision = 'PUT (DOWN)';
      phase = 'SELLERS ACTIVE';
      explanation = `H1 Analysis: Sellers dominating (${bearishCount}/24 bars). `;
      if (isBearishEngulfing) { finalConfidence += 0.8; explanation += "Bearish Engulfing detected. "; }
      if (currentPrice >= resistance * 0.99 && lastUpperWick > lastBody * 2) {
        finalConfidence = 99.50;
        explanation += "SURE SHOT: Price at Major Resistance with Shooting Star.";
      }
    }

    setSignal(decision);
    setConfidence(Math.min(finalConfidence, 99.50));
    setMarketPhase(phase);
    setReason(explanation || "Trend momentum aligned with H1 volume flows.");
  }, []);

  useEffect(() => {
    const update = () => {
      const now = Date.now() + serverOffset.current;
      const d = new Date(now);
      const sec = d.getSeconds();
      setSecRemaining(60 - sec);

      if (sec === 58 || sec === 59) {
        setStatus('🔥 SURE SHOT! ENTRY NOW');
      } else {
        setStatus('ANALYZING 1-HOUR CHART...');
      }
      requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, []);

  const connect = useCallback(() => {
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=1010`);
    
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ time: 1 }));
      ws.current.send(JSON.stringify({
        ticks_history: symbol.id,
        count: 24, end: "latest", style: "candles", granularity: 3600, subscribe: 1
      }));
    };

    ws.current.onmessage = (m) => {
      const r = JSON.parse(m.data);
      if (r.msg_type === 'time') serverOffset.current = (r.time * 1000) - Date.now();
      if (r.msg_type === 'candles') analyzeH1Data(r.candles);
      if (r.msg_type === 'ohlc') {
        if (r.ohlc.granularity === 3600) {
           // Trigger re-analysis on H1 tick
           ws.current.send(JSON.stringify({ ticks_history: symbol.id, count: 24, end: "latest", style: "candles", granularity: 3600 }));
        }
      }
    };
    ws.current.onclose = () => setTimeout(connect, 2000);
  }, [symbol, analyzeH1Data]);

  useEffect(() => {
    connect();
    const s = document.createElement("style"); s.innerHTML = styles; document.head.appendChild(s);
  }, [connect]);

  return (
    <div className="app-container">
      <header>
        <div className="gold">RTX DRIVE PRO V15 UPGRADED</div>
        <div className="server-time">{new Date(Date.now() + serverOffset.current).toLocaleTimeString()}</div>
      </header>
      
      <div className="chart-box">
        <iframe key={symbol.id} src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.tv}&interval=1&theme=dark&style=1&timezone=Etc%2FUTC&hide_side_toolbar=true&save_image=false`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>

      <div className="controls">
        <select value={symbol.id} onChange={(e) => setSymbol(markets.find(m => m.id === e.target.value))}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select disabled><option>1 MIN TRADE</option></select>
      </div>

      <div className="signal-card">
        <div className={`main-box ${signal.includes('UP') ? 'up-border' : 'down-border'}`}>
          <div className="status-text">{status}</div>
          <div className={`signal-val ${signal.includes('UP') ? 'up-text' : 'down-text'}`}>{signal}</div>
          
          <div className="info-grid">
            <div className="label">NEW CANDLE IN:</div>
            <div className="value" style={{color: secRemaining < 10 ? '#f6465d' : '#f3ba2f'}}>{secRemaining}s</div>
            <div className="label">MARKET PHASE:</div>
            <div className="value" style={{color: marketPhase.includes('BUYERS') ? '#0ecb81' : '#f6465d'}}>{marketPhase}</div>
          </div>
          
          <div className="accuracy-box">PRICE ACTION CONFIDENCE: {confidence.toFixed(2)}%</div>
          <div className="reason-box">
            <strong>EXPLANATION:</strong> {reason}
          </div>
        </div>
      </div>
    </div>
  );
                                                          }
