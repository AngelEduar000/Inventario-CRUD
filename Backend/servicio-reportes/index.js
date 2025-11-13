// index.js - servicio-reportes (consultas totalmente calificadas por schema)
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3006;

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

/**
 * safeCount: ejecuta una consulta COUNT y devuelve el número (0 en caso de error).
 * queryText debe devolver una fila con "total".
 */
async function safeCount(queryText, params = []) {
  try {
    const r = await pool.query(queryText, params);
    // normalizar a número
    const val = r?.rows?.[0]?.total;
    return typeof val === 'string' ? parseInt(val, 10) || 0 : (val || 0);
  } catch (err) {
    console.warn(`safeCount fallo para query: ${queryText} -> ${err.message}`);
    return 0;
  }
}

app.get('/api/test', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    console.error('Error test DB:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Dashboard stats usando tablas con schema explícito:
 * - productos: inventario_ms.producto
 * - pedidos:    pedidos_ms.pedido
 * - proveedores: pedidos_ms.proveedor
 * - bodegas: inventario_ms.bodega
 */
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    console.log('📊 solicitando dashboard-stats');

    // Conteos (consultas completamente calificadas)
    const totalProductos = await safeCount('SELECT COUNT(*)::int AS total FROM inventario_ms.producto');
    // Pedidos activos: asumimos "activo" = no recibido => recibido = false
    const totalPedidosActivos = await safeCount(
      "SELECT COUNT(*)::int AS total FROM pedidos_ms.pedido WHERE recibido = false"
    );

    const totalPedidos = await safeCount('SELECT COUNT(*)::int AS total FROM pedidos_ms.pedido');
    const pedidosCumplidos = await safeCount(
      'SELECT COUNT(*)::int AS total FROM pedidos_ms.pedido WHERE recibido = true'
    );

    const totalProveedores = await safeCount('SELECT COUNT(*)::int AS total FROM pedidos_ms.proveedor');
    const totalBodegas = await safeCount('SELECT COUNT(*)::int AS total FROM inventario_ms.bodega');

    const porcentajeEntregasCumplidas = totalPedidos > 0
      ? parseFloat(((pedidosCumplidos / totalPedidos) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        totalProductos: Number(totalProductos),
        totalPedidosActivos: Number(totalPedidosActivos),
        totalProveedores: Number(totalProveedores),
        totalBodegas: Number(totalBodegas),
        porcentajeEntregasCumplidas
      }
    });
  } catch (error) {
    console.error('❌ Error al calcular dashboard-stats:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas', detalle: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor de reportes ejecutándose en http://localhost:${port}`);
  console.log(`🔍 Prueba: http://localhost:${port}/api/test`);
  console.log(`📊 Dashboard: http://localhost:${port}/api/dashboard-stats`);
});
