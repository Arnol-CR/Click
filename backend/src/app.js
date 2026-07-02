const express = require('express')
const cors    = require('cors')
const path    = require('path')
require('dotenv').config()

const authRoutes      = require('./routes/auth.routes')
const clientesRoutes  = require('./routes/clientes.routes')
const productosRoutes = require('./routes/productos.routes')
const ventasRoutes    = require('./routes/ventas.routes')

const app = express()

app.use(cors())
app.use(express.json())

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')))

// Rutas API
app.use('/api/auth',      authRoutes)
app.use('/api/clientes',  clientesRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/ventas',    ventasRoutes)

// Rutas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/login.html'))
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/login.html'))
})

app.get('/inicio', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/inicio.html'))
})

app.get('/components/sidebar.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/components/sidebar.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})