import numpy as np

class SignalEngine:
    def __init__(self):
        pass

    def analyze_candles(self, candles):
        # এই অংশটি সাবধানে কপি করুন, স্পেস যেন ঠিক থাকে
        if candles is None or len(candles) == 0:
            return "NO DATA FROM API"
        
        # সর্বশেষ ক্যান্ডেল এবং তার আগের ডেটা
        current = candles[-1]
        
        # বডি এবং উইক ক্যালকুলেশন
        try:
            body = abs(current['open'] - current['close'])
            upper_wick = current['high'] - max(current['open'], current['close'])
            lower_wick = min(current['open'], current['close']) - current['low']
            
            # একটি সিম্পল লজিক টেস্ট করার জন্য
            if lower_wick > upper_wick and current['close'] > current['open']:
                return "UP"
            elif upper_wick > lower_wick and current['close'] < current['open']:
                return "DOWN"
            else:
                return "ANALYZING..."
        except Exception as e:
            return "ERROR IN DATA"
