const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// ============================================
// CATEGORIAS
// ============================================
router.get('/categorias', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query('SELECT * FROM CategoriaProducto ORDER BY NombreCategoria')
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/categorias', async (req, res) => {
    const { NombreCategoria } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('NombreCategoria', sql.VarChar(50), NombreCategoria)
            .execute('sp_InsertarCategoria')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/categorias/:id', async (req, res) => {
    const { id } = req.params
    const { NombreCategoria } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdCategoria',     sql.Int,         id)
            .input('NombreCategoria', sql.VarChar(50), NombreCategoria)
            .query(`UPDATE CategoriaProducto 
                    SET NombreCategoria = @NombreCategoria 
                    WHERE IdCategoria   = @IdCategoria`)
        res.json({ ok: true, mensaje: 'Categoría actualizada' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ============================================
// MARCAS
// ============================================
router.get('/marcas', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query('SELECT * FROM Marcas ORDER BY NombreMarca')
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/marcas', async (req, res) => {
    const { NombreMarca } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('NombreMarca', sql.VarChar(50), NombreMarca)
            .execute('sp_InsertarMarca')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/marcas/:id', async (req, res) => {
    const { id } = req.params
    const { NombreMarca, Activo } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdMarca',     sql.Int,         id)
            .input('NombreMarca', sql.VarChar(50), NombreMarca)
            .input('Activo',      sql.Bit,         Activo == '1' ? 1 : 0)
            .query(`UPDATE Marcas 
                    SET NombreMarca = @NombreMarca,
                        Activo      = @Activo
                    WHERE IdMarca   = @IdMarca`)
        res.json({ ok: true, mensaje: 'Marca actualizada' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ============================================
// ARTICULOS (VARIANTES) - ANTES DE PRODUCTOS
// ============================================
router.get('/variantes', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT PM.*, P.NombreProducto,
                       M.NombreMarca, PR.NombreEmpresa AS Proveedor
                FROM ProductoMarca PM
                INNER JOIN Productos   P  ON P.IdProducto   = PM.IdProducto
                INNER JOIN Marcas      M  ON M.IdMarca      = PM.IdMarca
                INNER JOIN Proveedores PR ON PR.IdProveedor = PM.IdProveedor
                ORDER BY P.NombreProducto
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})
router.post('/variantes', async (req, res) => {
    const { IdProducto, IdMarca, IdProveedor, CodigoVariante,
            Caracteristica1, Caracteristica2, Tamanio, UnidadMedida, CodigoBarras } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdProducto',      sql.Int,          IdProducto)
            .input('IdMarca',         sql.Int,          IdMarca)
            .input('IdProveedor',     sql.Int,          IdProveedor)
            .input('CodigoVariante',  sql.VarChar(30),  CodigoVariante)
            .input('Caracteristica1', sql.VarChar(100), Caracteristica1)
            .input('Caracteristica2', sql.VarChar(100), Caracteristica2)
            .input('Tamanio',         sql.VarChar(30),  Tamanio)
            .input('UnidadMedida',    sql.VarChar(20),  UnidadMedida)
            .input('CodigoBarras',    sql.VarChar(30),  CodigoBarras || null)
            .execute('sp_InsertarProductoMarca')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})


router.put('/variantes/:id', async (req, res) => {
    const { id } = req.params
    const { IdProducto, IdMarca, IdProveedor,
            Caracteristica1, Caracteristica2, Tamanio, 
            UnidadMedida, Activo, CodigoBarras } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdProductoMarca', sql.Int,          id)
            .input('IdProducto',      sql.Int,          IdProducto)
            .input('IdMarca',         sql.Int,          IdMarca)
            .input('IdProveedor',     sql.Int,          IdProveedor)
            .input('Caracteristica1', sql.VarChar(100), Caracteristica1)
            .input('Caracteristica2', sql.VarChar(100), Caracteristica2)
            .input('Tamanio',         sql.VarChar(30),  Tamanio)
            .input('UnidadMedida',    sql.VarChar(20),  UnidadMedida)
            .input('Activo',          sql.Bit,          Activo == '1' ? 1 : 0)
            .input('CodigoBarras',    sql.VarChar(30),  CodigoBarras || null)
            .query(`UPDATE ProductoMarca 
                    SET IdProducto      = @IdProducto,
                        IdMarca         = @IdMarca,
                        IdProveedor     = @IdProveedor,
                        Caracteristica1 = @Caracteristica1,
                        Caracteristica2 = @Caracteristica2,
                        Tamanio         = @Tamanio,
                        UnidadMedida    = @UnidadMedida,
                        Activo          = @Activo,
                        CodigoBarras    = @CodigoBarras
                    WHERE IdProductoMarca = @IdProductoMarca`)
        res.json({ ok: true, mensaje: 'Artículo actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ============================================
// PRODUCTOS - SIEMPRE AL FINAL
// ============================================
router.get('/', async (req, res) => {
    const { categoria } = req.query
    try {
        const pool    = await poolPromise
        const request = pool.request()

        let query = `
            SELECT P.*, C.NombreCategoria
            FROM Productos P
            INNER JOIN CategoriaProducto C ON C.IdCategoria = P.IdCategoria
            WHERE 1=1
        `
        if (categoria) {
            query += ` AND P.IdCategoria = @IdCategoria`
            request.input('IdCategoria', sql.Int, categoria)
        }
        query += ` ORDER BY P.NombreProducto`

        const result = await request.query(query)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', async (req, res) => {
    const { IdCategoria, Codigo, NombreProducto, Descripcion} = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdCategoria',    sql.Int,          IdCategoria)
            .input('Codigo',         sql.VarChar(30),  Codigo)
            .input('NombreProducto', sql.VarChar(150), NombreProducto)
            .input('Descripcion',    sql.VarChar(250), Descripcion)
            .execute('sp_InsertarProducto')  // <-- este SP necesita el parámetro nuevo
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { IdCategoria, NombreProducto, Descripcion, Activo } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdProducto',     sql.Int,          id)
            .input('IdCategoria',    sql.Int,          IdCategoria)
            .input('NombreProducto', sql.VarChar(150), NombreProducto)
            .input('Descripcion',    sql.VarChar(250), Descripcion)
            .input('Activo',         sql.Bit,          Activo == '1' ? 1 : 0)
            .query(`UPDATE Productos 
                    SET IdCategoria    = @IdCategoria,
                        NombreProducto = @NombreProducto,
                        Descripcion    = @Descripcion,
                        Activo         = @Activo
                    WHERE IdProducto   = @IdProducto`)
        res.json({ ok: true, mensaje: 'Producto actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router