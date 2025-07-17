#!/usr/bin/env python3
"""Test Prophet AI with limited data (like user's current scenario)"""

import json
import subprocess
import sys

def test_limited_data_scenario():
    """Test with only 3 Food expenses (user's current scenario)"""
    print("Testing Prophet AI with LIMITED data (user's current scenario)...")
    
    # Simulate user's current scenario: only 3 Food expenses
    test_data = [
        {"date": "2025-07-17", "category": "Food", "amount": 30.00},
        {"date": "2025-07-17", "category": "Food", "amount": 35.00},  # Same date
        {"date": "2025-07-17", "category": "Food", "amount": 38.00}   # Same date
    ]
    
    print(f"Test data: {len(test_data)} total records")
    print("Category breakdown:")
    categories = {}
    for item in test_data:
        cat = item['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)
    
    for category, items in categories.items():
        count = len(items)
        dates = set(item['date'] for item in items)
        unique_dates = len(dates)
        will_use_ai = count >= 3 and unique_dates >= 2
        print(f"  {category}: {count} records on {unique_dates} dates {'✓ Will use Prophet AI' if will_use_ai else '✗ Will use fallback'}")
    
    print("Sending test data to cloud_predictor.py...")
    
    # Send data to Prophet AI
    try:
        process = subprocess.Popen(
            [sys.executable, 'cloud_predictor.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd='.'
        )
        
        stdout, stderr = process.communicate(input=json.dumps(test_data))
        
        print("\n=== PROPHET AI OUTPUT ===")
        print("STDOUT:", stdout)
        print("\n=== PROPHET AI LOGS ===")
        print("STDERR:", stderr)
        
        if process.returncode == 0:
            try:
                predictions = json.loads(stdout)
                print("\n=== PREDICTIONS SUCCESS ===")
                for category, prediction in predictions.items():
                    current = sum(item['amount'] for item in test_data if item['category'] == category)
                    print(f"{category}: Current ${current:.2f} → Predicted ${prediction:.2f}")
            except json.JSONDecodeError:
                print("❌ Failed to parse predictions JSON")
        else:
            print(f"❌ Prophet AI failed with return code: {process.returncode}")
            
    except Exception as e:
        print(f"❌ Error running test: {e}")

if __name__ == "__main__":
    test_limited_data_scenario()
