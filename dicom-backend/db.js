const { Pool } = require('pg');
require('dotenv').config();

// Render proporciona una 'Internal Database URL' o 'External Database URL'
// Usualmente se guarda en una variable llamada DATABASE_URL o se construye con los datos
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false // Necesario para Render
  }
});

module.exports = pool;