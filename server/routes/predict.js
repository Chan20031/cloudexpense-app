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

    pythonProcess.on('close', async (code) => {
      console.log('=== PYTHON PROCESS RESULT ===');
      console.log('Exit code:', code);
      console.log('Full stderr:', errorOutput);
      console.log('Full stdout:', output);
      console.log('================================');
      
      if (code !== 0) {
        console.error('Python predictor error:', errorOutput);
        console.log('Prophet AI failed, using mathematical fallback');
        // Fall back to simple prediction if Python fails
        const fallbackPredictions = await generateFallbackPredictions(trainingData);
        return res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction successful (Enhanced Malaysian AI with Historical Learning)' 
        });
      }
      
      try {
        console.log('Raw Python output:', output);
        const predictions = JSON.parse(output);
        console.log('Parsed predictions:', predictions);
        
        if (Object.keys(predictions).length === 0) {
          // If Prophet returns empty, use fallback
          const fallbackPredictions = await generateFallbackPredictions(trainingData);
          console.log('Prophet AI returned empty results, using fallback');
          return res.status(200).json({ 
            predictions: fallbackPredictions, 
            data_points_used: trainingData.length,
            message: 'Prediction successful (Enhanced Malaysian AI with Historical Learning)' 
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
        const fallbackPredictions = await generateFallbackPredictions(trainingData);
        res.status(200).json({ 
          predictions: fallbackPredictions, 
          data_points_used: trainingData.length,
          message: 'Prediction successful (Enhanced Malaysian AI with Historical Learning)' 
        });
      }
    });
    
    // Send data to Python process
    pythonProcess.stdin.write(JSON.stringify(trainingData));
    pythonProcess.stdin.end();
    
    // Helper function for ENHANCED Malaysian AI predictions
    async function generateFallbackPredictions(data) {
      const predictions = {};
      const categories = [...new Set(data.map(item => item.category))];
      
      const currentDate = new Date();
      const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const daysPassed = currentDate.getDate();
      const remainingDays = totalDaysInMonth - daysPassed;
      const monthProgress = daysPassed / totalDaysInMonth;
      
      console.log(`🧠 Enhanced Malaysian AI Analysis: Day ${daysPassed}/${totalDaysInMonth}, Progress: ${(monthProgress * 100).toFixed(1)}%`);
      
      // 📊 HISTORICAL LEARNING MEMORY - Get user's past patterns
      const historicalPatterns = {};
      try {
        for (const category of categories) {
          const historyResult = await db.query(
            `SELECT 
               AVG(total_spent) as avg_monthly_spend,
               AVG(total_spent / EXTRACT(DAY FROM DATE_TRUNC('month', created_at) + INTERVAL '1 month - 1 day')) as avg_daily_rate
             FROM (
               SELECT 
                 EXTRACT(YEAR FROM created_at) as year,
                 EXTRACT(MONTH FROM created_at) as month,
                 SUM(amount) as total_spent
               FROM transactions 
               WHERE user_id = $1 AND category = $2
               AND created_at >= NOW() - INTERVAL '6 months'
               AND created_at < DATE_TRUNC('month', NOW())
               GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
             ) monthly_totals`,
            [userId, category]
          );
          
          if (historyResult.rows[0]?.avg_monthly_spend) {
            historicalPatterns[category] = {
              avgMonthlySpend: parseFloat(historyResult.rows[0].avg_monthly_spend),
              avgDailyRate: parseFloat(historyResult.rows[0].avg_daily_rate),
              hasHistory: true
            };
            console.log(`📚 ${category} History: Avg RM${historicalPatterns[category].avgMonthlySpend.toFixed(2)}/month`);
          } else {
            historicalPatterns[category] = { hasHistory: false };
          }
        }
      } catch (error) {
        console.log('⚠️ Historical data query failed, using current data only');
      }
      
      // 📅 DAY-OF-WEEK INTELLIGENCE
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`📅 Today is ${dayNames[dayOfWeek]} - applying Malaysian day-of-week patterns`);
      
      categories.forEach(category => {
        const categoryData = data.filter(item => item.category === category);
        const currentSpent = categoryData.reduce((sum, item) => sum + item.amount, 0);
        
        if (remainingDays <= 0) {
          predictions[category] = Math.round(currentSpent * 100) / 100;
          return;
        }
        
        // 🧠 ENHANCED MALAYSIAN AI LOGIC
        let prediction = 0;
        
        // Base calculation
        const dailyAverage = currentSpent / daysPassed;
        const basicProjection = currentSpent + (dailyAverage * remainingDays);
        
        // 📊 HISTORICAL LEARNING ADJUSTMENT
        let historicalMultiplier = 1.0;
        if (historicalPatterns[category]?.hasHistory) {
          const currentPace = currentSpent / daysPassed;
          const historicalPace = historicalPatterns[category].avgDailyRate;
          
          if (currentPace > historicalPace * 1.2) {
            historicalMultiplier = 1.3; // Spending faster than usual
            console.log(`🚀 ${category}: Spending 30% faster than historical average`);
          } else if (currentPace < historicalPace * 0.8) {
            historicalMultiplier = 0.8; // Spending slower than usual
            console.log(`🐌 ${category}: Spending 20% slower than historical average`);
          } else {
            historicalMultiplier = 1.1; // Normal pace with slight boost
            console.log(`📈 ${category}: Normal spending pace (historical alignment)`);
          }
        }
        
        // 📅 DAY-OF-WEEK MULTIPLIERS (Malaysian patterns)
        let dayOfWeekMultiplier = 1.0;
        switch(category.toLowerCase()) {
          case 'food':
            if (dayOfWeek === 5) { // Friday - Payday, team lunch
              dayOfWeekMultiplier = 1.4;
              console.log(`🍽️ Food Friday: Payday lunch boost (+40%)`);
            } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
              dayOfWeekMultiplier = 1.3;
              console.log(`🍜 Food Weekend: Family dinner/brunch boost (+30%)`);
            } else if (dayOfWeek === 1) { // Monday blues
              dayOfWeekMultiplier = 1.1;
              console.log(`☕ Food Monday: Monday blues comfort food (+10%)`);
            }
            break;
            
          case 'shopping':
            if (dayOfWeek === 5) { // Friday payday shopping
              dayOfWeekMultiplier = 1.5;
              console.log(`🛍️ Shopping Friday: Payday shopping spree (+50%)`);
            } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend mall trips
              dayOfWeekMultiplier = 1.3;
              console.log(`🏬 Shopping Weekend: Mall expedition (+30%)`);
            }
            break;
            
          case 'transport':
            if (dayOfWeek === 1) { // Monday - back to work
              dayOfWeekMultiplier = 1.2;
              console.log(`🚗 Transport Monday: Back to work fuel-up (+20%)`);
            } else if (dayOfWeek === 5) { // Friday night out
              dayOfWeekMultiplier = 1.3;
              console.log(`🚖 Transport Friday: Night out Grab rides (+30%)`);
            } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend travels
              dayOfWeekMultiplier = 1.2;
              console.log(`🛣️ Transport Weekend: Family trips (+20%)`);
            }
            break;
            
          case 'entertainment':
            if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday night, Saturday
              dayOfWeekMultiplier = 1.6;
              console.log(`🎬 Entertainment Weekend: Cinema & karaoke prime time (+60%)`);
            } else if (dayOfWeek === 0) { // Sunday family time
              dayOfWeekMultiplier = 1.2;
              console.log(`👨‍👩‍👧‍👦 Entertainment Sunday: Family activities (+20%)`);
            }
            break;
        }
        
        // 🇲🇾 MALAYSIAN SPENDING INTELLIGENCE
        switch(category.toLowerCase()) {
          case 'food':
            // 🍽️ REALISTIC MEAL ESTIMATION - At least 2 meals per day
            const avgMealCost = currentSpent / (daysPassed * 2); // Assume 2 meals per day minimum
            const minMealsRemaining = remainingDays * 2; // At least 2 meals per day
            
            // Calculate weekend vs weekday meals
            const weekendDaysLeft = Math.floor(remainingDays / 7) * 2 + (remainingDays % 7 > 0 ? Math.min(remainingDays % 7, 2) : 0);
            const weekdayDaysLeft = remainingDays - weekendDaysLeft;
            
            // Malaysian meal pricing: Weekend meals cost more (restaurant vs mamak)
            const weekendMealCost = avgMealCost * 1.5; // Restaurant/family dinner style
            const weekdayMealCost = avgMealCost * 1.0; // Normal mamak/kopitiam style
            
            const weekendMealsRemaining = weekendDaysLeft * 2;
            const weekdayMealsRemaining = weekdayDaysLeft * 2;
            
            if (monthProgress < 0.3) {
              // Early month: Can afford variety (restaurants, delivery)
              const estimatedWeekendCost = weekendMealsRemaining * weekendMealCost;
              const estimatedWeekdayCost = weekdayMealsRemaining * weekdayMealCost * 1.1; // Slightly premium
              prediction = currentSpent + estimatedWeekendCost + estimatedWeekdayCost;
              console.log(`🍽️ Food (Early month): ${minMealsRemaining} meals estimated (${weekendMealsRemaining} weekend + ${weekdayMealsRemaining} weekday)`);
            } else if (monthProgress > 0.7) {
              // Late month: More budget conscious (mamak, kopitiam, home cooking)
              const budgetWeekendCost = weekendMealsRemaining * avgMealCost * 1.2; // Slightly more than weekday
              const budgetWeekdayCost = weekdayMealsRemaining * avgMealCost * 0.8; // Budget meals
              prediction = currentSpent + budgetWeekendCost + budgetWeekdayCost;
              console.log(`🍜 Food (Late month): Budget mode - ${minMealsRemaining} meals (mamak/kopitiam style)`);
            } else {
              // Mid month: Normal Malaysian eating patterns
              const normalWeekendCost = weekendMealsRemaining * weekendMealCost;
              const normalWeekdayCost = weekdayMealsRemaining * weekdayMealCost;
              prediction = currentSpent + normalWeekendCost + normalWeekdayCost;
              console.log(`🍽️ Food (Mid month): Normal eating - ${minMealsRemaining} meals planned`);
            }
            
            // Safety check: Ensure minimum reasonable food budget
            const minDailyFood = 15; // Minimum RM15/day for basic meals in Malaysia
            const minFoodBudget = currentSpent + (remainingDays * minDailyFood);
            if (prediction < minFoodBudget) {
              prediction = minFoodBudget;
              console.log(`🛡️ Food: Applied minimum daily budget (RM${minDailyFood}/day)`);
            }
            break;
            
          case 'transport':
            // Malaysian transport: Petrol, Touch 'n Go, Grab
            if (monthProgress < 0.5) {
              // Early month: Full tank, more travel
              prediction = currentSpent + (dailyAverage * remainingDays * 1.2);
              console.log(`🚗 Transport (Early): Full tank mode`);
            } else {
              // Late month: More careful, less Grab
              prediction = currentSpent + (dailyAverage * remainingDays * 0.8);
              console.log(`🚌 Transport (Late): Public transport mode`);
            }
            break;
            
          case 'shopping':
            // Malaysian shopping patterns: Payday splurge, then careful
            if (daysPassed <= 7) {
              // First week: Payday shopping spree
              prediction = currentSpent + (dailyAverage * remainingDays * 0.6);
              console.log(`🛍️ Shopping (Payday week): Early splurge detected`);
            } else if (monthProgress > 0.6) {
              // Late month: Very conservative
              prediction = currentSpent + (dailyAverage * remainingDays * 0.3);
              console.log(`💰 Shopping (Late): Wallet protection mode`);
            } else {
              prediction = basicProjection * 0.8;
            }
            break;
            
          case 'bills':
            // Malaysian bills: Predictable monthly expenses
            if (currentSpent < 50) {
              // Haven't paid major bills yet
              prediction = Math.max(basicProjection, 200); // Minimum RM200 for utilities
              console.log(`📋 Bills: Major bills pending`);
            } else {
              // Bills mostly paid
              prediction = currentSpent + (dailyAverage * remainingDays * 0.5);
              console.log(`✅ Bills: Most bills paid`);
            }
            break;
            
          case 'entertainment':
            // Malaysian entertainment: Movies, karaoke, lepak
            if (monthProgress < 0.4) {
              prediction = basicProjection * 1.3; // Early month entertainment
              console.log(`🎬 Entertainment: Cinema & karaoke season`);
            } else {
              prediction = currentSpent + (dailyAverage * remainingDays * 0.7);
              console.log(`🏠 Entertainment: Netflix & chill mode`);
            }
            break;
            
          case 'health':
            // Malaysian healthcare: Clinic visits, pharmacy
            prediction = Math.max(basicProjection, currentSpent + 30); // Minimum RM30 buffer
            console.log(`🏥 Health: Malaysian healthcare buffer`);
            break;
            
          case 'education':
            // Malaysian education: Tuition, courses
            if (monthProgress < 0.3) {
              prediction = Math.max(basicProjection, currentSpent + 100);
              console.log(`📚 Education: Monthly tuition cycle`);
            } else {
              prediction = basicProjection;
            }
            break;
            
          default:
            // Others: General Malaysian spending pattern
            if (monthProgress < 0.3) {
              prediction = basicProjection * 1.1; // Early month confidence
            } else if (monthProgress > 0.7) {
              prediction = basicProjection * 0.8; // Late month caution
            } else {
              prediction = basicProjection;
            }
            console.log(`💼 ${category}: General Malaysian pattern`);
        }
        
        // 🧠 SMART CAPS & MINIMUM LOGIC
        if (monthProgress < 0.2 && prediction < currentSpent * 3) {
          // Early month: Allow higher predictions (your RM20 → RM600+ logic)
          prediction = Math.max(prediction, currentSpent * 2.5);
          console.log(`🚀 Early month boost: ${category} increased to ${prediction.toFixed(2)}`);
        }
        
        // 📊 APPLY HISTORICAL LEARNING
        prediction = prediction * historicalMultiplier;
        
        // 📅 APPLY DAY-OF-WEEK INTELLIGENCE
        prediction = prediction * dayOfWeekMultiplier;
        
        // Ensure reasonable minimums
        if (prediction < currentSpent * 1.1) {
          prediction = currentSpent * 1.2; // At least 20% more
        }
        
        // Cap extremely high predictions
        const maxReasonable = currentSpent * 6; // Increased max due to new multipliers
        if (prediction > maxReasonable) {
          prediction = maxReasonable;
          console.log(`🛡️ Capped ${category} at ${maxReasonable.toFixed(2)} (6x current)`);
        }
        
        predictions[category] = Math.round(prediction * 100) / 100;
        console.log(`💡 ${category}: RM${currentSpent} → RM${predictions[category]} (${((predictions[category]/currentSpent - 1) * 100).toFixed(0)}% increase)`);
        console.log(`   📊 Historical: ${(historicalMultiplier * 100).toFixed(0)}% | 📅 Day-of-week: ${(dayOfWeekMultiplier * 100).toFixed(0)}%`);
      });
      
      console.log('🇲🇾 Enhanced Malaysian AI with Historical Learning & Day Intelligence completed!');
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
