const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

let articulos  = []
let lineas     = []

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

// == CARGAR COMPRAS ==
async function cargarCompras() {
    const res   = await fetch(`${API}/compras`)
    const datos = await res.json()
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
            <td>${c.FechaEmision ? new Date(c.FechaEmision).toLocaleDateString('es-HN') : '-'}</td>
            <td>${new Date(c.FechaIngreso).toLocaleDateString('es-HN')}</td>
            <td>L. ${parseFloat(c.Subtotal).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td>L. ${parseFloat(c.ISV || 0).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td>L. ${parseFloat(c.Total).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td><span class="badge ${c.Estado === 'Anulada' ? 'badge-danger' : 'badge-success'}">${c.Estado}</span></td>
            <td style="display:flex; gap:6px;">
                <button class="btn-edit" onclick="verDetalle(${c.IdFacturaEntrada}, '${c.NumeroFacturaProveedor}', '${c.Proveedor}')">Ver</button>
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

// == BUSCADOR DE ARTICULOS ==
let lineaActual = null

function agregarLinea() {
    const idx = lineas.length
    lineas.push({ IdProductoMarca: '', NombreArticulo: '', Cantidad: 1, PrecioUnitario: 0, Descuento: 0 })

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
            (a.Caracteristica1 && a.Caracteristica1.toLowerCase().includes(texto)) ||
            (a.Tamanio && a.Tamanio.toLowerCase().includes(texto))
        )
    )

    const tbody = document.getElementById('resultados-articulos')

    if (!filtrados.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">Sin resultados</td></tr>`
        return
    }

    tbody.innerHTML = filtrados.map(a => `
        <tr style="cursor:pointer;" onmouseover="this.style.background='#f0f4f8'" onmouseout="this.style.background=''" onclick="seleccionarArticulo(${a.IdProductoMarca}, '${a.NombreProducto} - ${a.NombreMarca} ${a.Tamanio ? '(' + a.Tamanio + ')' : ''}', ${a.PrecioVenta || 0})">
            <td>${a.CodigoVariante}</td>
            <td>${a.NombreProducto}</td>
            <td>${a.NombreMarca}</td>
            <td>${a.Tamanio || '-'}</td>
            <td>${a.Caracteristica1 || '-'}</td>
        </tr>
    `).join('')
}

function seleccionarArticulo(id, nombre, precio) {
    const idx = lineaActual
    lineas[idx].IdProductoMarca = id
    lineas[idx].NombreArticulo  = nombre
    lineas[idx].PrecioUnitario  = precio

    document.getElementById(`art-nombre-${idx}`).value = nombre
    document.getElementById(`precio-${idx}`).value     = precio

    actualizarLinea(idx, 'PrecioUnitario', precio)
    document.getElementById('modal-buscar-articulo').classList.add('hidden')
}

function actualizarLinea(idx, campo, valor) {
    lineas[idx][campo] = campo === 'IdProductoMarca' ? valor : parseFloat(valor) || 0
    const subtotal = (lineas[idx].Cantidad * lineas[idx].PrecioUnitario) - lineas[idx].Descuento
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
    const subtotal = lineas
        .filter(l => l)
        .reduce((acc, l) => acc + (l.Cantidad * l.PrecioUnitario) - l.Descuento, 0)
    const isv   = subtotal * 0.15
    const total = subtotal + isv

    document.getElementById('res-subtotal').textContent = `L. ${subtotal.toLocaleString('es-HN', {minimumFractionDigits:2})}`
    document.getElementById('res-isv').textContent      = `L. ${isv.toLocaleString('es-HN', {minimumFractionDigits:2})}`
    document.getElementById('res-total').textContent    = `L. ${total.toLocaleString('es-HN', {minimumFractionDigits:2})}`
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
        Detalle:                detalle.map(l => ({
            IdProductoMarca:  parseInt(l.IdProductoMarca),
            CodigoProducto:   '',
            Cantidad:         l.Cantidad,
            PrecioUnitario:   l.PrecioUnitario,
            Descuento:        l.Descuento,
            FechaVencimiento: null
        }))
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
async function verDetalle(id, nfactura, proveedor) {
    const res   = await fetch(`${API}/compras/${id}/detalle`)
    const datos = await res.json()

    document.getElementById('info-compra').innerHTML = `
        <strong>Factura:</strong> ${nfactura || '-'} &nbsp;|&nbsp;
        <strong>Proveedor:</strong> ${proveedor}
    `

    document.getElementById('tabla-detalle-compra').innerHTML = datos.map(d => `
        <tr>
            <td>${d.NombreProducto} - ${d.NombreMarca}</td>
            <td>${d.CodigoVariante}</td>
            <td>${d.Cantidad}</td>
            <td>L. ${parseFloat(d.PrecioUnitario).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td>L. ${parseFloat(d.Descuento || 0).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
            <td>L. ${parseFloat(d.Subtotal).toLocaleString('es-HN', {minimumFractionDigits:2})}</td>
        </tr>
    `).join('')

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

cargarCompras()