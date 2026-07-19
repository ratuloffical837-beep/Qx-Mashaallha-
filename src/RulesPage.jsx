import { useState } from 'react'

// ── Colors (matches App.jsx / PaymentPage.jsx palette) ─────────
const C = {
  bg: '#0b0e11', card: '#141820', panel: '#1a1f2e',
  border: '#2b3139', text: '#e0e0e0', muted: '#666',
  green: '#0ecb81', red: '#f6465d', gold: '#f3ba2f', blue: '#60a5fa',
}

// ── MTG 5-Step data (from your WIN scenario table) ──────────────
const mtgWinSteps = [
  { step: 1, trade: 100, result: 'WIN', gain: 85, balance: 5085 },
  { step: 2, trade: 100, result: 'WIN', gain: 85, balance: 5170 },
  { step: 3, trade: 100, result: 'WIN', gain: 85, balance: 5255 },
  { step: 4, trade: 100, result: 'WIN', gain: 85, balance: 5340 },
  { step: 5, trade: 100, result: 'WIN', gain: 85, balance: 5425 },
]

const mtgLossSteps = [
  { step: 1, trade: 100, result: 'LOSS', loss: 100, balance: 4900, next: 200 },
  { step: 2, trade: 200, result: 'LOSS', loss: 200, balance: 4700, next: 400 },
  { step: 3, trade: 400, result: 'LOSS', loss: 400, balance: 4300, next: 800 },
  { step: 4, trade: 800, result: 'LOSS', loss: 800, balance: 3500, next: 1600 },
  { step: 5, trade: 1600, result: 'LOSS', loss: 1600, balance: 1700, next: null },
]

// ── 30-Day Compounding data ──────────────────────────────────────
const genCompounding = () => {
  const rows = []
  let bal = 5000
  for (let day = 1; day <= 30; day++) {
    const target = +(bal * 0.10).toFixed(2)
    const end = +(bal + target).toFixed(2)
    rows.push({ day, start: bal, target, end })
    bal = end
  }
  return rows
}
const compoundRows = genCompounding()
const finalBalance = compoundRows[compoundRows.length - 1].end

