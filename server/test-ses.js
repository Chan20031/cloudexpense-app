require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== SES EMAIL TEST ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('SES_SMTP_USERNAME:', process.env.SES_SMTP_USERNAME);
console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION);

// Use the same logic as the main server
const isProduction = process.env.NODE_ENV === 'production';

const transporter = nodemailer.createTransport({
  host: isProduction 
    ? `email-smtp.${process.env.AWS_SES_REGION || 'us-east-1'}.amazonaws.com`
    : 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: isProduction 
      ? process.env.SES_SMTP_USERNAME 
      : process.env.EMAIL_USER,
    pass: isProduction 
      ? process.env.SES_SMTP_PASSWORD 
      : (process.env.EMAIL_PASSWORD || 'your-email-password').replace(/\s/g, '')
  },
  tls: {
    rejectUnauthorized: false
  }
});

const getEmailSender = () => {
  return isProduction 
    ? process.env.EMAIL_USER || 'noreply@cloudexpense.com'
    : process.env.EMAIL_USER || 'your-email@gmail.com';
};

const testSESEmail = async () => {
  try {
    console.log('\n=== TESTING SES CONFIGURATION ===');
    console.log('Using:', isProduction ? 'AWS SES' : 'Gmail SMTP');
    console.log('Host:', isProduction ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` : 'smtp.gmail.com');
    console.log('Username:', isProduction ? process.env.SES_SMTP_USERNAME : process.env.EMAIL_USER);
    console.log('From address:', getEmailSender());
    
    // Test transporter verification
    console.log('\n1. Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully');
    
    // Test email sending
    console.log('\n2. Sending test email...');
    const info = await transporter.sendMail({
      from: getEmailSender(),
      to: process.env.EMAIL_USER,
      subject: `CloudExpense SES Test - ${isProduction ? 'Production (SES)' : 'Development (Gmail)'}`,
      html: `
        <h1>SES Email Test</h1>
        <p>This email was sent using ${isProduction ? 'AWS SES' : 'Gmail SMTP'}.</p>
        <p>Configuration:</p>
        <ul>
          <li>Environment: ${isProduction ? 'Production' : 'Development'}</li>
          <li>Host: ${isProduction ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` : 'smtp.gmail.com'}</li>
          <li>From: ${getEmailSender()}</li>
          <li>Test time: ${new Date().toISOString()}</li>
        </ul>
        <p>If you receive this email, the SES configuration is working correctly!</p>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n🎉 SES test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ SES test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    console.error('Full error:', error);
  }
};

testSESEmail();
