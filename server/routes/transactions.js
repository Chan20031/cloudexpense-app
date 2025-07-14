// Transaction API endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Get all transactions for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// Create a new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating transaction for user:', req.user.id);
    console.log('Request body:', req.body);
    
    const { item, category, amount, receipt_image, created_at } = req.body;
    
    // Validate required fields
    if (!item || !category || !amount) {
      console.log('Validation failed - missing fields:', { item, category, amount });
      return res.status(400).json({ message: 'Item, category, and amount are required' });
    }
    
    console.log('Inserting transaction into database...');
    const result = await db.query(
      'INSERT INTO transactions (user_id, item, category, amount, receipt_image, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, item, category, amount, receipt_image || null, created_at]
    );
    
    console.log('Transaction created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
});

// Update an existing transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, category, amount, receipt_image } = req.body;
    
    // Validate required fields
    if (!item || !category || !amount) {
      return res.status(400).json({ message: 'Item, category, and amount are required' });
    }
    
    // Check if transaction exists and belongs to the user
    const checkResult = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }
    
    const result = await db.query(
      'UPDATE transactions SET item = $1, category = $2, amount = $3, receipt_image = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [item, category, amount, receipt_image, id, req.user.id]
    );
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error updating transaction' });
  }
});

// Delete a transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if transaction exists and belongs to the user
    const checkResult = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }
    
    await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
});

module.exports = router;
