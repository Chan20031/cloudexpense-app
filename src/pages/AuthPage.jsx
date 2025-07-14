import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { motion } from 'framer-motion';
import Logo from '../assets/images/Logo.png';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, forgotPassword, googleLogin } = useContext(AuthContext);
  
  // Check URL parameter to determine initial mode (default to login)
  const initialMode = searchParams.get('mode') === 'signup' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
  // Password strength requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'At least 1 lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'At least 1 number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'At least 1 special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  ];
  const [capsLock, setCapsLock] = useState({ password: false, confirm: false });

  useEffect(() => {
    const renderGoogleButton = () => {
      if (window.google && document.getElementById('google-signin-button')) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.body.appendChild(script);
    } else {
      renderGoogleButton();
    }
  }, [isLogin, showForgotPassword]);

  const handleGoogleResponse = async (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const result = await googleLogin({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub
      });
      if (result.success) navigate('/dashboard');
      else setMessage({ type: 'error', text: result.message });
    } catch (error) {
      setMessage({ type: 'error', text: 'Google sign-in failed.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      let result;
      if (showForgotPassword) {
        result = await forgotPassword(form.email);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) setShowForgotPassword(false);
      } else if (isLogin) {
        result = await login(form.email, form.password);
        if (result.success) navigate('/dashboard');
        else setMessage({ type: 'error', text: result.message });
      } else {
        // ENFORCE STRONG PASSWORD REQUIREMENTS
        if (!passwordRequirements.every(req => req.test(form.password))) {
          setMessage({ type: 'error', text: 'Password does not meet all requirements.' });
          return;
        }
        if (form.password !== form.confirm) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          return;
        }
        result = await signup(form.name, form.email, form.password);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        if (result.success) setIsLogin(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setMessage({ type: '', text: '' });
    setForm({ name: '', email: '', password: '', confirm: '' });
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setMessage({ type: '', text: '' });
  };

  const backgroundPattern = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wave" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <path d="M0,100 C40,80 60,120 100,100 C140,80 160,120 200,100 L200,200 L0,200 Z" fill="rgba(255,255,255,0.1)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave)" />
    </svg>
  `;

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 font-sans overflow-hidden relative">
      <motion.div
        className="absolute top-4 left-4 flex items-center gap-3 cursor-pointer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onClick={() => navigate('/')}
      >
        <img src={Logo} alt="CloudExpense" className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-md" />
        <span className="text-white text-xl md:text-2xl font-semibold tracking-wide hidden sm:inline">CloudExpense</span>
      </motion.div>

      <motion.div
        className="w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] bg-white shadow-xl overflow-hidden rounded-none md:rounded-2xl flex flex-col md:flex-row"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`w-full md:w-1/2 h-1/3 md:h-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex flex-col items-center justify-center p-6 md:p-10 transition-transform duration-700 ease-in-out ${isLogin ? '' : 'md:translate-x-full'}`}
          style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(backgroundPattern)}")`, backgroundSize: 'cover' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-serif tracking-wide">
              {isLogin ? 'Welcome Back!' : 'Join Us Today!'}
            </h2>
            <p className="text-base md:text-lg mb-6 font-light">
              {isLogin
                ? 'To keep connected with us please login with your personal info'
                : 'Enter your details to start your journey with us'}
            </p>
            <motion.button
              onClick={toggleMode}
              className="border-2 border-white px-6 md:px-10 py-2 md:py-3 rounded-full bg-teal-600 text-white font-semibold hover:bg-white hover:text-teal-600 transition-all duration-300 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin ? 'SIGN UP' : 'SIGN IN'}
            </motion.button>
          </motion.div>
        </div>

        <div className={`w-full md:w-1/2 h-2/3 md:h-full bg-white flex flex-col items-center justify-center p-6 md:p-10 transition-transform duration-700 ease-in-out ${isLogin ? '' : 'md:-translate-x-full'}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-xs"
          >
            <h2 className="text-3xl font-bold text-teal-600 mb-6 text-center">
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
            </h2>

            {message.text && (
              <div className={`p-3 text-sm mb-6 rounded w-full text-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.text}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              {!isLogin && !showForgotPassword && (
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />

              {!showForgotPassword && (
                <>
                  <div className="relative">
                    <input
                      type={showPassword.password ? 'text' : 'password'}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onKeyUp={e => setCapsLock(p => ({ ...p, password: e.getModifierState && e.getModifierState('CapsLock') }))}
                      onKeyDown={e => setCapsLock(p => ({ ...p, password: e.getModifierState && e.getModifierState('CapsLock') }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md pr-10 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                    <span
                      onClick={() => setShowPassword(p => ({ ...p, password: !p.password }))}
                      className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 cursor-pointer"
                    >
                      {showPassword.password ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                    </span>
                  </div>
                  {/* Password requirements for signup */}
                  {!isLogin && (
                    <ul className="text-xs mt-1 mb-2 text-gray-600 space-y-1">
                      {passwordRequirements.map((req, i) => (
                        <li key={i} className={req.test(form.password) ? 'text-green-600' : 'text-gray-400'}>
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Caps lock hint */}
                  {capsLock.password && (
                    <div className="text-xs text-yellow-600 font-medium mb-2">Caps Lock is ON</div>
                  )}
                  {!isLogin && (
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                        onKeyUp={e => setCapsLock(p => ({ ...p, confirm: e.getModifierState && e.getModifierState('CapsLock') }))}
                        onKeyDown={e => setCapsLock(p => ({ ...p, confirm: e.getModifierState && e.getModifierState('CapsLock') }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md pr-10 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                      <span
                        onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 cursor-pointer"
                      >
                        {showPassword.confirm ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                      </span>
                    </div>
                  )}
                  {/* Caps lock hint for confirm password */}
                  {!isLogin && capsLock.confirm && (
                    <div className="text-xs text-yellow-600 font-medium mb-2">Caps Lock is ON</div>
                  )}
                </>
              )}

              <motion.button
                type="submit"
                className="w-full bg-teal-500 text-white font-semibold py-3 rounded-md hover:bg-teal-600 transition shadow hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {showForgotPassword ? 'Send Reset Link' : isLogin ? 'SIGN IN' : 'SIGN UP'}
              </motion.button>
            </form>

            {isLogin && !showForgotPassword && (
              <>
                <div className="mt-4 text-center">
                  <button
                    onClick={toggleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 transition font-medium bg-blue-100 px-4 py-2 rounded-md"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  <div id="google-signin-button" className="mt-4" />
                </div>
              </>
            )}

            {showForgotPassword && (
              <div className="mt-4 text-center">
                <button
                  onClick={toggleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 transition font-medium bg-blue-100 px-4 py-2 rounded-md"
                >
                  Back to login
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
