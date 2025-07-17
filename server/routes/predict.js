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
    
    if (trainingData.length === 0) {
      return res.status(400).json({ message: 'No expense data available for prediction' });
    }
    
    // Always use Prophet AI for predictions with enhanced error handling
    const { spawn } = require('child_process');
    const path = require('path');
    
    console.log('Launching AI prediction engine...');
    
    // Adjust for different Python command based on environment
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const pythonScript = path.join(__dirname, '../cloud_predictor.py');
    
    console.log(`Using Python command: ${pythonCommand}`);
    console.log(`Python script path: ${pythonScript}`);
    
    // Set timeout for AI prediction (30 seconds)
    const aiTimeout = setTimeout(() => {
      console.log('AI prediction timed out after 30 seconds');
      if (!pythonProcess.killed) {
        pythonProcess.kill();
      }
    }, 30000);
    
    const pythonProcess = spawn(pythonCommand, [pythonScript]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('AI output received:', data.toString().substring(0, 100) + '...');
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('AI engine debug info:', data.toString()); // Log all stderr output
    });

    pythonProcess.on('close', (code) => {
      // Clear the timeout as process has completed
      clearTimeout(aiTimeout);
      
      console.log('AI engine process finished with code:', code);
      console.log('AI engine debug output summary:', errorOutput.substring(0, 500) + (errorOutput.length > 500 ? '...' : ''));
      
      // Try to retry the AI once if it fails with specific error codes
      if (code !== 0) {
        console.error('AI prediction error:', errorOutput);
        
        // Check if error is due to known fixable issues
        const knownErrors = [
          'ImportError', 'ModuleNotFoundError', 'No module named',
          'Permission denied', 'File not found'
        ];
        
        const isKnownError = knownErrors.some(err => errorOutput.includes(err));
        
        if (isKnownError && !req.retryAttempted) {
          console.log('Detected known error, attempting one retry with AI...');
          req.retryAttempted = true;
          // Try to use direct path for retry
          const pythonPath = process.env.PYTHON_PATH || pythonCommand;
          const retryProcess = spawn(pythonPath, [pythonScript]);
          
          // [Retry logic would go here - simplified for now]
          // For now, just fall back to mathematical prediction
        }
        
        // Fall back to advanced prediction if AI fails
        console.log('Using enhanced mathematical prediction as fallback');
        const fallbackPredictions = generateFallbackPredictions(trainingData);
        return res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction completed (mathematical model used)',
          ai_status: 'Failed with code ' + code
        });
      }
      
      try {
        console.log('Raw AI output:', output);
        const predictions = JSON.parse(output);
        console.log('Parsed predictions:', predictions);
        
        if (Object.keys(predictions).length === 0) {
          // If Prophet returns empty, use fallback
          console.log('AI returned empty predictions, using mathematical model');
          const fallbackPredictions = generateFallbackPredictions(trainingData);
          return res.status(200).json({ 
            predictions: fallbackPredictions, 
            data_points_used: trainingData.length,
            message: 'Prediction completed (mathematical model used)',
            ai_status: 'No predictions returned'
          });
        }
        
        // Validate AI predictions before sending to frontend
        const validationResult = validateAIPredictions(predictions, trainingData);
        
        if (validationResult.valid) {
          console.log('AI predictions validated successfully');
          res.status(200).json({ 
            predictions: validationResult.predictions, 
            data_points_used: trainingData.length,
            message: 'AI prediction successful',
            ai_confidence: validationResult.confidence || 'high'
          });
        } else {
          console.log('AI predictions needed adjustment:', validationResult.reason);
          res.status(200).json({ 
            predictions: validationResult.predictions, 
            data_points_used: trainingData.length,
            message: 'AI prediction with adjustments',
            ai_confidence: validationResult.confidence || 'medium',
            ai_adjustment_reason: validationResult.reason
          });
        }
      } catch (parseError) {
        console.error('Failed to parse AI output:', parseError);
        const fallbackPredictions = generateFallbackPredictions(trainingData);
        res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction completed (mathematical model used)',
          ai_status: 'Failed to parse output'
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
    
    // Validate and refine AI predictions
    function validateAIPredictions(predictions, data) {
      const result = {
        valid: true,
        predictions: { ...predictions },
        confidence: 'high',
        reason: null
      };
      
      const categories = [...new Set(data.map(item => item.category))];
      const currentDate = new Date();
      const daysPassed = currentDate.getDate();
      
      // Check each category for anomalies or unrealistic values
      categories.forEach(category => {
        if (!predictions[category]) return; // Skip if category not in predictions
        
        const categoryData = data.filter(item => item.category === category);
        const currentSpent = categoryData.reduce((sum, item) => sum + item.amount, 0);
        const predicted = predictions[category];
        
        // Calculate reasonable multiplier based on category and days passed
        let maxMultiplier;
        if (category.toLowerCase().includes('bill') || category.toLowerCase().includes('rent')) {
          // Bills and rent are usually fixed monthly costs
          maxMultiplier = 1.5; 
        } else if (daysPassed < 10) {
          // Early in month, allow more variance
          maxMultiplier = 4.0;
        } else if (daysPassed < 20) {
          // Mid-month
          maxMultiplier = 3.0;
        } else {
          // Late in month
          maxMultiplier = 2.0;
        }
        
        // Check if prediction is unreasonably high
        if (predicted > currentSpent * maxMultiplier && predicted > currentSpent + 1000) {
          result.valid = false;
          result.confidence = 'medium';
          result.reason = 'Some predictions needed adjustment for realism';
          
          // Apply a more reasonable cap
          const cappedValue = Math.min(
            currentSpent * maxMultiplier,
            currentSpent + 1000
          );
          result.predictions[category] = Math.round(cappedValue * 100) / 100;
        }
        
        // Check for unreasonably low predictions (less than current spending)
        if (predicted < currentSpent) {
          result.valid = false;
          result.confidence = 'medium';
          result.reason = 'Some predictions were lower than current spending';
          
          // Ensure prediction is at least current spending
          result.predictions[category] = Math.round(currentSpent * 100) / 100;
        }
      });
      
      // Return validated and potentially adjusted predictions
      return result;
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
