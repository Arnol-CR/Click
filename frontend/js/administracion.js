const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden')
    if (id === 'modal-usuario') cargarSelectEmpleados()
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

function togglePass(inputId, ojoId) {
    const input = document.getElementById(inputId)
    const ojo   = document.getElementById(ojoId)
    if (input.type === 'password') {
        input.type = 'text'
        ojo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        </svg>`
    } else {
        input.type = 'password'
        ojo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>`
    }
}

// == CARGAR USUARIOS ==
async function cargarUsuarios() {
    const res   = await fetch(`${API}/usuarios`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-usuarios')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Sin usuarios</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((u, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${u.NombreEmpleado}</td>
            <td>${u.Usuario}</td>
            <td>${u.NombreRol}</td>
            <td>${u.UltimoAcceso ? new Date(u.UltimoAcceso).toLocaleDateString('es-HN') : '-'}</td>
            <td><span class="badge ${u.Activo ? 'badge-success' : 'badge-danger'}">${u.Activo ? 'Activo' : 'Inactivo'}</span></td>
            <td><span class="badge ${u.Bloqueado ? 'badge-danger' : 'badge-success'}">${u.Bloqueado ? 'Bloqueado' : 'OK'}</span></td>
            <td style="display:flex; gap:6px;">
                <button class="btn-edit" onclick="editarUsuario(${u.IdUsuario}, '${u.NombreEmpleado}', '${u.Usuario}', ${u.Activo ? 1 : 0})">Editar</button>
                <button class="btn-edit" style="background:var(--dark);" onclick="abrirCambioContrasena(${u.IdUsuario})">Contraseña</button>
                ${u.Bloqueado ? `<button class="btn-edit" style="background:#00875a;" onclick="desbloquear(${u.IdUsuario})">Desbloquear</button>` : ''}
            </td>
        </tr>
    `).join('')
}

// == SELECT EMPLEADOS ==
async function cargarSelectEmpleados() {
    const res   = await fetch(`${API}/empleados`)
    const datos = await res.json()
    document.getElementById('inp-usu-empleado').innerHTML =
        datos.filter(e => e.Activo)
             .map(e => `<option value="${e.IdEmpleado}">${e.Nombre}</option>`).join('')
}

// == GUARDAR USUARIO ==
async function guardarUsuario() {
    const body = {
        IdEmpleado: document.getElementById('inp-usu-empleado').value,
        Usuario:    document.getElementById('inp-usu-usuario').value.trim(),
        Contrasena: document.getElementById('inp-usu-contrasena').value
    }

    if (!body.Usuario || !body.Contrasena) return alert('Usuario y contraseña son requeridos')

    const res  = await fetch(`${API}/usuarios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-usuario')
    cargarUsuarios()
}

// == EDITAR USUARIO ==
function editarUsuario(id, empleado, usuario, activo) {
    document.getElementById('edit-usu-id').value       = id
    document.getElementById('edit-usu-empleado').value = empleado
    document.getElementById('edit-usu-usuario').value  = usuario
    document.getElementById('edit-usu-activo').checked = activo == 1
    document.getElementById('edit-usu-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'
    document.getElementById('modal-edit-usuario').classList.remove('hidden')

    document.getElementById('edit-usu-activo').onchange = function() {
        document.getElementById('edit-usu-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }
}

async function actualizarUsuario() {
    const id   = document.getElementById('edit-usu-id').value
    const body = {
        Usuario: document.getElementById('edit-usu-usuario').value.trim(),
        Activo:  document.getElementById('edit-usu-activo').checked ? 1 : 0
    }

    if (!body.Usuario) return alert('El usuario es requerido')

    const res  = await fetch(`${API}/usuarios/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-usuario')
    cargarUsuarios()
}

// == CAMBIAR CONTRASEÑA ==
function abrirCambioContrasena(id) {
    document.getElementById('pass-usu-id').value       = id
    document.getElementById('pass-usu-nueva').value    = ''
    document.getElementById('pass-usu-confirmar').value = ''
    document.getElementById('modal-contrasena').classList.remove('hidden')
}

async function cambiarContrasena() {
    const id        = document.getElementById('pass-usu-id').value
    const nueva     = document.getElementById('pass-usu-nueva').value
    const confirmar = document.getElementById('pass-usu-confirmar').value

    if (!nueva) return alert('Ingresa la nueva contraseña')
    if (nueva !== confirmar) return alert('Las contraseñas no coinciden')

    const res  = await fetch(`${API}/usuarios/contrasena/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ Contrasena: nueva })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-contrasena')
    alert('Contraseña actualizada correctamente')
}

// == DESBLOQUEAR ==
async function desbloquear(id) {
    if (!confirm('¿Desbloquear este usuario?')) return

    const res  = await fetch(`${API}/usuarios/desbloquear/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cargarUsuarios()
}

cargarUsuarios()