const express            = require('express')
const router             = express.Router()
const { sql, poolPromise } = require('../config/db')

router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query('SELECT * FROM Proveedores ORDER BY NombreEmpresa')
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', async (req, res) => {
    const { NombreEmpresa, RTN, Telefono, Correo, Direccion } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('NombreEmpresa', sql.VarChar(150), NombreEmpresa)
            .input('RTN',           sql.VarChar(20),  RTN)
            .input('Telefono',      sql.VarChar(20),  Telefono)
            .input('Correo',        sql.VarChar(100), Correo)
            .input('Direccion',     sql.VarChar(250), Direccion)
            .execute('sp_InsertarProveedor')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { NombreEmpresa, RTN, Telefono, Correo, Direccion } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdProveedor',   sql.Int,          id)
            .input('NombreEmpresa', sql.VarChar(150), NombreEmpresa)
            .input('RTN',           sql.VarChar(20),  RTN)
            .input('Telefono',      sql.VarChar(20),  Telefono)
            .input('Correo',        sql.VarChar(100), Correo)
            .input('Direccion',     sql.VarChar(250), Direccion)
            .query(`UPDATE Proveedores 
                    SET NombreEmpresa = @NombreEmpresa,
                        RTN           = @RTN,
                        Telefono      = @Telefono,
                        Correo        = @Correo,
                        Direccion     = @Direccion
                    WHERE IdProveedor = @IdProveedor`)
        res.json({ ok: true, mensaje: 'Proveedor actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router