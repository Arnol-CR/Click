const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://click-erqg.onrender.com/api'

const usuario = JSON.parse(localStorage.getItem('usuario'))
if (!usuario) window.location.href = '/login'

// == TABS ==
function cambiarTab(tab, e) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'))
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.getElementById(`tab-${tab}`).classList.remove('hidden')
    e.target.classList.add('active')
}

// == MODALES ==
function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden')

    if (id === 'modal-producto') {
        cargarSelectCategorias()
        setTimeout(() => {
            document.getElementById('inp-prod-nombre').addEventListener('input', generarCodigoProducto)
            document.getElementById('inp-prod-categoria').addEventListener('change', generarCodigoProducto)
        }, 300)
    }

    if (id === 'modal-articulo') {
        cargarSelectProductos()
        cargarSelectMarcas()
        cargarSelectProveedores()
        setTimeout(() => {
            document.getElementById('inp-var-producto').addEventListener('change', generarCodigo)
            document.getElementById('inp-var-marca').addEventListener('change', generarCodigo)
            document.getElementById('inp-var-tamanio').addEventListener('input', generarCodigo)
        }, 500)
    }
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden')
}

// == GENERAR CODIGOS ==
async function generarCodigoProducto() {
    const catSelect = document.getElementById('inp-prod-categoria')
    const catNombre = catSelect.options[catSelect.selectedIndex]?.text || ''
    if (!catNombre) return

    const prefijo     = catNombre.replace(/\s+/g, '').substring(0, 3).toUpperCase()
    const idCategoria = catSelect.value
    const res         = await fetch(`${API}/productos?categoria=${idCategoria}`)
    const datos       = await res.json()
    const siguiente   = (datos.length + 1).toString().padStart(3, '0')

    document.getElementById('inp-prod-codigo').value = `${prefijo}-${siguiente}`
}

function generarCodigo() {
    const prodSelect  = document.getElementById('inp-var-producto')
    const marcaSelect = document.getElementById('inp-var-marca')
    const tamanio     = document.getElementById('inp-var-tamanio').value.trim()

    const prod  = prodSelect.options[prodSelect.selectedIndex]?.text  || ''
    const marca = marcaSelect.options[marcaSelect.selectedIndex]?.text || ''

    const partProd  = prod.replace(/\s+/g, '').substring(0, 3).toUpperCase()
    const partMarca = marca.replace(/\s+/g, '').substring(0, 3).toUpperCase()
    const partTam   = tamanio.replace(/\s+/g, '').toUpperCase()

    document.getElementById('inp-var-codigo').value = partTam
        ? `${partProd}-${partMarca}-${partTam}`
        : `${partProd}-${partMarca}`
}

// == CATEGORIAS ==
async function cargarCategorias() {
    const res   = await fetch(`${API}/productos/categorias`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-categorias')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">Sin categorías</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${c.NombreCategoria}</td>
            <td><button class="btn-edit" onclick="editarCategoria(${c.IdCategoria}, '${c.NombreCategoria}')">Editar</button></td>
        </tr>
    `).join('')
}

async function cargarSelectCategorias() {
    const res   = await fetch(`${API}/productos/categorias`)
    const datos = await res.json()
    document.getElementById('inp-prod-categoria').innerHTML =
        datos.map(c => `<option value="${c.IdCategoria}">${c.NombreCategoria}</option>`).join('')
}

async function guardarCategoria() {
    const nombre = document.getElementById('inp-categoria').value.trim()
    if (!nombre) return alert('Ingresa el nombre de la categoría')

    const res  = await fetch(`${API}/productos/categorias`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ NombreCategoria: nombre })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-categoria')
    document.getElementById('inp-categoria').value = ''
    cargarCategorias()
}

function editarCategoria(id, nombre) {
    document.getElementById('edit-cat-id').value     = id
    document.getElementById('edit-cat-nombre').value = nombre
    document.getElementById('modal-edit-categoria').classList.remove('hidden')
}

async function actualizarCategoria() {
    const id     = document.getElementById('edit-cat-id').value
    const nombre = document.getElementById('edit-cat-nombre').value.trim()
    if (!nombre) return alert('Ingresa el nombre')

    const res  = await fetch(`${API}/productos/categorias/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ NombreCategoria: nombre })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-categoria')
    cargarCategorias()
}

