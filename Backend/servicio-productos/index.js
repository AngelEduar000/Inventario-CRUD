const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3004;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --------------------
// Configuración de la base de datos
// --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// --------------------
// Probar conexión a la base de datos
// --------------------
async function testConnection() {
  try {
    const client = await pool.connect();
    const proveedoresResult = await client.query('SELECT COUNT(*) FROM pedidos_ms.proveedor WHERE activo = true');
    const productosResult = await client.query('SELECT COUNT(*) FROM inventario_ms.producto');

    console.log('✅ Conexión a la base de datos establecida correctamente');
    console.log(`👥 Proveedores activos: ${proveedoresResult.rows[0].count}`);
    console.log(`📊 Productos en inventario: ${productosResult.rows[0].count}`);

    client.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
  }
}

// --------------------
// Rutas API
// --------------------

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API funcionando correctamente', timestamp: new Date().toISOString() });
});

// ====================
// CRUD PRODUCTOS
// ====================

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    console.log('🔹 /api/productos llamado');
    await pool.query('SET search_path TO inventario_ms');
    const result = await pool.query(`
      SELECT p.id_producto, p.descripcion, p.cedula,
             COALESCE(pr.nombre,'Proveedor no encontrado') AS nombre_proveedor
      FROM producto p
      LEFT JOIN pedidos_ms.proveedor pr ON p.cedula = pr.cedula
      ORDER BY p.id_producto DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error en /api/productos:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener producto por id
app.get('/api/productos/:id', async (req,res)=>{
  try{
    const { id } = req.params;
    await pool.query('SET search_path TO inventario_ms');
    const result = await pool.query('SELECT * FROM producto WHERE id_producto=$1',[id]);
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Producto no encontrado' });
    res.json({ success:true, data: result.rows[0] });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Crear producto
app.post('/api/productos', async (req,res)=>{
  try{
    const { descripcion, cedula } = req.body;
    if(!descripcion || !cedula) return res.status(400).json({ success:false, error:'Descripcion y cedula obligatorios' });

    await pool.query('SET search_path TO inventario_ms');
    const result = await pool.query(
      'INSERT INTO producto (descripcion, cedula) VALUES ($1,$2) RETURNING *',
      [descripcion, cedula]
    );
    res.status(201).json({ success:true, data: result.rows[0] });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Actualizar producto
app.put('/api/productos/:id', async (req,res)=>{
  try{
    const { id } = req.params;
    const { descripcion, cedula } = req.body;
    if(!descripcion || !cedula) return res.status(400).json({ success:false, error:'Descripcion y cedula obligatorios' });

    await pool.query('SET search_path TO inventario_ms');
    const result = await pool.query(
      'UPDATE producto SET descripcion=$1, cedula=$2 WHERE id_producto=$3 RETURNING *',
      [descripcion, cedula, id]
    );
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Producto no encontrado' });
    res.json({ success:true, data: result.rows[0] });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', async (req,res)=>{
  try{
    const { id } = req.params;
    await pool.query('SET search_path TO inventario_ms');
    const result = await pool.query('DELETE FROM producto WHERE id_producto=$1 RETURNING *',[id]);
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Producto no encontrado' });
    res.json({ success:true, message:'Producto eliminado correctamente' });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// ====================
// CRUD PROVEEDORES
// ====================

// Obtener todos los proveedores
app.get('/api/proveedores', async (req,res)=>{
  try{
    await pool.query('SET search_path TO pedidos_ms');
    const result = await pool.query('SELECT * FROM proveedor ORDER BY nombre');
    res.json({ success:true, data: result.rows });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Obtener proveedor por cédula
app.get('/api/proveedores/:cedula', async (req,res)=>{
  try{
    const { cedula } = req.params;
    await pool.query('SET search_path TO pedidos_ms');
    const result = await pool.query('SELECT * FROM proveedor WHERE cedula=$1', [cedula]);
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Proveedor no encontrado' });
    res.json({ success:true, data:result.rows[0] });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Crear proveedor
app.post('/api/proveedores', async (req,res)=>{
  try{
    const { cedula,nombre,descripcion,telefono,correo,ciudad,vereda,observaciones,activo } = req.body;
    if(!cedula||!nombre) return res.status(400).json({ success:false, error:'Cédula y nombre obligatorios' });

    await pool.query('SET search_path TO pedidos_ms');
    const result = await pool.query(
      `INSERT INTO proveedor 
       (cedula,nombre,descripcion,telefono,correo,ciudad,vereda,observaciones,activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [cedula,nombre,descripcion||null,telefono||null,correo||null,ciudad||null,vereda||null,observaciones||null,activo!==false]
    );
    res.status(201).json({ success:true, data:result.rows[0] });
  }catch(e){
    if(e.code==='23505') res.status(400).json({ success:false, error:'Proveedor ya existe' });
    else res.status(500).json({ success:false, error:e.message });
  }
});

// Actualizar proveedor
app.put('/api/proveedores/:cedula', async (req,res)=>{
  try{
    const { cedula } = req.params;
    const { nombre,descripcion,telefono,correo,ciudad,vereda,observaciones,activo } = req.body;
    if(!nombre) return res.status(400).json({ success:false, error:'Nombre obligatorio' });

    await pool.query('SET search_path TO pedidos_ms');
    const result = await pool.query(
      `UPDATE proveedor SET nombre=$1, descripcion=$2, telefono=$3, correo=$4, ciudad=$5, vereda=$6, observaciones=$7, activo=$8
       WHERE cedula=$9 RETURNING *`,
      [nombre,descripcion||null,telefono||null,correo||null,ciudad||null,vereda||null,observaciones||null,activo!==false, cedula]
    );
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Proveedor no encontrado' });
    res.json({ success:true, data:result.rows[0] });
  }catch(e){
    res.status(500).json({ success:false, error:e.message });
  }
});

// Eliminar proveedor
app.delete('/api/proveedores/:cedula', async (req,res)=>{
  try{
    const { cedula } = req.params;
    await pool.query('SET search_path TO pedidos_ms');
    const result = await pool.query('DELETE FROM proveedor WHERE cedula=$1 RETURNING *',[cedula]);
    if(result.rows.length===0) return res.status(404).json({ success:false, error:'Proveedor no encontrado' });
    res.json({ success:true, message:'Proveedor eliminado correctamente' });
  }catch(e){
    if(e.code==='23503') res.status(400).json({ success:false, error:'No se puede eliminar proveedor con pedidos asociados' });
    else res.status(500).json({ success:false, error:e.message });
  }
});



// --------------------
// Manejo de errores global
// --------------------
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(500).json({ success:false, error:'Error interno del servidor' });
});

// --------------------
// Iniciar servidor
// --------------------
app.listen(port, async ()=>{
  console.log('🚀 Servidor iniciado en puerto', port);
  await testConnection();
});

process.on('unhandledRejection', err=>{
  console.error('❌ Error no capturado:', err);
});
