#!/usr/bin/env python3
"""
Detailed Prophet AI analysis to understand what the prediction means
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

print("🔍 Analyzing Prophet AI Prediction Details...")
print("=" * 60)

# Sample data (same as before)
sample_data = [
    {"date": "2024-01-15", "amount": 50.0, "category": "Food"},
    {"date": "2024-01-20", "amount": 75.0, "category": "Food"},
    {"date": "2024-02-10", "amount": 60.0, "category": "Food"},
    {"date": "2024-02-25", "amount": 80.0, "category": "Food"},
    {"date": "2024-03-05", "amount": 45.0, "category": "Food"},
    {"date": "2024-03-15", "amount": 65.0, "category": "Food"},
    {"date": "2024-04-01", "amount": 70.0, "category": "Food"},
    {"date": "2024-04-10", "amount": 55.0, "category": "Food"},
    {"date": "2024-05-05", "amount": 85.0, "category": "Food"},
    {"date": "2024-05-20", "amount": 90.0, "category": "Food"}
]

print("📊 Input Data Analysis:")
df = pd.DataFrame(sample_data)
df['date'] = pd.to_datetime(df['date'])
print(f"   • Total transactions: {len(sample_data)}")
print(f"   • Date range: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}")
print(f"   • Amount range: ${df['amount'].min():.2f} - ${df['amount'].max():.2f}")
print(f"   • Average per transaction: ${df['amount'].mean():.2f}")

# Calculate monthly totals to understand the pattern
df['month'] = df['date'].dt.to_period('M')
monthly_totals = df.groupby('month')['amount'].sum()
monthly_counts = df.groupby('month')['amount'].count()

print(f"\n📅 Monthly Spending Pattern:")
for month, total in monthly_totals.items():
    count = monthly_counts[month]
    avg = total / count
    print(f"   • {month}: ${total:.2f} total ({count} transactions, ${avg:.2f} avg)")

try:
    from prophet import Prophet
    import logging
    logging.getLogger('prophet').setLevel(logging.WARNING)
    
    print(f"\n🔮 Prophet AI Analysis:")
    
    # Prepare data for Prophet (daily aggregation)
    # Prophet expects daily data, so let's aggregate by day
    daily_df = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
    daily_df.columns = ['ds', 'y']
    daily_df['ds'] = pd.to_datetime(daily_df['ds'])
    
    print(f"   • Prophet input: {len(daily_df)} daily data points")
    print(f"   • Daily amounts range: ${daily_df['y'].min():.2f} - ${daily_df['y'].max():.2f}")
    
    # Create Prophet model
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05
    )
    
    model.fit(daily_df)
    
    # Make predictions for different periods
    print(f"\n📈 Prophet Predictions:")
    
    # 1. Next single day
    future_1day = model.make_future_dataframe(periods=1)
    forecast_1day = model.predict(future_1day)
    next_day_pred = forecast_1day['yhat'].iloc[-1]
    print(f"   • Next day prediction: ${next_day_pred:.2f}")
    
    # 2. Next 7 days
    future_7days = model.make_future_dataframe(periods=7)
    forecast_7days = model.predict(future_7days)
    next_week_pred = forecast_7days['yhat'].iloc[-7:].sum()
    print(f"   • Next 7 days total: ${next_week_pred:.2f}")
    
    # 3. Next 30 days (what our original test showed)
    future_30days = model.make_future_dataframe(periods=30)
    forecast_30days = model.predict(future_30days)
    next_30days_total = forecast_30days['yhat'].iloc[-30:].sum()
    last_day_30 = forecast_30days['yhat'].iloc[-1]
    
    print(f"   • Next 30 days total: ${next_30days_total:.2f}")
    print(f"   • Day 30 single prediction: ${last_day_30:.2f} (this was our $928!)")
    
    # 4. Show what Prophet thinks is happening
    print(f"\n🤔 What Prophet Thinks is Happening:")
    print(f"   • Prophet sees your spending pattern increasing over time")
    print(f"   • It's predicting that by day 30, you'll spend ${last_day_30:.2f} in a SINGLE DAY")
    print(f"   • This is because Prophet detected an upward trend from your data")
    
    # Let's check the trend
    recent_avg = daily_df['y'].tail(3).mean()
    early_avg = daily_df['y'].head(3).mean()
    print(f"   • Early period avg: ${early_avg:.2f}/day")
    print(f"   • Recent period avg: ${recent_avg:.2f}/day")
    print(f"   • Prophet extrapolated this trend to ${last_day_30:.2f}/day by month-end")
    
    print(f"\n⚡ Reality Check:")
    print(f"   • Your historical monthly spending: ${monthly_totals.mean():.2f}")
    print(f"   • Prophet's 30-day prediction: ${next_30days_total:.2f}")
    print(f"   • Difference: {((next_30days_total / monthly_totals.mean()) - 1) * 100:.1f}% higher!")
    
    print(f"\n💡 Analysis:")
    if next_30days_total > monthly_totals.mean() * 3:
        print(f"   ❌ Prophet prediction seems TOO HIGH (3x+ your normal spending)")
        print(f"   📊 Mathematical fallback (${df['amount'].mean():.2f}/transaction) is more realistic")
        print(f"   🔧 We should use different Prophet parameters or more data")
    else:
        print(f"   ✅ Prophet prediction seems reasonable")
        print(f"   📈 Shows upward trend in your spending pattern")
    
except Exception as e:
    print(f"❌ Prophet analysis failed: {e}")

print(f"\n🎯 Conclusion:")
print(f"   • The $928 was Prophet predicting you'd spend $928 on a SINGLE DAY (day 30)")
print(f"   • This seems unrealistic based on your $50-90 transaction history")
print(f"   • Mathematical fallback ($72/transaction) is more sensible")
print(f"   • Prophet needs better tuning or more data for realistic predictions")
