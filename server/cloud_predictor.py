import sys
import json
import os
import pandas as pd
from prophet import Prophet
import warnings
from datetime import datetime, timedelta
warnings.filterwarnings('ignore')

def load_training_data():
    """Load training data for AI learning"""
    try:
        with open('training_data.json', 'r') as f:
            data = json.load(f)
            print(f"✅ Loaded {len(data)} training records for AI", file=sys.stderr)
            return data
    except FileNotFoundError:
        print("⚠️ training_data.json not found - using current data only", file=sys.stderr)
        return []
    except Exception as e:
        print(f"⚠️ Error loading training data: {e} - using current data only", file=sys.stderr)
        return []

def parse_date(date_str):
    """Parse date string to datetime"""
    if 'T' in str(date_str):
        # ISO format from database
        return datetime.fromisoformat(str(date_str).replace('Z', '+00:00')).replace(tzinfo=None)
    else:
        # Simple YYYY-MM-DD format
        return datetime.strptime(str(date_str), '%Y-%m-%d')

def predict_category(current_data, all_historical_data, category, remaining_days, reference_date=None):
    """Smart Prophet AI prediction with realistic constraints"""
    current_total = sum(expense['amount'] for expense in current_data)
    
    if remaining_days <= 0:
        return current_total
    
    print(f"{category}: Current total={current_total:.2f}, Remaining days={remaining_days}", file=sys.stderr)
    
    # Use Prophet AI if we have at least a minimal amount of data
    if len(all_historical_data) >= 3:  # Lowered to 3 to maximize AI usage
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
            
            # Create future dates for remaining days from reference date
            future_dates = []
            start_date = reference_date if reference_date else datetime.now()
            for i in range(1, remaining_days + 1):
                future_dates.append(start_date + timedelta(days=i))
            
            future_df = pd.DataFrame({'ds': future_dates})
            forecast = model.predict(future_df)
            
            # Sum predicted values for remaining days
            predicted_additional = max(0, forecast['yhat'].sum())
            
            # SMART AI APPROACH - Consider spending velocity and month context
            predicted_total = current_total + predicted_additional
            
            # Calculate spending velocity context for intelligent adjustments
            if current_data:
                current_dates = [parse_date(exp['date']) for exp in current_data]
                earliest_expense = min(current_dates)
                latest_expense = max(current_dates)
                
                # Calculate how far into the month we are based on expense dates
                days_into_month = latest_expense.day
                total_days_in_month = (latest_expense.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                total_days_in_month = total_days_in_month.day
                month_progress = days_into_month / total_days_in_month
                
                # Calculate current spending rate (daily average so far this month)
                days_with_expenses = len(set(d.day for d in current_dates))
                current_daily_rate = current_total / max(days_with_expenses, 1)
                
                print(f"{category}: Month progress: {month_progress:.1%}, Daily rate: ${current_daily_rate:.2f}, Days active: {days_with_expenses}", file=sys.stderr)
                
                # AI velocity intelligence: Adjust based on spending pace context
                if month_progress < 0.2:  # Early month (first 20%)
                    if current_daily_rate > 30:  # High spending rate early
                        velocity_factor = 1.3  # AI expects continued high spending
                        print(f"{category}: Early month + high velocity = aggressive AI prediction", file=sys.stderr)
                    else:
                        velocity_factor = 1.1  # Moderate increase
                        print(f"{category}: Early month + normal velocity = moderate AI increase", file=sys.stderr)
                        
                elif month_progress < 0.6:  # Mid month (20-60%)
                    if current_daily_rate > 20:  # Decent spending rate
                        velocity_factor = 1.0  # Trust AI prediction as-is
                        print(f"{category}: Mid month + good velocity = trust AI prediction", file=sys.stderr)
                    else:
                        velocity_factor = 0.9  # Slightly conservative
                        print(f"{category}: Mid month + low velocity = slightly reduce AI prediction", file=sys.stderr)
                        
                else:  # Late month (60%+)
                    if current_daily_rate > 15:  # Still spending late in month
                        velocity_factor = 0.8  # More conservative
                        print(f"{category}: Late month + continued spending = conservative AI", file=sys.stderr)
                    else:
                        velocity_factor = 0.6  # Very conservative
                        print(f"{category}: Late month + low velocity = very conservative AI", file=sys.stderr)
                
                # Apply velocity intelligence to AI prediction
                predicted_additional = predicted_additional * velocity_factor
                predicted_total = current_total + predicted_additional
                
                print(f"{category}: Applied velocity factor {velocity_factor:.2f} to AI prediction", file=sys.stderr)
            else:
                print(f"{category}: No current data for velocity analysis", file=sys.stderr)
            
            # Only apply dynamic daily-based caps (not fixed multipliers)
            # Calculate realistic daily-based maximum based on remaining days
            if current_data:
                current_dates = [parse_date(exp['date']) for exp in current_data]
                days_with_expenses = len(set(d.day for d in current_dates))
                current_daily_avg = current_total / max(days_with_expenses, 1)
                
                # Dynamic cap: current total + (daily average × remaining days)
                # This means you could theoretically spend your daily average every remaining day
                max_additional_per_day = current_daily_avg
                
                # Category-specific daily spending limits
                if category.lower() in ['bills']:
                    max_additional_per_day = current_daily_avg * 0.3  # Bills don't repeat daily
                elif category.lower() in ['education']:
                    max_additional_per_day = current_daily_avg * 0.2  # Education is irregular
                elif category.lower() in ['food', 'transport']:
                    max_additional_per_day = current_daily_avg * 1.5  # Daily essentials can vary
                elif category.lower() in ['shopping', 'entertainment']:
                    max_additional_per_day = current_daily_avg * 1.0  # Normal spending rate
                else:
                    max_additional_per_day = current_daily_avg * 0.8  # Conservative for others
                
                # Calculate dynamic maximum based on remaining days
                max_reasonable_additional = max_additional_per_day * remaining_days
                max_reasonable_total = current_total + max_reasonable_additional
                
                print(f"{category}: Daily avg: ${current_daily_avg:.2f}, Max per day: ${max_additional_per_day:.2f}, Remaining days: {remaining_days}", file=sys.stderr)
                print(f"{category}: Dynamic cap: ${current_total:.2f} + (${max_additional_per_day:.2f} × {remaining_days} days) = ${max_reasonable_total:.2f}", file=sys.stderr)
            else:
                # Fallback if no current data
                max_reasonable_total = current_total * 2
                print(f"{category}: No current data for dynamic cap, using 2x current total", file=sys.stderr)
            
            if predicted_total > max_reasonable_total:
                print(f"{category}: AI prediction {predicted_total:.2f} exceeds reasonable limit {max_reasonable_total:.2f}, capping", file=sys.stderr)
                predicted_total = max_reasonable_total
            elif predicted_total < current_total:
                # AI predicts less than current - this can happen, but ensure we don't go below current
                print(f"{category}: AI predicts decrease, using current total as minimum", file=sys.stderr)
                predicted_total = current_total
            else:
                print(f"{category}: Using pure Prophet AI prediction", file=sys.stderr)
            
            print(f"{category}: Prophet AI predicts {predicted_total:.2f} (additional: {predicted_total - current_total:.2f})", file=sys.stderr)
            return predicted_total
            
        except Exception as e:
            print(f"{category}: Prophet AI failed ({str(e)}), using fallback", file=sys.stderr)
    
    # Fallback: Smart mathematical projection
    print(f"{category}: Using smart math projection (need 3+ points for Prophet AI)", file=sys.stderr)
    
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
        # Debug environment information
        print(f"🔍 Python version: {sys.version}", file=sys.stderr)
        print(f"🔍 Current working directory: {os.getcwd()}", file=sys.stderr)
        print(f"🔍 Available files: {os.listdir('.')}", file=sys.stderr)
        
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
        
        # Calculate remaining days in month based on the latest expense date (context-aware)
        if input_data:
            # Find the latest expense date to use as our "current" reference point
            latest_expense_date = max(parse_date(record['date']) for record in input_data)
            reference_date = latest_expense_date
            print(f"Using latest expense date as reference: {reference_date.strftime('%Y-%m-%d')}", file=sys.stderr)
        else:
            # Fallback to actual current date if no expense data
            reference_date = datetime.now()
            print(f"Using actual current date as reference: {reference_date.strftime('%Y-%m-%d')}", file=sys.stderr)
        
        # Calculate remaining days from reference date to end of month
        last_day_of_month = (reference_date.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        remaining_days = (last_day_of_month - reference_date).days
        
        print(f"Days remaining in {reference_date.strftime('%B')} from reference date: {remaining_days}", file=sys.stderr)
        
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
                remaining_days,
                reference_date
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
