import cv2
import numpy as np
import os
import requests
import zipfile
import re
from io import BytesIO

class AIVision:
    def __init__(self):
        self.patterns = []
        self.orb = cv2.ORB_create(nfeatures=1000)
        self.bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        self.load_data()

    def load_data(self):
        url = os.getenv("DRIVE_LINK")
        try:
            # শক্তিশালী Regex লজিক
            match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
            file_id = match.group(1) if match else url.split('/')[-2]
            direct_url = f'https://drive.google.com/uc?export=download&id={file_id}'
            
            response = requests.get(direct_url)
            with zipfile.ZipFile(BytesIO(response.content)) as z:
                for f in z.namelist():
                    if f.upper().endswith(('.PNG', '.JPG', '.JPEG')):
                        img_data = np.frombuffer(z.read(f), np.uint8)
                        img = cv2.imdecode(img_data, cv2.IMREAD_GRAYSCALE)
                        if img is not None:
                            img = cv2.resize(img, (200, 200))
                            _, des = self.orb.detectAndCompute(img, None)
                            if des is not None:
                                self.patterns.append({'des': des, 'name': f.upper()})
            print(f"AI Master: {len(self.patterns)} Patterns Synced.")
        except Exception as e:
            print(f"Drive Sync Error: {e}")

    def analyze(self, frame):
        if frame is None or not self.patterns: return "SCANNING", 0
        target = cv2.resize(frame, (200, 200))
        _, des_now = self.orb.detectAndCompute(target, None)
        if des_now is None: return "WAITING", 0

        best_matches = 0
        verdict = "SCANNING"
        for p in self.patterns:
            matches = self.bf.match(p['des'], des_now)
            score = len([m for m in matches if m.distance < 30])
            if score > best_matches:
                best_matches = score
                verdict = "SURE SHOT CALL ⬆️" if "CALL" in p['name'] else "SURE SHOT PUT ⬇️"
        
        confidence = min((best_matches / 50) * 100, 99.2)
        return verdict, confidence
