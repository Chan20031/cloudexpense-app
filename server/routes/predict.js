// Predict API endpoint (Local AI Model)
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /predict - Get user expenses and run local AI prediction
router.post('/', async (req, res) => {
  console.log('=== PREDICT API ENDPOINT HIT ===');
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user);
  
  try {
    if (!req.user || !req.user.id) {
      console.log('ERROR: No user ID found in request');
      return res.status(401).json({ message: 'User authentication required' });
    }
    
    const userId = req.user.id;
    console.log('Predict API called for user ID:', userId);
    
    // Get current month expenses only (dynamic)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    console.log(`Fetching expenses for: ${currentYear}-${currentMonth.toString().padStart(2, '0')}`);
    
    const expensesResult = await db.query(
      `SELECT category, amount, DATE(created_at) as date 
       FROM transactions 
       WHERE user_id = $1 
       AND EXTRACT(YEAR FROM created_at) = $2 
       AND EXTRACT(MONTH FROM created_at) = $3
       ORDER BY created_at ASC`,
      [userId, currentYear, currentMonth]
    );
    
    console.log('Database query result:', {
      rowCount: expensesResult.rows.length,
      currentMonth: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
      sampleRows: expensesResult.rows.slice(0, 3)
    });
    
    if (expensesResult.rows.length === 0) {
      console.log('No transactions found for user:', userId);
      return res.status(400).json({ message: 'No expense data available for prediction' });
    }

    // Format data exactly as AI model expects: Date, Category, Amount
    const trainingData = expensesResult.rows.map(row => ({
      date: row.date,           // 2025-07-12 (date only, no time)
      category: row.category,   // Transport, Food, Bills, etc.
      amount: parseFloat(row.amount)  // 65.00
    }));
    
    console.log('Running local AI prediction for user:', userId);
    console.log('Data points:', trainingData.length);
    console.log('Sample data:', trainingData.slice(0, 2));
    
    // Group by category to show Prophet AI eligibility
    const categoryGroups = {};
    trainingData.forEach(item => {
      if (!categoryGroups[item.category]) {
        categoryGroups[item.category] = [];
      }
      categoryGroups[item.category].push(item);
    });
    
    console.log('Category breakdown for Prophet AI (need 3+ per category):');
    Object.keys(categoryGroups).forEach(category => {
      const count = categoryGroups[category].length;
      const willUseAI = count >= 3;
      console.log(`  ${category}: ${count} data points ${willUseAI ? '✓ Prophet AI' : '✗ Fallback'}`);
    });
    
    if (trainingData.length === 0) {
      return res.status(400).json({ message: 'No expense data available for prediction' });
    }
    
    // Always use Prophet AI for predictions
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Adjust for different Python command based on environment
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const pythonScript = path.join(__dirname, '../cloud_predictor.py');
    
    console.log(`Using Python command: ${pythonCommand}`);
    console.log(`Python script path: ${pythonScript}`);
    console.log(`Platform: ${process.platform}`);
    
    const pythonProcess = spawn(pythonCommand, [pythonScript]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python output received:', data.toString().substring(0, 100) + '...');
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('=== PYTHON STDERR ===:', data.toString()); // Enhanced logging
    });

    pythonProcess.on('close', (code) => {
      console.log('=== PYTHON PROCESS RESULT ===');
      console.log('Exit code:', code);
      console.log('Full stderr:', errorOutput);
      console.log('Full stdout:', output);
      console.log('================================');
      
      if (code !== 0) {
        console.error('Python predictor error:', errorOutput);
        console.log('Prophet AI failed, using mathematical fallback');
        // Fall back to simple prediction if Python fails
        const fallbackPredictions = generateFallbackPredictions(trainingData);
        return res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction successful (fallback used - Prophet AI failed)' 
        });
      }
      
      try {
        console.log('Raw Python output:', output);
        const predictions = JSON.parse(output);
        console.log('Parsed predictions:', predictions);
        
        if (Object.keys(predictions).length === 0) {
          // If Prophet returns empty, use fallback
          const fallbackPredictions = generateFallbackPredictions(trainingData);
          console.log('Prophet AI returned empty results, using fallback');
          return res.status(200).json({ 
            predictions: fallbackPredictions, 
            data_points_used: trainingData.length,
            message: 'Prediction successful (fallback used - Prophet returned empty)' 
          });
        }
        
        console.log('Prophet AI prediction successful!');
        res.status(200).json({ 
          predictions, 
          data_points_used: trainingData.length,
          message: 'Prediction successful (Prophet AI)' 
        });
      } catch (parseError) {
        console.error('Failed to parse Python output:', output);
        console.log('Prophet AI output parsing failed, using mathematical fallback');
        const fallbackPredictions = generateFallbackPredictions(trainingData);
        res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction successful (fallback used - parsing failed)' 
        });
      }
    });
    
    // Send data to Python process
    pythonProcess.stdin.write(JSON.stringify(trainingData));
    pythonProcess.stdin.end();
    
    // Helper function for fallback predictions (current month only)
    function generateFallbackPredictions(data) {
      const predictions = {};
      const categories = [...new Set(data.map(item => item.category))];
      
      const currentDate = new Date();
      const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const daysPassed = currentDate.getDate();
      const remainingDays = totalDaysInMonth - daysPassed;
      
      categories.forEach(category => {
        const categoryData = data.filter(item => item.category === category);
        const currentSpent = categoryData.reduce((sum, item) => sum + item.amount, 0);
        
        if (remainingDays <= 0) {
          // It's the last day of month
          predictions[category] = Math.round(currentSpent * 100) / 100;
        } else {
          // Calculate daily average and project for remaining days
          const dailyAverage = currentSpent / daysPassed;
          const predictedRemaining = dailyAverage * remainingDays;
          const totalPredicted = currentSpent + predictedRemaining;
          predictions[category] = Math.round(totalPredicted * 100) / 100;
        }
      });
      
      return predictions;
    }
    
  } catch (error) {
    console.error('=== PREDICT API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    
    res.status(500).json({ 
      message: 'Prediction failed', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint to verify authentication
router.get('/test', (req, res) => {
  console.log('=== PREDICT TEST ENDPOINT HIT ===');
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user);
  
  if (!req.user) {
    return res.status(401).json({ message: 'No user found in request' });
  }
  
  res.json({ 
    message: 'Authentication working', 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
