#!/usr/bin/env python3
"""Simple test: Does Prophet AI consider current date?"""
import json
import subprocess

# Same spending, different dates
early_data = [{"date": "2025-07-01", "category": "Food", "amount": 50}]
late_data = [{"date": "2025-07-28", "category": "Food", "amount": 50}]

def quick_test(data, name):
    try:
        result = subprocess.run(['python3', 'cloud_predictor.py'], 
                              input=json.dumps(data), text=True, 
                              capture_output=True, timeout=10)
        pred = json.loads(result.stdout).get('Food', 0)
        print(f"{name}: ${pred:.2f}")
        return pred
    except:
        print(f"{name}: Failed")
        return 0

print("Testing AI date awareness...")
early = quick_test(early_data, "Early month")
late = quick_test(late_data, "Late month")

if early != late:
    print("✅ AI considers date context!")
else:
    print("❌ AI ignores date context")
