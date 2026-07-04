const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// GET todos los usuarios
router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT U.IdUsuario, U.Usuario, U.Activo,
                       U.FechaCreacion, U.UltimoAcceso,
                       U.Bloqueado, U.IntentosFallidos,
                       E.Nombre AS NombreEmpleado,
                       R.NombreRol
                FROM Usuarios U
                INNER JOIN Empleados E ON E.IdEmpleado = U.IdEmpleado
                INNER JOIN Roles     R ON R.IdRol      = E.IdRol
                ORDER BY E.Nombre
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST crear usuario
router.post('/', async (req, res) => {
    const { IdEmpleado, Usuario, Contrasena } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdEmpleado', sql.Int,          IdEmpleado)
            .input('Usuario',    sql.VarChar(50),  Usuario)
            .input('Contrasena', sql.VarChar(256), Contrasena)
            .execute('sp_InsertarUsuario')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT editar usuario
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { Usuario, Activo } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdUsuario', sql.Int,         id)
            .input('Usuario',   sql.VarChar(50), Usuario)
            .input('Activo',    sql.Bit,         Activo == '1' ? 1 : 0)
            .query(`UPDATE Usuarios
                    SET Usuario = @Usuario,
                        Activo  = @Activo
                    WHERE IdUsuario = @IdUsuario`)
        res.json({ ok: true, mensaje: 'Usuario actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT cambiar contraseña
router.put('/contrasena/:id', async (req, res) => {
    const { id } = req.params
    const { Contrasena } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdUsuario',  sql.Int,          id)
            .input('Contrasena', sql.VarChar(256), Contrasena)
            .query(`UPDATE Usuarios
                    SET Contrasena        = CONVERT(VARCHAR(256), HASHBYTES('SHA2_256', @Contrasena), 2),
                        IntentosFallidos  = 0,
                        Bloqueado         = 0
                    WHERE IdUsuario = @IdUsuario`)
        res.json({ ok: true, mensaje: 'Contraseña actualizada' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT desbloquear usuario
router.put('/desbloquear/:id', async (req, res) => {
    const { id } = req.params
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdUsuario', sql.Int, id)
            .query(`UPDATE Usuarios
                    SET Bloqueado        = 0,
                        IntentosFallidos = 0
                    WHERE IdUsuario = @IdUsuario`)
        res.json({ ok: true, mensaje: 'Usuario desbloqueado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router