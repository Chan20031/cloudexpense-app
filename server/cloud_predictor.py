import sys
import json
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
    
    # Use Prophet AI if we have enough data (at least 10 data points)
    if len(all_historical_data) >= 10:
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
            
            # Create Prophet model with realistic settings
            model = Prophet(
                daily_seasonality=False,
                yearly_seasonality=False,
                weekly_seasonality=True,
                changepoint_prior_scale=0.01,  # Conservative changes
                seasonality_prior_scale=10.0,
                interval_width=0.8
            )
            
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
            
            # Apply category-specific reality checks
            if category.lower() in ['bills']:
                # Bills are usually one-time payments
                max_multiplier = 1.5
                predicted_additional = min(predicted_additional, current_total * 0.5)
            elif category.lower() in ['education']:
                # Education can have large payments but not every day
                max_multiplier = 2.0
                predicted_additional = min(predicted_additional, current_total * 1.0)
            elif category.lower() in ['food', 'transport']:
                # Essential daily categories
                max_multiplier = 2.5
                predicted_additional = min(predicted_additional, simple_projection * 1.3)
            elif category.lower() in ['shopping']:
                # Shopping can be variable but should be reasonable
                max_multiplier = 2.0
                predicted_additional = min(predicted_additional, simple_projection * 1.5)
            else:
                # Others - moderate spending
                max_multiplier = 2.0
                predicted_additional = min(predicted_additional, simple_projection * 1.2)
            
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
        
        for category, current_expenses in categories.items():
            # Get all historical data for this category (current + training)
            category_historical = current_expenses + [
                record for record in training_data 
                if record['category'] == category
            ]
            
            predicted_total = predict_category(
                current_expenses, 
                category_historical, 
                category, 
                remaining_days
            )
            predictions[category] = round(predicted_total, 2)
        
        # Output results
        print(json.dumps(predictions))
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}", file=sys.stderr)
        print(json.dumps({}))  # Return empty predictions on error

if __name__ == "__main__":
    main()
