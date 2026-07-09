const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

// Formatear fecha sin problema de zona horaria
function formatFecha(fecha) {
    if (!fecha) return '-'
    const parte = fecha.toString().substring(0, 10)
    const [anio, mes, dia] = parte.split('-')
    return `${dia}/${mes}/${anio}`
}


let articulos  = []
let lineas     = []

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

let debounceTimer = null
function cargarComprasDebounce() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(cargarCompras, 350)
}

let comprasCache = []

async function cargarCompras() {
    const params = new URLSearchParams()
    const desde = document.getElementById('f-desde')?.value
    const hasta = document.getElementById('f-hasta')?.value
    const factura = document.getElementById('f-factura')?.value
    const busqueda = document.getElementById('f-busqueda')?.value

    if (desde) params.append('desde', desde)
    if (hasta) params.append('hasta', hasta)
    if (factura) params.append('factura', factura)
    if (busqueda) params.append('busqueda', busqueda)
    if (estadoActivo) params.append('estado', estadoActivo)   // <-- usa la variable, no el select


    const res   = await fetch(`${API}/compras?${params}`)
    const datos = await res.json()
    comprasCache = datos
    const tbody = document.getElementById('tabla-compras')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">Sin compras registradas</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((c, i) => `
    <tr>
        <td>${i + 1}</td>
        <td>${c.NumeroFacturaProveedor || '-'}</td>
        <td>${c.Proveedor}</td>
        <td>${formatFecha(c.FechaEmision)}</td>
        <td>${formatFecha(c.FechaIngreso)}</td>
        <td>L. ${parseFloat(c.Subtotal).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
        <td>L. ${parseFloat(c.ISV || 0).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
        <td>L. ${parseFloat(c.Total).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td><span class="badge ${c.Estado === 'Anulada' ? 'badge-danger' : c.Estado === 'Pendiente' ? 'badge-warning' : 'badge-success'}">${c.Estado}</span></td>
            <td style="display:flex; gap:6px;">
    <button class="btn-edit" onclick="verDetalle(${c.IdFacturaEntrada}, '${c.NumeroFacturaProveedor || ''}', '${c.Proveedor || ''}', '${c.FechaEmision || ''}', '${c.FechaIngreso || ''}', '${c.Estado}')">Ver</button>
    ${c.Estado === 'Pendiente' ? `<button class="btn-edit" style="background:#00875a;" onclick="abrirRecibirCompra(${c.IdFacturaEntrada})">Recibir</button>` : ''}
    ${c.Estado !== 'Anulada' ? `<button class="btn-edit" style="background:#e53e3e;" onclick="anularCompra(${c.IdFacturaEntrada})">Anular</button>` : ''}
</td>
        </tr>
    `).join('')
}



// == ABRIR NUEVA COMPRA ==
async function abrirNuevaCompra() {
    lineas = []
    document.getElementById('detalle-compra').innerHTML = ''
    document.getElementById('inp-com-fecha').value = new Date().toISOString().split('T')[0]
    actualizarTotales()

    const [resProveedores, resArticulos] = await Promise.all([
        fetch(`${API}/proveedores`),
        fetch(`${API}/productos/variantes`)
    ])
    const proveedores = await resProveedores.json()
    articulos         = await resArticulos.json()

    document.getElementById('inp-com-proveedor').innerHTML =
        proveedores.map(p => `<option value="${p.IdProveedor}">${p.NombreEmpresa}</option>`).join('')

    document.getElementById('modal-compra').classList.remove('hidden')
}

function abrirRecibirCompra(id) {
    document.getElementById('recibir-id').value    = id
    document.getElementById('recibir-fecha').value = new Date().toISOString().split('T')[0]
    document.getElementById('modal-recibir').classList.remove('hidden')
}

async function recibirCompra() {
    const id    = document.getElementById('recibir-id').value
    const fecha = document.getElementById('recibir-fecha').value

    if (!fecha) return alert('Ingresa la fecha de recibimiento')

    const res  = await fetch(`${API}/compras/recibir/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ FechaRecibido: fecha })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    document.getElementById('modal-recibir').classList.add('hidden')
    cargarCompras()
}

// == BUSCADOR DE ARTICULOS ==
let lineaActual = null

function agregarLinea() {
    const idx = lineas.length
    lineas.push({ IdProductoMarca: '', NombreArticulo: '', Cantidad: 1, PrecioUnitario: 0, Descuento: 0, ISV: 0, Exento: false })

    const tr = document.createElement('tr')
    tr.id    = `linea-${idx}`
    tr.innerHTML = `
        <td>
            <div style="display:flex; gap:6px; align-items:center; width:100%;">
                <input type="text" id="art-nombre-${idx}" placeholder="Buscar artículo..." readonly
                    style="flex:1; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px; background:#f8fafc; cursor:pointer;"
                    onclick="abrirBuscadorArticulo(${idx})"/>
                <button onclick="abrirBuscadorArticulo(${idx})"
                    style="background:var(--primary); color:white; border:none; border-radius:6px; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                    </svg>
                </button>
            </div>
        </td>
        <td><input type="number" value="1" min="1" onchange="actualizarLinea(${idx}, 'Cantidad', this.value)" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td><input type="number" value="0" min="0" step="0.01" id="precio-${idx}" onchange="actualizarLinea(${idx}, 'PrecioUnitario', this.value)" style="width:90px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td><input type="number" value="0" min="0" step="0.01" onchange="actualizarLinea(${idx}, 'Descuento', this.value)" style="width:80px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td id="isv-${idx}" style="font-size:12px; color:#888;">-</td>
        <td id="subtotal-${idx}" style="font-size:13px; font-weight:600;">L. 0.00</td>
        <td><button onclick="eliminarLinea(${idx})" style="background:#e53e3e; color:white; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">✕</button></td>
    `
    document.getElementById('detalle-compra').appendChild(tr)
}

function abrirBuscadorArticulo(idx) {
    lineaActual = idx
    document.getElementById('inp-buscar-articulo').value = ''
    document.getElementById('resultados-articulos').innerHTML = ''
    document.getElementById('modal-buscar-articulo').classList.remove('hidden')
    document.getElementById('inp-buscar-articulo').focus()
    buscarArticulos()
}

function buscarArticulos() {
    const texto = document.getElementById('inp-buscar-articulo').value.toLowerCase().trim()

const filtrados = articulos.filter(a =>
    a.Activo && (
        a.NombreProducto.toLowerCase().includes(texto) ||
        a.NombreMarca.toLowerCase().includes(texto)    ||
        a.CodigoVariante.toLowerCase().includes(texto) ||
        (a.CodigoBarras && a.CodigoBarras.toLowerCase().includes(texto)) ||
        (a.Caracteristica1 && a.Caracteristica1.toLowerCase().includes(texto)) ||
        (a.Tamanio && a.Tamanio.toLowerCase().includes(texto))
    )
)   

    const tbody = document.getElementById('resultados-articulos')

    if (!filtrados.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Sin resultados</td></tr>`
        return
    }

tbody.innerHTML = filtrados.map(a => `
    <tr style="cursor:pointer;" 
        onmouseover="this.style.background='#f0f4f8'" 
        onmouseout="this.style.background=''"
        onclick="seleccionarArticulo(${a.IdProductoMarca}, '${a.NombreProducto} - ${a.NombreMarca} ${a.Tamanio ? '(' + a.Tamanio + ')' : ''}', ${a.PrecioVenta || 0}, ${a.IdProducto})">
        <td>${a.CodigoVariante}</td>
        <td>${a.NombreProducto}</td>
        <td>${a.NombreMarca}</td>
        <td>${a.Tamanio || '-'}</td>
        <td>${a.Caracteristica1 || '-'}</td>
    </tr>
`).join('')
}

async function seleccionarArticulo(idProductoMarca, nombre, precio, idProducto) {
    const idx = lineaActual

    // Obtener si el producto es exento
    const res    = await fetch(`${API}/productos`)
    const prods  = await res.json()
    const prod   = prods.find(p => p.IdProducto == idProducto)
    const exento = prod?.Exento ? true : false

    lineas[idx].IdProductoMarca = idProductoMarca
    lineas[idx].NombreArticulo  = nombre
    lineas[idx].PrecioUnitario  = precio
    lineas[idx].Exento          = exento
    lineas[idx].ISV             = exento ? 0 : 15

    document.getElementById(`art-nombre-${idx}`).value = nombre
    document.getElementById(`precio-${idx}`).value     = precio

    // Mostrar ISV en la fila
    const isvEl = document.getElementById(`isv-${idx}`)
    if (isvEl) isvEl.textContent = exento ? 'Exento' : '15%'

    actualizarLinea(idx, 'PrecioUnitario', precio)
    document.getElementById('modal-buscar-articulo').classList.add('hidden')
}

function actualizarLinea(idx, campo, valor) {
    lineas[idx][campo] = campo === 'IdProductoMarca' ? valor : parseFloat(valor) || 0
    
    const base     = (lineas[idx].Cantidad * lineas[idx].PrecioUnitario) - lineas[idx].Descuento
    const isv      = base * (lineas[idx].ISV / 100)
    const subtotal = base 

    const el = document.getElementById(`subtotal-${idx}`)
    if (el) el.textContent = `L. ${subtotal.toLocaleString('es-HN', {minimumFractionDigits:2})}`
    actualizarTotales()
}

function eliminarLinea(idx) {
    lineas[idx] = null
    const tr = document.getElementById(`linea-${idx}`)
    if (tr) tr.remove()
    actualizarTotales()
}

function actualizarTotales() {
    let subtotalExento = 0
    let subtotalGrav15 = 0
    let subtotalGrav18 = 0

    lineas.filter(l => l && l.IdProductoMarca).forEach(l => {
        const base = (l.Cantidad * l.PrecioUnitario) - l.Descuento
        if      (l.ISV == 0)  subtotalExento += base
        else if (l.ISV == 15) subtotalGrav15 += base
        else if (l.ISV == 18) subtotalGrav18 += base
    })

    const isv15 = subtotalGrav15 * 0.15
    const isv18 = subtotalGrav18 * 0.18
    const total = subtotalExento + subtotalGrav15 + subtotalGrav18 + isv15 + isv18

    const fmt = n => `L. ${n.toLocaleString('es-HN', {minimumFractionDigits:2})}`

    document.getElementById('res-exento').textContent   = fmt(subtotalExento)
    document.getElementById('res-grav15').textContent   = fmt(subtotalGrav15)
    document.getElementById('res-grav18').textContent   = fmt(subtotalGrav18)
    document.getElementById('res-subtotal').textContent = fmt(subtotalExento + subtotalGrav15 + subtotalGrav18)
    document.getElementById('res-isv').textContent      = fmt(isv15 + isv18)
    document.getElementById('res-total').textContent    = fmt(total)
}


// == GUARDAR COMPRA ==
async function guardarCompra() {
    const detalle = lineas.filter(l => l && l.IdProductoMarca)

    if (!detalle.length) return alert('Agrega al menos un producto')

    const body = {
        IdProveedor:            document.getElementById('inp-com-proveedor').value,
        IdEmpleado:             usuario.IdEmpleado,
        NumeroFacturaProveedor: document.getElementById('inp-com-nfactura').value.trim(),
        FechaEmision:           document.getElementById('inp-com-fecha').value,
        Estado:                 document.getElementById('inp-com-estado').value,
        Detalle:                detalle.map(l => {
            const neto = (l.Cantidad * l.PrecioUnitario) - l.Descuento
            const isv  = l.Exento ? 0 : neto * 0.15
            return {
                IdProductoMarca:  parseInt(l.IdProductoMarca),
                CodigoProducto:   '',
                Cantidad:         l.Cantidad,
                PrecioUnitario:   l.PrecioUnitario,
                Descuento:        l.Descuento,
                ISV:              parseFloat(isv.toFixed(2)),
                Subtotal:         parseFloat((neto + isv).toFixed(2)),
                FechaVencimiento: null
            }
        })
    }

    const res  = await fetch(`${API}/compras`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-compra')
    cargarCompras()
}

// == VER DETALLE ==
async function verDetalle(id, nfactura, proveedor, fechaEmision, fechaIngreso, estado) {
    const res   = await fetch(`${API}/compras/${id}/detalle`)
    const datos = await res.json()

    document.getElementById('info-compra').innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <div><strong>Factura:</strong> ${nfactura || '-'}</div>
            <div><strong>Proveedor:</strong> ${proveedor || '-'}</div>
            <div><strong>Fecha Emisión:</strong> ${formatFecha(fechaEmision)}</div>
<div><strong>Fecha Ingreso:</strong> ${formatFecha(fechaIngreso)}</div>
            <div><strong>Estado:</strong> <span class="badge ${estado === 'Anulada' ? 'badge-danger' : 'badge-success'}">${estado}</span></div>
        </div>
    `

    const fmt = n => `L. ${parseFloat(n).toLocaleString('es-HN', {minimumFractionDigits:2})}`

    let totalBase = 0
    let totalISV  = 0

    const filas = datos.map(d => {
        const base    = parseFloat(d.Cantidad) * parseFloat(d.PrecioUnitario)
        const desc    = parseFloat(d.Descuento || 0)
        const neto    = base - desc
        const isv     = neto * 0.15
        const subtotal = neto + isv

        totalBase += neto
        totalISV  += isv

        return `
    <tr>
        <td>${d.NombreProducto} - ${d.NombreMarca}</td>
        <td>${d.CodigoVariante}</td>
        <td style="text-align:center;">${d.Cantidad}</td>
        <td style="text-align:right; white-space:nowrap;">${fmt(d.PrecioUnitario)}</td>
        <td style="text-align:right; white-space:nowrap;">${fmt(desc)}</td>
    </tr>`
    }).join('')

    const totalGeneral = totalBase + totalISV

    

document.getElementById('tabla-detalle-compra').innerHTML = filas + `
    <tr style="border-top:2px solid var(--border);">
        <td colspan="3"></td>
        <td style="text-align:right; font-size:12px; color:#888; white-space:nowrap;">Subtotal:</td>
        <td style="text-align:right; font-size:12px; white-space:nowrap;">${fmt(totalBase)}</td>
    </tr>
    <tr>
        <td colspan="3"></td>
        <td style="text-align:right; font-size:12px; color:#888; white-space:nowrap;">ISV (15%):</td>
        <td style="text-align:right; font-size:12px; white-space:nowrap;">${fmt(totalISV)}</td>
    </tr>
    <tr>
        <td colspan="3"></td>
        <td style="text-align:right; font-weight:700; color:var(--dark); padding-top:8px; border-top:1px solid var(--border); white-space:nowrap;">Total:</td>
        <td style="text-align:right; font-weight:700; color:var(--primary); padding-top:8px; border-top:1px solid var(--border); white-space:nowrap;">${fmt(totalGeneral)}</td>
    </tr>
`

    document.getElementById('modal-detalle-compra').classList.remove('hidden')
}


// == ANULAR COMPRA ==
async function anularCompra(id) {
    if (!confirm('¿Está seguro de anular esta compra? Se revertirá el inventario.')) return

    const res  = await fetch(`${API}/compras/anular/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ IdEmpleado: usuario.IdEmpleado, Observacion: 'Anulado desde el sistema' })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cargarCompras()
}

let estadoActivo = ''

function filtrarEstado(estado, btn) {
    estadoActivo = estado
    document.querySelectorAll('#filtros-chips .chip').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    cargarCompras()
}

function imprimirCompra() {
    const info   = document.getElementById('info-compra').innerHTML
    const tabla  = document.getElementById('tabla-detalle-compra').innerHTML

    const ventana = window.open('', '_blank', 'width=800,height=600')
    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Detalle de Compra</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Segoe UI', sans-serif; padding:30px; color:#333; }
                h2 { font-size:18px; color:#1d2939; margin-bottom:20px; }
                .info { font-size:13px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
                .info div { margin-bottom:4px; }
                .badge { padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; }
                .badge-success { background:#e6fffa; color:#00875a; }
                .badge-danger  { background:#fff5f5; color:#e53e3e; }
                table { width:100%; border-collapse:collapse; font-size:13px; margin-top:10px; }
                thead th { background:#1d2939; color:white; padding:10px 12px; text-align:left; font-size:12px; }
                tbody td { padding:10px 12px; border-bottom:1px solid #eee; }
                tbody tr:last-child td { border-bottom:none; }
                .totales td { font-size:13px; padding:6px 12px; }
                @media print {
                    body { padding:10px; }
                    button { display:none; }
                }
            </style>
        </head>
        <body>
            <h2>Detalle de Compra</h2>
            <div class="info">${info}</div>
            <table>
                <thead>
                    <tr>
                        <th>Artículo</th>
                        <th>Código</th>
                        <th>Cant.</th>
                        <th>P. Unit.</th>
                        <th>Desc.</th>
                    </tr>
                </thead>
                <tbody>${tabla}</tbody>
            </table>
            <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `)
    ventana.document.close()
}

cargarCompras()