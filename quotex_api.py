import asyncio, os
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
import numpy as np
import cv2

class QuotexManager:
    def __init__(self):
        self.page = None
        self.browser = None

    async def start(self, email, password):
        pw = await async_playwright().start()
        # Render RAM Optimization Flags
        self.browser = await pw.chromium.launch(headless=True, args=[
            '--no-sandbox', '--disable-dev-shm-usage', '--single-process', 
            '--disable-gpu', '--disable-setuid-sandbox'
        ])
        self.context = await self.browser.new_context(viewport={'width': 800, 'height': 600})
        self.page = await self.context.new_page()
        await stealth_async(self.page)
        await self.login(email, password)

    async def login(self, email, password):
        try:
            await self.page.goto("https://qxbroker.com/en/login", timeout=60000)
            if "login" in self.page.url:
                await self.page.fill('input[name="email"]', email)
                await self.page.fill('input[name="password"]', password)
                await self.page.click('button[type="submit"]')
                await self.page.wait_for_url("**/trade**", timeout=45000)
                print("Quotex API: Session Established.")
        except Exception as e:
            print(f"Login Failure: {e}")

    async def capture(self):
        try:
            if "login" in self.page.url:
                await self.login(os.getenv("QUOTEX_EMAIL"), os.getenv("QUOTEX_PASSWORD"))
            
            # নিখুঁত চার্ট স্ক্রিনশট এলিমেন্ট
            chart = await self.page.query_selector('canvas.main-chart__canvas')
            if not chart: return None
            
            img_bytes = await chart.screenshot()
            nparr = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        except: return None