// == MARCAS ==
async function cargarMarcas() {
    const res   = await fetch(`${API}/productos/marcas`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-marcas')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">Sin marcas</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((m, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${m.NombreMarca}</td>
            <td><span class="badge ${m.Activo ? 'badge-success' : 'badge-danger'}">${m.Activo ? 'Activo' : 'Inactivo'}</span></td>
            <td><button class="btn-edit" onclick="editarMarca(${m.IdMarca}, '${m.NombreMarca}', ${m.Activo ? 1 : 0})">Editar</button></td>
        </tr>
    `).join('')
}

async function cargarSelectMarcas() {
    const res    = await fetch(`${API}/productos/marcas`)
    const datos  = await res.json()
    const activas = datos.filter(m => m.Activo)
    document.getElementById('inp-var-marca').innerHTML =
        activas.map(m => `<option value="${m.IdMarca}">${m.NombreMarca}</option>`).join('')
}

async function guardarMarca() {
    const nombre = document.getElementById('inp-marca').value.trim()
    if (!nombre) return alert('Ingresa el nombre de la marca')

    const res  = await fetch(`${API}/productos/marcas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ NombreMarca: nombre })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-marca')
    document.getElementById('inp-marca').value = ''
    cargarMarcas()
}

function editarMarca(id, nombre, activo) {
    document.getElementById('edit-mar-id').value       = id
    document.getElementById('edit-mar-nombre').value   = nombre
    document.getElementById('edit-mar-activo').checked = activo == 1
    document.getElementById('edit-mar-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'
    document.getElementById('modal-edit-marca').classList.remove('hidden')
    document.getElementById('edit-mar-activo').onchange = function() {
        document.getElementById('edit-mar-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }
}

async function actualizarMarca() {
    const id     = document.getElementById('edit-mar-id').value
    const nombre = document.getElementById('edit-mar-nombre').value.trim()
    const activo = document.getElementById('edit-mar-activo').checked ? 1 : 0
    if (!nombre) return alert('Ingresa el nombre')

    const res  = await fetch(`${API}/productos/marcas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ NombreMarca: nombre, Activo: activo })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    cerrarModal('modal-edit-marca')
    cargarMarcas()
}

// == PRODUCTOS ==
async function cargarProductos() {
    const res   = await fetch(`${API}/productos`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-productos')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">Sin productos</td></tr>`
        return
    }

tbody.innerHTML = datos.map(p => `
    <tr>
        <td>${p.Codigo}</td>
        <td>${p.NombreProducto}</td>
        <td>${p.NombreCategoria}</td>
         <td><span class="badge ${p.Activo ? 'badge-success' : 'badge-danger'}">${p.Activo ? 'Activo' : 'Inactivo'}</span></td>
        <td><button class="btn-edit" onclick="editarProducto(${p.IdProducto}, ${p.IdCategoria}, '${p.NombreProducto}', '${p.Descripcion || ''}', ${p.Activo ? 1 : 0})">Editar</button></td>
    </tr>
`).join('')
}

async function cargarSelectProductos() {
    const res    = await fetch(`${API}/productos`)
    const datos  = await res.json()
    const activos = datos.filter(p => p.Activo)
    document.getElementById('inp-var-producto').innerHTML =
        activos.map(p => `<option value="${p.IdProducto}">${p.NombreProducto}</option>`).join('')
}

async function guardarProducto() {
    const body = {
        IdCategoria:    document.getElementById('inp-prod-categoria').value,
        Codigo:         document.getElementById('inp-prod-codigo').value.trim(),
        NombreProducto: document.getElementById('inp-prod-nombre').value.trim(),
        Descripcion:    document.getElementById('inp-prod-descripcion').value.trim(),
    }

    if (!body.Codigo || !body.NombreProducto) return alert('Código y nombre son requeridos')

    const res  = await fetch(`${API}/productos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-producto')
    cargarProductos()
}

async function editarProducto(id, idCategoria, nombre, descripcion, activo) {
    document.getElementById('edit-prod-id').value          = id
    document.getElementById('edit-prod-nombre').value      = nombre
    document.getElementById('edit-prod-descripcion').value = descripcion || ''
    document.getElementById('edit-prod-activo').checked    = activo == 1
    document.getElementById('edit-prod-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'

    document.getElementById('edit-prod-activo').onchange = function() {
        document.getElementById('edit-prod-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }

    const res   = await fetch(`${API}/productos/categorias`)
    const datos = await res.json()
    document.getElementById('edit-prod-categoria').innerHTML =
        datos.map(c => `<option value="${c.IdCategoria}" ${c.IdCategoria == idCategoria ? 'selected' : ''}>${c.NombreCategoria}</option>`).join('')

    document.getElementById('modal-edit-producto').classList.remove('hidden')
}


async function actualizarProducto() {
    const id   = document.getElementById('edit-prod-id').value
    const body = {
        IdCategoria:    document.getElementById('edit-prod-categoria').value,
        NombreProducto: document.getElementById('edit-prod-nombre').value.trim(),
        Descripcion:    document.getElementById('edit-prod-descripcion').value.trim(),
        Activo:         document.getElementById('edit-prod-activo').checked ? 1 : 0
    }
    if (!body.NombreProducto) return alert('Ingresa el nombre')

    const res  = await fetch(`${API}/productos/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    cerrarModal('modal-edit-producto')
    cargarProductos()
}

// == ARTICULOS ==
async function cargarArticulos() {
    const res   = await fetch(`${API}/productos/variantes`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-articulos')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Sin artículos</td></tr>`
        return
    }

    tbody.innerHTML = datos.map(v => `
        <tr>
            <td>${v.CodigoVariante}</td>
            <td>${v.NombreProducto}</td>
            <td>${v.NombreMarca}</td>
            <td>${v.Proveedor}</td>
            <td>${v.Tamanio || '-'}</td>
            <td><span class="badge ${v.Activo ? 'badge-success' : 'badge-danger'}">${v.Activo ? 'Activo' : 'Inactivo'}</span></td>
           <td><button class="btn-edit" onclick="editarArticulo(${v.IdProductoMarca}, ${v.IdProducto}, ${v.IdMarca}, ${v.IdProveedor}, '${v.Caracteristica1 || ''}', '${v.Caracteristica2 || ''}', '${v.Tamanio || ''}', '${v.UnidadMedida || ''}', ${v.Activo ? 1 : 0}, '${v.CodigoBarras || ''}')">Editar</button></td>
            </tr>
    `).join('')
}

async function cargarSelectProveedores() {
    const res   = await fetch(`${API}/proveedores`)
    const datos = await res.json()
    document.getElementById('inp-var-proveedor').innerHTML =
        datos.map(p => `<option value="${p.IdProveedor}">${p.NombreEmpresa}</option>`).join('')
}

async function guardarVariante() {
    const body = {
        IdProducto:      document.getElementById('inp-var-producto').value,
        IdMarca:         document.getElementById('inp-var-marca').value,
        IdProveedor:     document.getElementById('inp-var-proveedor').value,
        CodigoVariante:  document.getElementById('inp-var-codigo').value.trim(),
        Caracteristica1: document.getElementById('inp-var-car1').value.trim(),
        Caracteristica2: document.getElementById('inp-var-car2').value.trim(),
        Tamanio:         document.getElementById('inp-var-tamanio').value.trim(),
        UnidadMedida:    document.getElementById('inp-var-unidad').value.trim(),
        CodigoBarras:    document.getElementById('inp-var-codigobarras').value.trim()
    }

    if (!body.CodigoVariante) return alert('El código del artículo es requerido')

    const res  = await fetch(`${API}/productos/variantes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-articulo')
    cargarArticulos()
}
async function editarArticulo(id, idProducto, idMarca, idProveedor, car1, car2, tamanio, unidad, activo, codigoBarras) {
    document.getElementById('edit-art-id').value           = id
    document.getElementById('edit-art-car1').value         = car1         || ''
    document.getElementById('edit-art-car2').value         = car2         || ''
    document.getElementById('edit-art-tamanio').value      = tamanio      || ''
    document.getElementById('edit-art-unidad').value       = unidad       || ''
    document.getElementById('edit-art-codigobarras').value = codigoBarras || ''
    document.getElementById('edit-art-activo').checked     = activo == 1
    document.getElementById('edit-art-activo-label').textContent = activo == 1 ? 'Activo' : 'Inactivo'
    document.getElementById('modal-edit-articulo').classList.remove('hidden')

    document.getElementById('edit-art-activo').onchange = function() {
        document.getElementById('edit-art-activo-label').textContent = this.checked ? 'Activo' : 'Inactivo'
    }

    const [resProd, resMarca, resProv] = await Promise.all([
        fetch(`${API}/productos`),
        fetch(`${API}/productos/marcas`),
        fetch(`${API}/proveedores`)
    ])
    const [prods, marcas, provs] = await Promise.all([
        resProd.json(), resMarca.json(), resProv.json()
    ])

    document.getElementById('edit-art-producto').innerHTML =
        prods.filter(p => p.Activo || p.IdProducto == idProducto)
             .map(p => `<option value="${p.IdProducto}" ${p.IdProducto == idProducto ? 'selected' : ''}>${p.NombreProducto}</option>`).join('')
    document.getElementById('edit-art-marca').innerHTML =
        marcas.filter(m => m.Activo || m.IdMarca == idMarca)
              .map(m => `<option value="${m.IdMarca}" ${m.IdMarca == idMarca ? 'selected' : ''}>${m.NombreMarca}</option>`).join('')
    document.getElementById('edit-art-proveedor').innerHTML =
        provs.map(p => `<option value="${p.IdProveedor}" ${p.IdProveedor == idProveedor ? 'selected' : ''}>${p.NombreEmpresa}</option>`).join('')
}
async function actualizarArticulo() {
    const id   = document.getElementById('edit-art-id').value
    const body = {
        IdProducto:      document.getElementById('edit-art-producto').value,
        IdMarca:         document.getElementById('edit-art-marca').value,
        IdProveedor:     document.getElementById('edit-art-proveedor').value,
        Caracteristica1: document.getElementById('edit-art-car1').value.trim(),
        Caracteristica2: document.getElementById('edit-art-car2').value.trim(),
        Tamanio:         document.getElementById('edit-art-tamanio').value.trim(),
        UnidadMedida:    document.getElementById('edit-art-unidad').value.trim(),
        Activo:          document.getElementById('edit-art-activo').checked ? 1 : 0,
        CodigoBarras:    document.getElementById('edit-art-codigobarras').value.trim()
    }

    const res  = await fetch(`${API}/productos/variantes/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-articulo')
    cargarArticulos()
}

// == PROVEEDORES ==
async function cargarProveedores() {
    const res   = await fetch(`${API}/proveedores`)
    const datos = await res.json()
    const tbody = document.getElementById('tabla-proveedores')

    if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Sin proveedores</td></tr>`
        return
    }

    tbody.innerHTML = datos.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.NombreEmpresa}</td>
            <td>${p.RTN || '-'}</td>
            <td>${p.Telefono || '-'}</td>
            <td>${p.Correo || '-'}</td>
            <td><button class="btn-edit" onclick="editarProveedor(${p.IdProveedor}, '${p.NombreEmpresa}', '${p.RTN || ''}', '${p.Telefono || ''}', '${p.Correo || ''}', '${p.Direccion || ''}')">Editar</button></td>
        </tr>
    `).join('')
}

async function guardarProveedor() {
    const body = {
        NombreEmpresa: document.getElementById('inp-prov-nombre').value.trim(),
        RTN:           document.getElementById('inp-prov-rtn').value.trim(),
        Telefono:      document.getElementById('inp-prov-telefono').value.trim(),
        Correo:        document.getElementById('inp-prov-correo').value.trim(),
        Direccion:     document.getElementById('inp-prov-direccion').value.trim()
    }

    if (!body.NombreEmpresa) return alert('El nombre de empresa es requerido')

    const res  = await fetch(`${API}/proveedores`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-proveedor')
    cargarProveedores()
}

function editarProveedor(id, nombre, rtn, telefono, correo, direccion) {
    document.getElementById('edit-prov-id').value        = id
    document.getElementById('edit-prov-nombre').value    = nombre    || ''
    document.getElementById('edit-prov-rtn').value       = rtn       || ''
    document.getElementById('edit-prov-telefono').value  = telefono  || ''
    document.getElementById('edit-prov-correo').value    = correo    || ''
    document.getElementById('edit-prov-direccion').value = direccion || ''
    document.getElementById('modal-edit-proveedor').classList.remove('hidden')
}

async function actualizarProveedor() {
    const id   = document.getElementById('edit-prov-id').value
    const body = {
        NombreEmpresa: document.getElementById('edit-prov-nombre').value.trim(),
        RTN:           document.getElementById('edit-prov-rtn').value.trim(),
        Telefono:      document.getElementById('edit-prov-telefono').value.trim(),
        Correo:        document.getElementById('edit-prov-correo').value.trim(),
        Direccion:     document.getElementById('edit-prov-direccion').value.trim()
    }
    if (!body.NombreEmpresa) return alert('El nombre es requerido')

    const res  = await fetch(`${API}/proveedores/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)

    cerrarModal('modal-edit-proveedor')
    cargarProveedores()
}

// == CARGAR TODO ==
cargarCategorias()
cargarMarcas()
cargarProductos()
cargarArticulos()
cargarProveedores()