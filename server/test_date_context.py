#!/usr/bin/env python3
"""
Test script to analyze how Prophet AI handles different dates and current date context
"""
import json
import sys
from datetime import datetime, timedelta

# Test with data from different time periods to see if AI considers date context
test_data_early_month = [
    {"date": "2025-07-01", "category": "Food", "amount": 45.75},
    {"date": "2025-07-02", "category": "Food", "amount": 28.90},
    {"date": "2025-07-03", "category": "Food", "amount": 67.20},
]

test_data_mid_month = [
    {"date": "2025-07-15", "category": "Food", "amount": 45.75},
    {"date": "2025-07-16", "category": "Food", "amount": 28.90},
    {"date": "2025-07-17", "category": "Food", "amount": 67.20},
]

test_data_late_month = [
    {"date": "2025-07-28", "category": "Food", "amount": 45.75},
    {"date": "2025-07-29", "category": "Food", "amount": 28.90},
    {"date": "2025-07-30", "category": "Food", "amount": 67.20},
]

def test_prediction_with_dates(test_data, test_name):
    print(f"\n=== TESTING {test_name} ===")
    print(f"Test data dates: {[item['date'] for item in test_data]}")
    print(f"Current date for context: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Calculate remaining days based on test data dates
    if test_data:
        latest_date = max(datetime.strptime(item['date'], '%Y-%m-%d') for item in test_data)
        today = datetime.now()
        last_day_of_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        remaining_days = (last_day_of_month - today).days
        print(f"Days remaining in month: {remaining_days}")
    
    import subprocess
    import os

    python_cmd = 'python'
    script_path = os.path.join(os.path.dirname(__file__), 'cloud_predictor.py')

    try:
        process = subprocess.Popen(
            [python_cmd, script_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=json.dumps(test_data))
        
        print("PREDICTION OUTPUT:", stdout.strip())
        print("AI LOGS:")
        # Extract key information from stderr
        for line in stderr.split('\n'):
            if 'Current total=' in line or 'remaining days=' in line or 'Prophet AI predicts' in line:
                print(f"  {line}")
        
        if process.returncode == 0:
            try:
                predictions = json.loads(stdout)
                current_spent = sum(item['amount'] for item in test_data)
                predicted = predictions.get('Food', 0)
                increase = predicted - current_spent
                multiplier = predicted / current_spent if current_spent > 0 else 0
                print(f"RESULT: Current ${current_spent:.2f} → Predicted ${predicted:.2f} (${increase:.2f} increase, {multiplier:.1f}x)")
                return predicted, current_spent, remaining_days
            except json.JSONDecodeError:
                print("Failed to parse predictions")
                return None, None, None
    except Exception as e:
        print(f"Error: {e}")
        return None, None, None

# Test all scenarios
print("Testing how Prophet AI handles different dates and remaining time...")

early_pred, early_current, early_days = test_prediction_with_dates(test_data_early_month, "EARLY MONTH (July 1-3)")
mid_pred, mid_current, mid_days = test_prediction_with_dates(test_data_mid_month, "MID MONTH (July 15-17)")  
late_pred, late_current, late_days = test_prediction_with_dates(test_data_late_month, "LATE MONTH (July 28-30)")

print(f"\n=== ANALYSIS: Does AI Consider Current Date? ===")
print(f"Same spending amount (${early_current:.2f}) on different dates:")
print(f"Early month → Predicted: ${early_pred:.2f} (remaining days: {early_days})")
print(f"Mid month   → Predicted: ${mid_pred:.2f} (remaining days: {mid_days})")
print(f"Late month  → Predicted: ${late_pred:.2f} (remaining days: {late_days})")

if early_pred and mid_pred and late_pred:
    if early_pred != mid_pred or mid_pred != late_pred:
        print("✅ YES! AI considers current date - predictions vary based on remaining time")
    else:
        print("❌ NO - AI gives same predictions regardless of date")
else:
    print("⚠️  Could not compare - some tests failed")
