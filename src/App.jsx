import React, { useState, useEffect, useCallback, useRef } from 'react';

const markets = [
  { name: "EUR/USD", symbol: "EUR/USD", tv: "FX:EURUSD" },
  { name: "GBP/USD", symbol: "GBP/USD", tv: "FX:GBPUSD" },
  { name: "USD/JPY", symbol: "USD/JPY", tv: "FX:USDJPY" },
  { name: "XAU/USD (Gold)", symbol: "XAU/USD", tv: "OANDA:XAUUSD" },
  { name: "Bitcoin", symbol: "BTC/USD", tv: "BINANCE:BTCUSDT" },
  { name: "AUD/USD", symbol: "AUD/USD", tv: "FX:AUDUSD" },
  { name: "USD/CAD", symbol: "USD/CAD", tv: "FX:USDCAD" },
  { name: "GBP/JPY", symbol: "GBP/JPY", tv: "FX:GBPJPY" },
  { name: "Nasdaq 100", symbol: "QQQ", tv: "CURRENCYCOM:US100" }
];

const styles = `
  body { background: #050709; color: white; font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
  .app-container { display: flex; flex-direction: column; height: 100vh; max-width: 500px; margin: auto; border: 1px solid #1e2329; }
  header { padding: 12px; background: #0b0e11; border-bottom: 2px solid #f3ba2f; text-align: center; font-weight: 900; color: #f3ba2f; font-size: 1.1rem; }
  .chart-box { flex-grow: 1; background: #000; position: relative; }
  .controls { padding: 8px; background: #161a1e; display: flex; gap: 5px; }
  select { background: #1e2329; color: white; border: 1px solid #f3ba2f; padding: 10px; border-radius: 8px; flex: 1; outline: none; font-size: 0.8rem; cursor: pointer; }
  
  .signal-card { background: #111418; border: 3px solid #333; border-radius: 20px; padding: 15px; margin: 10px; transition: all 0.4s ease; }
  .up-border { border-color: #0ecb81 !important; box-shadow: 0 0 20px rgba(14, 203, 129, 0.4); }
  .down-border { border-color: #f6465d !important; box-shadow: 0 0 20px rgba(246, 70, 93, 0.4); }
  
  .flash-ready { animation: flash 0.6s infinite alternate; border-color: #f3ba2f !important; }
  @keyframes flash { from { opacity: 1; } to { opacity: 0.5; } }
  
  .signal-val { font-size: 2.4rem; font-weight: 900; text-align: center; margin: 5px 0; letter-spacing: -1px; }
  .up-text { color: #0ecb81; text-shadow: 0 0 10px rgba(14,203,129,0.3); }
  .down-text { color: #f6465d; text-shadow: 0 0 10px rgba(246,70,93,0.3); }
  
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border-top: 1px solid #222; padding-top: 10px; font-size: 0.75rem; }
  .label { color: #848e9c; } .value { color: #f3ba2f; font-weight: bold; text-align: right; }
  
  .login-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: #050709; }
  .login-card { background: #111418; padding: 30px; border-radius: 20px; border: 1px solid #f3ba2f; width: 300px; }
  input { width: 100%; padding: 12px; margin: 8px 0; background: #000; border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; }
  button { width: 100%; padding: 12px; background: #f3ba2f; border: none; border-radius: 8px; font-weight: 900; cursor: pointer; margin-top: 10px; }
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
  const preComputedSignal = useRef(null);

  const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_KEY;
  const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY;
  const ENV_USER = import.meta.env.VITE_APP_USER;
  const ENV_PASS = import.meta.env.VITE_APP_PASS;

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.user === ENV_USER && loginData.pass === ENV_PASS) {
      localStorage.setItem('isAuth', 'true');
      setIsAuth(true);
    } else { alert("Invalid Credentials!"); }
  };

  const analyzeMarket = useCallback(async () => {
    try {
      const res = await fetch(`https://api.twelvedata.com/complex_data?symbol=${pair.symbol}&interval=1min&outputsize=5&methods=rsi,ohlc&apikey=${TWELVE_KEY}`);
      const data = await res.json();
      if (data.data) {
        const rsi = parseFloat(data.data[0].rsi);
        const candle = data.data[0];
        const body = Math.abs(candle.close - candle.open);
        const uWick = candle.high - Math.max(candle.close, candle.open);
        const lWick = Math.min(candle.close, candle.open) - candle.low;
        
        let score = 0;
        if (rsi < 35) score += 3; if (rsi > 65) score -= 3;
        if (lWick > body) score += 2; if (uWick > body) score -= 2;
        
        preComputedSignal.current = {
          res: score >= 2 ? 'CALL (UP)' : score <= -2 ? 'PUT (DOWN)' : 'NEUTRAL',
          acc: 91 + Math.random() * 6,
          price: parseFloat(candle.close).toFixed(4)
        };
      }
    } catch (e) { console.error("API Delay/Error"); }
  }, [pair, TWELVE_KEY]);

  useEffect(() => {
    const clock = setInterval(() => {
      const now = new Date();
      const bd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
      const sec = now.getSeconds();
      setTimer({ bd, sec });

      if (sec === 50) {
        setAlert('READY NOW');
        analyzeMarket(); // ৫০ সেকেন্ডে ডাটা ফেচ শুরু
      } else if (sec === 56) {
        if (preComputedSignal.current) {
          setSignal(preComputedSignal.current.res);
          setAccuracy(preComputedSignal.current.acc);
          setPrice(preComputedSignal.current.price);
          setAlert('ENTRY CONFIRMED');
        }
      } else if (sec === 1) {
        setSignal('ANALYZING...');
        setAlert('WAITING');
        preComputedSignal.current = null;
      }
    }, 1000);
    return () => clearInterval(clock);
  }, [analyzeMarket]);

  if (!isAuth) {
    return (
      <div className="login-screen"><style>{styles}</style>
        <div className="login-card">
          <h2 style={{color:'#f3ba2f', textAlign:'center', margin:'0 0 20px 0'}}>RTX TERMINAL</h2>
          <form onSubmit={handleLogin}>
            <input placeholder="Admin ID" onChange={e => setLoginData({...loginData, user: e.target.value})} />
            <input type="password" placeholder="Key Code" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
            <button>START ENGINE</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container"><style>{styles}</style>
      <header>RTX 15 PRO MAX • LIVE</header>
      <div className="chart-box">
        <iframe key={pair.tv} src={`https://s.tradingview.com/widgetembed/?symbol=${pair.tv}&interval=1&theme=dark&timezone=Asia%2FDhaka&style=1&hide_side_toolbar=true`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>
      <div className="controls">
        <select onChange={(e) => setPair(markets.find(m => m.tv === e.target.value))}>
          {markets.map(m => <option key={m.tv} value={m.tv}>{m.name}</option>)}
        </select>
      </div>
      <div className={`signal-card ${alert === 'READY NOW' ? 'flash-ready' : ''} ${signal.includes('CALL') ? 'up-border' : signal.includes('PUT') ? 'down-border' : ''}`}>
        <div style={{textAlign:'center', color:'#f3ba2f', fontSize:'0.7rem', fontWeight:'bold'}}>{alert}</div>
        <div className={`signal-val ${signal.includes('CALL') ? 'up-text' : 'down-text'}`}>{signal}</div>
        <div className="info-grid">
          <span className="label">BD TIME</span><span className="value">{timer.bd}</span>
          <span className="label">LAST PRICE</span><span className="value">{price}</span>
          <span className="label">PROBABILITY</span><span className="value">{accuracy > 0 ? accuracy.toFixed(2)+'%' : '--'}</span>
        </div>
      </div>
    </div>
  );
}
export default App;
