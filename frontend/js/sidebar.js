async function cargarSidebar() {
    const res  = await fetch('/components/sidebar.html')
    const html = await res.text()
    document.getElementById('sidebar-container').innerHTML = html

    // Marcar item activo según la página actual
    const ruta = window.location.pathname
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('href') === ruta) {
            item.classList.add('active')
        }
    })

    // Mostrar datos del usuario
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    if (usuario) {
        document.getElementById('user-nombre').textContent = usuario.NombreEmpleado
        document.getElementById('user-rol').textContent    = usuario.NombreRol
        document.getElementById('user-avatar').textContent = usuario.NombreEmpleado.charAt(0).toUpperCase()
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuario')
    window.location.href = '/login'
}

cargarSidebar()