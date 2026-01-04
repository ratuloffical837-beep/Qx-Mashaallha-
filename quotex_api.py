import json
import asyncio
import websockets
import time

class QuotexAPI:
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.wss_url = "wss://ws.qxbroker.com/websocket/889/asdfghjkl/websocket" # Quotex Websocket URL
        self.ws = None
        self.candles = []
        self.is_connected = False

    async def connect(self):
        """Quotex সার্ভারের সাথে কানেকশন তৈরি করা"""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            self.ws = await websockets.connect(self.wss_url, extra_headers=headers)
            self.is_connected = True
            print("Successfully Connected to Quotex Market")
            
            # অথেন্টিকেশন বা লগইন মেসেজ (এটি আপনার টোকেন অনুযায়ী কাজ করবে)
            auth_msg = {"name": "authorization", "msg": {"email": self.email, "password": self.password}}
            await self.ws.send(json.dumps(auth_msg))
            
            # লাইভ ক্যান্ডেল স্ট্রিম শুরু করা (যেমন: EUR/USD)
            stream_msg = {"name": "subscribe_asset", "msg": {"asset": "EURUSD_otc", "period": 60}}
            await self.ws.send(json.dumps(stream_msg))
            
            asyncio.create_task(self.receive_messages())
        except Exception as e:
            print(f"Connection Error: {e}")
            self.is_connected = False

    async def receive_messages(self):
        """মার্কেট থেকে লাইভ ডেটা গ্রহণ করা"""
        async for message in self.ws:
            data = json.loads(message)
            
            # ক্যান্ডেল ডেটা ফরম্যাট করা
            if "candles" in data:
                # আপনার লজিক ফাইলের জন্য ডেটা প্রসেস করা
                new_candles = data["candles"]
                self.candles = [
                    {
                        "open": c[1],
                        "close": c[2],
                        "high": c[3],
                        "low": c[4],
                        "time": c[0]
                    } for c in new_candles
                ]

    def get_latest_candles(self):
        """সর্বশেষ ৫০০ ক্যান্ডেল রিটার্ন করা"""
        return self.candles[-500:] if len(self.candles) > 0 else []

    async def get_remaining_time(self):
        """ক্যান্ডেল শেষ হতে কত সেকেন্ড বাকি তা বের করা"""
        now = time.time()
        remaining = 60 - (now % 60)
        return int(remaining)

# গ্লোবাল ইন্সট্যান্স যাতে অন্য ফাইল ব্যবহার করতে পারে
api_instance = QuotexAPI(email="YOUR_EMAIL", password="YOUR_PASSWORD")
