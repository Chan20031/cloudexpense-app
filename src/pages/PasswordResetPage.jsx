import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const PasswordResetPage = () => {
  const [status, setStatus] = useState('initial');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  const [capsLock, setCapsLock] = useState({ password: false, confirm: false });
  const location = useLocation();
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'At least 1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'At least 1 number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'At least 1 special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resetToken = params.get('token');

    if (!resetToken) {
      setStatus('error');
      setMessage('Invalid password reset link. Please request a new password reset link.');
    } else {
      setToken(resetToken);
      setStatus('reset');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    setStatus('submitting');
    setMessage('Resetting your password...');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset successful. You can now log in with your new password.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reset password. Please try again or request a new reset link.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus('error');
      setMessage('An error occurred during password reset. Please try again later.');
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600">
      <div className="w-full max-w-xl bg-white p-10 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {status === 'initial' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        )}

        {status === 'reset' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {message && <div className="bg-red-100 text-red-700 p-3 rounded text-sm text-center">{message}</div>}

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                id="password"
                type={showPassword.password ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={e => setCapsLock(p => ({ ...p, password: e.getModifierState && e.getModifierState('CapsLock') }))}
                onKeyDown={e => setCapsLock(p => ({ ...p, password: e.getModifierState && e.getModifierState('CapsLock') }))}
                className="w-full px-4 py-2 border rounded-md pr-10"
                required
              />
              <span
                onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 cursor-pointer"
              >
                {showPassword.password ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </span>
            </div>
            <ul className="text-xs mt-1 mb-2 text-gray-600 space-y-1">
              {passwordRequirements.map((req, i) => (
                <li key={i} className={req.test(password) ? 'text-green-600' : 'text-gray-400'}>
                  {req.label}
                </li>
              ))}
            </ul>
            {capsLock.password && (
              <div className="text-xs text-yellow-600 font-medium mb-2">Caps Lock is ON</div>
            )}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                id="confirmPassword"
                type={showPassword.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyUp={e => setCapsLock(p => ({ ...p, confirm: e.getModifierState && e.getModifierState('CapsLock') }))}
                onKeyDown={e => setCapsLock(p => ({ ...p, confirm: e.getModifierState && e.getModifierState('CapsLock') }))}
                className="w-full px-4 py-2 border rounded-md pr-10"
                required
              />
              <span
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 cursor-pointer"
              >
                {showPassword.confirm ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </span>
            </div>
            {capsLock.confirm && (
              <div className="text-xs text-yellow-600 font-medium mb-2">Caps Lock is ON</div>
            )}
            <button
              type="submit"
              className="w-full bg-teal-500 text-white font-semibold py-2 rounded hover:bg-teal-600 transition"
            >
              Reset Password
            </button>
          </form>
        )}

        {status === 'submitting' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p>{message}</p>
            </div>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-teal-500 text-white font-semibold py-2 rounded hover:bg-teal-600 transition"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p>{message}</p>
            </div>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-teal-500 text-white font-semibold py-2 rounded hover:bg-teal-600 transition"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetPage;
