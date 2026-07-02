const API = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://click-erqg.onrender.com/api'

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
        window.location.href = '/inicio'

    } catch (err) {
        errorMsg.textContent = 'Error de conexión con el servidor'
    }
}

function togglePassword() {
    const input = document.getElementById('contrasena')
    const ojito = document.getElementById('ojito')
    
    if (input.type === 'password') {
        input.type = 'text'
        ojito.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>`
    } else {
        input.type = 'password'
        ojito.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#888" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>`
    }
}

// Permitir login con Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login()
})