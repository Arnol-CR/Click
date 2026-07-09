const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// GET todas las ventas
router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT TOP 50
                    FC.FacturaID,
                    FC.NumeroFactura,
                    FC.FechaEmision,
                    C.NombreORazonSocial AS Cliente,
                    E.Nombre             AS Vendedor,
                    FC.SubtotalExento,
                    FC.SubtotalGravado15,
                    FC.SubtotalGravado18,
                    FC.ISV15,
                    FC.ISV18,
                    FC.TotalISV,
                    FC.TotalFactura,
                    FC.Descuento,
                    FC.Estado,
                    FC.FechaCreacion
                FROM FacturaClientes FC
                INNER JOIN Clientes  C ON C.IdCliente  = FC.ClienteID
                LEFT  JOIN Empleados E ON E.IdEmpleado = FC.IdEmpleado
                ORDER BY FC.FechaCreacion DESC
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET detalle de una venta
router.get('/:id/detalle', async (req, res) => {
    const { id } = req.params
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('FacturaID', sql.Int, id)
            .query(`
                SELECT FD.*, PM.CodigoVariante,
                       P.NombreProducto, M.NombreMarca, P.Exento
                FROM FacturaClienteDetalle FD
                INNER JOIN ProductoMarca PM ON PM.IdProductoMarca = FD.IdProductoMarca
                INNER JOIN Productos     P  ON P.IdProducto       = PM.IdProducto
                INNER JOIN Marcas        M  ON M.IdMarca          = PM.IdMarca
                WHERE FD.FacturaID = @FacturaID
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST registrar venta
router.post('/', async (req, res) => {
    const { ClienteID, IdEmpleado, CAIID, NumeroFactura,
            FechaEmision, Descuento, Observacion, Detalle } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('ClienteID',    sql.Int,           ClienteID)
            .input('IdEmpleado',   sql.Int,           IdEmpleado)
            .input('CAIID',        sql.Int,           CAIID || 1)
            .input('NumeroFactura',sql.VarChar(30),   NumeroFactura)
            .input('FechaEmision', sql.DateTime,      FechaEmision)
            .input('Descuento',    sql.Decimal(12,2), Descuento || 0)
            .input('Observacion',  sql.VarChar(250),  Observacion || null)
            .input('Detalle',      sql.NVarChar(sql.MAX), JSON.stringify(Detalle))
            .execute('sp_RegistrarFacturaVenta')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT anular venta
router.put('/anular/:id', async (req, res) => {
    const { id }         = req.params
    const { IdEmpleado, Observacion } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('FacturaID',   sql.Int,          id)
            .input('IdEmpleado',  sql.Int,          IdEmpleado)
            .input('Observacion', sql.VarChar(250), Observacion)
            .execute('sp_AnularFacturaVenta')
        res.json({ ok: true, mensaje: 'Venta anulada' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router