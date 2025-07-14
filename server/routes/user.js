// User API endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, profile_picture, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    // Profile picture URLs from S3 are already complete URLs
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    let { name, profile_picture } = req.body;

    // Validate profile_picture is a string or null (can be S3 key or full URL)
    if (profile_picture && typeof profile_picture !== 'string') {
      return res.status(400).json({ message: 'Invalid profile_picture format. Must be a string (S3 key or URL).' });
    }
    
    // Accept both S3 keys and full URLs (no validation required for S3 keys)
    // S3 keys look like: profile-pictures/user_1_12345.png
    // Full URLs look like: https://bucket.s3.region.amazonaws.com/key...
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), profile_picture = COALESCE($2, profile_picture), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, profile_picture, created_at',
      [name, profile_picture, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = result.rows[0];
    // Profile picture URLs from S3 are already complete URLs
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error updating user profile:', error, req.body);
    res.status(500).json({ message: 'Server error updating user profile', error: error.message });
  }
});

// Update user settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { currency } = req.body;
    
    // Check if user settings exist
    const checkResult = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new settings
      result = await db.query(
        'INSERT INTO user_settings (user_id, currency) VALUES ($1, $2) RETURNING *',
        [req.user.id, currency]
      );
    } else {
      // Update existing settings
      result = await db.query(
        'UPDATE user_settings SET currency = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
        [currency, req.user.id]
      );
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error updating user settings' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    // Start a transaction
    await db.query('BEGIN');
    
    // Delete user settings
    await db.query('DELETE FROM user_settings WHERE user_id = $1', [req.user.id]);
    
    // Delete user transactions
    await db.query('DELETE FROM transactions WHERE user_id = $1', [req.user.id]);
    
    // Delete user budgets
    await db.query('DELETE FROM budgets WHERE user_id = $1', [req.user.id]);
    
    // Delete user category budgets if they exist
    await db.query('DELETE FROM category_budgets WHERE user_id = $1', [req.user.id]);
    
    // Finally delete the user
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Server error deleting user account' });
  }
});

module.exports = router;