export default function RulesPage({ onClose }) {
  const [tab, setTab] = useState('disclaimer') // disclaimer | mtg | compounding

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg, zIndex: 999,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.gold }}>📜 রুল্স ও গাইড</div>
        <button onClick={onClose} style={{
          background: C.panel, border: `1px solid ${C.border}`, color: C.muted,
          borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
        }}>✕ বন্ধ</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 12px 0' }}>
        {[
          { key: 'disclaimer', label: '⚠️ নিয়মাবলী' },
          { key: 'mtg', label: '🎯 5-Step MTG' },
          { key: 'compounding', label: '📈 30 Day Plan' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 6px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            background: tab === t.key ? `${C.gold}22` : C.panel,
            color: tab === t.key ? C.gold : C.muted,
            border: tab === t.key ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 14 }}>

        {/* ══════════ DISCLAIMER TAB ══════════ */}
        {tab === 'disclaimer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ ...s.card, border: `1px solid ${C.red}55` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.red, marginBottom: 8 }}>
                ⚠️ ঝুঁকি সম্পর্কিত সতর্কতা
              </div>
              <ul style={s.ul}>
                <li>ট্রেডিং (ফরেক্স/বাইনারি) একটি <b style={{ color: C.red }}>উচ্চ-ঝুঁকিপূর্ণ</b> কার্যক্রম। এখানে টাকা হারানোর সম্ভাবনা সবসময় থাকে।</li>
                <li>এই অ্যাপের সিগনাল কোনো নিশ্চিত লাভের গ্যারান্টি না — এটি একটি সহায়ক টুল মাত্র, বিশেষজ্ঞ পরামর্শ না।</li>
                <li>আপনি যা বিনিয়োগ করছেন তা সম্পূর্ণ হারানোর সম্ভাবনা মেনে নিয়েই ট্রেড করুন।</li>
                <li>নিজের আর্থিক সিদ্ধান্তের দায়ভার সম্পূর্ণ আপনার নিজের — এই অ্যাপ, এর ডেভেলপার বা সিগনাল কোনো ক্ষতির দায় নেবে না।</li>
              </ul>
            </div>

            <div style={{ ...s.card, border: `1px solid ${C.gold}55` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.gold, marginBottom: 8 }}>
                💰 মানি ম্যানেজমেন্ট — সাধারণ নীতি
              </div>
              <ul style={s.ul}>
                <li>প্রতি ট্রেডে মোট ব্যালেন্সের মাত্র ১-২% ঝুঁকি নিন।</li>
                <li>একদিনে সর্বোচ্চ ৩-৫টি ট্রেডের বেশি না করাই ভালো।</li>
                <li>লাভ বা লস — কোনোটাতেই আবেগের বশে সিদ্ধান্ত বদলাবেন না।</li>
              </ul>
            </div>

            <div style={{ ...s.card, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.blue, marginBottom: 8 }}>
                🎯 মার্টিঙ্গেল (ডাবল ট্রেড) নিয়ে বিশেষ সতর্কতা
              </div>
              <ul style={s.ul}>
                <li>মার্টিঙ্গেল সিস্টেমে প্রতিটা লসের পর পরের ট্রেডের পরিমাণ দ্বিগুণ করা হয়, যাতে একটা WIN আসলে আগের সব লস পুষিয়ে যায়।</li>
                <li>কিন্তু <b style={{ color: C.red }}>টানা লস চলতে থাকলে</b> ট্রেডের পরিমাণ খুব দ্রুত অনেক বড় হয়ে যায় — ৫ ধাপের পরেও লস চললে ব্যালেন্স দ্রুত শেষ হয়ে যেতে পারে।</li>
                <li>এটি একটি পরিচিত উচ্চ-ঝুঁকির কৌশল ("risk of ruin") — নিচের 5-Step MTG উদাহরণটি একটি সম্ভাব্য দৃশ্য মাত্র, ফলাফলের নিশ্চয়তা না।</li>
              </ul>
            </div>

          </div>
        )}

        {/* ══════════ MTG 5-STEP TAB ══════════ */}
        {tab === 'mtg' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ ...s.card, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.gold }}>MTG 5-STEP TRADING METHOD</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                নিয়ম: যতক্ষণ পর্যন্ত লস না হবে ততক্ষণ ডাবল ট্রেড নয়, লাভ হলে ১০০ টাকা কন্টিনিউ।
              </div>
              <div style={{ marginTop: 10, background: '#0d1117', borderRadius: 8, padding: '8px 12px', display: 'inline-block' }}>
                <span style={{ fontSize: 11, color: C.muted }}>START BALANCE: </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>৳5,000</span>
              </div>
            </div>

            {/* WIN scenario */}
            <div style={s.card}>
              <div style={{ ...s.sectionLabel, color: C.green }}>✅ লাভের ক্ষেত্রে (Win Scenario)</div>
              <TableHead cols={['ধাপ', 'ট্রেড (৳)', 'রেজাল্ট', 'পরের ব্যালেন্স']} />
              {mtgWinSteps.map(r => (
                <TableRow key={r.step} cells={[r.step, `৳${r.trade}`, <span style={{ color: C.green }}>WIN ✅</span>, `৳${r.balance}`]} />
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.7 }}>
                • প্রতিটি ট্রেডে ৮৫% লাভ এবং ১০০ টাকা কন্টিনিউ করলে ৫টি ট্রেড শেষে ব্যালেন্স: <b style={{ color: C.green }}>৳5,425</b> (মোট লাভ ৳425)
              </div>
            </div>

            {/* LOSS scenario */}
            <div style={s.card}>
              <div style={{ ...s.sectionLabel, color: C.red }}>❌ লসের ক্ষেত্রে (Loss Scenario)</div>
              <TableHead cols={['ধাপ', 'ট্রেড (৳)', 'রেজাল্ট', 'পরের ব্যালেন্স']} />
              {mtgLossSteps.map(r => (
                <TableRow key={r.step} cells={[r.step, `৳${r.trade}`, <span style={{ color: C.red }}>LOSS ❌</span>, `৳${r.balance}`]} />
              ))}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.7 }}>
                • ৫ ধাপ ধারাবাহিক লস হলে মোট ব্যালেন্স: <b style={{ color: C.red }}>৳1,700</b> (মোট লস ৳3,300)<br />
                • <b style={{ color: C.red }}>⚠️ ৫ ধাপ শেষ — এরপর আর ডাবল করা যাবে না।</b> ৬ষ্ঠ লস হলে বাকি ব্যালেন্স থেকেই যেতে হবে, যা দ্রুত শেষ হয়ে যেতে পারে।
              </div>
            </div>

          </div>
        )}

        {/* ══════════ 30-DAY COMPOUNDING TAB ══════════ */}
        {tab === 'compounding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ ...s.card, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.gold }}>30 DAYS COMPOUNDING PLAN</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>মানি ও রিস্ক ম্যানেজমেন্ট সহ</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Badge label="স্টার্ট" value="৳5,000" color={C.blue} />
                <Badge label="দৈনিক টার্গেট" value="10%" color={C.green} />
                <Badge label="রিস্ক/ট্রেড" value="1-2%" color={C.gold} />
              </div>
            </div>

            <div style={{ ...s.card, border: `1px solid ${C.gold}44` }}>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
                <b style={{ color: C.text }}>ফর্মুলা:</b> পরের দিনের ব্যালেন্স = আজকের ব্যালেন্স × ১.১০
                <br />
                <span style={{ color: C.red }}>⚠️ এই হিসাব ধরে নিচ্ছে প্রতিদিন লাভ হবে, কোনো লস দিন থাকবে না — বাস্তবে এটি নিশ্চিত না। এটি একটি হাইপোথেটিক্যাল (সম্ভাব্য) উদাহরণ মাত্র, প্রতিশ্রুতি না।</span>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.sectionLabel}>দৈনিক ব্যালেন্স টেবিল</div>
              <TableHead cols={['দিন', 'শুরুর ব্যালেন্স', 'টার্গেট (10%)', 'শেষ ব্যালেন্স']} small />
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {compoundRows.map(r => (
                  <TableRow key={r.day}
                    small
                    cells={[r.day, `৳${r.start.toLocaleString()}`, `৳${r.target.toLocaleString()}`, <b style={{ color: C.green }}>৳{r.end.toLocaleString()}</b>]}
                  />
                ))}
              </div>
            </div>

            <div style={{ ...s.card, textAlign: 'center', border: `1px solid ${C.green}55` }}>
              <div style={{ fontSize: 11, color: C.muted }}>৩০ দিন পর (হাইপোথেটিক্যাল)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.green, margin: '4px 0' }}>
                ৳{finalBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: C.gold }}>
                সম্ভাব্য লাভ: ৳{(finalBalance - 5000).toLocaleString()} (যদি প্রতিদিন লাভ হয়)
              </div>
            </div>

            <div style={{ ...s.card, border: `1px solid ${C.border}` }}>
              <div style={{ ...s.sectionLabel, color: C.blue }}>রিস্ক ম্যানেজমেন্ট প্ল্যান</div>
              <ul style={s.ul}>
                <li>SL (Stop Loss) ব্যবহার করুন</li>
                <li>RR (Risk:Reward) কমপক্ষে 1:2 রাখুন</li>
                <li>আবেগ দিয়ে না, পরিকল্পনা দিয়ে ট্রেড করুন</li>
                <li>নিজের ট্রেডিং সময় অতিরিক্ত না নেওয়াই ভালো</li>
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ── Small sub-components ────────────────────────────────────────
function TableHead({ cols, small }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
      gap: 4, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}`,
    }}>
      {cols.map((c, i) => (
        <div key={i} style={{ fontSize: small ? 9 : 10, color: C.muted, fontWeight: 700, textAlign: i === 0 ? 'left' : 'center' }}>{c}</div>
      ))}
    </div>
  )
}

function TableRow({ cells, small }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      gap: 4, padding: small ? '5px 0' : '7px 0', borderBottom: `1px solid ${C.border}33`,
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{ fontSize: small ? 10.5 : 12, color: C.text, textAlign: i === 0 ? 'left' : 'center' }}>{c}</div>
      ))}
    </div>
  )
}

function Badge({ label, value, color }) {
  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: '6px 12px', border: `1px solid ${color}44` }}>
      <div style={{ fontSize: 9, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const s = {
  card: {
    background: C.card, borderRadius: 12, padding: 14,
    border: `1px solid ${C.border}`,
  },
  sectionLabel: {
    fontSize: 10, color: '#555', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
  },
  ul: {
    margin: 0, paddingLeft: 18, fontSize: 12, color: C.text,
    lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 4,
  },
    }
