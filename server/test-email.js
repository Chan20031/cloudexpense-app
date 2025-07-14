require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD.replace(/\s/g, '') // Remove any spaces
  }
});

// Test email
const testEmail = async () => {
  try {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD (with spaces removed):', process.env.EMAIL_PASSWORD.replace(/\s/g, ''));
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'CloudExpense - Email Test',
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you receive this email, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
};

testEmail();
