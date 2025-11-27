

// Configuración
const API_BASE_URL = '/api/auth';

// Estado global
let datosUsuario = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando gestión de cuentas...");

    // Verificar si el usuario está autenticado
    if (document.getElementById('usuarioNombre')) {
        cargarDatosUsuario();
        cargarEstadisticasReales();
        cargarDirecciones();
        inicializarEventListeners();
        inicializarAvanzada();
        console.log(" Sistema de cuentas inicializado");
    }
});

// FUNCIONES PRINCIPALES
async function cargarDatosUsuario() {
    console.log(" Cargando datos del usuario...");

    try {
        const response = await fetch(`${API_BASE_URL}/datos-usuario`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const usuario = await response.json();
        console.log(" Datos del usuario recibidos:", usuario);

        // Guardar datos globalmente
        datosUsuario = usuario;

        // Mostrar datos en la vista
        mostrarDatosUsuario(usuario);

    } catch (error) {
        console.error(" Error cargando datos del usuario:", error);
        mostrarErrorGeneral("Error al cargar los datos del usuario: " + error.message);
    }
}


async function cargarEstadisticasReales() {
    console.log("Cargando estadísticas reales...");

    try {
        // Cargar contador de favoritos
        const responseFavoritos = await fetch('/favoritos/count', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        let totalFavoritos = 0;
        if (responseFavoritos.ok) {
            const dataFavoritos = await responseFavoritos.json();
            if (dataFavoritos.success) {
                totalFavoritos = dataFavoritos.count;
            }
        }

        // Cargar contador de pedidos
        const responsePedidos = await fetch('/pedido/mis-pedidos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        let totalPedidos = 0;
        if (responsePedidos.ok) {
            const dataPedidos = await responsePedidos.json();
            if (Array.isArray(dataPedidos)) {
                totalPedidos = dataPedidos.length;
            }
        }

        // Actualizar la UI con los datos reales
        document.getElementById('totalPedidos').textContent = totalPedidos;
        document.getElementById('totalFavoritos').textContent = totalFavoritos;

        console.log(" Estadísticas cargadas:", {
            totalPedidos: totalPedidos,
            totalFavoritos: totalFavoritos
        });

    } catch (error) {
        console.error(" Error cargando estadísticas:", error);

        document.getElementById('totalPedidos').textContent = '0';
        document.getElementById('totalFavoritos').textContent = '0';
    }
}


async function cargarEstadisticasCuenta() {
    await cargarEstadisticasReales();
}

function mostrarDatosUsuario(usuario) {

    document.getElementById('usuarioNombre').textContent = validarCampoTexto(usuario.nombres || usuario.nombre);
    document.getElementById('usuarioApellidos').textContent = validarCampoTexto(usuario.apellidos);
    document.getElementById('usuarioEmail').textContent = validarCampoTexto(usuario.email || usuario.username);
    document.getElementById('usuarioTipoDocumento').textContent = validarCampoTexto(usuario.tipoDocumento);
    document.getElementById('usuarioNumeroDocumento').textContent = validarCampoTexto(usuario.numeroDocumento);
    document.getElementById('usuarioTelefono').textContent = validarCampoTexto(usuario.telefono);
    document.getElementById('usuarioFechaNacimiento').textContent = validarFecha(usuario.fechaNacimiento);
}

async function cargarDirecciones() {
    console.log(" Cargando direcciones desde la API...");

    try {
        const response = await fetch('/api/direcciones', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const direcciones = await response.json();
        console.log(" Direcciones cargadas:", direcciones);

        // Encontrar dirección de facturación y envío
        const direccionFacturacion = direcciones.find(dir => dir.facturacion) ||
                                   direcciones.find(dir => dir.predeterminada) ||
                                   null;

        const direccionEnvio = direcciones.find(dir => dir.predeterminada) ||
                             direcciones[0] ||
                             null;

        mostrarDireccion('facturacion', direccionFacturacion);
        mostrarDireccion('envio', direccionEnvio);

    } catch (error) {
        console.error(" Error cargando direcciones:", error);
        mostrarDireccion('facturacion', null);
        mostrarDireccion('envio', null);
    }
}

function mostrarDireccion(tipo, direccion) {
    const contenedor = document.getElementById(`direccion${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);

    if (!contenedor) {
        console.error(` Contenedor no encontrado para: ${tipo}`);
        return;
    }

    if (!direccion) {
        contenedor.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-map-marker-alt fa-2x text-muted mb-2"></i>
                <p class="text-muted mb-0">No hay dirección de ${tipo} guardada.</p>
                <small class="text-muted">Haz clic en "Gestionar" para agregar una dirección</small>
            </div>
        `;
        return;
    }

    const html = `
        <div class="direccion-info">
            <p class="mb-1"><strong>Nombre:</strong> ${validarCampoTexto(direccion.nombre)}</p>
            <p class="mb-1"><strong>Tipo:</strong> ${validarCampoTexto(direccion.tipo)}</p>
            <p class="mb-1"><strong>Dirección:</strong> ${validarCampoTexto(direccion.direccion)}</p>
            <p class="mb-1"><strong>Ciudad:</strong> ${validarCampoTexto(direccion.ciudad)}</p>
            ${direccion.referencia ? `<p class="mb-1"><strong>Referencia:</strong> ${validarCampoTexto(direccion.referencia)}</p>` : ''}
            <p class="mb-0"><strong>Teléfono:</strong> ${validarCampoTexto(direccion.telefono)}</p>
            <div class="mt-2">
                ${direccion.predeterminada ? '<span class="badge bg-primary">Principal</span>' : ''}
                ${direccion.facturacion ? '<span class="badge bg-success ms-1">Facturación</span>' : ''}
            </div>
        </div>
    `;

    contenedor.innerHTML = html;
}


function validarCampoTexto(valor) {
    if (!valor || valor.trim() === '') {
        return 'No especificado';
    }
    return escaparHTML(valor);
}

function validarFecha(fechaString) {
    if (!fechaString) {
        return 'No especificada';
    }

    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) {
            return 'Fecha inválida';
        }

        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error(" Error validando fecha:", error);
        return 'Fecha inválida';
    }
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefono(telefono) {
    const regex = /^\d{9}$/;
    return regex.test(telefono);
}

function validarDocumento(tipo, numero) {
    if (!numero || numero.trim() === '') {
        return { valido: false, mensaje: 'El número de documento es requerido' };
    }

    let regex, mensaje;

    switch (tipo) {
        case 'DNI':
            regex = /^\d{8}$/;
            mensaje = 'El DNI debe tener 8 dígitos';
            break;
        case 'Pasaporte':
            regex = /^[A-Z0-9]{6,12}$/i;
            mensaje = 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos';
            break;
        case 'Carné de extranjería':
            regex = /^\d{9}$/;
            mensaje = 'El carné de extranjería debe tener 9 dígitos';
            break;
        default:
            return { valido: true, mensaje: '' };
    }

    if (!regex.test(numero)) {
        return { valido: false, mensaje };
    }

    return { valido: true, mensaje: '' };
}

function validarFechaNacimiento(fechaString) {
    if (!fechaString) {
        return { valido: false, mensaje: 'La fecha de nacimiento es requerida' };
    }

    const fecha = new Date(fechaString);
    const hoy = new Date();
    const minFecha = new Date('1900-01-01');

    if (isNaN(fecha.getTime())) {
        return { valido: false, mensaje: 'La fecha ingresada no es válida' };
    }

    if (fecha < minFecha) {
        return { valido: false, mensaje: 'La fecha debe ser posterior a 1900' };
    }

    if (fecha > hoy) {
        return { valido: false, mensaje: 'La fecha no puede ser futura' };
    }

    // Calcular edad
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
    }

    if (edad < 18) {
        return { valido: false, mensaje: 'Debes ser mayor de edad (18 años o más)' };
    }

    if (edad > 120) {
        return { valido: false, mensaje: 'Por favor ingresa una fecha válida' };
    }

    return { valido: true, mensaje: '' };
}


function gestionarDireccion(tipo) {
    console.log(` Gestionando dirección de ${tipo}`);

    // Mostrar mensaje informativo
    mostrarExito(`Redirigiendo a la gestión de direcciones...`);


    setTimeout(() => {
        window.location.href = '/direcciones';
    }, 1000);
}

function inicializarEventListeners() {
    console.log(" Inicializando event listeners...");

    // Listeners para botones de acción
    const botonesGestion = document.querySelectorAll('[onclick*="gestionarDireccion"]');
    botonesGestion.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const tipo = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            gestionarDireccion(tipo);
        });
    });

    // Listener para recargar datos cuando la página se vuelve visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log(" Página visible, actualizando datos...");
            cargarDatosUsuario();
            cargarEstadisticasReales();
            cargarDirecciones();
        }
    });

    // Listener para conexión/desconexión de red
    window.addEventListener('online', function() {
        mostrarExito("Conexión restaurada. Actualizando datos...");
        cargarDatosUsuario();
        cargarEstadisticasReales();
        cargarDirecciones();
    });

    window.addEventListener('offline', function() {
        mostrarErrorGeneral(" Sin conexión. Algunas funciones pueden no estar disponibles.");
    });

    console.log(" Event listeners inicializados");
}

