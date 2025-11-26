// SISTEMA DE GESTIÓN DE DATOS PERSONALES

// Configuración
const API_BASE_URL = '/api/auth';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando gestión de datos personales...");

    // Verificar si el usuario está autenticado
    if (document.getElementById('infoView')) {
        cargarDatosUsuario();
        inicializarEventListeners();
        console.log(" Sistema de datos personales inicializado");
    }
});

// FUNCIONES PRINCIPALES

async function cargarDatosUsuario() {
    console.log(" Cargando datos del usuario desde el servidor...");

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

        // Mostrar datos en la vista
        mostrarDatosEnVista(usuario);

        // Cargar datos en el formulario de edición
        cargarDatosEnFormulario(usuario);

    } catch (error) {
        console.error(" Error cargando datos del usuario:", error);
        mostrarErrorGeneral("Error al cargar los datos del usuario: " + error.message);
    }
}

function mostrarDatosEnVista(usuario) {
    document.getElementById('viewNombre').textContent = usuario.nombre || '-';
    document.getElementById('viewApellidos').textContent = usuario.apellidos || '-';
    document.getElementById('viewEmail').textContent = usuario.email || '-';
    document.getElementById('viewTipoDocumento').textContent = usuario.tipoDocumento || '-';
    document.getElementById('viewNumeroDocumento').textContent = usuario.numeroDocumento || '-';
    document.getElementById('viewTelefono').textContent = usuario.telefono || '-';
    document.getElementById('viewFechaNacimiento').textContent = formatearFecha(usuario.fechaNacimiento) || '-';
}

function cargarDatosEnFormulario(usuario) {
    document.getElementById('editNombre').value = usuario.nombre || '';
    document.getElementById('editApellidos').value = usuario.apellidos || '';
    document.getElementById('editTipoDocumento').value = usuario.tipoDocumento || '';
    document.getElementById('editNumeroDocumento').value = usuario.numeroDocumento || '';
    document.getElementById('editTelefono').value = usuario.telefono || '';
    document.getElementById('editFechaNacimiento').value = usuario.fechaNacimiento || '';

    // Limpiar campos de contraseña
    document.getElementById('passwordActual').value = '';
    document.getElementById('nuevaPassword').value = '';
    actualizarFortalezaPassword('');
}

function inicializarEventListeners() {
    // Configurar botones de edición y cancelación
    const btnEditar = document.getElementById('btnEditar');
    const btnCancelar = document.getElementById('btnCancelar');
    const form = document.getElementById('editarDatosForm');

    if (btnEditar) {
        btnEditar.addEventListener('click', habilitarEdicion);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicion);
    }

    if (form) {
        form.addEventListener('submit', manejarEnvioFormulario);
    }

    // Inicialmente ocultar el formulario de edición
    document.getElementById('editForm').style.display = 'none';

    // Validaciones en tiempo real
    configurarValidacionesTiempoReal();
}


function habilitarEdicion() {
    console.log(" Habilitando modo edición...");

    // Ocultar vista de información
    document.getElementById('infoView').style.display = 'none';

    // Mostrar formulario de edición
    document.getElementById('editForm').style.display = 'block';

    // Enfocar el primer campo
    document.getElementById('editNombre').focus();
}

function cancelarEdicion() {
    console.log(" Cancelando edición...");

    // Limpiar errores
    limpiarErrores();

    // Ocultar formulario de edición
    document.getElementById('editForm').style.display = 'none';

    // Mostrar vista de información
    document.getElementById('infoView').style.display = 'block';

    // Recargar datos originales desde el servidor
    cargarDatosUsuario();
}



async function manejarEnvioFormulario(event) {
    console.log(" Procesando actualización de datos...");
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validar formulario
    if (!validarFormularioCompleto()) {
        mostrarErrorGeneral("Por favor, corrige los errores en el formulario.");
        return;
    }

    try {

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

        // Preparar datos
        const datosActualizados = prepararDatosFormulario();

        // Enviar datos al servidor
        await enviarDatosAlServidor(datosActualizados);

        // Mostrar éxito
        mostrarMensajeExito("Tus datos se han actualizado correctamente.");

        // Actualizar vista y recargar datos
        setTimeout(() => {
            cargarDatosUsuario();
            cancelarEdicion();
        }, 1000);

    } catch (error) {
        console.error(" Error:", error);
        mostrarErrorGeneral("Error al actualizar los datos: " + error.message);
    } finally {
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
    }
}

