import React, { useState, useEffect } from 'react';

const marketPairs = [
  // CURRENCIES (OTC & LIVE)
  { name: "GBP/NZD (OTC)", tv: "FX:GBPNZD", profit: "95%" },
  { name: "NZD/CAD (OTC)", tv: "FX:NZDCAD", profit: "95%" },
  { name: "USD/IDR (OTC)", tv: "FX:USDIDR", profit: "94%" },
  { name: "USD/JPY", tv: "FX:USDJPY", profit: "91%" },
  { name: "USD/BDT (OTC)", tv: "FX:USDBDT", profit: "77%" },
  { name: "EUR/USD", tv: "FX:EURUSD", profit: "81%" },
  // CRYPTO
  { name: "Bitcoin (OTC)", tv: "BINANCE:BTCUSDT", profit: "84%" },
  { name: "Ethereum (OTC)", tv: "BINANCE:ETHUSDT", profit: "92%" },
  { name: "Trump (OTC)", tv: "MEXC:TRUMPUSDT", profit: "92%" },
  { name: "Dogwifhat (OTC)", tv: "BYBIT:WIFUSDT", profit: "92%" },
  { name: "Solana (OTC)", tv: "BINANCE:SOLUSDT", profit: "85%" },
  // STOCKS
  { name: "McDonald's (OTC)", tv: "NYSE:MCD", profit: "93%" },
  { name: "Intel (OTC)", tv: "NASDAQ:INTC", profit: "92%" },
  { name: "Boeing (OTC)", tv: "NYSE:BA", profit: "85%" },
  { name: "NASDAQ 100", tv: "CAPITALCOM:US100", profit: "30%" }
];

export default function App() {
  const [selected, setSelected] = useState(marketPairs[0]);
  const [cookie, setCookie] = useState('');
  const [signal, setSignal] = useState('WAITING FOR CONNECTION');
  const [acc, setAcc] = useState(0);
  const [time, setTime] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB')), 1000);
    return () => clearInterval(t);
  }, []);

  const startBot = () => {
    if(!cookie) return alert("পবিত্র দোয়াগুলোর উসিলায় শুরু করার আগে কুকি দিন।");
    setSignal('ANALYZING...');
    setTimeout(() => {
      setSignal(Math.random() > 0.5 ? 'UP (CALL) ↑' : 'DOWN (PUT) ↓');
      setAcc((Math.random() * (99 - 89) + 89).toFixed(2));
    }, 2000);
  };

  return (
    <div className="container">
      <header>
        <div className="status"><span className="dot"></span> SIGNAL OPEN</div>
        <div className="holy-text">
          لَا إِلٰهَ إِلَّا اللهُ مُحَمَّدٌ رَسُولُ اللهِ <br/>
          يَا حَيُّ يَا قَيُّومُ
        </div>
      </header>

      <div className="chart">
        <iframe src={`https://s.tradingview.com/widgetembed/?symbol=${selected.tv}&interval=1&theme=dark`} width="100%" height="100%" frameBorder="0"></iframe>
      </div>

      <div className="input-area">
        <select onChange={(e) => setSelected(marketPairs.find(m => m.name === e.target.value))}>
          {marketPairs.map(m => <option key={m.name}>{m.name}</option>)}
        </select>
        <input type="text" placeholder="Paste Cookie/Session ID..." onChange={(e) => setCookie(e.target.value)} />
        <button onClick={startBot}>START RTX V15</button>
      </div>

      <div className="signal-box">
        <div className={`card ${signal.includes('UP') ? 'up' : signal.includes('DOWN') ? 'down' : ''}`}>
          <h2>{signal}</h2>
          <div className="meta">
            <p>ACCURACY: <span>{acc}%</span></p>
            <p>ENTRY: <span>1 MIN</span></p>
            <p>LIVE: <span>{time}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
    }
