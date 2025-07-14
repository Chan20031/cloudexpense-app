// Income API endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Get all income entries for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM income WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching income entries:', error);
    res.status(500).json({ message: 'Server error fetching income entries' });
  }
});

// Create a new income entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating income entry for user:', req.user.id);
    console.log('Request body:', req.body);
    
    const { item, category, amount, created_at } = req.body;
    
    // Validate required fields
    if (!item || !category || !amount) {
      console.log('Validation failed - missing fields:', { item, category, amount });
      return res.status(400).json({ message: 'Item, category, and amount are required' });
    }
    
    console.log('Inserting income entry into database...');
    const result = await db.query(
      'INSERT INTO income (user_id, item, category, amount, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, item, category, amount, created_at]
    );
    
    console.log('Income entry created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating income entry:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error creating income entry' });
  }
});

// Update an existing income entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, category, amount } = req.body;
    
    // Validate required fields
    if (!item || !category || !amount) {
      return res.status(400).json({ message: 'Item, category, and amount are required' });
    }
    
    // Check if income entry exists and belongs to the user
    const checkResult = await db.query(
      'SELECT * FROM income WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Income entry not found or unauthorized' });
    }
    
    const result = await db.query(
      'UPDATE income SET item = $1, category = $2, amount = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [item, category, amount, id, req.user.id]
    );
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating income entry:', error);
    res.status(500).json({ message: 'Server error updating income entry' });
  }
});

// Delete an income entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if income entry exists and belongs to the user
    const checkResult = await db.query(
      'SELECT * FROM income WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Income entry not found or unauthorized' });
    }
    
    await db.query(
      'DELETE FROM income WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    res.status(200).json({ message: 'Income entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting income entry:', error);
    res.status(500).json({ message: 'Server error deleting income entry' });
  }
});

module.exports = router;

