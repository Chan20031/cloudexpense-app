#!/usr/bin/env python3
"""
Test script to verify Prophet AI works with minimal data points
"""
import json
import sys
from datetime import datetime, timedelta

# Test data with different patterns and amounts
test_data = [
    # Food - More varied spending pattern
    {"date": "2025-07-10", "category": "Food", "amount": 45.75},
    {"date": "2025-07-12", "category": "Food", "amount": 28.90},
    {"date": "2025-07-14", "category": "Food", "amount": 67.20},
    {"date": "2025-07-16", "category": "Food", "amount": 15.30},
    {"date": "2025-07-17", "category": "Food", "amount": 52.85},
    
    # Transport - Lower amounts, frequent
    {"date": "2025-07-11", "category": "Transport", "amount": 8.50},
    {"date": "2025-07-13", "category": "Transport", "amount": 12.75},
    {"date": "2025-07-15", "category": "Transport", "amount": 9.25},
    {"date": "2025-07-17", "category": "Transport", "amount": 11.40},
    
    # Shopping - Bigger irregular amounts
    {"date": "2025-07-12", "category": "Shopping", "amount": 125.99},
    {"date": "2025-07-15", "category": "Shopping", "amount": 78.45},
    {"date": "2025-07-17", "category": "Shopping", "amount": 234.50},
    
    # Education - One big payment
    {"date": "2025-07-10", "category": "Education", "amount": 450.00},
    {"date": "2025-07-16", "category": "Education", "amount": 25.50},
    
    # Bills - Mix of amounts
    {"date": "2025-07-05", "category": "Bills", "amount": 120.00},
    {"date": "2025-07-15", "category": "Bills", "amount": 85.50},
    {"date": "2025-07-17", "category": "Bills", "amount": 65.75},
    
    # Entertainment - Weekend pattern
    {"date": "2025-07-13", "category": "Entertainment", "amount": 35.00},  # Saturday
    {"date": "2025-07-14", "category": "Entertainment", "amount": 22.50},  # Sunday
    {"date": "2025-07-16", "category": "Entertainment", "amount": 18.75},
]

print("Testing Prophet AI with minimal data...")
print(f"Test data: {len(test_data)} total records")

# Group by category
categories = {}
for record in test_data:
    cat = record['category']
    if cat not in categories:
        categories[cat] = []
    categories[cat].append(record)

print("\nCategory breakdown:")
for category, records in categories.items():
    count = len(records)
    will_use_ai = count >= 3
    print(f"  {category}: {count} records {'✓ Will use Prophet AI' if will_use_ai else '✗ Will use fallback'}")

print(f"\nSending test data to cloud_predictor.py...")

# Test the actual predictor
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
    
    print("=== PROPHET AI OUTPUT ===")
    print("STDOUT:", stdout)
    print("\n=== PROPHET AI LOGS ===")
    print("STDERR:", stderr)
    
    if process.returncode == 0:
        try:
            predictions = json.loads(stdout)
            print(f"\n=== PREDICTIONS SUCCESS ===")
            for category, predicted_total in predictions.items():
                current_spent = sum(r['amount'] for r in categories.get(category, []))
                print(f"{category}: Current ${current_spent:.2f} → Predicted ${predicted_total:.2f}")
        except json.JSONDecodeError:
            print("Failed to parse predictions as JSON")
    else:
        print(f"Prophet AI failed with exit code: {process.returncode}")
        
except Exception as e:
    print(f"Error running test: {e}")
