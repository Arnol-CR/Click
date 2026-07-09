const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

let todosLosItems = []
let estadoFiltro  = ''

async function cargarInventario() {
    const res   = await fetch(`${API}/inventario`)
    const datos = await res.json()
    todosLosItems = datos
    renderizarInventario(datos)
}

function filtrarInventario() {
    const texto = document.getElementById('buscador-inv').value.toLowerCase().trim()
    const filtrados = todosLosItems.filter(i => {
        const coincideTexto = 
            i.NombreProducto.toLowerCase().includes(texto) ||
            i.NombreMarca.toLowerCase().includes(texto)    ||
            (i.CodigoVariante && i.CodigoVariante.toLowerCase().includes(texto)) ||
            (i.CodigoProducto && i.CodigoProducto.toLowerCase().includes(texto))
        const coincideEstado = estadoFiltro ? i.EstadoStock === estadoFiltro : true
        return coincideTexto && coincideEstado
    })
    renderizarInventario(filtrados)
}

function filtrarEstado(estado, btn) {
    estadoFiltro = estado
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    filtrarInventario()
}

function badgeEstado(estado) {
    switch(estado) {
        case 'OK':         return 'badge-success'
        case 'Stock bajo': return 'badge-warning'
        case 'Sin stock':  return 'badge-danger'
        case 'Por vencer': return 'badge-warning'
        case 'Vencido':    return 'badge-danger'
        default:           return 'badge-success'
    }
}

function fmt(n) {
    if (!n && n !== 0) return '-'
    return `L. ${parseFloat(n).toLocaleString('es-HN', {minimumFractionDigits:2})}`
}

function renderizarInventario(datos) {
    const tbody = document.getElementById('tabla-inventario')
    document.getElementById('total-registros').textContent = `${datos.length} registros`

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center">Sin resultados</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((i, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${i.NombreProducto}</td>
            <td>${i.NombreMarca}</td>
            <td>${i.CodigoVariante || '-'}</td>
            <td>${i.NombreCategoria}</td>
            <td>${i.Tamanio || '-'}</td>
            <td style="font-weight:600; color:${i.StockActual <= i.StockMinimo ? '#e53e3e' : 'inherit'}">
                ${parseFloat(i.StockActual).toLocaleString('es-HN')} ${i.UnidadMedida || ''}
            </td>
            <td>${parseFloat(i.StockMinimo || 0).toLocaleString('es-HN')}</td>
            <td>${fmt(i.PrecioCompra)}</td>
            <td>${fmt(i.PrecioVenta)}</td>
            <td><span class="badge ${badgeEstado(i.EstadoStock)}">${i.EstadoStock}</span></td>
        </tr>
    `).join('')
}

cargarInventario()