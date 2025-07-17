#!/usr/bin/env python3
"""
CloudExpense AI Training Data Generator
======================================

This script connects to the CloudExpense database and generates training data for the AI prediction model.
It extracts historical transaction data and formats it for use by the cloud_predictor.py script.

Usage:
  python generate_training_data.py

Configuration:
  The script reads database connection information from environment variables or defaults.
"""

import os
import sys
import json
import psycopg2
from datetime import datetime, timedelta

# Database connection parameters (from environment or defaults)
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'cloudexpense')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')

# Output file
OUTPUT_FILE = 'training_data.json'

def connect_to_db():
    """Connect to the PostgreSQL database and return connection"""
    try:
        print(f"Connecting to database: {DB_NAME} at {DB_HOST}:{DB_PORT}")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def fetch_historical_data(conn, months_back=6):
    """Fetch historical transaction data from the database"""
    try:
        cur = conn.cursor()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        
        print(f"Fetching transactions from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        # Execute query to get all expense transactions
        query = """
        SELECT 
            t.id,
            t.user_id,
            t.category,
            t.amount,
            t.transaction_type,
            DATE(t.created_at) as date
        FROM 
            transactions t
        WHERE 
            t.transaction_type = 'expense'
            AND t.created_at >= %s
            AND t.created_at <= %s
        ORDER BY 
            t.user_id, t.created_at
        """
        
        cur.execute(query, (start_date, end_date))
        results = cur.fetchall()
        
        print(f"Fetched {len(results)} transactions")
        
        # Format data as required by cloud_predictor.py
        training_data = []
        for row in results:
            _, user_id, category, amount, _, date = row
            
            # Format data as expected by the prediction model
            training_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'category': category,
                'amount': float(amount),
                'user_id': user_id  # Keep user_id for filtering
            })
            
        cur.close()
        return training_data
        
    except Exception as e:
        print(f"Error fetching historical data: {e}")
        if cur:
            cur.close()
        return []

def group_by_user_id(transactions):
    """Group transactions by user_id for separate training data"""
    user_transactions = {}
    
    for transaction in transactions:
        user_id = transaction['user_id']
        
        if user_id not in user_transactions:
            user_transactions[user_id] = []
            
        # Create a copy without user_id for the training data
        clean_transaction = transaction.copy()
        del clean_transaction['user_id']
        user_transactions[user_id].append(clean_transaction)
    
    return user_transactions

def generate_training_data():
    """Main function to generate training data"""
    try:
        conn = connect_to_db()
        
        # Fetch all historical data
        all_transactions = fetch_historical_data(conn)
        
        # Group by user_id
        user_transactions = group_by_user_id(all_transactions)
        
        # Generate global training data (without user_id)
        global_training_data = []
        for transaction in all_transactions:
            # Create a copy without user_id
            clean_transaction = {
                'date': transaction['date'],
                'category': transaction['category'],
                'amount': transaction['amount']
            }
            global_training_data.append(clean_transaction)
            
        # Write global training data to file
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(global_training_data, f, indent=2)
            
        print(f"Generated training data with {len(global_training_data)} records")
        print(f"Training data written to {OUTPUT_FILE}")
        
        # TODO: In the future, create user-specific training files
        # for user_id, transactions in user_transactions.items():
        #     with open(f'training_data_{user_id}.json', 'w') as f:
        #         json.dump(transactions, f, indent=2)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error generating training data: {e}")
        return False

if __name__ == "__main__":
    print("CloudExpense AI Training Data Generator")
    print("======================================")
    success = generate_training_data()
    
    if success:
        print("Training data generation completed successfully!")
    else:
        print("Training data generation failed!")
        sys.exit(1)
