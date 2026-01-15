require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db'); // Ahora usa mysql2
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuración Multer (Igual que antes) ---
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.id;
    const dir = path.join(UPLOAD_DIR, String(patientId));
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({ storage: storage });

// --- ENDPOINTS (Adaptados a MySQL) ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Faltan credenciales.' });

    try {
        // MySQL usa ? en lugar de $1
        const [rows] = await pool.query(
            `SELECT u.id, u.username, u.name, u.password, r.nombreRol, u.id_Rol
             FROM users u
             JOIN roles r ON u.id_Rol = r.idRol
             WHERE u.username = ?`,
            [username]
        );

        if (rows.length === 0) return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        
        const user = rows[0];

        // Compatibilidad de contraseñas viejas
        let dbPassword = user.password;
        if (dbPassword.startsWith('$2y$')) dbPassword = dbPassword.replace('$2y$', '$2a$');

        const isMatch = await bcrypt.compare(password, dbPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });

        res.json({ success: true, user: { id: user.id, username: user.username, name: user.name, role: user.nombreRol, id_Rol: user.id_Rol } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// Pacientes
app.get('/api/patients', async (req, res) => {
  try {
    // MySQL no necesita comillas en las columnas generalmente
    const [rows] = await pool.query('SELECT idPaciente as id, nombre, sexo, rutaImagen, nombreImagen, fechaIngreso FROM pacientes ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Estudios
app.get('/api/patients/:id/studies', async (req, res) => {
  try {
    // TIMESTAMPDIFF es la funcion de MySQL para fechas
    const [rows] = await pool.query(
      `SELECT idEstudio as id, nombreEstudio as nombre, rutaEstudio as ruta, fechaEstudio,
              TIMESTAMPDIFF(MINUTE, fechaEstudio, NOW()) as minutosDesde
       FROM estudios WHERE IdPaciente = ? ORDER BY fechaEstudio DESC`,
      [req.params.id]
    );
    const studies = rows.map(r => ({ ...r, canDelete: r.minutosDesde <= 5 }));
    res.json(studies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Subir Estudio
app.post('/api/patients/:id/studies', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const pid = req.params.id;
    const filename = req.file.filename;
    const relativePath = `uploads/${pid}/${filename}`;

    const [result] = await pool.query(
      'INSERT INTO estudios (rutaEstudio, nombreEstudio, IdPaciente, fechaEstudio) VALUES (?, ?, ?, NOW())',
      [relativePath, filename, pid]
    );

    res.status(201).json({ id: result.insertId, nombre: filename, ruta: relativePath, canDelete: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload error' });
  }
});

// Eliminar Estudio
app.delete('/api/studies/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT idEstudio, rutaEstudio, fechaEstudio, TIMESTAMPDIFF(MINUTE, fechaEstudio, NOW()) as minutosDesde FROM estudios WHERE idEstudio = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        
        const study = rows[0];
        if (study.minutosDesde > 5) return res.status(403).json({ error: 'Tiempo expirado' });

        const filePath = path.join(UPLOAD_DIR, study.rutaEstudio.replace('uploads/', ''));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await pool.query('DELETE FROM estudios WHERE idEstudio = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`API MySQL corriendo en ${PORT}`));