const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const cors = require('cors'); // 1. Importa el paquete

const app = express();
const port = process.env.PORT || 3001;
app.use(cors());

// ============================================
// CONFIGURACIÓN DE CONEXIÓN A POSTGRES (NEON)
// ============================================
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Habilitar CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Prevenir cache
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// ============================================
// RUTAS PARA INVENTARIO (USANDO inventario_ms)
// ============================================

// ✅ Test conexión general
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ success: true, message: 'Conexión exitosa a la base de datos', time: result.rows[0].current_time });
  } catch (error) {
    console.error('Error de conexión a la BD:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Test tabla inventario
app.get('/api/test-inventario', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.descripcion AS producto_desc, b.codigo AS bodega_codigo
      FROM inventario_ms.inventario i
      LEFT JOIN inventario_ms.producto p ON i.id_producto = p.id_producto
      LEFT JOIN inventario_ms.bodega b ON i.id_bodega = b.id_bodega
      LIMIT 5;
    `);
    res.json({ success: true, message: 'Inventario accesible', inventario: result.rows });
  } catch (error) {
    console.error('Error al acceder a inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Obtener todo el inventario
app.get('/api/inventario', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.descripcion AS producto_desc, b.codigo AS bodega_codigo
      FROM inventario_ms.inventario i
      LEFT JOIN inventario_ms.producto p ON i.id_producto = p.id_producto
      LEFT JOIN inventario_ms.bodega b ON i.id_bodega = b.id_bodega
      ORDER BY i.id_inventario DESC;
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Productos (dropdown)
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_producto, descripcion FROM inventario_ms.producto ORDER BY descripcion;');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Bodegas (dropdown)
app.get('/api/bodegas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_bodega, codigo FROM inventario_ms.bodega ORDER BY codigo;');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener bodegas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Obtener un inventario por ID
app.get('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT i.*, p.descripcion AS producto_desc, b.codigo AS bodega_codigo
      FROM inventario_ms.inventario i
      LEFT JOIN inventario_ms.producto p ON i.id_producto = p.id_producto
      LEFT JOIN inventario_ms.bodega b ON i.id_bodega = b.id_bodega
      WHERE i.id_inventario = $1;
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Crear inventario
app.post('/api/inventario', async (req, res) => {
  try {
    const { id_producto, id_bodega, fecha_entrada, fecha_salida, humedad, fermentacion } = req.body;
    if (!id_producto || !id_bodega || !humedad || !fermentacion)
      return res.status(400).json({ success: false, error: 'Campos obligatorios faltantes' });

    const result = await pool.query(`
      INSERT INTO inventario_ms.inventario 
      (id_producto, id_bodega, fecha_entrada, fecha_salida, humedad, fermentacion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [id_producto, id_bodega, fecha_entrada || null, fecha_salida || null, humedad, fermentacion]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al crear inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Actualizar inventario
app.put('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_producto, id_bodega, fecha_entrada, fecha_salida, humedad, fermentacion } = req.body;

    const result = await pool.query(`
      UPDATE inventario_ms.inventario
      SET id_producto=$1, id_bodega=$2, fecha_entrada=$3, fecha_salida=$4, 
          humedad=$5, fermentacion=$6
      WHERE id_inventario=$7 RETURNING *;
    `, [id_producto, id_bodega, fecha_entrada || null, fecha_salida || null, humedad, fermentacion, id]);

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'No encontrado' });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Eliminar inventario
app.delete('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inventario_ms.inventario WHERE id_inventario=$1 RETURNING *;', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'No encontrado' });
    res.json({ success: true, message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Buscar
app.get('/api/inventario/buscar/:termino', async (req, res) => {
  try {
    const { termino } = req.params;
    const result = await pool.query(`
      SELECT i.*, p.descripcion AS producto_desc, b.codigo AS bodega_codigo
      FROM inventario_ms.inventario i
      LEFT JOIN inventario_ms.producto p ON i.id_producto = p.id_producto
      LEFT JOIN inventario_ms.bodega b ON i.id_bodega = b.id_bodega
      WHERE i.id_inventario::text ILIKE $1
         OR p.descripcion ILIKE $1
         OR b.codigo ILIKE $1
         OR i.humedad::text ILIKE $1
         OR i.fermentacion::text ILIKE $1
      ORDER BY i.id_inventario DESC;
    `, [`%${termino}%`]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor de Inventario en http://localhost:${port}`);
  console.log(`📊 Test conexión: http://localhost:${port}/api/test`);
  console.log(`📦 Test inventario: http://localhost:${port}/api/test-inventario`);
});
