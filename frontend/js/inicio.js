const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

// Verificar sesión
const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

// Mostrar fecha
const hoy = new Date()
document.getElementById('fecha-hoy').textContent = hoy.toLocaleDateString('es-HN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

// Cargar últimas ventas
async function cargarVentas() {
    try {
        const res    = await fetch(`${API}/ventas`)
        const ventas = await res.json()
        const tbody  = document.getElementById('tabla-ventas')

        if (!ventas.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#888; padding:30px;">
                        Sin ventas registradas
                    </td>
                </tr>`
            return
        }

        tbody.innerHTML = ventas.map(v => `
            <tr>
                <td>${v.NumeroFactura}</td>
                <td>${v.Cliente}</td>
                <td>${new Date(v.FechaEmision).toLocaleDateString('es-HN')}</td>
                <td>L. ${parseFloat(v.TotalFactura).toLocaleString('es-HN', {minimumFractionDigits: 2})}</td>
                <td>
                    <span class="badge ${
                        v.Estado === 'Emitida'  ? 'badge-success' :
                        v.Estado === 'Anulada'  ? 'badge-danger'  :
                        'badge-warning'
                    }">${v.Estado}</span>
                </td>
            </tr>
        `).join('')

    } catch (err) {
        console.error('Error cargando ventas:', err)
    }
}

cargarVentas()