const express = require('express');
const mysql = require('mysql');
const app = express();

// MySQL configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'habits'
});

// Connect to MySQL
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Configure Express to parse JSON requests
app.use(express.json());

// Define API endpoints

// TODO: Define your API endpoints for creating/modifying/deleting habits, marking habits as complete, resetting habit status, and compiling statistics.

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});