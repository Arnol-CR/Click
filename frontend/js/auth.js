const API = 'http://localhost:3000/api'

async function login() {
    const usuario    = document.getElementById('usuario').value.trim()
    const contrasena = document.getElementById('contrasena').value.trim()
    const errorMsg   = document.getElementById('error-msg')

    errorMsg.textContent = ''

    if (!usuario || !contrasena) {
        errorMsg.textContent = 'Ingresa usuario y contraseña'
        return
    }

    try {
        const res  = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ usuario, contrasena })
        })

        const data = await res.json()

        if (!res.ok) {
            errorMsg.textContent = data.error
            return
        }

        // Guardar sesión
        localStorage.setItem('usuario', JSON.stringify(data.datos))

        // Redirigir a inicio
        window.location.href = 'inicio.html'

    } catch (err) {
        errorMsg.textContent = 'Error de conexión con el servidor'
    }
}

// Permitir login con Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login()
})