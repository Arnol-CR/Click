const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// GET todas las compras — CON FILTROS
router.get('/', async (req, res) => {
    const { desde, hasta, factura, busqueda, estado } = req.query
    try {
        const pool    = await poolPromise
        const request = pool.request()

        let query = `
            SELECT FE.*, P.NombreEmpresa AS Proveedor, E.Nombre AS Empleado
            FROM FacturasEntrada FE
            LEFT JOIN Proveedores PR ON PR.IdProveedor = FE.IdProveedor
            LEFT JOIN Empleados   E  ON E.IdEmpleado   = FE.IdEmpleado
            LEFT JOIN Proveedores P  ON P.IdProveedor  = FE.IdProveedor
            WHERE 1=1
        `
        if (desde) {
            query += ` AND FE.FechaEmision >= @Desde`
            request.input('Desde', sql.Date, desde)
        }
        if (hasta) {
            query += ` AND FE.FechaEmision <= @Hasta`
            request.input('Hasta', sql.Date, hasta)
        }
        if (factura) {
            query += ` AND FE.NumeroFacturaProveedor LIKE @Factura`
            request.input('Factura', sql.VarChar(30), `%${factura}%`)
        }
        if (estado) {
            query += ` AND FE.Estado = @Estado`
            request.input('Estado', sql.VarChar(20), estado)
        }
        if (busqueda) {
            query += ` AND (
                P.NombreEmpresa LIKE @Busqueda
                OR FE.IdFacturaEntrada IN (
                    SELECT FED.IdFacturaEntrada FROM FacturaEntradaDetalle FED
                    INNER JOIN ProductoMarca PM  ON PM.IdProductoMarca = FED.IdProductoMarca
                    INNER JOIN Productos     PR2 ON PR2.IdProducto     = PM.IdProducto
                    WHERE PR2.NombreProducto LIKE @Busqueda OR FED.CodigoProducto LIKE @Busqueda
                )
            )`
            request.input('Busqueda', sql.VarChar(100), `%${busqueda}%`)
        }
        query += ` ORDER BY FE.FechaIngreso DESC`

        const result = await request.query(query)
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

// POST registrar compra — enriquece cada línea con Exento/ISV antes de mandar al SP
router.post('/', async (req, res) => {
    const { IdProveedor, IdEmpleado, NumeroFacturaProveedor,
            FechaEmision, Estado, Detalle } = req.body
    try {
        const pool = await poolPromise

        const ids = Detalle.map(d => d.IdProductoMarca)
        const exentosResult = await pool.request().query(`
            SELECT PM.IdProductoMarca, P.EsExento
            FROM ProductoMarca PM
            INNER JOIN Productos P ON P.IdProducto = PM.IdProducto
            WHERE PM.IdProductoMarca IN (${ids.join(',')})
        `)
        const mapaExentos = {}
        exentosResult.recordset.forEach(r => mapaExentos[r.IdProductoMarca] = r.EsExento)

        const detalleConImpuesto = Detalle.map(d => {
            const subtotal = (d.Cantidad * d.PrecioUnitario) - (d.Descuento || 0)
            const exento   = mapaExentos[d.IdProductoMarca] ? 1 : 0
            const isv      = exento ? 0 : +(subtotal * 0.15).toFixed(2)
            return { ...d, Exento: exento, ISV: isv, Subtotal: subtotal }
        })

        const result = await pool.request()
            .input('IdProveedor',            sql.Int,         IdProveedor)
            .input('IdEmpleado',             sql.Int,         IdEmpleado)
            .input('NumeroFacturaProveedor', sql.VarChar(30), NumeroFacturaProveedor)
            .input('FechaEmision',           sql.Date,        FechaEmision)
            .input('Estado',                 sql.VarChar(20), Estado || 'Recibida')
            .input('Detalle',                sql.NVarChar(sql.MAX), JSON.stringify(detalleConImpuesto))
            .execute('sp_RegistrarFacturaEntrada')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        console.error('ERROR COMPLETO:', err)
        res.status(500).json({
            error: err.message || err.originalError?.info?.message || 'Error desconocido'
        })
    }
})


// PUT recibir - DEBE IR ANTES DE /:id
router.put('/recibir/:id', async (req, res) => {
    const { id } = req.params
    const { FechaRecibido } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdFacturaEntrada', sql.Int,  id)
            .input('FechaRecibido',    sql.Date, FechaRecibido)
            .query(`UPDATE FacturasEntrada
                    SET Estado       = 'Recibida',
                        FechaIngreso = @FechaRecibido
                    WHERE IdFacturaEntrada = @IdFacturaEntrada`)
        res.json({ ok: true, mensaje: 'Compra marcada como recibida' })
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