function prepararDatosFormulario() {
    const datos = {
        nombre: document.getElementById('editNombre').value.trim(),
        apellidos: document.getElementById('editApellidos').value.trim(),
        tipoDocumento: document.getElementById('editTipoDocumento').value,
        numeroDocumento: document.getElementById('editNumeroDocumento').value.trim(),
        telefono: document.getElementById('editTelefono').value.trim(),
        fechaNacimiento: document.getElementById('editFechaNacimiento').value
    };

    // Solo incluir campos de contraseña si se están cambiando
    const passwordActual = document.getElementById('passwordActual').value;
    const nuevaPassword = document.getElementById('nuevaPassword').value;

    if (nuevaPassword) {
        datos.passwordActual = passwordActual;
        datos.nuevaPassword = nuevaPassword;
    }

    return datos;
}


function validarFormularioCompleto() {
    let esValido = true;

    // Limpiar errores previos
    limpiarErrores();

    // Validaciones individuales
    if (!validarCampoRequerido('editNombre')) esValido = false;
    if (!validarCampoRequerido('editApellidos')) esValido = false;
    if (!validarTipoDocumento()) esValido = false;
    if (!validarNumeroDocumento()) esValido = false;
    if (!validarTelefono()) esValido = false;
    if (!validarFechaNacimiento()) esValido = false;
    if (!validarPassword()) esValido = false;

    return esValido;
}

function validarCampoRequerido(elementId) {
    const campo = document.getElementById(elementId);
    const valor = campo.value.trim();

    if (!valor) {
        mostrarErrorCampo(campo, 'Este campo es obligatorio');
        return false;
    }

    // Validaciones específicas por campo
    if (elementId === 'editNombre' || elementId === 'editApellidos') {
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
            mostrarErrorCampo(campo, 'Solo se permiten letras y espacios');
            return false;
        }
    }

    return true;
}

function validarTipoDocumento() {
    const select = document.getElementById('editTipoDocumento');
    if (!select || select.value === '') {
        mostrarErrorCampo(select, 'Selecciona un tipo de documento');
        return false;
    }
    return true;
}

function validarNumeroDocumento() {
    const tipoDoc = document.getElementById('editTipoDocumento').value;
    const numeroDoc = document.getElementById('editNumeroDocumento');
    const valor = numeroDoc.value.trim();

    if (!valor) {
        mostrarErrorCampo(numeroDoc, 'El número de documento es obligatorio');
        return false;
    }

    let regex, mensaje;
    switch (tipoDoc) {
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
            return true;
    }

    if (!regex.test(valor)) {
        mostrarErrorCampo(numeroDoc, mensaje);
        return false;
    }

    return true;
}

function validarTelefono() {
    const telefono = document.getElementById('editTelefono');
    const valor = telefono.value.trim();

    if (!valor) {
        mostrarErrorCampo(telefono, 'El teléfono es obligatorio');
        return false;
    }

    if (!/^\d{9}$/.test(valor)) {
        mostrarErrorCampo(telefono, 'El teléfono debe tener 9 dígitos');
        return false;
    }

    return true;
}

function validarFechaNacimiento() {
    const fecha = document.getElementById('editFechaNacimiento');
    const valor = fecha.value;

    if (!valor) {
        mostrarErrorCampo(fecha, 'La fecha de nacimiento es obligatoria');
        return false;
    }

    const fechaNac = new Date(valor);
    const hoy = new Date();
    const minFecha = new Date('1900-01-01');

    if (isNaN(fechaNac.getTime())) {
        mostrarErrorCampo(fecha, 'La fecha ingresada no es válida');
        return false;
    }

    if (fechaNac < minFecha) {
        mostrarErrorCampo(fecha, 'La fecha debe ser posterior a 1900');
        return false;
    }

    if (fechaNac > hoy) {
        mostrarErrorCampo(fecha, 'La fecha no puede ser futura');
        return false;
    }

    // Calcular edad
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }

    if (edad < 18) {
        mostrarErrorCampo(fecha, 'Debes ser mayor de edad (18 años o más)');
        return false;
    }

    if (edad > 120) {
        mostrarErrorCampo(fecha, 'Por favor ingresa una fecha válida');
        return false;
    }

    return true;
}

