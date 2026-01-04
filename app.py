import os
from flask import Flask, render_template, jsonify
from logic import SignalEngine

app = Flask(__name__)
engine = SignalEngine()

# ডামি ডেটা (এখানে আপনার Quotex API থেকে লাইভ ডেটা আসবে)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_signal')
def get_signal():
    # এখানে Quotex API থেকে আসা লাইভ ক্যান্ডেল লিস্ট পাস করতে হবে
    # উদাহরণ স্বরূপ একটি স্ট্যাটিক সিগন্যাল পাঠানো হচ্ছে
    mock_candles = [{'open': 1.1, 'close': 1.2, 'high': 1.3, 'low': 1.0}]
    signal = engine.analyze_candles(mock_candles)
    return jsonify({"direction": signal, "time": "5s Remaining"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
