require('dotenv').config();
const mysql = require('mysql2/promise');

// 1. Verificamos que las variables existan para evitar errores silenciosos
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASS) {
  console.error("❌ ERROR: Faltan variables de entorno para la Base de Datos.");
} else {
  console.log("✅ Configurando conexión a MySQL en AWS...");
}

// 2. Creamos el pool usando las variables individuales
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // 'dicom-db-sql...'
  user: process.env.DB_USER,      // 'admin'
  password: process.env.DB_PASS,  // Tu contraseña
  database: process.env.DB_NAME,  // 'dicom_system'
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;