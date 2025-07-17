/**
 * CloudExpense AI Training Data Scheduler
 * 
 * This script schedules automatic generation of training data for the AI prediction system.
 * It runs the Python training data generator script on a schedule to keep AI training data fresh.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Configuration
const PYTHON_COMMAND = process.platform === 'win32' ? 'python' : 'python3';
const SCRIPT_PATH = path.join(__dirname, 'generate_training_data.py');
const TRAINING_DATA_PATH = path.join(__dirname, 'training_data.json');
const LOG_FILE = path.join(__dirname, 'training_data_generation.log');

// Schedule: Run every day at 3:00 AM
const SCHEDULE = '0 3 * * *'; 

// Function to append to log file
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(logEntry);
  
  // Log to file
  fs.appendFileSync(LOG_FILE, logEntry);
}

// Function to run the training data generator
function generateTrainingData() {
  logMessage('Starting training data generation process...');
  
  const pythonProcess = spawn(PYTHON_COMMAND, [SCRIPT_PATH]);
  
  let output = '';
  let errorOutput = '';
  
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    if (code === 0) {
      // Check if training data was generated
      try {
        const stats = fs.statSync(TRAINING_DATA_PATH);
        const fileSizeKb = Math.round(stats.size / 1024);
        logMessage(`Training data generated successfully (${fileSizeKb}KB)`);
        
        // Check data contents
        const trainingData = JSON.parse(fs.readFileSync(TRAINING_DATA_PATH, 'utf8'));
        logMessage(`Generated ${trainingData.length} training records`);
      } catch (error) {
        logMessage(`Error verifying training data: ${error.message}`);
      }
    } else {
      logMessage(`Training data generation failed with code ${code}`);
      logMessage(`Error output: ${errorOutput}`);
    }
  });
}

// Run immediately on startup
logMessage('AI Training Data Scheduler started');
generateTrainingData();

// Schedule regular runs
cron.schedule(SCHEDULE, generateTrainingData);
logMessage(`Training data generation scheduled: ${SCHEDULE}`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  logMessage('AI Training Data Scheduler shutting down');
  process.exit(0);
});

module.exports = {
  generateTrainingData
};
