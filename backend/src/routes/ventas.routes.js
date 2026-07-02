const express = require('express')
const router  = express.Router()

router.get('/', (req, res) => {
    res.json({ mensaje: 'Ruta ventas OK' })
})

module.exports = router