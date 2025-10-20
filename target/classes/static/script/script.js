
// CONFIGURACIÓN

const RECAPTCHA_SITE_KEY = "6LcOWNQrAAAAAD_mcy9fM5j71rg4kr0p-THrhQ-L";


// INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando formulario de registro...");
    inicializarFormulario();
});

function inicializarFormulario() {
    const form = document.getElementById("registroForm");

    if (!form) {
        console.error(" No se encontró el formulario");
        return;
    }

    console.log(" Formulario encontrado, configurando validaciones...");

    // Desactivar validación HTML5
    form.setAttribute("novalidate", "true");

    // Remover atributos required
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => field.removeAttribute('required'));

    // Event listener para submit
    form.addEventListener("submit", manejarEnvioFormulario);

    // Configurar validaciones en tiempo real
    configurarValidacionesTiempoReal(form);

    console.log(" Formulario inicializado correctamente");
}


// MANEJADOR DE ENVÍO

async function manejarEnvioFormulario(event) {
    console.log(" Procesando envío del formulario...");
    event.preventDefault();
    event.stopPropagation();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validar formulario
    if (!validarFormularioCompleto()) {
        mostrarErrorGeneral("Por favor, corrige los errores en el formulario.");
        return;
    }

    console.log(" Validación exitosa, procesando reCAPTCHA...");

    try {
        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando cuenta...';

        // Ejecutar reCAPTCHA
        const token = await ejecutarRecaptcha();
        console.log(" Token reCAPTCHA obtenido");

        // Insertar token
        insertarTokenRecaptcha(token);

        // Enviar formulario y manejar respuesta
        await enviarFormularioConRedireccion(form);

    } catch (error) {
        console.error(" Error:", error);
        mostrarErrorGeneral(error.message);

        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = "Crear Cuenta";
    }
}


// FUNCIÓN: ENVÍO CON REDIRECCIÓN BONITA

async function enviarFormularioConRedireccion(form) {
    try {
        const formData = new FormData(form);

        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            //  Registro exitoso - Mostrar mensaje bonito
            mostrarMensajeExito();

            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                window.location.href = '/login?registroExitoso=true';
            }, 3000);

        } else {
            const errorText = await response.text();
            manejarErrorServidor(errorText);
            throw new Error(errorText);
        }

    } catch (error) {
        throw new Error('Error de conexión: ' + error.message);
    }
}


// FUNCIÓN: MANEJAR ERRORES DEL SERVIDOR

function manejarErrorServidor(errorText) {
    console.log(" Error del servidor:", errorText);

    // Limpiar errores previos
    limpiarErrores();

    // Mapear mensajes de error del servidor a campos específicos
    if (errorText.includes('correo ya está registrado')) {
        mostrarErrorCampo(document.querySelector('[name="email"]'), 'El correo electrónico ya está registrado');
    } else if (errorText.includes('DNI debe tener 8 dígitos')) {
        mostrarErrorCampo(document.querySelector('[name="numeroDocumento"]'), 'El DNI debe tener 8 dígitos');
    } else if (errorText.includes('pasaporte debe tener')) {
        mostrarErrorCampo(document.querySelector('[name="numeroDocumento"]'), 'El pasaporte debe tener al menos 6 caracteres');
    } else if (errorText.includes('Formato de fecha inválido')) {
        mostrarErrorCampo(document.querySelector('[name="fechaNacimiento"]'), 'Formato de fecha inválido. Use AAAA-MM-DD');
    } else if (errorText.includes('Verificación de seguridad')) {
        mostrarErrorGeneral('Error de verificación de seguridad. Recarga la página e intenta nuevamente.');
    } else {
        // Error general
        mostrarErrorGeneral(errorText);
    }
}


// FUNCIÓN: MENSAJE DE ÉXITO BONITO

