import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/fetch-quotex', async (req, res) => {
    const { cookie, symbol } = req.body;
    try {
        console.log(`🔍 Fetching data for: ${symbol}`);
        const response = await axios.get(`https://qxbroker.com/api/v1/candles/${symbol}`, {
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://qxbroker.com/en/trade',
                'Origin': 'https://qxbroker.com'
            },
            timeout: 15000
        });
        
        // বিভিন্ন ফরম্যাট হ্যান্ডলিং (Array, Object, বা nested data)
        const rawData = response.data;
        const candles = Array.isArray(rawData) ? rawData : (rawData.data || rawData.candles || []);
        
        if (candles.length === 0) throw new Error("Empty data received from Quotex");

        // অন্তত ১০০টি ক্যান্ডেল পাঠানো হচ্ছে যাতে ইন্ডিকেটর সঠিক ক্যালকুলেশন করতে পারে
        res.json(candles.slice(-100)); 
    } catch (error) {
        console.error("❌ Backend Error:", error.message);
        res.status(500).json({ error: "Quotex Rejected", detail: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Master Proxy running on port ${PORT}`));
