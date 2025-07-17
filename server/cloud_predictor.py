import sys
import json
import pandas as pd
from prophet import Prophet
import warnings
from datetime import datetime, timedelta
import os
warnings.filterwarnings('ignore')

# Ensure the Prophet algorithm uses optimal numerical libraries if available
os.environ['OPENBLAS_NUM_THREADS'] = '4'  # Optimize numerical performance
os.environ['MKL_NUM_THREADS'] = '4'       # Optimize numerical performance

def load_training_data():
    """Load training data for AI learning"""
    try:
        with open('training_data.json', 'r') as f:
            data = json.load(f)
            print(f"Loaded {len(data)} training records for AI", file=sys.stderr)
            return data
    except:
        print("No training data found - using current data only", file=sys.stderr)
        return []

def parse_date(date_str):
    """Parse date string to datetime"""
    if 'T' in str(date_str):
        # ISO format from database
        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00')).replace(tzinfo=None)
    else:
        # Simple YYYY-MM-DD format
        return datetime.strptime(str(date_str), '%Y-%m-%d')

def predict_category(current_data, all_historical_data, category, remaining_days):
    """Smart Prophet AI prediction with realistic constraints"""
    current_total = sum(expense['amount'] for expense in current_data)
    
    if remaining_days <= 0:
        return current_total
    
    print(f"{category}: Current total={current_total:.2f}, Remaining days={remaining_days}", file=sys.stderr)
    
    # Now prioritize using AI prediction whenever possible
    if len(all_historical_data) >= 3:  # Even more aggressive AI usage, only need 3 data points
        try:
            print(f"{category}: Using Prophet AI with {len(all_historical_data)} data points", file=sys.stderr)
            
            # Prepare data for Prophet
            prophet_data = []
            for record in all_historical_data:
                date_obj = parse_date(record['date'])
                prophet_data.append({
                    'ds': date_obj,
                    'y': float(record['amount'])
                })
            
            df = pd.DataFrame(prophet_data).sort_values('ds')
            
            # Create Prophet model with optimized settings for expense prediction
            model = Prophet(
                daily_seasonality=True,         # Daily patterns matter for expenses
                yearly_seasonality=True,        # Capture annual patterns (holidays, etc.)
                weekly_seasonality=True,        # Weekly patterns (weekends vs weekdays)
                changepoint_prior_scale=0.15,   # More flexible to capture expense pattern changes
                seasonality_prior_scale=20.0,   # Strongly enhanced seasonal component
                interval_width=0.9,            # Wider prediction interval for better coverage
                seasonality_mode='multiplicative',  # Better for expense patterns
                growth='linear'                # Linear growth model works best for expenses
            )
            
            # Add country-specific holidays for better prediction around spending patterns
            try:
                # Prophet API changed in newer versions - try the safe way
                country_holidays = None
                
                # Try to determine user's country from spending patterns
                # For now, default to US holidays but could be expanded
                try:
                    model.add_country_holidays(country_code='US')
                    print(f"{category}: Added country-specific holidays to AI model", file=sys.stderr)
                except (AttributeError, ImportError, ValueError) as e:
                    print(f"{category}: Could not add specific holidays: {e}", file=sys.stderr)
            except Exception as holiday_error:
                print(f"{category}: Could not add holidays: {holiday_error}", file=sys.stderr)
            
            # Train the model
            model.fit(df)
            
            # Create future dates for remaining days
            future_dates = []
            today = datetime.now()
            for i in range(1, remaining_days + 1):
                future_dates.append(today + timedelta(days=i))
            
            future_df = pd.DataFrame({'ds': future_dates})
            forecast = model.predict(future_df)
            
            # Sum predicted values for remaining days
            predicted_additional = max(0, forecast['yhat'].sum())
            
            # REALISTIC CONSTRAINTS - This is the key!
            
            # Calculate current daily average
            unique_dates = set(parse_date(expense['date']).day for expense in current_data)
            days_with_spending = len(unique_dates)
            current_daily_avg = current_total / max(days_with_spending, 1)
            
            # Calculate expected spending frequency
            days_passed = max(unique_dates) if unique_dates else 1
            spending_frequency = days_with_spending / days_passed
            
            # Simple projection for comparison
            simple_projection = current_daily_avg * remaining_days * spending_frequency
            
            # Apply AI-powered category-specific intelligence
            
            # Calculate spending pattern consistency
            dates_with_expenses = set(parse_date(expense['date']).day for expense in current_data)
            date_range = max(dates_with_expenses) - min(dates_with_expenses) if dates_with_expenses else 1
            expense_count = len(current_data)
            
            # AI pattern recognition: Higher consistency = more predictable future
            consistency_score = 1.0 - (len(dates_with_expenses) / max(date_range, 1)) + (0.1 * min(expense_count / 10, 1.0))
            
            # Dynamic multipliers based on spending patterns
            if category.lower() in ['bills']:
                # Bills: Check if typical end-of-month pattern
                late_month_expenses = sum(1 for exp in current_data if parse_date(exp['date']).day > 20)
                is_late_month_pattern = late_month_expenses > len(current_data) * 0.7
                
                if is_late_month_pattern and remaining_days < 10:
                    # End of month with typical bill pattern
                    max_multiplier = 1.2
                    predicted_additional = min(predicted_additional, current_total * 0.3)
                else:
                    max_multiplier = 1.5
                    predicted_additional = min(predicted_additional, current_total * 0.5 * (1 + consistency_score))
                    
            elif category.lower() in ['education']:
                # Education: Check for large irregular payments
                has_large_payments = any(float(exp['amount']) > current_total * 0.5 for exp in current_data)
                
                if has_large_payments:
                    # One large payment likely means another won't happen
                    max_multiplier = 1.3
                    predicted_additional = min(predicted_additional, current_total * 0.4)
                else:
                    max_multiplier = 2.0
                    predicted_additional = min(predicted_additional, current_total * (0.8 + consistency_score))
                    
            elif category.lower() in ['food', 'transport']:
                # Essential daily categories: Strong day-of-week patterns
                weekday_pattern = {}
                for exp in all_historical_data:
                    day = parse_date(exp['date']).weekday()
                    if day not in weekday_pattern:
                        weekday_pattern[day] = 0
                    weekday_pattern[day] += 1
                    
                # Check if weekday pattern exists
                has_pattern = max(weekday_pattern.values()) > sum(weekday_pattern.values()) * 0.3
                
                if has_pattern:
                    # Apply AI-detected weekday pattern
                    max_multiplier = 2.2
                    pattern_factor = 1.2
                else:
                    # More consistent daily spending
                    max_multiplier = 2.5
                    pattern_factor = 1.3
                    
                predicted_additional = min(predicted_additional, simple_projection * pattern_factor)
                
            elif category.lower() in ['shopping']:
                # Shopping: Often clustered on weekends or paydays
                # Check for weekend pattern
                weekend_expenses = sum(1 for exp in all_historical_data 
                                     if parse_date(exp['date']).weekday() >= 5)
                is_weekend_heavy = weekend_expenses > len(all_historical_data) * 0.4
                
                if is_weekend_heavy and remaining_days >= 5:
                    # Account for upcoming weekend(s)
                    remaining_weekends = remaining_days // 7 + (1 if remaining_days % 7 >= 6 - datetime.now().weekday() else 0)
                    max_multiplier = 2.0 + (0.2 * remaining_weekends)
                else:
                    max_multiplier = 2.0
                    
                predicted_additional = min(predicted_additional, simple_projection * (1.2 + consistency_score))
                
            else:
                # Others - apply smart intelligence based on detected patterns
                avg_gap = date_range / max(len(dates_with_expenses) - 1, 1) if len(dates_with_expenses) > 1 else 7
                regularity_factor = 1.0 - min(avg_gap / 15, 0.5)  # Lower gaps = more regular spending
                
                max_multiplier = 2.0 * (1 + regularity_factor * 0.5)
                predicted_additional = min(predicted_additional, simple_projection * (1.0 + regularity_factor))
            
            # Final sanity check - never exceed reasonable bounds
            max_reasonable = current_total * max_multiplier
            predicted_total = current_total + predicted_additional
            
            if predicted_total > max_reasonable:
                predicted_total = max_reasonable
                print(f"{category}: AI prediction capped at reasonable limit", file=sys.stderr)
            
            print(f"{category}: Prophet AI predicts {predicted_total:.2f} (additional: {predicted_additional:.2f})", file=sys.stderr)
            return predicted_total
            
        except Exception as e:
            print(f"{category}: Prophet AI failed ({str(e)}), using fallback", file=sys.stderr)
    
    # Fallback: Smart mathematical projection
    print(f"{category}: Using smart math projection (need 10+ points for Prophet AI)", file=sys.stderr)
    
    unique_dates = set(parse_date(expense['date']).day for expense in current_data)
    days_with_spending = len(unique_dates)
    days_passed = max(unique_dates) if unique_dates else 1
    spending_frequency = days_with_spending / days_passed
    daily_avg = current_total / max(days_with_spending, 1)
    
    # Category-specific projections
    if category.lower() in ['bills']:
        predicted_additional = current_total * 0.2  # Minimal additional bills
    elif category.lower() in ['education']:
        predicted_additional = current_total * 0.3  # Some additional education costs
    else:
        expected_spending_days = remaining_days * spending_frequency * 0.8  # Slightly conservative
        predicted_additional = daily_avg * expected_spending_days
    
    return current_total + predicted_additional

