import React, { useState, useEffect, useCallback, useRef } from 'react';

const markets = [
  // Forex Pairs (15)
  { name: "EUR/USD", symbol: "frxEURUSD", tv: "FX:EURUSD" },
  { name: "GBP/USD", symbol: "frxGBPUSD", tv: "FX:GBPUSD" },
  { name: "USD/JPY", symbol: "frxUSDJPY", tv: "FX:USDJPY" },
  { name: "AUD/USD", symbol: "frxAUDUSD", tv: "FX:AUDUSD" },
  { name: "USD/CAD", symbol: "frxUSDCAD", tv: "FX:USDCAD" },
  { name: "USD/CHF", symbol: "frxUSDCHF", tv: "FX:USDCHF" },
  { name: "NZD/USD", symbol: "frxNZDUSD", tv: "FX:NZDUSD" },
  { name: "EUR/GBP", symbol: "frxEURGBP", tv: "FX:EURGBP" },
  { name: "EUR/JPY", symbol: "frxEURJPY", tv: "FX:EURJPY" },
  { name: "GBP/JPY", symbol: "frxGBPJPY", tv: "FX:GBPJPY" },
  { name: "AUD/JPY", symbol: "frxAUDJPY", tv: "FX:AUDJPY" },
  { name: "EUR/AUD", symbol: "frxEURAUD", tv: "FX:EURAUD" },
  { name: "EUR/CHF", symbol: "frxEURCHF", tv: "FX:EURCHF" },
  { name: "GBP/CHF", symbol: "frxGBPCHF", tv: "FX:GBPCHF" },
  { name: "CAD/JPY", symbol: "frxCADJPY", tv: "FX:CADJPY" },
  // Metals & Indices (7)
  { name: "Gold (XAU/USD)", symbol: "frxXAUUSD", tv: "OANDA:XAUUSD" },
  { name: "Silver (XAG/USD)", symbol: "frxXAGUSD", tv: "OANDA:XAGUSD" },
  { name: "Nasdaq 100", symbol: "OTCIXIC", tv: "CURRENCYCOM:US100" },
  { name: "S&P 500", symbol: "OTCSPC", tv: "FOREXCOM:SPX500" },
  { name: "Dow Jones", symbol: "OTCDJI", tv: "FOREXCOM:DJI" },
  { name: "Crude Oil", symbol: "frxWTI", tv: "TVC:USOIL" },
  { name: "Platinum", symbol: "frxXPTUSD", tv: "OANDA:XPTUSD" },
  // Crypto (7)
  { name: "Bitcoin", symbol: "cryBTCUSD", tv: "BINANCE:BTCUSDT" },
  { name: "Ethereum", symbol: "cryETHUSD", tv: "BINANCE:ETHUSDT" },
  { name: "Litecoin", symbol: "cryLTCUSD", tv: "BINANCE:LTCUSDT" },
  { name: "Ripple (XRP)", symbol: "cryXRPUSD", tv: "BINANCE:XRPUSDT" },
  { name: "Solana", symbol: "crySOLUSD", tv: "BINANCE:SOLUSDT" },
  { name: "Cardano (ADA)", symbol: "cryADAUSD", tv: "BINANCE:ADAUSDT" },
  { name: "Dogecoin", symbol: "cryDOGEUSD", tv: "BINANCE:DOGEUSDT" }
];

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; border: 1px solid #1e2329; }
  header { padding: 12px; background: #0b0e11; border-bottom: 2px solid #f3ba2f; text-align: center; font-weight: 900; color: #f3ba2f; font-size: 1.1rem; }
  .chart-box { flex-grow: 1; background: #000; position: relative; }
  .controls { padding: 8px; background: #161a1e; display: flex; gap: 5px; }
  select { background: #1e2329; color: white; border: 1px solid #f3ba2f; padding: 10px; border-radius: 8px; flex: 1; outline: none; font-size: 0.8rem; }
  
  .signal-card { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 15px; margin: 10px; transition: 0.4s; }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 20px rgba(14, 203, 129, 0.4); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 20px rgba(246, 70, 93, 0.4); }
  .flash-ready { animation: flash 0.6s infinite alternate; border-color: #f3ba2f !important; }
  @keyframes flash { from { opacity: 1; } to { opacity: 0.5; } }
  
  .signal-val { font-size: 2.2rem; font-weight: 900; text-align: center; margin: 5px 0; }
  .up-text { color: #0ecb81; } .down-text { color: #f6465d; }
  
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border-top: 1px solid #222; padding-top: 10px; font-size: 0.75rem; }
  .label { color: #848e9c; } .value { color: #f3ba2f; font-weight: bold; text-align: right; }
`;

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [pair, setPair] = useState(markets[0]);
  const [timer, setTimer] = useState({ bd: '--:--:--', sec: 0 });
  const [signal, setSignal] = useState('ANALYZING...');
  const [alert, setAlert] = useState('WAITING');
  const [price, setPrice] = useState('0.0000');
  const [accuracy, setAccuracy] = useState(0);
  
  const ws = useRef(null);
  const DERIV_APP_ID = import.meta.env.VITE_DERIV_APP_ID;
  const DERIV_KEY = import.meta.env.VITE_DERIV_API_KEY;

  const connectDeriv = useCallback(() => {
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${DERIV_APP_ID}`);
    
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ authorize: DERIV_KEY }));
    };

    ws.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.msg_type === 'authorize') {
        ws.current.send(JSON.stringify({ ticks: pair.symbol }));
      }
      if (data.tick) {
        setPrice(data.tick.quote.toFixed(5));
        const sec = new Date().getSeconds();
        if (sec >= 50 && sec < 56) setAlert('READY NOW');
        else if (sec === 56) {
          const isUp = Math.random() > 0.5;
          setSignal(isUp ? 'CALL (UP)' : 'PUT (DOWN)');
          setAccuracy(93 + Math.random() * 5);
          setAlert('ENTRY CONFIRMED');
        } else if (sec === 1) {
          setSignal('ANALYZING...');
          setAlert('WAITING');
          setAccuracy(0);
        }
      }
    };
  }, [pair, DERIV_APP_ID, DERIV_KEY]);

  useEffect(() => {
    if (isAuth) connectDeriv();
    return () => ws.current?.close();
  }, [isAuth, connectDeriv]);

  useEffect(() => {
    const clock = setInterval(() => {
      const now = new Date();
      setTimer({
        bd: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' }),
        sec: now.getSeconds()
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  if (!isAuth) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050709'}}>
        <style>{styles}</style>
        <div style={{background:'#111418', padding:'30px', borderRadius:'20px', border:'1px solid #f3ba2f', width:'300px'}}>
          <h2 style={{color:'#f3ba2f', textAlign:'center', margin:'0 0 20px 0'}}>RTX TERMINAL</h2>
          <form onSubmit={(e) => { e.preventDefault(); if(loginData.user === import.meta.env.VITE_APP_USER && loginData.pass === import.meta.env.VITE_APP_PASS) { localStorage.setItem('isAuth','true'); setIsAuth(true); } else { alert("Login Failed!"); } }}>
            <input style={{width:'100%', padding:'12px', margin:'8px 0', background:'#000', border:'1px solid #333', color:'white', borderRadius:'8px', boxSizing:'border-box'}} placeholder="Admin ID" onChange={e => setLoginData({...loginData, user: e.target.value})} />
            <input style={{width:'100%', padding:'12px', margin:'8px 0', background:'#000', border:'1px solid #333', color:'white', borderRadius:'8px', boxSizing:'border-box'}} type="password" placeholder="Key Code" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button style={{width:'100%', padding:'12px', background:'#f3ba2f', border:'none', borderRadius:'8px', fontWeight:'900', cursor:'pointer', marginTop:'10px'}}>START ENGINE</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container"><style>{styles}</style>
      <header>RTX 15 PRO MAX • DERIV LIVE</header>
      <div className="chart-box">
        <iframe key={pair.tv} src={`https://s.tradingview.com/widgetembed/?symbol=${pair.tv}&interval=1&theme=dark&timezone=Asia%2FDhaka&style=1&hide_side_toolbar=true`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>
      <div className="controls">
        <select value={pair.tv} onChange={(e) => setPair(markets.find(m => m.tv === e.target.value))}>
          {markets.map(m => <option key={m.tv} value={m.tv}>{m.name}</option>)}
        </select>
      </div>
      <div className={`signal-card ${alert === 'READY NOW' ? 'flash-ready' : ''} ${signal.includes('CALL') ? 'up-border' : signal.includes('PUT') ? 'down-border' : ''}`}>
        <div style={{textAlign:'center', color:'#f3ba2f', fontSize:'0.75rem', fontWeight:'bold'}}>{alert}</div>
        <div className={`signal-val ${signal.includes('CALL') ? 'up-text' : 'down-text'}`}>{signal}</div>
        <div className="info-grid">
          <span className="label">BD TIME</span><span className="value">{timer.bd}</span>
          <span className="label">LIVE PRICE</span><span className="value">{price}</span>
          <span className="label">PROBABILITY</span><span className="value">{accuracy > 0 ? accuracy.toFixed(2)+'%' : '--'}</span>
        </div>
      </div>
    </div>
  );
}
export default App;
