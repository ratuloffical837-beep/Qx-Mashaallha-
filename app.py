import os, asyncio, threading, time, datetime
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from ai_engine import AIVision
from quotex_api import QuotexManager

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
vision, quotex = AIVision(), QuotexManager()

@app.route('/login', methods=['POST'])
def auth():
    if request.json.get('password') == os.getenv("ADMIN_PASSWORD"):
        return jsonify({"status": "ok"})
    return jsonify({"status": "fail"}), 401

async def signal_engine():
    await quotex.start(os.getenv("QUOTEX_EMAIL"), os.getenv("QUOTEX_PASSWORD"))
    processed_this_min = False
    
    while True:
        now = datetime.datetime.now()
        socketio.emit('time_sync', {
            'live': now.strftime('%H:%M:%S'),
            'next': (now + datetime.timedelta(minutes=1)).replace(second=0).strftime('%H:%M:%S')
        })
        
        # ৫৬ সেকেন্ডের মাস্টার লজিক
        if now.second == 56 and not processed_this_min:
            frame = await quotex.capture()
            sig, acc = vision.analyze(frame)
            socketio.emit('new_signal', {'signal': sig, 'acc': f"{acc:.2f}%"})
            processed_this_min = True
        
        if now.second == 0:
            processed_this_min = False
            
        await asyncio.sleep(0.5)

def run_background():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(signal_engine())

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    threading.Thread(target=run_background, daemon=True).start()
    socketio.run(app, host='0.0.0.0', port=port)