function mostrarErrorGeneral(mensaje) {
    // Crear alerta temporal
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show';
    alerta.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${escaparHTML(mensaje)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insertar al inicio del contenido principal
    const contenido = document.querySelector('.col-md-9');
    if (contenido) {
        // Limpiar alertas previas del mismo tipo
        const alertasPrevias = contenido.querySelectorAll('.alert-danger');
        alertasPrevias.forEach(alerta => alerta.remove());

        contenido.insertBefore(alerta, contenido.firstChild);

        // Auto-eliminar después de 8 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 8000);
    }
}

function mostrarExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${escaparHTML(mensaje)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const contenido = document.querySelector('.col-md-9');
    if (contenido) {
        // Limpiar alertas previas del mismo tipo
        const alertasPrevias = contenido.querySelectorAll('.alert-success');
        alertasPrevias.forEach(alerta => alerta.remove());

        contenido.insertBefore(alerta, contenido.firstChild);

        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 5000);
    }
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}


window.addEventListener('error', function(e) {
    console.error(' Error global:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error(' Promise rechazada no manejada:', e.reason);
    e.preventDefault();
});


function iniciarActualizacionesAutomaticas() {
    // Actualizar cada 2 minutos si la página está visible
    setInterval(() => {
        if (!document.hidden && navigator.onLine) {
            console.log(" Actualización automática de datos...");
            cargarDatosUsuario();
            cargarEstadisticasReales();
            cargarDirecciones();
        }
    }, 120000); // 2 minutos
}


function inicializarAvanzada() {

    if (!navigator.onLine) {
        mostrarErrorGeneral(" Estás sin conexión. Algunas funciones pueden no estar disponibles.");
    }


    iniciarActualizacionesAutomaticas();


    console.log("Configuración del sistema:");
    console.log("- API Base URL:", API_BASE_URL);
    console.log("- Online:", navigator.onLine);
    console.log("- User Agent:", navigator.userAgent);
}

console.log(" Sistema de gestión de cuentas cargado correctamente");


if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validarCampoTexto,
        validarEmail,
        validarTelefono,
        validarDocumento,
        validarFechaNacimiento,
        escaparHTML
    };
}