// Category Budget API endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Default category budgets
const defaultCategoryBudgets = {
  Food: 0,
  Transport: 0,
  Shopping: 0,
  Bills: 0,
  Education: 0,
  Health: 0,
  Others: 0
};

// Get category budgets for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user has category budgets record
    const result = await db.query(
      'SELECT * FROM category_budgets WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create a default category budgets record if none exists
      const newCategoryBudgets = await db.query(
        'INSERT INTO category_budgets (user_id, category_data) VALUES ($1, $2) RETURNING *',
        [req.user.id, JSON.stringify(defaultCategoryBudgets)]
      );
      
      return res.status(200).json(newCategoryBudgets.rows[0].category_data);
    }
    
    res.status(200).json(result.rows[0].category_data);
  } catch (error) {
    console.error('Error fetching category budgets:', error);
    res.status(500).json({ message: 'Server error fetching category budgets' });
  }
});

// Update category budgets for the logged-in user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Validate category data
    if (!categoryData || typeof categoryData !== 'object') {
      return res.status(400).json({ message: 'Valid category budget data is required' });
    }
    
    // Check if user has a category budgets record
    const checkResult = await db.query(
      'SELECT * FROM category_budgets WHERE user_id = $1',
      [req.user.id]
    );
    
    let result;
    
    if (checkResult.rows.length === 0) {
      // Create a new category budgets record
      result = await db.query(
        'INSERT INTO category_budgets (user_id, category_data) VALUES ($1, $2) RETURNING *',
        [req.user.id, JSON.stringify(categoryData)]
      );
    } else {
      // Update existing category budgets record
      result = await db.query(
        'UPDATE category_budgets SET category_data = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
        [JSON.stringify(categoryData), req.user.id]
      );
    }
    
    res.status(200).json(result.rows[0].category_data);
  } catch (error) {
    console.error('Error updating category budgets:', error);
    res.status(500).json({ message: 'Server error updating category budgets' });
  }
});

module.exports = router;
