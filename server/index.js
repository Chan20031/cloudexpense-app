// Set timezone for the Node.js application (important for Elastic Beanstalk)
process.env.TZ = 'Asia/Kuala_Lumpur';

// IMPORTANT: Ensure Python dependencies are available before starting server
async function ensurePythonDependencies() {
    const isAppRunner = process.env.AWS_REGION && process.env.PORT;
    if (!isAppRunner) {
        console.log('🏠 Local environment - skipping Python dependency check');
        return;
    }
    
    console.log('🔧 CloudExpense: Checking Python dependencies...');
    
    try {
        const { execSync } = require('child_process');
        // Quick check if packages are already installed
        execSync('python3 -c "import pandas, prophet; print(\\"✅ Python packages ready\\")"', 
                { encoding: 'utf8', timeout: 5000 });
        console.log('✅ Python dependencies already available');
    } catch (error) {
        console.log('📦 Python packages not found, installing...');
        console.log('⏰ This may take 5-10 minutes on first deployment...');
        
        try {
            // Install system packages
            execSync('yum update -y && yum install -y python3 python3-pip python3-devel gcc gcc-c++ make', 
                    { stdio: 'inherit', timeout: 120000 });
            
            // Install Python packages
            execSync('python3 -m pip install --upgrade pip', { stdio: 'inherit', timeout: 30000 });
            execSync('python3 -m pip install --no-cache-dir numpy==1.24.3', { stdio: 'inherit', timeout: 180000 });
            execSync('python3 -m pip install --no-cache-dir pandas==2.0.3', { stdio: 'inherit', timeout: 180000 });
            execSync('python3 -m pip install --no-cache-dir pystan==3.7.0', { stdio: 'inherit', timeout: 300000 });
            execSync('python3 -m pip install --no-cache-dir prophet==1.1.4', { stdio: 'inherit', timeout: 300000 });
            
            console.log('🎉 Python dependencies installed successfully!');
        } catch (installError) {
            console.log('⚠️  Python installation failed, will use mathematical fallback:', installError.message);
        }
    }
}

// Run Python dependency check before starting the server
ensurePythonDependencies().then(() => {
    console.log('🚀 Starting CloudExpense server...');
    startServer();
}).catch((error) => {
    console.log('⚠️  Dependency check failed, starting server anyway:', error.message);
    startServer();
});

