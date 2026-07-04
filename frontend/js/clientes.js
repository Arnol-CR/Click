const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'


const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden')
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

// == CARGAR CLIENTES ==
// Variable global para guardar todos los clientes
let todosLosClientes = []

async function cargarClientes() {
    const res   = await fetch(`${API}/clientes`)
    const datos = await res.json()
    todosLosClientes = datos  // guardar para filtrar
    renderizarClientes(datos)
}

function filtrarClientes() {
    const texto = document.getElementById('buscador-cliente').value.toLowerCase().trim()
    
    const filtrados = todosLosClientes.filter(c =>
        c.NombreORazonSocial.toLowerCase().includes(texto) ||
        (c.Identidad && c.Identidad.toLowerCase().includes(texto)) ||
        (c.RTN && c.RTN.toLowerCase().includes(texto))
    )
    renderizarClientes(filtrados)
}

function renderizarClientes(datos) {
    const tbody = document.getElementById('tabla-clientes')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Sin resultados</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${c.NombreORazonSocial}</td>
            <td>${c.RTN || '-'}</td>
            <td>${c.Identidad || '-'}</td>
            <td>${c.Telefono || '-'}</td>
            <td>${c.Correo || '-'}</td>
            <td>L. ${parseFloat(c.LimiteCredito || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</td>
            <td><span class="badge ${c.Activo ? 'badge-success' : 'badge-danger'}">${c.Activo ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn-edit" onclick="editarCliente(${c.IdCliente}, '${c.NombreORazonSocial}', '${c.RTN || ''}', '${c.Identidad || ''}', '${c.Telefono || ''}', '${c.Correo || ''}', '${c.Direccion || ''}', ${c.LimiteCredito || 0}, ${c.Activo ? 1 : 0})">Editar</button></td>
        </tr>
    `).join('')
}

// == GUARDAR CLIENTE ==
async function guardarCliente() {
    const body = {
        IdTipoCliente:      1,
        NombreORazonSocial: document.getElementById('inp-cli-nombre').value.trim(),
        RTN:                document.getElementById('inp-cli-rtn').value.trim(),
        Identidad:          document.getElementById('inp-cli-identidad').value.trim(),
        Telefono:           document.getElementById('inp-cli-telefono').value.trim(),
        Correo:             document.getElementById('inp-cli-correo').value.trim(),
        Direccion:          document.getElementById('inp-cli-direccion').value.trim(),
        LimiteCredito:      document.getElementById('inp-cli-credito').value || 0
    }

    if (!body.NombreORazonSocial) return alert('El nombre es requerido')

    const res  = await fetch(`${API}/clientes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-cliente')
    document.getElementById('inp-cli-nombre').value    = ''
    document.getElementById('inp-cli-rtn').value       = ''
    document.getElementById('inp-cli-identidad').value = ''
    document.getElementById('inp-cli-telefono').value  = ''
    document.getElementById('inp-cli-correo').value    = ''
    document.getElementById('inp-cli-direccion').value = ''
    document.getElementById('inp-cli-credito').value   = '0'
    cargarClientes()
}

// == EDITAR CLIENTE ==
function editarCliente(id, nombre, rtn, identidad, telefono, correo, direccion, credito, activo) {
    document.getElementById('edit-cli-id').value        = id
    document.getElementById('edit-cli-nombre').value    = nombre
    document.getElementById('edit-cli-rtn').value       = rtn       || ''
    document.getElementById('edit-cli-identidad').value = identidad || ''
    document.getElementById('edit-cli-telefono').value  = telefono  || ''
    document.getElementById('edit-cli-correo').value    = correo    || ''
    document.getElementById('edit-cli-direccion').value = direccion || ''
    document.getElementById('edit-cli-credito').value   = credito   || 0
    document.getElementById('edit-cli-activo').checked  = activo == 1
    document.getElementById('edit-cli-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'
    document.getElementById('modal-edit-cliente').classList.remove('hidden')

    document.getElementById('edit-cli-activo').onchange = function() {
        document.getElementById('edit-cli-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }
}

async function actualizarCliente() {
    const id   = document.getElementById('edit-cli-id').value
    const body = {
        NombreORazonSocial: document.getElementById('edit-cli-nombre').value.trim(),
        RTN:                document.getElementById('edit-cli-rtn').value.trim(),
        Identidad:          document.getElementById('edit-cli-identidad').value.trim(),
        Telefono:           document.getElementById('edit-cli-telefono').value.trim(),
        Correo:             document.getElementById('edit-cli-correo').value.trim(),
        Direccion:          document.getElementById('edit-cli-direccion').value.trim(),
        LimiteCredito:      document.getElementById('edit-cli-credito').value || 0,
        Activo:             document.getElementById('edit-cli-activo').checked ? 1 : 0
    }

    if (!body.NombreORazonSocial) return alert('El nombre es requerido')

    const res  = await fetch(`${API}/clientes/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-cliente')
    cargarClientes()
}

cargarClientes()