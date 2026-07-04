const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

let todosLosEmpleados = []

function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden')
    if (id === 'modal-empleado') cargarSelectRoles('inp-emp-rol')
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

async function cargarSelectRoles(selectId) {
    const res   = await fetch(`${API}/empleados/roles`)
    const datos = await res.json()
    document.getElementById(selectId).innerHTML =
        datos.map(r => `<option value="${r.IdRol}">${r.NombreRol}</option>`).join('')
}

// == CARGAR EMPLEADOS ==
async function cargarEmpleados() {
    const res   = await fetch(`${API}/empleados`)
    const datos = await res.json()
    todosLosEmpleados = datos
    renderizarEmpleados(datos)
}

function filtrarEmpleados() {
    const texto = document.getElementById('buscador-empleado').value.toLowerCase().trim()
    const filtrados = todosLosEmpleados.filter(e =>
        e.Nombre.toLowerCase().includes(texto) ||
        (e.Identidad && e.Identidad.toLowerCase().includes(texto))
    )
    renderizarEmpleados(filtrados)
}

function renderizarEmpleados(datos) {
    const tbody = document.getElementById('tabla-empleados')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Sin empleados</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((e, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${e.Nombre}</td>
            <td>${e.Identidad || '-'}</td>
            <td>${e.NombreRol || '-'}</td>
            <td>${e.Cargo || '-'}</td>
            <td>${e.Salario ? 'L. ' + parseFloat(e.Salario).toLocaleString('es-HN', {minimumFractionDigits: 2}) : '-'}</td>
            <td>${e.Telefono || '-'}</td>
            <td><span class="badge ${e.Activo ? 'badge-success' : 'badge-danger'}">${e.Activo ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn-edit" onclick="editarEmpleado(${e.IdEmpleado}, ${e.IdRol}, '${e.Nombre}', '${e.Identidad || ''}', '${e.Telefono || ''}', '${e.Correo || ''}', '${e.Direccion || ''}', ${e.Activo ? 1 : 0})">Editar</button></td>
        </tr>
    `).join('')
}

// == GUARDAR EMPLEADO ==
async function guardarEmpleado() {
    const body = {
        IdRol:     document.getElementById('inp-emp-rol').value,
        Nombre:    document.getElementById('inp-emp-nombre').value.trim(),
        Identidad: document.getElementById('inp-emp-identidad').value.trim(),
        Telefono:  document.getElementById('inp-emp-telefono').value.trim(),
        Correo:    document.getElementById('inp-emp-correo').value.trim(),
        Direccion: document.getElementById('inp-emp-direccion').value.trim()
    }

    if (!body.Nombre) return alert('El nombre es requerido')

    const res  = await fetch(`${API}/empleados`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-empleado')
    cargarEmpleados()
}

// == EDITAR EMPLEADO ==
async function editarEmpleado(id, idRol, nombre, identidad, telefono, correo, direccion, activo) {
    document.getElementById('edit-emp-id').value        = id
    document.getElementById('edit-emp-nombre').value    = nombre
    document.getElementById('edit-emp-identidad').value = identidad || ''
    document.getElementById('edit-emp-telefono').value  = telefono  || ''
    document.getElementById('edit-emp-correo').value    = correo    || ''
    document.getElementById('edit-emp-direccion').value = direccion || ''
    document.getElementById('edit-emp-activo').checked  = activo == 1
    document.getElementById('edit-emp-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'
    document.getElementById('modal-edit-empleado').classList.remove('hidden')

    document.getElementById('edit-emp-activo').onchange = function() {
        document.getElementById('edit-emp-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }

    await cargarSelectRoles('edit-emp-rol')
    document.getElementById('edit-emp-rol').value = idRol
}

async function actualizarEmpleado() {
    const id   = document.getElementById('edit-emp-id').value
    const body = {
        IdRol:     document.getElementById('edit-emp-rol').value,
        Nombre:    document.getElementById('edit-emp-nombre').value.trim(),
        Identidad: document.getElementById('edit-emp-identidad').value.trim(),
        Telefono:  document.getElementById('edit-emp-telefono').value.trim(),
        Correo:    document.getElementById('edit-emp-correo').value.trim(),
        Direccion: document.getElementById('edit-emp-direccion').value.trim(),
        Activo:    document.getElementById('edit-emp-activo').checked ? 1 : 0
    }

    if (!body.Nombre) return alert('El nombre es requerido')

    const res  = await fetch(`${API}/empleados/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-empleado')
    cargarEmpleados()
}

cargarEmpleados()