function startServer() {
    require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const db = require('./db');
const transactionRoutes = require('./routes/transactions');
const incomeRoutes = require('./routes/income');
const categoryBudgetRoutes = require('./routes/category-budgets');
const budgetRoutes = require('./routes/budget');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const profileRoutes = require('./routes/profile');
const predictRoutes = require('./routes/predict');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email sender details
const getEmailSender = () => {
  return {
    email: process.env.FROM_EMAIL || 'noreply@cloudexpense.com',
    name: process.env.FROM_NAME || 'CloudExpense'
  };
};

// Helper function to send emails using SendGrid
const sendEmail = async (to, subject, html) => {
  const sender = getEmailSender();
  const msg = {
    to: to,
    from: sender,
    subject: subject,
    html: html,
  };
  
  return await sgMail.send(msg);
};

// Helper function to generate tokens
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Routes

// Health check endpoint for App Runner
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate verification token
    const verificationToken = generateToken();
    console.log('Generated verification token for user:', {
      email: email,
      tokenPreview: `${verificationToken.substring(0, 10)}...`
    });
    
    // Insert user into database
    const newUser = await db.query(
      'INSERT INTO users (name, email, password_hash, verification_token, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, name, email',
      [name, email.toLowerCase().trim(), hashedPassword, verificationToken]
    );
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const emailHtml = `
      <h1>Welcome to CloudExpense!</h1>
      <p>Hello ${name},</p>
      <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #14b8a6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This verification link will remain valid until you verify your account.</p>
      <p>Best regards,<br>CloudExpense Team</p>
    `;
    
    // Send verification email with SendGrid
    try {
      console.log('Attempting to send verification email via SendGrid...');
      const emailResult = await sendEmail(email, 'Verify Your Email - CloudExpense', emailHtml);
      console.log('✅ Verification email sent successfully via SendGrid');
      console.log('Message ID:', emailResult[0].headers['x-message-id']);
    } catch (emailError) {
      console.error('❌ Error sending verification email via SendGrid:', emailError);
      console.error('SendGrid error details:', emailError.response?.body);
      // Continue with registration even if email fails
    }
    
    res.status(201).json({ 
      message: 'User registered successfully. Please check your email to verify your account.',
      user: newUser.rows[0]
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// In-memory store to track recent verification attempts (use Redis in production)
const recentVerifications = new Map();

// Verify email
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    console.log('Email verification attempt:', { 
      token: token ? `${token.substring(0, 10)}...` : 'null',
      ip: clientIP 
    });
    
    if (!token || token.trim() === '') {
      console.log('Email verification failed: No token provided');
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    // Trim and validate token format
    const cleanToken = token.trim();
    if (cleanToken.length < 10) {
      console.log('Email verification failed: Invalid token format');
      return res.status(400).json({ message: 'Invalid verification token format' });
    }
    
    // Check for recent verification attempts for this token
    const recentKey = `${cleanToken}_${clientIP}`;
    const lastAttempt = recentVerifications.get(recentKey);
    const now = Date.now();
    
    if (lastAttempt && (now - lastAttempt) < 5000) { // 5 seconds cooldown
      console.log('Email verification: Too many recent attempts, rate limited');
      return res.status(429).json({ 
        message: 'Too many verification attempts. Please wait a moment.',
        code: 'RATE_LIMITED'
      });
    }
    
    // Record this attempt
    recentVerifications.set(recentKey, now);
    
    // Clean up old entries (older than 1 minute)
    for (const [key, timestamp] of recentVerifications.entries()) {
      if (now - timestamp > 60000) {
        recentVerifications.delete(key);
      }
    }
    
    // Find user with this verification token
    const user = await db.query(
      'SELECT id, email, is_verified, verification_token FROM users WHERE verification_token = $1', 
      [cleanToken]
    );
    
    console.log('Email verification query result:', {
      foundUser: user.rows.length > 0,
      isVerified: user.rows[0]?.is_verified,
      email: user.rows[0]?.email
    });
    
    if (user.rows.length === 0) {
      console.log('Email verification failed: Token not found in database');
      
      // This usually means the token was already used and cleared from the database
      // Provide a more helpful error message
      return res.status(400).json({ 
        message: 'This verification link has already been used or has expired. If you recently verified your email, you can now log in to your account.',
        code: 'TOKEN_ALREADY_USED'
      });
    }
    
    const foundUser = user.rows[0];
    
    // Check if user is already verified
    if (foundUser.is_verified) {
      console.log(`User ${foundUser.email} is already verified`);
      return res.status(200).json({ message: 'Email is already verified. You can now log in.' });
    }
    
    // Update user to verified and clear the verification token
    const updateResult = await db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1 RETURNING email',
      [foundUser.id]
    );
    
    if (updateResult.rows.length === 0) {
      console.log('Email verification failed: Update operation failed');
      return res.status(500).json({ message: 'Failed to update verification status' });
    }
    
    console.log(`User ${foundUser.email} successfully verified`);
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'No account found with this email address' });
    }
    
    console.log(`Login attempt for ${email}:`);
    console.log(`- User found: ${user.rows[0].name}`);
    console.log(`- Is verified: ${user.rows[0].is_verified}`);
    console.log(`- Google ID: ${user.rows[0].google_id}`);
    console.log(`- Verification token: ${user.rows[0].verification_token}`);
    
    // Check if email is verified
    if (!user.rows[0].is_verified && !user.rows[0].google_id) {
      console.log(`User ${email} attempted login but email is not verified`);
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      console.log(`User ${email} provided incorrect password`);
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }
    
    console.log(`User ${email} logged in successfully`);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        profile_picture: user.rows[0].profile_picture
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google authentication
app.post('/api/auth/google', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    let userId;
    
    if (userCheck.rows.length === 0) {
      // Create new user
      const newUser = await db.query(
        'INSERT INTO users (name, email, google_id, is_verified) VALUES ($1, $2, $3, TRUE) RETURNING id',
        [name, email, googleId]
      );
      userId = newUser.rows[0].id;
    } else {
      // Update existing user with Google ID if not already set
      if (!userCheck.rows[0].google_id) {
        await db.query(
          'UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2',
          [googleId, userCheck.rows[0].id]
        );
      }
      userId = userCheck.rows[0].id;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({
      message: 'Google authentication successful',
      token,
      user: { id: userId, name, email }
    });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Password reset request for:', email);
    
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    // Find user
    const user = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    
    if (user.rows.length === 0) {
      console.log(`Password reset: Email ${email} not found`);
      // Don't reveal that the email doesn't exist for security
      return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    }
    
    // Generate reset token
    const resetToken = generateToken();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour
    
    console.log('Generated reset token for user:', {
      email: user.rows[0].email,
      tokenPreview: `${resetToken.substring(0, 10)}...`,
      expiresAt: resetTokenExpires.toISOString()
    });
    
    // Update user with reset token using UTC timestamp
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires.toISOString(), user.rows[0].id]
    );
    
    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <h1>Password Reset Request</h1>
      <p>Hello ${user.rows[0].name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #14b8a6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>CloudExpense Team</p>
    `;
    
    // Send reset email with SendGrid
    try {
      console.log('Attempting to send password reset email via SendGrid...');
      const emailResult = await sendEmail(email, 'Password Reset - CloudExpense', emailHtml);
      console.log('✅ Password reset email sent successfully via SendGrid');
      console.log('Message ID:', emailResult[0].headers['x-message-id']);
    } catch (emailError) {
      console.error('❌ Error sending password reset email via SendGrid:', emailError);
      console.error('SendGrid error details:', emailError.response?.body);
      // Continue even if email fails
    }
    
    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('Password reset attempt:', { 
      token: token ? `${token.substring(0, 10)}...` : 'null',
      hasPassword: !!newPassword 
    });
    
    if (!token || token.trim() === '') {
      console.log('Password reset failed: No token provided');
      return res.status(400).json({ message: 'Reset token is required' });
    }
    
    if (!newPassword || newPassword.length < 8) {
      console.log('Password reset failed: Invalid password');
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    const cleanToken = token.trim();
    
    // Find user with this reset token that hasn't expired
    // Use UTC comparison for timezone safety
    const user = await db.query(
      `SELECT id, email, reset_token, reset_token_expires 
       FROM users 
       WHERE reset_token = $1 
       AND reset_token_expires > NOW() AT TIME ZONE 'UTC'`,
      [cleanToken]
    );
    
    console.log('Password reset query result:', {
      foundUser: user.rows.length > 0,
      email: user.rows[0]?.email,
      tokenExpires: user.rows[0]?.reset_token_expires
    });
    
    if (user.rows.length === 0) {
      // Check if token exists but is expired
      const expiredUser = await db.query(
        'SELECT email, reset_token_expires FROM users WHERE reset_token = $1',
        [cleanToken]
      );
      
      if (expiredUser.rows.length > 0) {
        console.log('Password reset failed: Token expired for user:', expiredUser.rows[0].email);
        return res.status(400).json({ 
          message: 'This password reset link has expired. Please request a new password reset link.' 
        });
      } else {
        console.log('Password reset failed: Token not found');
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password and clear reset token
    const updateResult = await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2 RETURNING email',
      [hashedPassword, user.rows[0].id]
    );
    
    if (updateResult.rows.length === 0) {
      console.log('Password reset failed: Update operation failed');
      return res.status(500).json({ message: 'Failed to update password' });
    }
    
    console.log(`Password reset successful for user: ${user.rows[0].email}`);
    res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Get user's current password hash
    const user = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.status(200).json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Update user profile
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;
    
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Check if username is already taken by another user
    const existingUser = await db.query(
      'SELECT id FROM users WHERE name = $1 AND id != $2', 
      [username.trim(), userId]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    
    // Update username
    await db.query(
      'UPDATE users SET name = $1 WHERE id = $2',
      [username.trim(), userId]
    );
    
    res.status(200).json({ message: 'Profile updated successfully' });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Profile picture upload endpoint
app.post('/api/auth/upload-profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate the image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    // Update the user's profile_picture in the database
    await db.query(
      'UPDATE users SET profile_picture = $1, updated_at = NOW() WHERE id = $2 RETURNING id', 
      [imageUrl, req.user.id]
    );

    // Return the full URL for the image using the actual request host
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ 
      url: `${baseUrl}${imageUrl}`,
      message: 'Profile picture uploaded successfully'
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile picture' });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Transaction routes

// Register upload route so /api/upload works
app.use('/api', uploadRoutes);

// Register profile routes so /api/profile works
app.use('/api/profile', profileRoutes);

app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/income', authenticateToken, incomeRoutes);
app.use('/api/category-budgets', authenticateToken, categoryBudgetRoutes);
app.use('/api/budget', authenticateToken, budgetRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/predict', authenticateToken, predictRoutes);

// Debug endpoint to check token status (remove in production)
app.get('/api/debug/token-status/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Check verification token
    const verificationResult = await db.query(
      'SELECT id, email, is_verified, verification_token FROM users WHERE verification_token = $1',
      [token]
    );
    
    // Check reset token
    const resetResult = await db.query(
      'SELECT id, email, reset_token, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );
    
    res.json({
      verification: {
        found: verificationResult.rows.length > 0,
        user: verificationResult.rows[0] || null
      },
      reset: {
        found: resetResult.rows.length > 0,
        user: resetResult.rows[0] || null,
        expired: resetResult.rows[0] ? new Date() > new Date(resetResult.rows[0].reset_token_expires) : null
      }
    });
    
  } catch (error) {
    console.error('Token status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint for testing email
app.post('/api/debug/test-email', async (req, res) => {
  try {
    console.log('=== SENDGRID EMAIL DEBUG ===');
    console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 'undefined');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('FROM_NAME:', process.env.FROM_NAME);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    
    const sender = getEmailSender();
    console.log('Email sender config:', sender);
    
    // Send test email
    const emailHtml = `
      <h1>SendGrid Test</h1>
      <p>This email was sent from CloudExpense using SendGrid.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      <p>From: ${sender.name} &lt;${sender.email}&gt;</p>
    `;
    
    const emailResult = await sendEmail(sender.email, 'CloudExpense SendGrid Test', emailHtml);
    
    console.log('✅ SendGrid email sent successfully!');
    console.log('Message ID:', emailResult[0].headers['x-message-id']);
    
    res.json({
      success: true,
      message: 'Email sent successfully via SendGrid',
      messageId: emailResult[0].headers['x-message-id'],
      sender: sender
    });
    
  } catch (error) {
    console.error('❌ SendGrid email failed:');
    console.error('Error message:', error.message);
    console.error('SendGrid error details:', error.response?.body);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.body || 'No additional details'
    });
  }
});

// Debug GET endpoint for easier email testing
app.get('/api/debug/test-email-get', async (req, res) => {
  try {
    console.log('=== SENDGRID EMAIL DEBUG (GET) ===');
    console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 'undefined');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('FROM_NAME:', process.env.FROM_NAME);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    
    const sender = getEmailSender();
    
    // Send test email
    const emailHtml = `
      <h1>SendGrid Test (GET)</h1>
      <p>This email was sent from CloudExpense using SendGrid.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      <p>From: ${sender.name} &lt;${sender.email}&gt;</p>
      <p>Test triggered via GET request</p>
    `;
    
    const emailResult = await sendEmail(sender.email, 'CloudExpense SendGrid Test (GET)', emailHtml);
    
    console.log('✅ SendGrid email sent successfully!');
    console.log('Message ID:', emailResult[0].headers['x-message-id']);
    
    res.json({
      success: true,
      message: 'SendGrid email sent successfully',
      messageId: emailResult[0].headers['x-message-id'],
      environment: `${process.env.NODE_ENV || 'development'} (SendGrid)`,
      sender: sender
    });
    
  } catch (error) {
    console.error('❌ SendGrid email failed:');
    console.error('Error message:', error.message);
    console.error('SendGrid error details:', error.response?.body);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.body || 'No additional details',
      environment: `${process.env.NODE_ENV || 'development'} (SendGrid)`,
      sender: getEmailSender()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

} // End of startServer function
