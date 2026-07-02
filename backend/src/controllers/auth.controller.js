const { sql, poolPromise } = require('../config/db')

const login = async (req, res) => {
    const { usuario, contrasena } = req.body

    if (!usuario || !contrasena)
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })

    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .input('Usuario',    sql.VarChar(50),  usuario)
            .input('Contrasena', sql.VarChar(256), contrasena)
            .execute('sp_Login')

        const datos = result.recordsets[0][0]

        if (!datos)
            return res.status(401).json({ error: 'Credenciales incorrectas' })

        res.json({
            ok:     true,
            mensaje: 'Login exitoso',
            datos
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = { login }