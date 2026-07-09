const express              = require('express')
const router               = express.Router()
const { sql, poolPromise } = require('../config/db')

router.get('/', async (req, res) => {
    try {
        const pool   = await poolPromise
        const result = await pool.request()
            .query(`
                SELECT 
                    I.IdInventario,
                    I.CodigoProducto,
                    P.NombreProducto,
                    M.NombreMarca,
                    PM.CodigoVariante,
                    PM.Tamanio,
                    PM.UnidadMedida,
                    C.NombreCategoria,
                    PR.NombreEmpresa AS Proveedor,
                    I.StockActual,
                    I.StockMinimo,
                    I.PrecioCompra,
                    I.PrecioVenta,
                    I.FechaVencimiento,
                    I.UltimaActualizacion,
                    CASE 
                        WHEN I.FechaVencimiento < GETDATE() THEN 'Vencido'
                        WHEN I.FechaVencimiento < DATEADD(DAY,30,GETDATE()) AND I.FechaVencimiento IS NOT NULL THEN 'Por vencer'
                        WHEN I.StockActual = 0 THEN 'Sin stock'
                        WHEN I.StockActual <= I.StockMinimo THEN 'Stock bajo'
                        ELSE 'OK'
                    END AS EstadoStock
                FROM Inventario I
                INNER JOIN ProductoMarca    PM ON PM.IdProductoMarca = I.IdProductoMarca
                INNER JOIN Productos        P  ON P.IdProducto       = PM.IdProducto
                INNER JOIN Marcas           M  ON M.IdMarca          = PM.IdMarca
                INNER JOIN CategoriaProducto C ON C.IdCategoria      = P.IdCategoria
                INNER JOIN Proveedores      PR ON PR.IdProveedor      = PM.IdProveedor
                ORDER BY P.NombreProducto
            `)
        res.json(result.recordset)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router