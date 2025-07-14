// Budget API endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Get budget for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has a budget record
    const result = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create a default budget record if none exists
      const newBudget = await db.query(
        'INSERT INTO budgets (user_id, amount) VALUES ($1, $2) RETURNING *',
        [req.user.id, 0]
      );
      
      return res.status(200).json(newBudget.rows[0]);
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
});

// Update budget for the logged-in user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Validate amount
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Check if user has a budget record
    const checkResult = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1',
      [req.user.id]
    );
    
    let result;
    
    if (checkResult.rows.length === 0) {
      // Create a new budget record
      result = await db.query(
        'INSERT INTO budgets (user_id, amount) VALUES ($1, $2) RETURNING *',
        [req.user.id, parseFloat(amount)]
      );
    } else {
      // Update existing budget record
      result = await db.query(
        'UPDATE budgets SET amount = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
        [parseFloat(amount), req.user.id]
      );
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error updating budget' });
  }
});

module.exports = router;