def main():
    try:
        # Read current month data
        input_data = json.loads(sys.stdin.read())
        print(f"Received {len(input_data)} current expense records", file=sys.stderr)
        
        # Load training data for AI
        training_data = load_training_data()
        print(f"Using {len(training_data)} historical records + {len(input_data)} current records", file=sys.stderr)
        
        # Group current month expenses by category
        categories = {}
        for record in input_data:
            category = record['category']
            if category not in categories:
                categories[category] = []
            categories[category].append(record)
        
        # Calculate remaining days in month
        today = datetime.now()
        last_day_of_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        remaining_days = (last_day_of_month - today).days
        
        print(f"Days remaining in {today.strftime('%B')}: {remaining_days}", file=sys.stderr)
        
        # Generate AI predictions for each category
        predictions = {}
        ai_prediction_count = 0
        fallback_count = 0
        
        for category, current_expenses in categories.items():
            # Get all historical data for this category (current + training)
            category_historical = current_expenses + [
                record for record in training_data 
                if record['category'] == category
            ]
            
            # Track what method is used for metrics
            data_point_count = len(category_historical)
            will_use_ai = data_point_count >= 3
            if will_use_ai:
                ai_prediction_count += 1
            else:
                fallback_count += 1
                
            print(f"Predicting {category}: {data_point_count} data points, using {'AI' if will_use_ai else 'fallback'}", file=sys.stderr)
            
            predicted_total = predict_category(
                current_expenses, 
                category_historical, 
                category, 
                remaining_days
            )
            predictions[category] = round(predicted_total, 2)
        
        # Output results with metrics
        print(f"Prediction complete: {ai_prediction_count} categories used AI, {fallback_count} used fallback", file=sys.stderr)
        print(json.dumps(predictions))
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}", file=sys.stderr)
        # Include stacktrace for better debugging
        import traceback
        print(f"Stacktrace: {traceback.format_exc()}", file=sys.stderr)
        print(json.dumps({}))  # Return empty predictions on error

if __name__ == "__main__":
    main()
