// Profile picture upload API endpoints
const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Configure AWS SDK v3
const s3Client = new S3Client({ region: 'us-east-1' });

// Multer setup for profile picture uploads (limit 2MB, restrict to JPEG, PNG only)
const profileUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for profile pictures
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed for profile pictures'));
    }
    cb(null, true);
  }
});

// Upload profile picture to S3
router.post('/upload', authenticateToken, profileUpload.single('profilePicture'), async (req, res) => {
  console.log('=== PROFILE PICTURE UPLOAD ENDPOINT HIT ===');
  try {
    const file = req.file;
    console.log('Profile picture file received:', file ? file.originalname : 'No file');
    
    if (!file) {
      return res.status(400).json({ message: 'No profile picture uploaded' });
    }

    // File size check (should be handled by Multer, but double check)
    if (file.size > 2 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Profile picture size exceeds 2MB' });
    }

    const fileContent = fs.readFileSync(file.path);
    const fileExtension = path.extname(file.originalname);
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `profile-pictures/user_${req.user.id}_${Date.now()}${fileExtension}`,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const putObjectCommand = new PutObjectCommand(s3Params);
    console.log('Uploading profile picture to S3...');
    const s3Result = await s3Client.send(putObjectCommand);
    
    // Store only the S3 key in database, we'll generate URLs on-demand
    const s3Key = s3Params.Key;
    console.log('S3 profile picture upload successful, key:', s3Key);

    // Clean up local file
    fs.unlinkSync(file.path);

    // Update user's profile picture key in database (not the full URL)
    console.log('Updating database for user:', req.user.id);
    console.log('S3 key to store:', s3Key);
    
    const updateResult = await db.query(
      'UPDATE users SET profile_picture = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, profile_picture, created_at',
      [s3Key, req.user.id]
    );

    console.log('Database update result:', updateResult.rows.length);
    
    if (updateResult.rows.length === 0) {
      console.log('User not found in database for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = updateResult.rows[0];
    console.log('Profile picture key updated successfully for user:', req.user.id);
    console.log('User data:', user);

    // Generate a temporary URL for immediate display (1 hour)
    const getObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    };
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const temporaryUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 }); // 1 hour
    
    console.log('Generated temporary URL for immediate display:', temporaryUrl);

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      user,
      profilePictureUrl: temporaryUrl // Temporary URL for immediate display
    });

  } catch (error) {
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      message: 'Profile picture upload failed', 
      error: error.message 
    });
  }
});

// Get profile picture URL (generates fresh pre-signed URL)
router.get('/picture-url', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id; // Use current user or specified user
    
    // Get user's profile picture key from database
    const userResult = await db.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    if (!user.profile_picture) {
      return res.status(404).json({ message: 'No profile picture found' });
    }

    // Generate fresh pre-signed URL (valid for 1 hour)
    const getObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: user.profile_picture,
    };
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const profilePictureUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 }); // 1 hour

    console.log('Generated fresh profile picture URL:', profilePictureUrl);
    console.log('For S3 key:', user.profile_picture);

    res.status(200).json({
      profilePictureUrl,
      expiresIn: 3600 // Let frontend know when to refresh
    });

  } catch (error) {
    console.error('Profile picture URL generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate profile picture URL', 
      error: error.message 
    });
  }
});

module.exports = router;
