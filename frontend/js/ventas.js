const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

let lineasVenta    = []
let articulosVenta = []
let lineaActualVenta = null

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

function formatFecha(fecha) {
    if (!fecha) return '-'
    const parte = fecha.toString().substring(0, 10)
    const [anio, mes, dia] = parte.split('-')
    return `${dia}/${mes}/${anio}`
}

function fmt(n) {
    if (!n && n !== 0) return '-'
    return `L. ${parseFloat(n).toLocaleString('es-HN', {minimumFractionDigits:2})}`
}

// == CARGAR VENTAS ==
async function cargarVentas() {
    const res   = await fetch(`${API}/ventas`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-ventas')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">Sin ventas registradas</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((v, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${v.NumeroFactura || '-'}</td>
            <td>${v.Cliente}</td>
            <td>${formatFecha(v.FechaEmision)}</td>
            <td>${fmt(v.SubtotalExento)}</td>
            <td>${fmt(v.SubtotalGravado15)}</td>
            <td>${fmt(v.TotalISV)}</td>
            <td>${fmt(v.TotalFactura)}</td>
            <td><span class="badge ${v.Estado === 'Anulada' ? 'badge-danger' : 'badge-success'}">${v.Estado}</span></td>
            <td style="display:flex; gap:6px;">
                <button class="btn-edit" onclick="verDetalleVenta(${v.FacturaID}, '${v.NumeroFactura || ''}', '${v.Cliente}', '${v.FechaEmision || ''}', '${v.Estado}')">Ver</button>
                ${v.Estado !== 'Anulada' ? `<button class="btn-edit" style="background:#e53e3e;" onclick="anularVenta(${v.FacturaID})">Anular</button>` : ''}
            </td>
        </tr>
    `).join('')
}

// == ABRIR NUEVA VENTA ==
async function abrirNuevaVenta() {
    lineasVenta = []
    document.getElementById('detalle-venta').innerHTML = ''
    document.getElementById('inp-ven-fecha').value = new Date().toISOString().split('T')[0]
    actualizarTotalesVenta()

    const [resClientes, resArticulos] = await Promise.all([
        fetch(`${API}/clientes`),
        fetch(`${API}/productos/variantes`)
    ])
    const clientes = await resClientes.json()
    articulosVenta = await resArticulos.json()

    document.getElementById('inp-ven-cliente').innerHTML =
        clientes.filter(c => c.Activo)
                .map(c => `<option value="${c.IdCliente}">${c.NombreORazonSocial}</option>`).join('')

    document.getElementById('modal-venta').classList.remove('hidden')
}

// == AGREGAR LINEA ==
function agregarLineaVenta() {
    const idx = lineasVenta.length
    lineasVenta.push({ IdProductoMarca: '', NombreArticulo: '', Cantidad: 1, PrecioUnitario: 0, Descuento: 0, Exento: false })

    const tr = document.createElement('tr')
    tr.id    = `linea-ven-${idx}`
    tr.innerHTML = `
        <td>
            <div style="display:flex; gap:6px; align-items:center; width:100%;">
                <input type="text" id="art-ven-nombre-${idx}" placeholder="Buscar artículo..." readonly
                    style="flex:1; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px; background:#f8fafc; cursor:pointer;"
                    onclick="abrirBuscadorVenta(${idx})"/>
                <button onclick="abrirBuscadorVenta(${idx})"
                    style="background:var(--primary); color:white; border:none; border-radius:6px; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                    </svg>
                </button>
            </div>
        </td>
        <td><input type="number" value="1" min="1" onchange="actualizarLineaVenta(${idx}, 'Cantidad', this.value)" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td><input type="number" value="0" min="0" step="0.01" id="precio-ven-${idx}" onchange="actualizarLineaVenta(${idx}, 'PrecioUnitario', this.value)" style="width:90px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td><input type="number" value="0" min="0" step="0.01" onchange="actualizarLineaVenta(${idx}, 'Descuento', this.value)" style="width:80px; padding:6px; border:1px solid var(--border); border-radius:6px; font-size:12px;"/></td>
        <td id="isv-ven-${idx}" style="font-size:12px; color:#888; white-space:nowrap;">-</td>
        <td id="subtotal-ven-${idx}" style="font-size:13px; font-weight:600; white-space:nowrap;">L. 0.00</td>
        <td><button onclick="eliminarLineaVenta(${idx})" style="background:#e53e3e; color:white; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">✕</button></td>
    `
    document.getElementById('detalle-venta').appendChild(tr)
}

function actualizarLineaVenta(idx, campo, valor) {
    lineasVenta[idx][campo] = campo === 'IdProductoMarca' ? valor : parseFloat(valor) || 0
    const base     = (lineasVenta[idx].Cantidad * lineasVenta[idx].PrecioUnitario) - lineasVenta[idx].Descuento
    const isv      = lineasVenta[idx].Exento ? 0 : base * 0.15
    const subtotal = base + isv

    const isvEl = document.getElementById(`isv-ven-${idx}`)
    const subEl = document.getElementById(`subtotal-ven-${idx}`)
    if (isvEl) isvEl.textContent = lineasVenta[idx].Exento ? 'Exento' : `L. ${isv.toFixed(2)}`
    if (subEl) subEl.textContent = `L. ${subtotal.toLocaleString('es-HN', {minimumFractionDigits:2})}`
    actualizarTotalesVenta()
}

function eliminarLineaVenta(idx) {
    lineasVenta[idx] = null
    const tr = document.getElementById(`linea-ven-${idx}`)
    if (tr) tr.remove()
    actualizarTotalesVenta()
}

function actualizarTotalesVenta() {
    let subtotalExento = 0
    let subtotalGrav15 = 0

    lineasVenta.filter(l => l && l.IdProductoMarca).forEach(l => {
        const base = (l.Cantidad * l.PrecioUnitario) - l.Descuento
        if (l.Exento) subtotalExento += base
        else          subtotalGrav15 += base
    })

    const isv15 = subtotalGrav15 * 0.15
    const total = subtotalExento + subtotalGrav15 + isv15
    const fmt   = n => `L. ${n.toLocaleString('es-HN', {minimumFractionDigits:2})}`

    document.getElementById('ven-exento').textContent   = fmt(subtotalExento)
    document.getElementById('ven-grav15').textContent   = fmt(subtotalGrav15)
    document.getElementById('ven-subtotal').textContent = fmt(subtotalExento + subtotalGrav15)
    document.getElementById('ven-isv').textContent      = fmt(isv15)
    document.getElementById('ven-total').textContent    = fmt(total)
}

// == BUSCADOR ==
function abrirBuscadorVenta(idx) {
    lineaActualVenta = idx
    document.getElementById('inp-buscar-articulo-venta').value = ''
    document.getElementById('resultados-articulos-venta').innerHTML = '<tr><td colspan="6" class="text-center">Escriba para buscar...</td></tr>'
    document.getElementById('modal-buscar-articulo-venta').classList.remove('hidden')
    document.getElementById('inp-buscar-articulo-venta').focus()
    buscarArticulosVenta()
}

function buscarArticulosVenta() {
    const texto = document.getElementById('inp-buscar-articulo-venta').value.toLowerCase().trim()

    const filtrados = articulosVenta.filter(a =>
        a.Activo && (
            a.NombreProducto.toLowerCase().includes(texto) ||
            a.NombreMarca.toLowerCase().includes(texto)    ||
            a.CodigoVariante.toLowerCase().includes(texto) ||
            (a.CodigoBarras && a.CodigoBarras.toLowerCase().includes(texto)) ||
            (a.Tamanio && a.Tamanio.toLowerCase().includes(texto))
        )
    )

    const tbody = document.getElementById('resultados-articulos-venta')

    if (!filtrados.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Sin resultados</td></tr>`
        return
    }

    tbody.innerHTML = filtrados.map(a => `
        <tr style="cursor:pointer;"
            onmouseover="this.style.background='#f0f4f8'"
            onmouseout="this.style.background=''"
            onclick="seleccionarArticuloVenta(${a.IdProductoMarca}, '${a.NombreProducto} - ${a.NombreMarca} ${a.Tamanio ? '(' + a.Tamanio + ')' : ''}', ${a.PrecioVenta || 0}, ${a.Exento ? 1 : 0})">
            <td>${a.CodigoVariante}</td>
            <td>${a.NombreProducto}</td>
            <td>${a.NombreMarca}</td>
            <td>${a.Tamanio || '-'}</td>
            <td>${a.StockActual || 0}</td>
            <td>${fmt(a.PrecioVenta)}</td>
        </tr>
    `).join('')
}

