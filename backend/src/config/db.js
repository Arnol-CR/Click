const sql = require('mssql')
require('dotenv').config()

const config = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server:   process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port:     parseInt(process.env.DB_PORT),
    options: {
        encrypt:                true,
        trustServerCertificate: false
    }
}

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a DB_Taller')
        return pool
    })
    .catch(err => {
        console.error('❌ Error de conexión:', err)
        process.exit(1)
    })

module.exports = { sql, poolPromise }