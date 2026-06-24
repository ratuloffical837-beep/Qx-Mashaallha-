import { useState } from 'react'
import { db } from './firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

// ── আপনার তথ্য ────────────────────────────────────────────────
const BKASH_NUMBER   = '01725218874'
const NAGAD_NUMBER   = '01725218874'
const SUPPORT_LINK   = 'https://t.me/ratulhossain56'
const MONTHLY_AMOUNT = 1000
const BACKEND_URL    = 'https://master-ai-backend.onrender.com'  // Deploy পরে এটি ঠিক থাকবে

// ── Colors ─────────────────────────────────────────────────────
const C = {
  bg: '#0b0e11', card: '#141820', panel: '#1a1f2e',
  border: '#2b3139', text: '#e0e0e0', muted: '#666',
  green: '#0ecb81', red: '#f6465d', gold: '#f3ba2f',
  blue: '#60a5fa', pink: '#e2136e', orange: '#f7941d',
}

export default function PaymentPage({ tgUser, status }) {
  const [method, setMethod]   = useState('')
  const [txId, setTxId]       = useState('')
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState('')

  const copyNum = (num, label) => {
    navigator.clipboard.writeText(num).catch(() => {})
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleSubmit = async () => {
    if (!method)      return setError('পেমেন্ট মেথড সিলেক্ট করুন')
    if (!amount || isNaN(amount)) return setError('সঠিক পরিমাণ লিখুন')
    if (!txId.trim()) return setError('ট্রানজেকশন আইডি লিখুন')

    setLoading(true)
    setError('')

    try {
      const name = tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')
      const data = {
        userId:    String(tgUser.id),
        name,
        username:  tgUser.username || '',
        method,
        amount:    Number(amount),
        txId:      txId.trim(),
        status:    'pending',
        createdAt: serverTimestamp(),
      }

      // Firestore-এ save করো
      await setDoc(doc(db, 'payments', txId.trim()), data)

      // Backend-এ Telegram notification পাঠাও
      await fetch(`${BACKEND_URL}/api/notify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      setDone(true)
    } catch (e) {
      console.error(e)
      setError('সাবমিট হয়নি। ইন্টারনেট চেক করুন।')
    } finally {
      setLoading(false)
    }
  }

  // ── Pending / Rejected screen ────────────────────────────────
  if (done || status === 'pending') {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <div style={s.notifBar}>
          📢 প্রতি মাসে <strong>৳{MONTHLY_AMOUNT}</strong> পেমেন্ট করুন Master AI ব্যবহার করতে
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ ...s.card, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>⏳</div>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              পেমেন্ট রিভিউতে আছে
            </div>
            <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
              আপনার পেমেন্ট যাচাই হলে অ্যাক্সেস পাবেন।{'\n'}
              সাধারণত ১–৩ ঘণ্টার মধ্যে কনফার্ম হয়।
            </div>
            <button onClick={() => window.open(SUPPORT_LINK, '_blank')} style={s.supportBtnLarge}>
              💬 সাপোর্টে যোগাযোগ করুন
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <div style={s.notifBar}>
          📢 প্রতি মাসে <strong>৳{MONTHLY_AMOUNT}</strong> পেমেন্ট করুন Master AI ব্যবহার করতে
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ ...s.card, textAlign: 'center', padding: '30px 16px', marginBottom: 12, border: `1px solid ${C.red}44` }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>❌</div>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>পেমেন্ট রিজেক্ট হয়েছে</div>
            <div style={{ color: C.muted, fontSize: 12 }}>সঠিক ট্রানজেকশন আইডি দিয়ে আবার পেমেন্ট করুন।</div>
          </div>
          {/* Show payment form again */}
          <PaymentForm
            tgUser={tgUser} method={method} setMethod={setMethod}
            txId={txId} setTxId={setTxId} amount={amount} setAmount={setAmount}
            loading={loading} error={error} copied={copied}
            copyNum={copyNum} handleSubmit={handleSubmit}
          />
        </div>
      </div>
    )
  }

  // ── Main payment page ────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 30 }}>
      <div style={s.notifBar}>
        📢 প্রতি মাসে <strong>৳{MONTHLY_AMOUNT}</strong> পেমেন্ট করুন Master AI ব্যবহার করতে
      </div>
      <div style={{ padding: '12px 16px' }}>

        {/* Header card */}
        <div style={{ ...s.card, textAlign: 'center', padding: '20px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>💹</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '0.03em' }}>
            Master AI Signal
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>সাবস্ক্রিপশন — ৩০ দিন</div>
          {tgUser?.id > 0 && (
            <div style={{ marginTop: 10, background: '#0d1117', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#9ba3af' }}>
              👤 {tgUser.first_name} {tgUser.last_name || ''}
              {tgUser.username && <span style={{ color: C.blue }}> @{tgUser.username}</span>}
            </div>
          )}
        </div>

        <PaymentForm
          tgUser={tgUser} method={method} setMethod={setMethod}
          txId={txId} setTxId={setTxId} amount={amount} setAmount={setAmount}
          loading={loading} error={error} copied={copied}
          copyNum={copyNum} handleSubmit={handleSubmit}
        />

        {/* Customer support button */}
        <button onClick={() => window.open(SUPPORT_LINK, '_blank')} style={s.supportBtnLarge}>
          💬 Customer Support
        </button>
      </div>
    </div>
  )
}

// ── Payment Form Sub-component ────────────────────────────────
function PaymentForm({ tgUser, method, setMethod, txId, setTxId, amount, setAmount, loading, error, copied, copyNum, handleSubmit }) {
  const C = {
    bg: '#0b0e11', card: '#141820', panel: '#1a1f2e',
    border: '#2b3139', text: '#e0e0e0', muted: '#666',
    green: '#0ecb81', red: '#f6465d', gold: '#f3ba2f',
    blue: '#60a5fa', pink: '#e2136e', orange: '#f7941d',
  }
  const BKASH_NUMBER = '01725218874'
  const NAGAD_NUMBER = '01725218874'

  return (
    <>
      {/* Payment numbers */}
      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.sectionLabel}>পেমেন্ট নম্বর</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ ...s.numCard, borderColor: '#e2136e55' }} onClick={() => copyNum(BKASH_NUMBER, 'bkash')}>
            <div style={{ color: C.pink, fontWeight: 800, fontSize: 12, marginBottom: 4 }}>🩷 বিকাশ</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '0.05em' }}>{BKASH_NUMBER}</div>
            <div style={{ fontSize: 10, color: copied === 'bkash' ? C.green : C.muted, marginTop: 4 }}>
              {copied === 'bkash' ? '✅ কপি হয়েছে!' : 'ট্যাপ করে কপি করুন'}
            </div>
          </div>
          <div style={{ ...s.numCard, borderColor: '#f7941d55' }} onClick={() => copyNum(NAGAD_NUMBER, 'nagad')}>
            <div style={{ color: C.orange, fontWeight: 800, fontSize: 12, marginBottom: 4 }}>🧡 নগদ</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '0.05em' }}>{NAGAD_NUMBER}</div>
            <div style={{ fontSize: 10, color: copied === 'nagad' ? C.green : C.muted, marginTop: 4 }}>
              {copied === 'nagad' ? '✅ কপি হয়েছে!' : 'ট্যাপ করে কপি করুন'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#9ba3af' }}>
          Send Money পাঠান: <strong style={{ color: C.gold }}>৳1,000</strong>
        </div>
      </div>

      {/* Form */}
      <div style={{ ...s.card, marginBottom: 12 }}>
        <div style={s.sectionLabel}>পেমেন্ট তথ্য দিন</div>

        <div style={{ marginBottom: 12 }}>
          <div style={s.fieldLabel}>মেথড সিলেক্ট করুন</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ key: 'বিকাশ', color: C.pink }, { key: 'নগদ', color: C.orange }].map(({ key, color }) => (
              <button key={key} onClick={() => setMethod(key)} style={{
                flex: 1, padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', transition: '0.2s',
                background: method === key ? color + '22' : C.panel,
                color:      method === key ? color : C.muted,
                border:     method === key ? `2px solid ${color}` : `2px solid ${C.border}`,
              }}>{key}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={s.fieldLabel}>পরিমাণ (টাকা)</div>
          <input type="number" placeholder="যত টাকা পাঠিয়েছেন" value={amount}
            onChange={e => setAmount(e.target.value)} style={s.input} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={s.fieldLabel}>ট্রানজেকশন আইডি / TrxID</div>
          <input type="text" placeholder="TrxID বা Ref নম্বর লিখুন" value={txId}
            onChange={e => setTxId(e.target.value)} style={s.input} />
        </div>

        {error && (
          <div style={{ background: '#f6465d11', border: '1px solid #f6465d44', borderRadius: 8, padding: '10px 12px', color: '#f6465d', fontSize: 12, marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: loading ? C.panel : C.gold, color: loading ? C.muted : '#000',
          fontWeight: 800, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '⏳ সাবমিট হচ্ছে...' : '✅ পেমেন্ট সাবমিট করুন'}
        </button>
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const s = {
  notifBar: {
    background: 'linear-gradient(90deg, #1a1200, #251a00)',
    borderBottom: '1px solid #f3ba2f33',
    color: '#f3ba2f', fontSize: 12, padding: '10px 16px', textAlign: 'center',
  },
  card: {
    background: '#141820', borderRadius: 14, padding: '16px',
    border: '1px solid #2b3139',
  },
  numCard: {
    flex: 1, background: '#0d1117', borderRadius: 10, padding: '12px 10px',
    textAlign: 'center', cursor: 'pointer', border: '1px solid #2b3139',
  },
  sectionLabel: {
    fontSize: 10, color: '#555', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10, color: '#555', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '12px', borderRadius: 8,
    background: '#0d1117', color: '#e0e0e0',
    border: '1px solid #2b3139', fontSize: 13, outline: 'none',
  },
  supportBtnLarge: {
    width: '100%', padding: '14px', borderRadius: 10,
    background: '#1a2744', color: '#60a5fa',
    fontWeight: 700, fontSize: 13, border: '1px solid #60a5fa44',
    cursor: 'pointer', marginTop: 4,
  },
  }