function mostrarMensajeExito() {
    // Ocultar el formulario
    const form = document.getElementById('registroForm');
    form.style.display = 'none';

    // Obtener el nombre del usuario para personalizar el mensaje
    const nombre = document.querySelector('[name="nombres"]').value;

    // Crear mensaje de éxito
    const mensajeHTML = `
        <div class="text-center py-5">
            <div class="success-animation mb-4">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="80" height="80">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="#28a745" stroke-width="3"/>
                    <path class="checkmark__check" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h2 class="text-success mb-3">¡Registro Exitoso!</h2>
            <p class="lead mb-4">Hola <strong>${nombre}</strong>, tu cuenta ha sido creada correctamente.</p>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>¡Bienvenido a Luren Chicken!</strong> Serás redirigido al inicio de sesión en unos segundos.
            </div>
            <div class="mt-4">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Redirigiendo...</span>
                </div>
                <p class="text-muted mt-2">Redirigiendo al login...</p>
            </div>
        </div>
    `;

    // Insertar el mensaje en el contenedor
    const container = document.querySelector('.registro-container');
    container.innerHTML = mensajeHTML;

    // Agregar estilos CSS para la animación
    agregarEstilosAnimacion();
}


// FUNCIÓN: ESTILOS PARA ANIMACIÓN

