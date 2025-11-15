const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3005;

// ============================================
// CONEXIÓN A POSTGRES / NEON
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// 🔥 MUY IMPORTANTE: Forzamos el search_path
pool.query(`SET search_path TO pedidos_ms, inventario_ms, public;`)
  .then(() => console.log("🔧 search_path configurado correctamente"))
  .catch(err => console.error("❌ Error configurando search_path:", err.message));


// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Evitar caché
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});


// ============================================
// GET → Obtener todos los pedidos
// ============================================
const getPedidosHandler = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_pedido, p.cedula, p.id_producto, p.fecha_entrega, p.cantidad,
        p.peso_total, p.observaciones, p.recibido,
        pr.nombre AS proveedor_nombre,
        prod.descripcion AS producto_desc
      FROM pedido p
      LEFT JOIN proveedor pr ON p.cedula = pr.cedula
      LEFT JOIN inventario_ms.producto prod ON p.id_producto = prod.id_producto
      ORDER BY p.id_pedido DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ Error GET /api/pedidos:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};


// ============================================
// POST → Crear un pedido
// ============================================
const createPedidoHandler = async (req, res) => {
  try {
    const { cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones } = req.body;

    if (!cedula || !id_producto || !fecha_entrega || !cantidad) {
      return res.status(400).json({
        success: false,
        error: 'Cédula, Producto, Fecha de entrega y Cantidad son obligatorios.'
      });
    }

    // ⚠️ NO se envía id_pedido → lo genera el trigger
    const result = await pool.query(
      `INSERT INTO pedido 
        (cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones, recibido)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [cedula, id_producto, fecha_entrega, cantidad, peso_total || null, observaciones || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (e) {
    console.error("❌ Error POST /api/pedidos:", e.message);

    if (e.code === '23503')
      return res.status(400).json({ success: false, error: 'Proveedor o Producto no existen.' });

    res.status(500).json({ success: false, error: e.message });
  }
};


// ============================================
// PUT → Actualizar
// ============================================
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, id_producto, fecha_entrega, cantidad, peso_total, observaciones, recibido } = req.body;

    const result = await pool.query(
      `UPDATE pedido SET 
        cedula=$1, id_producto=$2, fecha_entrega=$3, cantidad=$4,
        peso_total=$5, observaciones=$6, recibido=$7
       WHERE id_pedido=$8 RETURNING *`,
      [cedula, id_producto, fecha_entrega, cantidad, peso_total || null,
      observaciones || null, recibido || false, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });

    res.json({ success: true, data: result.rows[0] });

  } catch (e) {
    console.error("❌ Error PUT:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// DELETE
// ============================================
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM pedido WHERE id_pedido=$1 RETURNING *', [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });

    res.json({ success: true, message: 'Pedido eliminado correctamente.' });

  } catch (e) {
    console.error("❌ Error DELETE:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});


// ============================================
// RUTA DE TEST REAL
// ============================================
app.get('/api/pedidos/test', async (req, res) => {
  try {
    await pool.query('SELECT 1 FROM pedido LIMIT 1');
    res.json({ success: true, message: 'Servicio OK y tabla pedido accesible.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ============================================
// RUTA PRINCIPAL
// ============================================
app.get('/api/pedidos', getPedidosHandler);
app.post('/api/pedidos', createPedidoHandler);


// ============================================
// RUTA 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.originalUrl}` });
});


// ============================================
// SERVIDOR
// ============================================
app.listen(port, () => {
  console.log(`🚀 PEDIDOS corriendo http://localhost:${port}`);
});
