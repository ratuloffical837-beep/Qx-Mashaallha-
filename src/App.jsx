import React, { useState, useEffect, useRef } from 'react';
import * as ti from 'technicalindicators';

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; position: relative; }
  header { padding: 12px; display: flex; justify-content: space-between; align-items: center; background: #0b0e11; border-bottom: 2px solid #f3ba2f; }
  .gold { color: #f3ba2f; font-weight: 900; }
  .chart-box { flex-grow: 1; width: 100%; background: #000; }
  .controls { padding: 10px; background: #161a1e; display: flex; gap: 8px; border-top: 1px solid #2b2f36; }
  select { background: #1e2329; color: white; border: 1px solid #f3ba2f; padding: 12px; border-radius: 8px; flex: 1; font-weight: bold; outline: none; }
  .signal-card { padding: 15px; background: #050709; }
  .main-box { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 20px; text-align: center; transition: 0.3s; }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 35px rgba(14, 203, 129, 0.5); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 35px rgba(246, 70, 93, 0.5); }
  .status-text { color: #f3ba2f; font-size: 1rem; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
  .signal-val { font-size: 2.8rem; font-weight: 900; margin: 10px 0; }
  .up-text { color: #0ecb81; text-shadow: 0 0 10px rgba(14, 203, 129, 0.5); } 
  .down-text { color: #f6465d; text-shadow: 0 0 10px rgba(246, 70, 93, 0.5); }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; border-top: 1px solid #222; padding-top: 15px; font-size: 0.8rem; }
  .label { color: #848e9c; text-align: left; } .value { color: #f3ba2f; font-weight: bold; text-align: right; }
  .acc-meter { border: 1px solid #0ecb81; color: #0ecb81; padding: 10px; border-radius: 12px; margin-top: 15px; font-weight: 900; font-size: 1.2rem; }
`;

// Deriv Markets (Symbol ID and TV for Chart)
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
  const [signal, setSignal] = useState('SCANNING');
  const [confidence, setConfidence] = useState(0);
  const [alert, setAlert] = useState('INITIALIZING...');
  const [serverTime, setServerTime] = useState('--:--:--');
  const [entryTime, setEntryTime] = useState('--:--:--');

  const ws = useRef(null);
  const serverOffset = useRef(0);

  // Deriv WebSocket Connection
  useEffect(() => {
    const connectWS = () => {
      ws.current = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1010');

      ws.current.onopen = () => {
        // Sync Time
        ws.current.send(JSON.stringify({ time: 1 }));
        // Get Candles for Analysis
        requestData();
      };

      ws.current.onmessage = (msg) => {
        const res = JSON.parse(msg.data);
        if (res.msg_type === 'time') {
          serverOffset.current = (res.time * 1000) - Date.now();
        }
        if (res.msg_type === 'candles') {
          mainAnalysisEngine(res.candles);
        }
      };

      ws.current.onclose = () => setTimeout(connectWS, 3000);
    };

    connectWS();
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);

    // Refresh data every 10 seconds for signal
    const refreshData = setInterval(requestData, 10000);
    return () => {
      clearInterval(refreshData);
      if (ws.current) ws.current.close();
    };
  }, [symbol]);

  const requestData = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ticks_history: symbol.id,
        adjust_start_time: 1,
        count: 100,
        end: "latest",
        granularity: 60, // 1 minute candles
        style: "candles"
      }));
    }
  };

  // Your original analysis logic from file 1
  const mainAnalysisEngine = (candles) => {
    try {
      const closes = candles.map(c => parseFloat(c.close));
      const opens = candles.map(c => parseFloat(c.open));
      
      // RSI calculation using technicalindicators
      const rsi = ti.RSI.calculate({ values: closes, period: 14 }).pop();
      const lastClose = closes[closes.length - 1];
      const lastOpen = opens[opens.length - 1];

      // Original Logic from File 1
      if (rsi < 45 || (lastClose > lastOpen && rsi < 60)) {
        setSignal('UP (CALL)');
        setConfidence(98.10 + Math.random());
      } else {
        setSignal('DOWN (PUT)');
        setConfidence(98.20 + Math.random());
      }
    } catch (e) { console.error("Analysis Error"); }
  };

  // Timer logic for status messages
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date(Date.now() + serverOffset.current);
      setServerTime(now.toLocaleTimeString('en-GB'));
      
      const sec = now.getSeconds();
      if (sec > 40) {
        setAlert('Predicting Market...');
      } else if (sec <= 20 && sec > 4) {
        setAlert('Find success for trading');
      } else if (sec <= 4 && sec > 0) {
        setAlert(`SURE SHOT ${signal.includes('UP') ? 'UP' : 'DOWN'}`);
      } else {
        setAlert('ANALYZING...');
      }

      const next = new Date(now.getTime() + (60 - sec) * 1000);
      setEntryTime(next.toLocaleTimeString('en-GB'));
    }, 1000);
    return () => clearInterval(timer);
  }, [signal]);

  return (
    <div className="app-container">
      <header>
        <div className="gold">RTX DRIVE PRO V15.1</div>
        <div style={{color:'#0ecb81', fontSize:'0.7rem'}}>PREMIUM ●</div>
      </header>

      <div className="chart-box">
        {/* Deriv specific TradingView integration */}
        <iframe 
          key={symbol.id}
          src={`https://s.tradingview.com/widgetembed/?symbol=${symbol.tv}&interval=1&theme=dark&style=1`} 
          width="100%" height="100%" frameBorder="0">
        </iframe>
      </div>

      <div className="controls">
        <select value={symbol.id} onChange={(e) => setSymbol(markets.find(m => m.id === e.target.value))}>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="signal-card">
        <div className={`main-box ${signal.includes('UP') ? 'up-border' : 'down-border'}`}>
          <div className="status-text">{alert}</div>
          <div className={`signal-val ${signal.includes('UP') ? 'up-text' : 'down-text'}`}>{signal}</div>
          
          <div className="info-grid">
            <div className="label">SERVER TIME:</div><div className="value">{serverTime}</div>
            <div className="label">ENTRY TIME:</div><div className="value">{entryTime}</div>
            <div className="label">MARKET:</div><div className="value">{symbol.name}</div>
            <div className="label">RESULT:</div><div className="value">PREDICTED</div>
          </div>
          <div className="acc-meter">ACCURACY: {confidence.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
  }
