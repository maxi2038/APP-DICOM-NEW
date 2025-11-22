require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcryptjs'); 


const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.id;
    const dir = path.join(UPLOAD_DIR, String(patientId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '_' + file.originalname.replace(/\s+/g,'_');
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// --- Endpoints ---

// Lista de pacientes
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT idPaciente AS id, nombre, sexo, rutaImagen, nombreImagen, fechaIngreso
       FROM pacientes ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});
// ===================================
// Endpoints de Autenticación
// ===================================
app.post('/api/login', async (req, res) => {
    // 1. Obtener credenciales del cuerpo de la solicitud (JSON)
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Faltan credenciales.' });
    }

    try {
        // 2. Buscar el usuario y su rol en la base de datos
        const [rows] = await pool.query(
            // La columna 'password' debe estar incluida para la verificación
            `SELECT u.id, u.username, u.name, u.password, r.nombreRol, u.id_Rol 
             FROM users u 
             JOIN roles r ON u.id_Rol = r.idRol 
             WHERE u.username = ?`,
            [username]
        );

        const user = rows[0];

        if (!user) {
            // Usuario no encontrado
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }

        // 3. Verificar la contraseña hasheada (bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Contraseña incorrecta
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }
        
        // 4. Autenticación exitosa
        // Creamos un objeto de respuesta sin la contraseña hasheada
        const userResponse = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.nombreRol, // Ej: "Doctor" o "Administrador"
            id_Rol: user.id_Rol,
        };

        res.json({ success: true, user: userResponse });

    } catch (error) {
        console.error('Error en el endpoint /api/login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
// Estudios de un paciente
app.get('/api/patients/:id/studies', async (req, res) => {
  try {
    const pid = req.params.id;
    const [rows] = await pool.query(
      `SELECT idEstudio AS id, nombreEstudio AS nombre, rutaEstudio AS ruta, fechaEstudio,
              TIMESTAMPDIFF(MINUTE, fechaEstudio, NOW()) AS minutosDesde
       FROM estudios WHERE IdPaciente = ? ORDER BY fechaEstudio DESC`, [pid]
    );
    const studies = rows.map(r => ({
      ...r,
      canDelete: (r.minutosDesde <= 5)
    }));
    res.json(studies);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Subir estudio
app.post('/api/patients/:id/studies', upload.single('file'), async (req, res) => {
  try {
    const pid = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filename = req.file.filename;
    const relativePath = path.relative(process.cwd(), req.file.path);

    const [result] = await pool.query(
      `INSERT INTO estudios (rutaEstudio, nombreEstudio, IdPaciente, fechaEstudio)
       VALUES (?, ?, ?, NOW())`,
      [relativePath.replace(/\\/g, '/'), filename, pid]
    );

    res.json({ id: result.insertId, nombre: filename, ruta: relativePath, canDelete: true });
  } catch (err) {
    res.status(500).json({ error: 'Upload error' });
  }
});

// Eliminar estudio (sólo si <= 5 min)
app.delete('/api/studies/:id', async (req, res) => {
  try {
    const sid = req.params.id;
    const [rows] = await pool.query(
      `SELECT idEstudio, rutaEstudio, fechaEstudio,
              TIMESTAMPDIFF(MINUTE, fechaEstudio, NOW()) AS minutosDesde
       FROM estudios WHERE idEstudio = ?`, [sid]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    const row = rows[0];
    if (row.minutosDesde > 5) return res.status(403).json({ error: 'Tiempo expiró' });

    const filePath = path.resolve(process.cwd(), row.rutaEstudio);
    try { fs.unlinkSync(filePath); } catch (e) {}

    await pool.query('DELETE FROM estudios WHERE idEstudio = ?', [sid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