function seleccionarArticuloVenta(id, nombre, precio, exento) {
    const idx = lineaActualVenta
    lineasVenta[idx].IdProductoMarca = id
    lineasVenta[idx].NombreArticulo  = nombre
    lineasVenta[idx].PrecioUnitario  = precio
    lineasVenta[idx].Exento          = exento == 1

    document.getElementById(`art-ven-nombre-${idx}`).value = nombre
    document.getElementById(`precio-ven-${idx}`).value     = precio

    const isvEl = document.getElementById(`isv-ven-${idx}`)
    if (isvEl) isvEl.textContent = exento == 1 ? 'Exento' : '15%'

    actualizarLineaVenta(idx, 'PrecioUnitario', precio)
    document.getElementById('modal-buscar-articulo-venta').classList.add('hidden')
}

// == GUARDAR VENTA ==
async function guardarVenta() {
    const detalle = lineasVenta.filter(l => l && l.IdProductoMarca)
    if (!detalle.length) return alert('Agrega al menos un producto')

    const body = {
        ClienteID:     document.getElementById('inp-ven-cliente').value,
        IdEmpleado:    usuario.IdEmpleado,
        NumeroFactura: document.getElementById('inp-ven-nfactura').value.trim(),
        FechaEmision:  document.getElementById('inp-ven-fecha').value,
        Descuento:     0,
        Detalle:       detalle.map(l => {
            const base = (l.Cantidad * l.PrecioUnitario) - l.Descuento
            const isv  = l.Exento ? 0 : base * 0.15
            return {
                IdProductoMarca: parseInt(l.IdProductoMarca),
                Cantidad:        l.Cantidad,
                PrecioUnitario:  l.PrecioUnitario,
                Descuento:       l.Descuento,
                Subtotal:        parseFloat((base + isv).toFixed(2)),
                Exento:          l.Exento ? 1 : 0
            }
        })
    }

    if (!body.NumeroFactura) return alert('Ingresa el número de factura')

    const res  = await fetch(`${API}/ventas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-venta')
    cargarVentas()
}

// == VER DETALLE ==
async function verDetalleVenta(id, nfactura, cliente, fecha, estado) {
    const res   = await fetch(`${API}/ventas/${id}/detalle`)
    const datos = await res.json()

    document.getElementById('info-venta').innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <div><strong>Factura:</strong> ${nfactura || '-'}</div>
            <div><strong>Cliente:</strong> ${cliente}</div>
            <div><strong>Fecha:</strong> ${formatFecha(fecha)}</div>
            <div><strong>Estado:</strong> <span class="badge ${estado === 'Anulada' ? 'badge-danger' : 'badge-success'}">${estado}</span></div>
        </div>
    `

    let totalBase = 0
    let totalISV  = 0

    const filas = datos.map(d => {
        const base     = parseFloat(d.Cantidad) * parseFloat(d.PrecioUnitario)
        const desc     = parseFloat(d.Descuento || 0)
        const neto     = base - desc
        const isv      = d.Exento ? 0 : neto * 0.15
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

    document.getElementById('tabla-detalle-venta').innerHTML = filas + `
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

    document.getElementById('modal-detalle-venta').classList.remove('hidden')
}

// == IMPRIMIR ==
function imprimirVenta() {
    window.print()
}

// == ANULAR ==
async function anularVenta(id) {
    if (!confirm('¿Está seguro de anular esta venta? Se revertirá el inventario.')) return

    const res  = await fetch(`${API}/ventas/anular/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ IdEmpleado: usuario.IdEmpleado, Observacion: 'Anulado desde el sistema' })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cargarVentas()
}

cargarVentas()