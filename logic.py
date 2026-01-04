import numpy as np

class SignalEngine:
    def __init__(self):
        pass

    def analyze_candles(self, candles):
        if len(candles) < 10: return "WAIT"
        
        # সর্বশেষ ক্যান্ডেল এবং তার আগের ডেটা
        current = candles[-1]
        prev = candles[-2]
        
        # বডি এবং উইক ক্যালকুলেশন
        body = abs(current['open'] - current['close'])
        upper_wick = current['high'] - max(current['open'], current['close'])
        lower_wick = min(current['open'], current['close']) - current['low']
        
        # সাপোর্ট ও রেজিস্ট্যান্স (গত ১০০ ক্যান্ডেল থেকে)
        highs = [c['high'] for c in candles[-100:]]
        lows = [c['low'] for c in candles[-100:]]
        resistance = max(highs)
        support = min(lows)

        # ১. রেজিস্ট্যান্স লাইন রিজেকশন লজিক (DOWN Signal)
        if current['close'] >= resistance * 0.998 and upper_wick > body:
            return "DOWN"

        # ২. সাপোর্ট লাইন রিজেকশন লisজিক (UP Signal)
        if current['close'] <= support * 1.002 and lower_wick > body:
            return "UP"

        # ৩. হ্যামার বা বুলিশ প্যাটার্ন তদন্ত
        if lower_wick > (body * 2) and current['close'] > current['open']:
            return "UP"

        # ৪. শুটিং স্টার বা বিয়ারিশ প্যাটার্ন তদন্ত
        if upper_wick > (body * 2) and current['close'] < current['open']:
            return "DOWN"

        return "ANALYZING..."
