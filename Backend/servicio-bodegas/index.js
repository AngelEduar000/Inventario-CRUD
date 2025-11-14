const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a Neon
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_6OuAWfLD8rvk@ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// Probar conexión
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Conectado a Neon PostgreSQL');
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Error conectando a Neon:', err.message);
        return false;
    }
}

// Ruta de estado del servicio
app.get('/api/status', async (req, res) => {
    const ok = await testConnection();
    if (ok) {
        res.json({ status: 'ok', message: '✅ Servicio de Bodegas operativo' });
    } else {
        res.status(500).json({ status: 'error', message: '❌ Error de conexión a la base de datos' });
    }
});


// Rutas API
app.get('/api/bodegas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventario_ms.bodega ORDER BY id_bodega');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener bodegas:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bodegas', async (req, res) => {
    try {
        const { codigo } = req.body;
        const result = await pool.query(
            'INSERT INTO inventario_ms.bodega (codigo) VALUES ($1) RETURNING *',
            [codigo]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear bodega:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/bodegas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo } = req.body;
        const result = await pool.query(
            'UPDATE inventario_ms.bodega SET codigo = $1 WHERE id_bodega = $2 RETURNING *',
            [codigo, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar bodega:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/bodegas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM inventario_ms.bodega WHERE id_bodega = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bodega no encontrada' });
        }
        
        res.json({ message: 'Bodega eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar bodega:', error);
        res.status(500).json({ error: error.message });
    }
});

// Búsqueda
app.get('/api/bodegas/buscar/:termino', async (req, res) => {
    try {
        const { termino } = req.params;
        const result = await pool.query(
            'SELECT * FROM inventario_ms.bodega WHERE id_bodega ILIKE $1 OR codigo ILIKE $2 ORDER BY id_bodega',
            [`%${termino}%`, `%${termino}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al buscar bodegas:', error);
        res.status(500).json({ error: error.message });
    }
});



// Iniciar servidor
const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    await testConnection();
});