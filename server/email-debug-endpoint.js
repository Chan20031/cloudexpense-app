// Simple email test endpoint for production debugging
app.post('/api/debug/test-email', async (req, res) => {
  try {
    console.log('=== PRODUCTION EMAIL DEBUG ===');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'undefined');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    
    // Test transporter verification
    await transporter.verify();
    console.log('✅ Transporter verified in production');
    
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'CloudExpense Production Email Test',
      html: `
        <h1>Production Email Test</h1>
        <p>This email was sent from the production App Runner environment.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>Server IP: Request from production</p>
      `
    });
    
    console.log('✅ Production email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    res.json({
      success: true,
      message: 'Email sent successfully from production',
      messageId: info.messageId,
      response: info.response
    });
    
  } catch (error) {
    console.error('❌ Production email failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.response || 'No additional details'
    });
  }
});
