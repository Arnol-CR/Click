const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// GET todos los clientes
router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT C.*, TC.Descripcion AS TipoCliente
                FROM Clientes C
                LEFT JOIN TipoCliente TC ON TC.IdTipoCliente = C.IdTipoCliente
                ORDER BY C.NombreORazonSocial
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST crear cliente
router.post('/', async (req, res) => {
    const { IdTipoCliente, NombreORazonSocial, RTN, Identidad,
            Telefono, Correo, Direccion, LimiteCredito } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdTipoCliente',      sql.Int,           IdTipoCliente)
            .input('NombreORazonSocial', sql.VarChar(150),  NombreORazonSocial)
            .input('RTN',                sql.VarChar(20),   RTN)
            .input('Identidad',          sql.VarChar(20),   Identidad)
            .input('Telefono',           sql.VarChar(20),   Telefono)
            .input('Correo',             sql.VarChar(100),  Correo)
            .input('Direccion',          sql.VarChar(250),  Direccion)
            .input('LimiteCredito',      sql.Decimal(12,2), LimiteCredito || 0)
            .execute('sp_InsertarCliente')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT editar cliente
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { NombreORazonSocial, RTN, Identidad,
            Telefono, Correo, Direccion, LimiteCredito, Activo } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdCliente',          sql.Int,           id)
            .input('NombreORazonSocial', sql.VarChar(150),  NombreORazonSocial)
            .input('RTN',                sql.VarChar(20),   RTN)
            .input('Identidad',          sql.VarChar(20),   Identidad)
            .input('Telefono',           sql.VarChar(20),   Telefono)
            .input('Correo',             sql.VarChar(100),  Correo)
            .input('Direccion',          sql.VarChar(250),  Direccion)
            .input('LimiteCredito',      sql.Decimal(12,2), LimiteCredito || 0)
            .input('Activo',             sql.Bit,           Activo == '1' ? 1 : 0)
            .query(`UPDATE Clientes
                    SET NombreORazonSocial = @NombreORazonSocial,
                        RTN               = @RTN,
                        Identidad         = @Identidad,
                        Telefono          = @Telefono,
                        Correo            = @Correo,
                        Direccion         = @Direccion,
                        LimiteCredito     = @LimiteCredito,
                        Activo            = @Activo
                    WHERE IdCliente = @IdCliente`)
        res.json({ ok: true, mensaje: 'Cliente actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router