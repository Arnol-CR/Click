const express = require('express')
const router  = express.Router()

router.get('/', (req, res) => {
    res.json({ mensaje: 'Ruta clientes OK' })
})

module.exports = router