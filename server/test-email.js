require('dotenv').config();
const db = require('./db');

const testUser = async () => {
  try {
    const result = await db.query('SELECT id, email, name, is_verified FROM users WHERE email = $1', ['zixue4399@gmail.com']);
    console.log('User found:', result.rows);
    
    if (result.rows.length > 0) {
      console.log('User exists, testing password reset...');
      
      // Test password reset
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const testEmail = {
        to: 'zixue4399@gmail.com',
        from: {
          email: process.env.FROM_EMAIL || 'noreply@cloudexpense.com',
          name: process.env.FROM_NAME || 'CloudExpense'
        },
        subject: 'SendGrid Test - CloudExpense',
        html: `
          <h1>SendGrid Test Email</h1>
          <p>This is a test email to verify SendGrid integration is working correctly.</p>
          <p>If you receive this email, the SendGrid configuration is successful!</p>
          <p>Time: ${new Date().toISOString()}</p>
        `
      };
      
      try {
        const result = await sgMail.send(testEmail);
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', result[0].headers['x-message-id']);
      } catch (emailError) {
        console.error('❌ Test email failed:', emailError);
        if (emailError.response) {
          console.error('SendGrid error details:', emailError.response.body);
        }
      }
    } else {
      console.log('User not found in database');
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    process.exit(0);
  }
};

testUser();
