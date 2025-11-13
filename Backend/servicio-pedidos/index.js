const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3005;

// ============================================
// CONEXIÓN A NEON
// ============================================
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Evitar caché
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
});

// ============================================
// TEST DE CONEXIÓN
// ============================================
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Conexión exitosa a la base de datos',
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Error de conexión a la BD:', error);
    res.status(500).json({
      success: false,
      error: 'Error de conexión a la base de datos: ' + error.message
    });
  }
});

// ============================================
// RUTAS DE INVENTARIO
// ============================================

app.get('/api/inventario', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, p.descripcion AS producto_desc, b.codigo AS bodega_codigo
      FROM inventario_ms.inventario i
      LEFT JOIN inventario_ms.producto p ON i.id_producto = p.id_producto
      LEFT JOIN inventario_ms.bodega b ON i.id_bodega = b.id_bodega
      ORDER BY i.id_inventario DESC
    `);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_producto, descripcion FROM inventario_ms.producto ORDER BY descripcion');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bodegas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_bodega, codigo FROM inventario_ms.bodega ORDER BY codigo');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RUTAS DE PEDIDOS
// ============================================

app.get('/api/test-pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pr.nombre AS proveedor_nombre, prod.descripcion AS producto_desc
      FROM pedidos_ms.pedido p
      LEFT JOIN public.proveedor pr ON p.cedula = pr.cedula
      LEFT JOIN inventario_ms.producto prod ON p.id_producto = prod.id_producto
      LIMIT 5
    `);
    res.json({
      success: true,
      message: 'Tabla de pedidos accesible',
      pedidos: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al acceder a pedidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pr.nombre AS proveedor_nombre, prod.descripcion AS producto_desc
      FROM pedidos_ms.pedido p
      LEFT JOIN public.proveedor pr ON p.cedula = pr.cedula
      LEFT JOIN inventario_ms.producto prod ON p.id_producto = prod.id_producto
      ORDER BY p.id_pedido DESC
    `);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener proveedores (para dropdown)
app.get('/api/proveedores', async (req, res) => {
  try {
    const result = await pool.query('SELECT cedula, nombre FROM public.proveedor WHERE activo = true ORDER BY nombre');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones } = req.body;
    if (!cedula || !id_producto || !fecha_entrega || !cantidad) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    const result = await pool.query(
      `INSERT INTO pedidos_ms.pedido 
        (cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [cedula, id_producto, fecha_entrega, cantidad, peso_total || null, observaciones || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    if (error.code === '23503') {
      res.status(400).json({ success: false, error: 'El proveedor o producto no existe' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Actualizar pedido
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones, recibido } = req.body;

    const result = await pool.query(
      `UPDATE pedidos_ms.pedido 
       SET cedula=$1, id_producto=$2, fecha_entrega=$3, cantidad=$4, peso_total=$5, observaciones=$6, recibido=$7
       WHERE id_pedido=$8 RETURNING *`,
      [cedula, id_producto, fecha_entrega, cantidad, peso_total || null, observaciones || null, recibido || false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pedidos_ms.pedido WHERE id_pedido=$1', [id]);
    res.json({ success: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FRONTEND
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pedidos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pedidos.html'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ============================================
// SERVIDOR
// ============================================
app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📊 Inventario: http://localhost:${port}/`);
  console.log(`📦 Pedidos: http://localhost:${port}/pedidos`);
  console.log(`🔍 Test: http://localhost:${port}/api/test`);
});
