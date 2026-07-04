const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// GET todas las compras
router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT FE.*, P.NombreEmpresa AS Proveedor,
                       E.Nombre AS Empleado
                FROM FacturasEntrada FE
                LEFT JOIN Proveedores PR ON PR.IdProveedor = FE.IdProveedor
                LEFT JOIN Empleados   E  ON E.IdEmpleado   = FE.IdEmpleado
                LEFT JOIN Proveedores P  ON P.IdProveedor  = FE.IdProveedor
                ORDER BY FE.FechaIngreso DESC
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET detalle de una compra
router.get('/:id/detalle', async (req, res) => {
    const { id } = req.params
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdFacturaEntrada', sql.Int, id)
            .query(`
                SELECT FED.*, PM.CodigoVariante,
                       P.NombreProducto, M.NombreMarca
                FROM FacturaEntradaDetalle FED
                INNER JOIN ProductoMarca PM ON PM.IdProductoMarca = FED.IdProductoMarca
                INNER JOIN Productos     P  ON P.IdProducto       = PM.IdProducto
                INNER JOIN Marcas        M  ON M.IdMarca          = PM.IdMarca
                WHERE FED.IdFacturaEntrada = @IdFacturaEntrada
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST registrar compra
router.post('/', async (req, res) => {
    const { IdProveedor, IdEmpleado, NumeroFacturaProveedor,
            FechaEmision, Estado, Detalle } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdProveedor',            sql.Int,         IdProveedor)
            .input('IdEmpleado',             sql.Int,         IdEmpleado)
            .input('NumeroFacturaProveedor', sql.VarChar(30), NumeroFacturaProveedor)
            .input('FechaEmision',           sql.Date,        FechaEmision)
            .input('Estado',                 sql.VarChar(20), Estado || 'Recibida')
            .input('Detalle',                sql.NVarChar(sql.MAX), JSON.stringify(Detalle))
            .execute('sp_RegistrarFacturaEntrada')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT anular compra
router.put('/anular/:id', async (req, res) => {
    const { id }         = req.params
    const { IdEmpleado, Observacion } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdFacturaEntrada', sql.Int,          id)
            .input('IdEmpleado',       sql.Int,          IdEmpleado)
            .input('Observacion',      sql.VarChar(250), Observacion)
            .execute('sp_AnularFacturaEntrada')
        res.json({ ok: true, mensaje: 'Compra anulada' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router