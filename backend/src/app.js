const express = require('express')
const cors    = require('cors')
const path    = require('path')
require('dotenv').config()

const authRoutes        = require('./routes/auth.routes')
const clientesRoutes    = require('./routes/clientes.routes')
const productosRoutes   = require('./routes/productos.routes')
const ventasRoutes      = require('./routes/ventas.routes')
const proveedoresRoutes = require('./routes/proveedores.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const comprasRoutes = require('./routes/compras.routes')

const app = express()

app.use(cors())
app.use(express.json())

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../../frontend')))

// Rutas API
app.use('/api/auth',        authRoutes)
app.use('/api/clientes',    clientesRoutes)
app.use('/api/productos',   productosRoutes)
app.use('/api/ventas',      ventasRoutes)
app.use('/api/proveedores', proveedoresRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/compras', comprasRoutes)

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
app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/productos.html'))
})
app.get('/components/sidebar.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/components/sidebar.html'))
})

app.get('/clientes', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/clientes.html'))
})

const empleadosRoutes = require('./routes/empleados.routes')
app.use('/api/empleados', empleadosRoutes)

app.get('/empleados', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/empleados.html'))
})

app.get('/administracion', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/administracion.html'))
})

app.get('/compras', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/pages/compras.html'))
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

