require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcryptjs'); 
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.id;
    const dir = path.join(UPLOAD_DIR, String(patientId));
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = Date.now() + '_' + file.originalname.replace(/\s+/g,'_');
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// --- Endpoints (Adaptados a PostgreSQL) ---

// Lista de pacientes
app.get('/api/patients', async (req, res) => {
  try {
    // 1. Guardamos el resultado completo en una variable (sin corchetes [])
    const result = await pool.query(
      `SELECT idPaciente AS id, nombre, sexo, rutaImagen, nombreImagen, fechaIngreso
       FROM pacientes ORDER BY nombre`
    );
    
    // 2. Enviamos result.rows (donde Postgres guarda los datos)
    res.json(result.rows); 
    
  } catch (err) {
    console.error(err); // Esto imprimirá el error real en los logs de Render
    res.status(500).json({ error: 'DB error: ' + err.message });
  }
});



// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Faltan credenciales.' });
    }

    try {
        // 1. Buscar al usuario
        const result = await pool.query(
            `SELECT u.id, u.username, u.name, u.password, r.nombreRol, u.id_Rol 
             FROM users u 
             JOIN roles r ON u.id_Rol = r.idRol 
             WHERE u.username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // 2. COMPARACIÓN DIRECTA (Sin encriptación)
        // Si la contraseña en la BD es "123456" y el usuario escribe "123456", entra.
        if (password !== user.password) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }
        
        // 3. Éxito
        const userResponse = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.nombreRol,
            id_Rol: user.id_Rol,
        };

        res.json({ success: true, user: userResponse });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// Chatbot
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Eres un asistente médico útil." },
                { role: "user", content: message }
            ],
        });
        res.json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error OpenAI:', error);
        res.status(500).json({ error: 'Error del asistente.' });
    }
});

// Estudios de un paciente
app.get('/api/patients/:id/studies', async (req, res) => {
  try {
    const pid = req.params.id;
    // CAMBIO: Sintaxis de fecha para Postgres (EXTRACT EPOCH para calcular diferencia en segundos/minutos)
    const result = await pool.query(
      `SELECT idEstudio AS id, nombreEstudio AS nombre, rutaEstudio AS ruta, fechaEstudio,
              EXTRACT(EPOCH FROM (NOW() - fechaEstudio))/60 AS minutosDesde
       FROM estudios WHERE IdPaciente = $1 ORDER BY fechaEstudio DESC`, [pid]
    );
    
    const studies = result.rows.map(r => ({
      ...r,
      canDelete: (r.minutosdesde <= 5) // Postgres suele devolver nombres de columna en minúscula
    }));
    res.json(studies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Subir estudio
app.post('/api/patients/:id/studies', upload.single('file'), async (req, res) => {
  try {
    const pid = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const filename = req.file.filename;
    const relativePath = `${pid}/${filename}`;

    // CAMBIO: Postgres requiere "RETURNING id" para obtener el ID insertado
    const result = await pool.query(
      `INSERT INTO estudios (rutaEstudio, nombreEstudio, IdPaciente, fechaEstudio)
       VALUES ($1, $2, $3, NOW()) RETURNING idEstudio`,
      [relativePath, filename, pid]
    );

    const newId = result.rows[0].idestudio; // Nota: idestudio en minúscula por defecto en pg driver

    res.json({ id: newId, nombre: filename, ruta: relativePath, canDelete: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload error' });
  }
});

// Eliminar estudio
app.delete('/api/studies/:id', async (req, res) => {
  try {
    const sid = req.params.id;
    const result = await pool.query(
      `SELECT idEstudio, rutaEstudio, fechaEstudio,
              EXTRACT(EPOCH FROM (NOW() - fechaEstudio))/60 AS minutosDesde
       FROM estudios WHERE idEstudio = $1`, [sid]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    const row = result.rows[0];
    
    if (row.minutosdesde > 5) return res.status(403).json({ error: 'Tiempo expiró' });

    const filePath = path.join(UPLOAD_DIR, row.rutaestudio); // Ojo con mayúsculas/minúsculas
    try { fs.unlinkSync(filePath); } catch (e) { console.error(e); }

    await pool.query('DELETE FROM estudios WHERE idEstudio = $1', [sid]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));