function agregarEstilosAnimacion() {
    const styles = `
        <style>
            .success-animation {
                animation: scaleIn 0.5s ease-in-out;
            }

            .checkmark__circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 3;
                stroke-miterlimit: 10;
                stroke: #28a745;
                fill: none;
                animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }

            .checkmark__check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
            }

            @keyframes stroke {
                100% {
                    stroke-dashoffset: 0;
                }
            }

            @keyframes scaleIn {
                0% {
                    opacity: 0;
                    transform: scale(0.5);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .alert-success {
                border-left: 4px solid #28a745;
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
}


// VALIDACIONES COMPLETAS

function validarFormularioCompleto() {
    const form = document.getElementById("registroForm");
    let esValido = true;

    // Limpiar errores previos
    limpiarErrores();

    // Validaciones individuales
    if (!validarCampoRequerido('nombres')) esValido = false;
    if (!validarCampoRequerido('apellidos')) esValido = false;
    if (!validarTipoDocumento()) esValido = false;
    if (!validarNumeroDocumento()) esValido = false;
    if (!validarTelefono()) esValido = false;
    if (!validarFechaNacimiento()) esValido = false;
    if (!validarEmail()) esValido = false;
    if (!validarPassword()) esValido = false;
    if (!validarTerminos()) esValido = false;

    return esValido;
}

function validarCampoRequerido(nombreCampo) {
    const campo = document.querySelector(`[name="${nombreCampo}"]`);
    if (!campo || campo.value.trim() === '') {
        mostrarErrorCampo(campo, 'Este campo es obligatorio');
        return false;
    }
    return true;
}

function validarTipoDocumento() {
    const select = document.querySelector('[name="tipoDocumento"]');
    if (!select || select.value === '') {
        mostrarErrorCampo(select, 'Selecciona un tipo de documento');
        return false;
    }
    return true;
}

function validarNumeroDocumento() {
    const tipoDoc = document.querySelector('[name="tipoDocumento"]').value;
    const numeroDoc = document.querySelector('[name="numeroDocumento"]');
    const valor = numeroDoc.value.trim();

    if (valor === '') {
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
    const telefono = document.querySelector('[name="telefono"]');
    const valor = telefono.value.trim();

    if (valor === '') {
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
    const fecha = document.querySelector('[name="fechaNacimiento"]');
    const valor = fecha.value;

    if (!valor) {
        mostrarErrorCampo(fecha, 'La fecha de nacimiento es obligatoria');
        return false;
    }

    const fechaNac = new Date(valor);
    const hoy = new Date();
    const minFecha = new Date('1900-01-01');

    // Validaciones secuenciales con mensajes específicos
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

    // Calcular edad exacta
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

function validarEmail() {
    const email = document.querySelector('[name="email"]');
    const valor = email.value.trim();

    if (valor === '') {
        mostrarErrorCampo(email, 'El email es obligatorio');
        return false;
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(valor)) {
        mostrarErrorCampo(email, 'Ingresa un email válido (ejemplo: usuario@dominio.com)');
        return false;
    }

    return true;
}

function validarPassword() {
    const password = document.querySelector('[name="password"]');
    const valor = password.value;

    if (valor === '') {
        mostrarErrorCampo(password, 'La contraseña es obligatoria');
        return false;
    }

    if (valor.length < 6) {
        mostrarErrorCampo(password, 'La contraseña debe tener al menos 6 caracteres');
        return false;
    }

    // Mostrar fortaleza de contraseña
    actualizarFortalezaPassword(valor);

    return true;
}

function validarTerminos() {
    const terminos = document.querySelector('[name="aceptaDatos"]');
    if (!terminos.checked) {
        mostrarErrorCampo(terminos, 'Debes aceptar los términos y condiciones');
        return false;
    }
    return true;
}


// VALIDACIONES EN TIEMPO REAL

function configurarValidacionesTiempoReal(form) {
    // Nombres y Apellidos - solo letras y espacios
    configurarValidacionTexto('nombres', /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/);
    configurarValidacionTexto('apellidos', /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/);

    // Número de documento - según tipo
    const numeroDoc = form.querySelector('[name="numeroDocumento"]');
    const tipoDoc = form.querySelector('[name="tipoDocumento"]');

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
    const telefono = form.querySelector('[name="telefono"]');
    telefono.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 9);
    });

    // Fecha de nacimiento - validación en tiempo real
    const fechaNacimiento = form.querySelector('[name="fechaNacimiento"]');
    fechaNacimiento.addEventListener('change', function() {
        if (this.value) {
            const fecha = new Date(this.value);
            const hoy = new Date();
            const minFecha = new Date('1900-01-01');

            if (fecha < minFecha) {
                mostrarErrorCampo(this, 'La fecha debe ser posterior a 1900');
            } else if (fecha > hoy) {
                mostrarErrorCampo(this, 'La fecha no puede ser futura');
            } else {
                this.classList.remove('is-invalid');
            }
        }
    });

    // Email - validación en tiempo real
    const email = form.querySelector('[name="email"]');
    email.addEventListener('blur', function() {
        if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    // Password - fortaleza en tiempo real
    const password = form.querySelector('[name="password"]');
    password.addEventListener('input', function() {
        actualizarFortalezaPassword(this.value);
        if (this.value.length > 0 && this.value.length < 6) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    // Cambio de tipo de documento
    tipoDoc.addEventListener('change', function() {
        const numeroDocField = form.querySelector('[name="numeroDocumento"]');
        numeroDocField.value = '';
        numeroDocField.classList.remove('is-invalid');

        // Actualizar placeholder según tipo
        switch (this.value) {
            case 'DNI':
                numeroDocField.placeholder = '8 dígitos';
                break;
            case 'Carné de extranjería':
                numeroDocField.placeholder = '9 dígitos';
                break;
            case 'Pasaporte':
                numeroDocField.placeholder = '6-12 caracteres alfanuméricos';
                break;
            default:
                numeroDocField.placeholder = '';
        }
    });
}

function configurarValidacionTexto(nombreCampo, regex) {
    const campo = document.querySelector(`[name="${nombreCampo}"]`);
    if (campo) {
        campo.addEventListener('input', function() {
            if (!regex.test(this.value)) {
                this.value = this.value.slice(0, -1);
            }
        });
    }
}


// UTILIDADES

function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('is-invalid');

    // Buscar o crear elemento de error
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
    // Crear o actualizar alerta de error general
    let alerta = document.querySelector('.alert-danger');
    if (!alerta) {
        alerta = document.createElement('div');
        alerta.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.registro-container').insertBefore(alerta, document.querySelector('form'));
    } else {
        alerta.textContent = mensaje;
    }
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

function ejecutarRecaptcha() {
    return new Promise((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
            reject(new Error('reCAPTCHA no está disponible'));
            return;
        }

        grecaptcha.ready(() => {
            grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'registro' })
                .then(resolve)
                .catch(reject);
        });
    });
}

function insertarTokenRecaptcha(token) {
    let campo = document.getElementById('g-recaptcha-response');
    if (!campo) {
        campo = document.createElement('input');
        campo.type = 'hidden';
        campo.name = 'g-recaptcha-response';
        campo.id = 'g-recaptcha-response';
        document.getElementById('registroForm').appendChild(campo);
    }
    campo.value = token;
}

console.log(" Sistema de registro completo cargado");