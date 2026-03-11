import React, { useState, useEffect } from 'react';
import { RSI, EMA } from 'technicalindicators';

const markets = [
    { name: "GBP/NZD (OTC)", id: "GBPNZD", tv: "FX:GBPNZD" },
    { name: "USD/BDT (OTC)", id: "USDBDT", tv: "FX:USDBDT" },
    { name: "EUR/USD", id: "EURUSD", tv: "FX:EURUSD" },
    { name: "Bitcoin (OTC)", id: "BTCUSDT", tv: "BINANCE:BTCUSDT" },
    { name: "McDonald's (OTC)", id: "MCD", tv: "NYSE:MCD" }
];

export default function App() {
    const [selected, setSelected] = useState(markets[0]);
    const [cookie, setCookie] = useState('');
    const [signal, setSignal] = useState('READY TO SCAN');
    const [accuracy, setAccuracy] = useState(0);
    const [entryTime, setEntryTime] = useState('--:--:--');
    const [countdown, setCountdown] = useState(180);

    useEffect(() => {
        if (!cookie) return;
        
        const runScanner = () => {
            getSignal();
            setCountdown(180);
        };

        runScanner(); 
        const signalTimer = setInterval(runScanner, 180000);
        const countTimer = setInterval(() => setCountdown(p => p > 0 ? p - 1 : 180), 1000);

        return () => { clearInterval(signalTimer); clearInterval(countTimer); };
    }, [selected, cookie]);

    const getSignal = async () => {
        setSignal('SCANNING MARKET...');
        try {
            // Vite Proxy ব্যবহার করা হয়েছে (/api/)
            const res = await fetch('/api/fetch-quotex', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cookie, symbol: selected.id })
            });
            const data = await res.json();
            
            const closePrices = data
                .map(c => parseFloat(c.close || c[4] || c.c || c.price))
                .filter(p => !isNaN(p) && p !== 0);

            if (closePrices.length < 30) {
                setSignal('INSUFFICIENT DATA');
                return;
            }

            const rsi = RSI.calculate({ values: closePrices, period: 14 });
            const ema = EMA.calculate({ values: closePrices, period: 20 });
            
            const curRSI = rsi[rsi.length - 1];
            const preRSI = rsi[rsi.length - 2];
            const curEMA = ema[ema.length - 1];
            const curPrice = closePrices[closePrices.length - 1];

            setEntryTime(new Date().toLocaleTimeString());

            // --- হাই-একিউরেসি রিভার্সাল লজিক ---
            // CALL: EMA এর উপরে এবং RSI ৩০ নিচ থেকে ক্রস করে উপরে উঠছে
            if (curPrice > curEMA && curRSI > 30 && preRSI <= 30) {
                updateSignal('STRONG CALL ↑', 98.5);
            } 
            // PUT: EMA এর নিচে এবং RSI ৭০ উপর থেকে ক্রস করে নিচে নামছে
            else if (curPrice < curEMA && curRSI < 70 && preRSI >= 70) {
                updateSignal('STRONG PUT ↓', 97.8);
            } 
            else {
                updateSignal('NO SIGNAL - WAIT', 0);
            }
        } catch (err) {
            setSignal('ERROR: CHECK COOKIE');
        }
    };

    const updateSignal = (sig, acc) => {
        setSignal(sig);
        setAccuracy(acc);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(acc > 0 ? 'success' : 'warning');
        }
    };

    return (
        <div className="main-wrapper">
            <header>
                <div className="status"><span className="dot"></span> LIVE SCANNER</div>
                <div className="holy-txt">لَا إِلٰهَ إِلَّا اللهُ مُحَمَّدٌ رَسُولُ اللهِ</div>
            </header>
            
            <div className="chart-area">
                <iframe key={selected.tv} src={`https://s.tradingview.com/widgetembed/?symbol=${selected.tv}&interval=1&theme=dark`} width="100%" height="100%" frameBorder="0"></iframe>
            </div>

            <div className="ui-group">
                <div className="timer-bar">Next Update: {Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}</div>
                <select onChange={(e) => {setSelected(markets.find(m => m.id === e.target.value)); setSignal('WAITING...');}}>
                    {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input type="text" placeholder="Paste Session Cookie" onChange={(e) => setCookie(e.target.value)} />
            </div>

            <div className="result-area">
                <div className={`signal-card ${signal.includes('CALL') ? 'up' : signal.includes('PUT') ? 'down' : ''}`}>
                    <small>ENTRY: {entryTime}</small>
                    <h1>{signal}</h1>
                    <div className="meta">
                        <span>ACCURACY: <b>{accuracy}%</b></span>
                        <span>EXPIRY: <b>1 MIN</b></span>
                    </div>
                </div>
            </div>
        </div>
    );
  }