function validarPassword() {
    const passwordActual = document.getElementById('passwordActual').value;
    const nuevaPassword = document.getElementById('nuevaPassword').value;

    // Si se llena nueva contraseña, validar que también se llene la actual
    if (nuevaPassword && !passwordActual) {
        mostrarErrorCampo(document.getElementById('passwordActual'), 'Debes ingresar tu contraseña actual para cambiarla');
        return false;
    }

    // Si se llena nueva contraseña, validar fortaleza
    if (nuevaPassword) {
        if (nuevaPassword.length < 6) {
            mostrarErrorCampo(document.getElementById('nuevaPassword'), 'La nueva contraseña debe tener al menos 6 caracteres');
            return false;
        }
        actualizarFortalezaPassword(nuevaPassword);
    }

    return true;
}

// VALIDACIONES EN TIEMPO REAL

function configurarValidacionesTiempoReal() {
    // Nombres y Apellidos - solo letras y espacios
    configurarValidacionTexto('editNombre', /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/);
    configurarValidacionTexto('editApellidos', /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/);

    // Número de documento - según tipo
    const numeroDoc = document.getElementById('editNumeroDocumento');
    const tipoDoc = document.getElementById('editTipoDocumento');

    numeroDoc.addEventListener('input', function() {
        const tipo = tipoDoc.value;
        switch (tipo) {
            case 'DNI':
                this.value = this.value.replace(/\D/g, '').slice(0, 8);
                break;
            case 'Carné de extranjería':
                this.value = this.value.replace(/\D/g, '').slice(0, 9);
                break;
            case 'Pasaporte':
                this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
                break;
        }
    });

    // Teléfono - solo números, máximo 9
    const telefono = document.getElementById('editTelefono');
    telefono.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 9);
    });

    // Password - fortaleza en tiempo real
    const nuevaPassword = document.getElementById('nuevaPassword');
    nuevaPassword.addEventListener('input', function() {
        actualizarFortalezaPassword(this.value);
    });

    // Cambio de tipo de documento
    tipoDoc.addEventListener('change', function() {
        const numeroDocField = document.getElementById('editNumeroDocumento');
        numeroDocField.value = '';
        numeroDocField.classList.remove('is-invalid');
        limpiarErrores();
    });
}

function configurarValidacionTexto(elementId, regex) {
    const campo = document.getElementById(elementId);
    if (campo) {
        campo.addEventListener('input', function() {
            if (this.value && !regex.test(this.value)) {
                this.value = this.value.slice(0, -1);
            }
        });
    }
}

// UTILIDADES

function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('is-invalid');

    let errorElement = campo.parentNode.querySelector('.invalid-feedback');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        campo.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = mensaje;
}

function limpiarErrores() {
    document.querySelectorAll('.is-invalid').forEach(elemento => {
        elemento.classList.remove('is-invalid');
    });
}

function mostrarErrorGeneral(mensaje) {
    // Crear alerta temporal
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show';
    alerta.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insertar al inicio del contenido principal
    const contenido = document.querySelector('.col-md-9');
    contenido.insertBefore(alerta, contenido.firstChild);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

function mostrarMensajeExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const contenido = document.querySelector('.col-md-9');
    contenido.insertBefore(alerta, contenido.firstChild);

    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

function actualizarFortalezaPassword(password) {
    const strengthElement = document.getElementById('passwordStrength');
    if (!strengthElement) return;

    let strength = '';
    let color = '';
    let message = '';

    if (password.length === 0) {
        strength = '';
        message = '';
    } else if (password.length < 6) {
        strength = 'Débil';
        color = '#dc3545';
        message = 'Muy corta';
    } else if (password.length < 8) {
        strength = 'Media';
        color = '#fd7e14';
        message = 'Podría ser más segura';
    } else if (/[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
        strength = 'Fuerte';
        color = '#198754';
        message = 'Excelente seguridad';
    } else {
        strength = 'Media';
        color = '#fd7e14';
        message = 'Usa mayúsculas, números y símbolos';
    }

    strengthElement.textContent = strength ? `Seguridad: ${strength} - ${message}` : '';
    strengthElement.style.color = color;
    strengthElement.style.fontWeight = 'bold';
}

function formatearFecha(fechaString) {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// COMUNICACIÓN CON EL SERVIDOR

async function enviarDatosAlServidor(datos) {
    console.log(" Enviando datos al servidor:", datos);

    const response = await fetch(`${API_BASE_URL}/actualizar-datos`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.text();
    console.log(" Respuesta del servidor:", result);
    return result;
}

console.log(" Sistema de gestión de datos personales cargado");