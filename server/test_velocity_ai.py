#!/usr/bin/env python3
"""
Detailed test to verify velocity-aware AI functionality
"""
import json
import subprocess
import os
from datetime import datetime

def test_single_scenario(test_data, scenario_name):
    print(f"\n{'='*60}")
    print(f"TESTING: {scenario_name}")
    print(f"{'='*60}")
    
    # Show test data details
    dates = [item['date'] for item in test_data]
    amounts = [item['amount'] for item in test_data]
    total = sum(amounts)
    
    print(f"Expense dates: {dates}")
    print(f"Amounts: {amounts}")
    print(f"Total spent: ${total:.2f}")
    
    # Calculate daily rate for context
    unique_days = len(set(datetime.strptime(d, '%Y-%m-%d').day for d in dates))
    daily_rate = total / unique_days
    
    # Calculate month progress
    latest_date = max(datetime.strptime(d, '%Y-%m-%d') for d in dates)
    month_progress = latest_date.day / 31  # Assuming 31-day month
    
    print(f"Days with spending: {unique_days}")
    print(f"Daily spending rate: ${daily_rate:.2f}")
    print(f"Month progress: {month_progress:.1%}")
    
    # Run the predictor
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
        
        print(f"\nPREDICTION RESULT: {stdout.strip()}")
        
        print(f"\nDETAILED AI LOGS:")
        for line in stderr.split('\n'):
            if any(keyword in line for keyword in ['velocity', 'Month progress', 'Applied velocity', 'Early month', 'Mid month', 'Late month']):
                print(f"  🧠 {line}")
            elif 'Prophet AI predicts' in line:
                print(f"  📊 {line}")
            elif 'Current total=' in line:
                print(f"  💰 {line}")
                
        if process.returncode == 0:
            try:
                predictions = json.loads(stdout)
                predicted = predictions.get('Food', 0)
                increase = predicted - total
                multiplier = predicted / total if total > 0 else 0
                print(f"\n📈 FINAL: ${total:.2f} → ${predicted:.2f} (${increase:.2f} increase, {multiplier:.1f}x)")
                return predicted
            except json.JSONDecodeError:
                print("❌ Failed to parse predictions")
                return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Test scenarios with clear velocity differences
early_month_data = [
    {"date": "2025-07-01", "category": "Food", "amount": 45.75},
    {"date": "2025-07-02", "category": "Food", "amount": 28.90},
    {"date": "2025-07-03", "category": "Food", "amount": 67.20},
]

mid_month_data = [
    {"date": "2025-07-15", "category": "Food", "amount": 45.75},
    {"date": "2025-07-16", "category": "Food", "amount": 28.90},
    {"date": "2025-07-17", "category": "Food", "amount": 67.20},
]

late_month_data = [
    {"date": "2025-07-28", "category": "Food", "amount": 45.75},
    {"date": "2025-07-29", "category": "Food", "amount": 28.90},
    {"date": "2025-07-30", "category": "Food", "amount": 67.20},
]

# Run tests
early_pred = test_single_scenario(early_month_data, "EARLY MONTH - High Velocity (Days 1-3)")
mid_pred = test_single_scenario(mid_month_data, "MID MONTH - Normal Velocity (Days 15-17)")
late_pred = test_single_scenario(late_month_data, "LATE MONTH - Low Velocity (Days 28-30)")

print(f"\n{'='*60}")
print("VELOCITY INTELLIGENCE SUMMARY")
print(f"{'='*60}")
print(f"Early Month (High Velocity): ${early_pred:.2f}")
print(f"Mid Month (Normal Velocity): ${mid_pred:.2f}") 
print(f"Late Month (Low Velocity):   ${late_pred:.2f}")

if early_pred > mid_pred and mid_pred > late_pred:
    print("✅ SUCCESS: AI correctly considers velocity and timing!")
elif early_pred != mid_pred or mid_pred != late_pred:
    print("⚠️  PARTIAL: AI shows some velocity awareness")
else:
    print("❌ ISSUE: AI not considering velocity properly")
