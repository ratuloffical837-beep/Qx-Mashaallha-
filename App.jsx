import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(window.location.origin);
const markets = ["EUR/USD OTC", "GBP/USD OTC", "USD/JPY OTC", "AUD/CAD OTC", "EUR/JPY OTC"];

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [viewData, setViewData] = useState({ signal: 'SCANNING', acc: '0%', live: '--:--:--', next: '--:--:--' });

  useEffect(() => {
    socket.on('new_signal', (s) => setViewData(prev => ({ ...prev, ...s })));
    socket.on('time_sync', (t) => setViewData(prev => ({ ...prev, ...t })));
    return () => { socket.off('new_signal'); socket.off('time_sync'); };
  }, []);

  if (!isAuth) return (
    <div style={{height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif'}}>
      <div style={{background:'#111', padding:'30px', borderRadius:'15px', border:'1px solid #f3ba2f', textAlign:'center', width:'320px'}}>
        <h3 style={{color:'#f3ba2f', margin:'0 0 20px 0'}}>RTX 15 PRO MASTER LOGIN</h3>
        <input type="password" placeholder="PASSWORD" style={{width:'85%', padding:'12px', background:'#000', border:'1px solid #333', color:'#fff', borderRadius:'8px', marginBottom:'20px'}} onChange={e => setPass(e.target.value)} />
        <button style={{width:'95%', padding:'12px', background:'#f3ba2f', color:'#000', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', border:'none'}} onClick={async () => {
          const res = await fetch('/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pass})});
          if(res.ok) setIsAuth(true); else alert("Access Denied!");
        }}>BOOT SYSTEM</button>
      </div>
    </div>
  );

  return (
    <div style={{background:'#050505', minHeight:'100vh', color:'#fff', fontFamily:'sans-serif', padding:'15px'}}>
      <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #222', paddingBottom:'10px'}}>
        <span style={{color:'#f3ba2f', fontWeight:'bold'}}>RTX 15 PRO MAX AI</span>
        <span style={{color:'#888', fontSize:'0.9rem'}}>{viewData.live}</span>
      </div>

      <select style={{width:'100%', background:'#111', color:'#f3ba2f', border:'1px solid #333', padding:'12px', borderRadius:'10px', margin:'20px 0'}}>
        {markets.map(m => <option key={m}>{m}</option>)}
      </select>

      <div style={{background:'#0a0a0a', border:`2px solid ${viewData.signal.includes('CALL') ? '#0ecb81' : viewData.signal.includes('PUT') ? '#f6465d' : '#333'}`, borderRadius:'20px', padding:'40px', textAlign:'center', boxShadow:'0 10px 40px rgba(0,0,0,0.5)'}}>
        <div style={{fontSize:'2.8rem', fontWeight:'900', color: viewData.signal.includes('CALL') ? '#0ecb81' : viewData.signal.includes('PUT') ? '#f6465d' : '#fff'}}>{viewData.signal}</div>
        <div style={{marginTop:'30px', display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#666'}}>
          <span>NEXT: <b style={{color:'#fff'}}>{viewData.next}</b></span>
          <span>ACCURACY: <b style={{color:'#f3ba2f'}}>{viewData.acc}</b></span>
        </div>
      </div>
    </div>
  );
}
export default App;
