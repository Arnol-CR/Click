const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const authRoutes      = require('./routes/auth.routes')
const clientesRoutes  = require('./routes/clientes.routes')
const productosRoutes = require('./routes/productos.routes')
const ventasRoutes    = require('./routes/ventas.routes')

const app = express()

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/auth',      authRoutes)
app.use('/api/clientes',  clientesRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/ventas',    ventasRoutes)

// Ruta base
app.get('/', (req, res) => {
    res.json({ mensaje: '✅ API Clik funcionando' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})