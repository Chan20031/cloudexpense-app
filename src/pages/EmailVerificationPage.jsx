import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const EmailVerificationPage = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'alreadyVerified'
  const [message, setMessage] = useState('Verifying your email...');
  const location = useLocation();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple verification attempts
      if (verificationAttempted.current) {
        console.log('Verification already attempted, skipping...');
        return;
      }
      
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (!token) {
          setStatus('error');
          setMessage('Invalid or missing verification link.');
          return;
        }
        
        console.log('Starting email verification with token:', token.substring(0, 10) + '...');
        verificationAttempted.current = true; // Mark as attempting verification
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        console.log('Verification response:', { status: response.status, data });
        
        if (response.ok) {
          // Check for already verified message
          if (data.message && data.message.toLowerCase().includes('already verified')) {
            setStatus('alreadyVerified');
            setMessage('Your email is already verified. You can log in.');
          } else {
            setStatus('success');
            setMessage(data.message || 'Email verified successfully! You can now log in.');
          }
        } else {
          // Check if it's a rate limiting error
          if (data.code === 'RATE_LIMITED') {
            setStatus('error');
            setMessage('Please wait a moment before trying again.');
          }
          // Check if it's a "already used" token error
          else if (data.code === 'TOKEN_ALREADY_USED') {
            setStatus('alreadyVerified');
            setMessage('This verification link has already been used. If you recently verified your email, you can now log in to your account.');
          } else if (data.message && data.message.toLowerCase().includes('already')) {
            setStatus('alreadyVerified');
            setMessage('Your email is already verified. You can log in.');
          } else {
            setStatus('error');
            setMessage(data.message || 'Invalid or expired verification link.');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Invalid or expired verification link.');
      }
    };
    
    verifyEmail();
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center">
        <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center w-full">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 w-full flex flex-col items-center">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-center">{message}</p>
            </div>
            <a 
              href="/auth" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors mt-2"
            >
              Go to Login
            </a>
          </div>
        )}
        {status === 'alreadyVerified' && (
          <div className="flex flex-col items-center w-full">
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 w-full flex flex-col items-center">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
              </svg>
              <p className="text-center">{message}</p>
            </div>
            <a 
              href="/auth" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors mt-2"
            >
              Go to Login
            </a>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center w-full">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 w-full flex flex-col items-center">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-center">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
