import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/images/Logo.png';

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80 },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const handleLoginClick = () => setShowLoginModal(true);
  const handleCloseModal = () => setShowLoginModal(false);
  const handleNavigateToAuth = () => navigate('/auth');
  const handleNavigateToSignup = () => navigate('/auth?mode=signup');

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            className="flex items-center select-none"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={Logo} alt="CloudExpense Logo" className="h-10 w-10 mr-2" />
            <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">CloudExpense</h1>
          </motion.div>
          <button
            onClick={handleLoginClick}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-4 py-16 md:py-24 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-6"
          variants={itemVariants}
        >
          Manage Your Finances <span className="text-teal-500">Effortlessly</span>
        </motion.h1>
        <motion.p
          className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          Track expenses, set budgets, and gain insights into your spending habits with our intuitive cloud-based expense tracker.
        </motion.p>
        <motion.div variants={itemVariants}>
          <button
            onClick={handleLoginClick}
            className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started Now
          </button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="container mx-auto px-4 py-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg my-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Expense Tracking',
              desc: 'Easily log and categorize your expenses with our intuitive interface.',
              iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            },
            {
              title: 'Budget Management',
              desc: 'Set and track budgets for different categories to keep your spending in check.',
              iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            },
            {
              title: 'Insightful Reports',
              desc: 'Gain valuable insights with detailed reports and visualizations of your spending patterns.',
              iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            },
          ].map((f, idx) => (
            <motion.div
              key={f.title}
              className="bg-teal-50 dark:bg-gray-700 p-6 rounded-lg shadow-md"
              whileHover={{ scale: 1.05 }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={sectionVariants}
              transition={{ delay: idx * 0.2 }}
            >
              <div className="bg-teal-100 dark:bg-teal-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.iconPath} />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="container mx-auto px-4 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              quote: "CloudExpense has completely transformed how I manage my finances. The intuitive interface makes tracking expenses a breeze!",
              name: "Sarah Johnson",
            },
            {
              quote: "The budget tracking feature has helped me save more money than I ever thought possible. Highly recommended!",
              name: "Michael Chen",
            },
            {
              quote: "The reports and insights have given me a clear picture of my spending habits. Now I know exactly where my money goes!",
              name: "Emily Rodriguez",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 + 0.6 }}
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">"{t.quote}"</p>
              <p className="font-semibold">{t.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        className="container mx-auto px-4 py-16 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <h2 className="text-3xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
        <button
          onClick={handleLoginClick}
          className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Get Started Now
        </button>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} CloudExpense. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Login to CloudExpense</h3>
              <button
                onClick={handleCloseModal}
                className="bg-red-500 rounded-full p-1 text-black hover:bg-red-600 transition-colors duration-300"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleNavigateToAuth}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg mb-4 transition-colors duration-300"
            >
              Continue to Login
            </button>
            <button
              onClick={handleNavigateToSignup}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-3 rounded-lg transition-colors duration-300"
            >
              Create an Account
            </button>
          </motion.div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          ↑
        </motion.button>
      )}
    </div>
  );
}