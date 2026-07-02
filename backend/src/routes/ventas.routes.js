const express    = require('express')
const router     = express.Router()
const { sql, poolPromise } = require('../config/db')

router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT TOP 20
                    FC.FacturaID,
                    FC.NumeroFactura,
                    FC.FechaEmision,
                    C.NombreORazonSocial AS Cliente,
                    FC.TotalFactura,
                    FC.Estado
                FROM FacturaClientes FC
                INNER JOIN Clientes C ON C.IdCliente = FC.ClienteID
                ORDER BY FC.FechaEmision DESC
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router