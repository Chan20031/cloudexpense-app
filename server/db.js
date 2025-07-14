const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to the AWS RDS PostgreSQL database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS public access (safe for dev)
  },
  connectionTimeoutMillis: 30000, // Back to 30 seconds for reliability
  idleTimeoutMillis: 30000,
  max: 10, // Reduced to avoid overwhelming micro instance
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000
});

// Simple connection test
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('✅ Database connection successful:', res.rows[0]);
  }
});

// Set timezone to Malaysia (Asia/Kuala_Lumpur) for all connections
pool.on('connect', (client) => {
  client.query("SET timezone = 'Asia/Kuala_Lumpur'");
  client.query("SET datestyle = 'ISO, MDY'");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
