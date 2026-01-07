#!/usr/bin/env bash
# exit on error
set -o errexit

# পাইপ (pip) আপডেট করা
pip install --upgrade pip

# আপনার requirements.txt থেকে সব লাইব্রেরি ইন্সটল করা
pip install -r requirements.txt

# রেন্ডারে ব্রাউজার (Chromium) ইন্সটল করার সঠিক কমান্ড
# এখানে 'install-deps' ব্যবহার করা হবে না কারণ রেন্ডারে রুট এক্সেস নেই
playwright install chromium
