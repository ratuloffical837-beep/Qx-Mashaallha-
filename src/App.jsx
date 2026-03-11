import React, { useState, useEffect, useRef } from 'react';

// আপনার দেওয়া ২৯টি সঠিক মার্কেট লিস্ট
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
    const [selected, setSelected] = useState(markets[0]);
    const [token, setToken] = useState(localStorage.getItem('deriv_token') || '');
    const [isSaved, setIsSaved] = useState(!!localStorage.getItem('deriv_token'));
    const [liveTime, setLiveTime] = useState('00:00:00');
    const [entryTime, setEntryTime] = useState('00:00:00');
    const [signal, setSignal] = useState('WAITING FOR PATTERN');
    const [stats, setStats] = useState({ trend: '--', pattern: 'Scanning...' });
    const [score, setScore] = useState({ win: 0, loss: 0 });
    
    const ws = useRef(null);

    // Win/Loss এবং ২৪ ঘণ্টা রিসেট লজিক
    useEffect(() => {
        const savedScore = JSON.parse(localStorage.getItem('trade_score'));
        const lastReset = localStorage.getItem('last_reset_time');
        const now = new Date().getTime();

        if (lastReset && now - lastReset > 86400000) { // ২৪ ঘণ্টা = ৮৬৪০০০০০ মি.সে.
            const newScore = { win: 0, loss: 0 };
            localStorage.setItem('trade_score', JSON.stringify(newScore));
            localStorage.setItem('last_reset_time', now.toString());
            setScore(newScore);
        } else if (savedScore) {
            setScore(savedScore);
        } else {
            localStorage.setItem('last_reset_time', now.toString());
        }

        const timer = setInterval(() => {
            setLiveTime(new Date().toLocaleTimeString('en-GB'));
            if (new Date().getSeconds() === 56 && isSaved) fetchMarketData();
        }, 1000);
        return () => clearInterval(timer);
    }, [isSaved, selected]);

    const updateScore = (type) => {
        const newScore = { ...score, [type]: score[type] + 1 };
        setScore(newScore);
        localStorage.setItem('trade_score', JSON.stringify(newScore));
    };

    const fetchMarketData = () => {
        if (!token) return;
        if (ws.current) ws.current.close();
        ws.current = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({
                ticks_history: selected.id,
                count: 20,
                end: "latest",
                style: "candles"
            }));
        };

        ws.current.onmessage = (msg) => {
            const res = JSON.parse(msg.data);
            if (res.candles) {
                const completeCandles = res.candles.slice(0, -1);
                runSureShotLogic(completeCandles);
                ws.current.close();
            }
        };
    };

    const runSureShotLogic = (candles) => {
        const c = candles.map(cand => parseFloat(cand.close) > parseFloat(cand.open) ? "G" : "R");
        const match = (pattern) => JSON.stringify(c.slice(-pattern.length)) === JSON.stringify(pattern);

        let finalSig = "NO SIGNAL";
        let patName = "Searching...";

        // --- আপনার ৩০টি প্রো রুলস ---
        if (match(["R", "R", "R"])) { finalSig = "CALL"; patName = "Rule 1: 3 Red Reversal"; }
        else if (match(["R", "R", "G", "G", "G", "R"])) { finalSig = "PUT"; patName = "Rule 2: 6-Step Put"; }
        else if (match(["G", "R", "R", "G", "R"])) { finalSig = "CALL"; patName = "Rule 3: 5-Step Call"; }
        else if (match(["G", "G", "G", "R"])) { finalSig = "CALL"; patName = "Rule 4: 3G 1R Reversal"; }
        else if (match(["R", "R", "G", "G"])) { finalSig = "CALL"; patName = "Rule 5: 2R 2G Continue"; }
        else if (match(["R", "R", "R", "R", "G", "G"])) { finalSig = "CALL"; patName = "Rule 6: 4R 2G Recovery"; }
        else if (match(["R", "R", "R", "R"])) { finalSig = "CALL"; patName = "Rule 7: 4 Red Flush"; }
        else if (match(["R", "R", "R", "G"])) { finalSig = "PUT"; patName = "Rule 8: 3R 1G Trap"; }
        else if (match(["R", "G", "G", "G", "G", "R"])) { finalSig = "PUT"; patName = "Rule 9: 1R 4G 1R"; }
        else if (match(["R", "R", "R", "G", "R", "R"])) { finalSig = "CALL"; patName = "Rule 10: Deep Recovery"; }
        else if (match(["G", "G", "R", "G"])) { finalSig = "PUT"; patName = "Rule 11: 2G 1R 1G Put"; }
        else if (match(["G", "G", "R"])) { finalSig = "CALL"; patName = "Rule 12: Double Green Pullback"; }
        else if (match(["G", "R", "G", "G", "R", "R"])) { finalSig = "CALL"; patName = "Rule 13: Complex Recovery"; }
        else if (match(["R", "R", "R", "R", "G"])) { finalSig = "CALL"; patName = "Rule 14: 4R 1G Call"; }
        else if (match(["R", "R", "G", "R"])) { finalSig = "CALL"; patName = "Rule 15: 2R 1G 1R Call"; }
        else if (match(["G", "R", "R", "R", "G", "R"])) { finalSig = "CALL"; patName = "Rule 16: Volatility Spike"; }
        else if (match(["R", "G", "G", "R", "R", "G", "R", "R"])) { finalSig = "CALL"; patName = "Rule 17: Long Wave Call"; }
        else if (match(["G", "R", "R", "G", "G", "R"])) { finalSig = "PUT"; patName = "Rule 18: Reversal Put"; }
        else if (match(["G", "R", "R", "R"])) { finalSig = "CALL"; patName = "Rule 19: 3-Red Exhaustion"; }
        else if (match(["R", "R", "R", "G", "R", "G"])) { finalSig = "PUT"; patName = "Rule 20: Alternating Put"; }
        else if (match(["G", "G", "R", "G", "R", "G"])) { finalSig = "CALL"; patName = "Rule 21: Wave Reversal"; }
        else if (match(["R", "G", "G", "G", "R"])) { finalSig = "PUT"; patName = "Rule 22: Red Gap Correction"; }
        else if (match(["R", "G", "G", "G"])) { finalSig = "PUT"; patName = "Rule 23: 1R 3G Put"; }
        else if (match(["G", "G", "G", "R", "G"])) { finalSig = "PUT"; patName = "Rule 24: Green Trap Put"; }
        else if (match(["R", "G", "R", "R"])) { finalSig = "CALL"; patName = "Rule 25: 1R 1G 2R Call"; }
        else if (match(["G", "G", "R", "R"])) { finalSig = "CALL"; patName = "Rule 26: 2G 2R Call"; }
        else if (match(["R", "G", "R", "R", "R"])) { finalSig = "CALL"; patName = "Rule 27: Red Wave Call"; }
        else if (match(["G", "G", "G", "R", "G", "G"])) { finalSig = "PUT"; patName = "Rule 28: Strong Put Reversal"; }
        else if (match(["R", "G", "R", "G", "R"])) { finalSig = "CALL"; patName = "Rule 29: Pattern Break Call"; }
        else if (match(["G", "G", "R", "R", "G"])) { finalSig = "CALL"; patName = "Rule 30: Trend Follower"; }

        if (finalSig !== "NO SIGNAL") {
            setSignal(`SURE SHOT: ${finalSig === "CALL" ? "UP (CALL) ↑" : "DOWN (PUT) ↓"}`);
            setStats({ trend: c[c.length-1] === "G" ? "UP" : "DOWN", pattern: patName });
            setEntryTime(new Date().toLocaleTimeString('en-GB'));
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
        } else {
            setSignal("WAITING FOR PATTERN");
            setStats({ trend: "--", pattern: "Scanning Candles..." });
        }
    };

    return (
        <div className="container">
            <header className="header">
                <span className="logo">DERIV MASTER AI PRO</span>
                <span className="clock">{liveTime}</span>
            </header>

            <div className="chart-box">
                <iframe key={selected.id} src={`https://s.tradingview.com/widgetembed/?symbol=${selected.tv}&theme=dark`} width="100%" height="100%"></iframe>
            </div>

            <div className="ui-panel">
                <div className="score-row">
                    <div className="score-box win" onClick={() => updateScore('win')}>WIN: {score.win}</div>
                    <div className="score-box loss" onClick={() => updateScore('loss')}>LOSS: {score.loss}</div>
                    <div className="score-box rate">RATE: {score.win + score.loss > 0 ? ((score.win / (score.win + score.loss)) * 100).toFixed(0) : 0}%</div>
                </div>

                <select onChange={(e) => setSelected(markets.find(m => m.id === e.target.value))}>
                    {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                <div className="token-row">
                    <input type="password" placeholder="Deriv API Token" value={token} onChange={(e) => setToken(e.target.value)} disabled={isSaved} />
                    {!isSaved ? <button className="btn-save" onClick={() => {localStorage.setItem('deriv_token', token); setIsSaved(true); alert("Started!");}}>SAVE & START</button> : <button className="btn-del" onClick={() => {localStorage.removeItem('deriv_token'); setToken(''); setIsSaved(false);}}>DELETE</button>}
                </div>

                <div className="monitor-card">
                    <div className="monitor-top">
                        <span>LIVE: <b>{liveTime}</b></span>
                        <span>ENTRY: <b className="highlight">{entryTime}</b></span>
                    </div>
                    <div className={`signal-area ${signal.includes('UP') ? 'call' : signal.includes('DOWN') ? 'put' : 'waiting'}`}>
                        <h1>{signal}</h1>
                    </div>
                    <div className="monitor-bottom">
                        <div>TREND: <span>{stats.trend}</span></div>
                        <div>PATTERN: <span>{stats.pattern}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
