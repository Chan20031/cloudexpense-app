require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email configuration with detailed debugging
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD.replace(/\s/g, '')
  },
  debug: true, // Enable debug output
  logger: true // Enable logging
});

const debugEmail = async () => {
  try {
    console.log('=== EMAIL DEBUG TEST ===');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD.length);
    console.log('EMAIL_PASSWORD (cleaned):', process.env.EMAIL_PASSWORD.replace(/\s/g, ''));
    
    // Test 1: Verify transporter
    console.log('\n1. Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully');
    
    // Test 2: Send to same email (your Gmail)
    console.log('\n2. Sending test email to same account...');
    const info1 = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'CloudExpense - Self Test',
      html: `
        <h1>Self Email Test</h1>
        <p>This is a test email sent from CloudExpense to the same Gmail account.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    console.log('✅ Self email sent successfully!');
    console.log('Message ID:', info1.messageId);
    
    // Test 3: Send to a different email (if you have one)
    console.log('\n3. Sending test email to different account...');
    const info2 = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'test@example.com', // This will fail but we can see the error
      subject: 'CloudExpense - External Test',
      html: `
        <h1>External Email Test</h1>
        <p>This is a test email sent to an external address.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    console.log('✅ External email sent successfully!');
    console.log('Message ID:', info2.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    console.error('Error responseCode:', error.responseCode);
    console.error('Full error:', error);
  }
};

debugEmail();
