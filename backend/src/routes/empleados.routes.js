const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

// == EMPLEADOS ==
router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT E.*, R.NombreRol,
                       C.Salario, C.Cargo, C.TipoContrato, C.FechaInicio
                FROM Empleados E
                LEFT JOIN Roles     R ON R.IdRol      = E.IdRol
                LEFT JOIN Contratos C ON C.IdContrato = E.IdContrato
                ORDER BY E.Nombre
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', async (req, res) => {
    const { IdRol, Nombre, Identidad, Telefono, Correo, Direccion } = req.body
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('IdRol',     sql.Int,          IdRol)
            .input('Nombre',    sql.VarChar(100), Nombre)
            .input('Identidad', sql.VarChar(20),  Identidad)
            .input('Telefono',  sql.VarChar(20),  Telefono)
            .input('Correo',    sql.VarChar(100), Correo)
            .input('Direccion', sql.VarChar(250), Direccion)
            .execute('sp_InsertarEmpleado')
        res.json({ ok: true, datos: result.recordset[0] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { IdRol, Nombre, Identidad, Telefono, Correo, Direccion, Activo } = req.body
    try {
        const pool = await poolPromise
        await pool.request()
            .input('IdEmpleado', sql.Int,          id)
            .input('IdRol',      sql.Int,          IdRol)
            .input('Nombre',     sql.VarChar(100), Nombre)
            .input('Identidad',  sql.VarChar(20),  Identidad)
            .input('Telefono',   sql.VarChar(20),  Telefono)
            .input('Correo',     sql.VarChar(100), Correo)
            .input('Direccion',  sql.VarChar(250), Direccion)
            .input('Activo',     sql.Bit,          Activo == '1' ? 1 : 0)
            .query(`UPDATE Empleados
                    SET IdRol     = @IdRol,
                        Nombre    = @Nombre,
                        Identidad = @Identidad,
                        Telefono  = @Telefono,
                        Correo    = @Correo,
                        Direccion = @Direccion,
                        Activo    = @Activo
                    WHERE IdEmpleado = @IdEmpleado`)
        res.json({ ok: true, mensaje: 'Empleado actualizado' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// == ROLES ==
router.get('/roles', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query('SELECT * FROM Roles ORDER BY NombreRol')
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router