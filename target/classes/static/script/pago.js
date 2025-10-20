// pago.js - CON FORMULARIO HTML
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PAGO - INICIADO ===');
    inicializarPago();
});

//  Inicializar página de pago
function inicializarPago() {
    configurarEventos();
    configurarFechas();
    configurarDirecciones();
    actualizarMontos();
    console.log('Página de pago inicializada');
}

//  Configurar eventos
function configurarEventos() {
    // Evento para tipo de entrega
    const tipoEntrega = document.getElementById('tipoEntrega');
    if (tipoEntrega) {
        tipoEntrega.addEventListener('change', function() {
            manejarCambioTipoEntrega(this.value);
        });
        manejarCambioTipoEntrega(tipoEntrega.value);
    }

    // Eventos para métodos de pago
    const metodosPago = document.querySelectorAll('input[name="metodoPago"]');
    metodosPago.forEach(radio => {
        radio.addEventListener('change', function() {
            manejarCambioMetodoPago(this.value);
        });
    });

    //  EVENTO MEJORADO: Usar formulario HTML
    const btnConfirmar = document.getElementById('btnConfirmarPedido');
    if (btnConfirmar && !btnConfirmar.disabled) {
        btnConfirmar.addEventListener('click', confirmarPedidoConFormulario);
    }

    // Evento para fecha de entrega
    const fechaEntrega = document.getElementById('fechaEntrega');
    if (fechaEntrega) {
        fechaEntrega.addEventListener('change', validarFechaEntrega);
    }

    // Eventos para formato de tarjeta
    const numeroTarjeta = document.querySelector('.tarjeta-info input[placeholder*="1234"]');
    if (numeroTarjeta) {
        numeroTarjeta.addEventListener('input', function() {
            formatearNumeroTarjeta(this);
        });
    }

    const fechaVencimiento = document.querySelector('.tarjeta-info input[placeholder*="MM/AA"]');
    if (fechaVencimiento) {
        fechaVencimiento.addEventListener('input', function() {
            formatearFechaVencimiento(this);
        });
    }

    const cvvInput = document.querySelector('.tarjeta-info input[placeholder*="123"]');
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    console.log('Eventos configurados');
}

// CONFIRMAR PEDIDO CON FORMULARIO HTML (SOLUCIÓN DEFINITIVA)
function confirmarPedidoConFormulario() {
    console.log('=== CONFIRMACIÓN DE PEDIDO CON FORMULARIO ===');

    // 1. Validar formulario
    if (!validarFormulario()) {
        mostrarNotificacion(' Completa todos los campos requeridos', 'error');
        return;
    }

    const btnConfirmar = document.getElementById('btnConfirmarPedido');
    const textoOriginal = btnConfirmar.innerHTML;

    try {
        // 2. Mostrar loading
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>PROCESANDO...';

        // 3. Obtener datos del formulario
        const datosPedido = obtenerDatosPedido();
        console.log(' Datos del pedido:', datosPedido);

        // 4.  USAR FORMULARIO HTML EN LUGAR DE FETCH
        const form = document.getElementById('pedidoForm');
        const formDatos = document.getElementById('formDatosPedido');

        if (!form || !formDatos) {
            throw new Error('Formulario no encontrado');
        }

        // Convertir datos a JSON string
        formDatos.value = JSON.stringify(datosPedido);

        console.log(' Enviando formulario...');

        // Enviar formulario
        form.submit();

    } catch (error) {
        console.error(' Error al confirmar pedido:', error);
        mostrarNotificacion(' Error: ' + error.message, 'error');

        // Restaurar botón
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = textoOriginal;
    }
}

// Configurar fechas disponibles
function configurarFechas() {
    const fechaInput = document.getElementById('fechaEntrega');
    if (!fechaInput) return;

    const hoy = new Date();
    const fechaMin = new Date(hoy);
    fechaMin.setDate(hoy.getDate() + 1);

    const fechaMax = new Date(hoy);
    fechaMax.setDate(hoy.getDate() + 7);

    fechaInput.min = formatoFechaInput(fechaMin);
    fechaInput.max = formatoFechaInput(fechaMax);
    fechaInput.value = formatoFechaInput(fechaMin);

    console.log('Fechas configuradas:', fechaInput.min, 'a', fechaInput.max);
}

//  Formatear fecha para input type="date"
function formatoFechaInput(fecha) {
    return fecha.toISOString().split('T')[0];
}

//  Manejar cambio de tipo de entrega
function manejarCambioTipoEntrega(tipo) {
    const direccionField = document.getElementById('direccionField');
    const direccionInput = direccionField?.querySelector('input');

    if (tipo === 'recojo') {
        if (direccionField && direccionInput) {
            direccionField.style.display = 'none';
            direccionInput.required = false;
            direccionInput.value = '';
        }
        actualizarTiempoEstimado('15-25 minutos');
    } else {
        if (direccionField && direccionInput) {
            direccionField.style.display = 'block';
            direccionInput.required = true;
        }
        actualizarTiempoEstimado('30-45 minutos');
    }

    console.log('Tipo de entrega cambiado a:', tipo);
}

//  Manejar cambio de método de pago
function manejarCambioMetodoPago(metodo) {
    document.querySelectorAll('.tarjeta-info, .yape-info').forEach(panel => {
        panel.style.display = 'none';
    });

    if (metodo === 'tarjeta') {
        const tarjetaInfo = document.querySelector('.tarjeta-info');
        if (tarjetaInfo) tarjetaInfo.style.display = 'block';
    } else if (metodo === 'yape') {
        const yapeInfo = document.querySelector('.yape-info');
        if (yapeInfo) yapeInfo.style.display = 'block';

        const montoYape = document.getElementById('montoYape');
        const totalPagar = document.getElementById('totalPagar');
        if (montoYape && totalPagar) {
            montoYape.textContent = totalPagar.textContent;
        }
    }

    console.log('Método de pago cambiado a:', metodo);
}

//  Actualizar tiempo estimado de entrega
function actualizarTiempoEstimado(tiempo) {
    const tiempoElement = document.querySelector('.tiempo-entrega .text-muted');
    if (tiempoElement) {
        tiempoElement.textContent = tiempo;
    }
}

//  Actualizar montos en la interfaz
function actualizarMontos() {
    console.log('Montos actualizados desde el servidor');
}

//  Validar fecha de entrega
function validarFechaEntrega() {
    const fechaInput = document.getElementById('fechaEntrega');
    if (!fechaInput.value) return false;

    const fechaSeleccionada = new Date(fechaInput.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada <= hoy) {
        mostrarNotificacion(' La fecha de entrega debe ser futura', 'error');
        fechaInput.value = formatoFechaInput(new Date(hoy.setDate(hoy.getDate() + 1)));
        return false;
    }

    return true;
}

//  Validar campos de tarjeta
function validarTarjeta() {
    const numero = document.querySelector('.tarjeta-info input[placeholder*="1234"]')?.value;
    const vencimiento = document.querySelector('.tarjeta-info input[placeholder*="MM/AA"]')?.value;
    const cvv = document.querySelector('.tarjeta-info input[placeholder*="123"]')?.value;
    const nombre = document.querySelector('.tarjeta-info input[placeholder*="nombre"]')?.value;

    if (!numero || numero.replace(/\s/g, '').length < 16) {
        mostrarNotificacion(' Número de tarjeta incompleto', 'error');
        return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
        mostrarNotificacion(' Formato de fecha inválido (MM/AA)', 'error');
        return false;
    }

    if (!cvv || cvv.length !== 3) {
        mostrarNotificacion(' CVV debe tener 3 dígitos', 'error');
        return false;
    }

    if (!nombre || nombre.trim().length < 3) {
        mostrarNotificacion(' Nombre en tarjeta requerido', 'error');
        return false;
    }

    return true;
}

//  Validar formulario completo
function validarFormulario() {
    let valido = true;

    const camposRequeridos = [
        '#tipoEntrega',
        '#fechaEntrega',
        '#horaEntrega',
        '.info-contacto input[type="text"]',
        '.info-contacto input[type="tel"]'
    ];

    camposRequeridos.forEach(selector => {
        const elemento = document.querySelector(selector);
        if (elemento && !elemento.value.trim()) {
            elemento.classList.add('is-invalid');
            valido = false;
        } else if (elemento) {
            elemento.classList.remove('is-invalid');
        }
    });

    const tipoEntrega = document.getElementById('tipoEntrega').value;
    if (tipoEntrega === 'delivery') {
        const direccionInput = document.querySelector('#direccionField input');
        if (direccionInput && !direccionInput.value.trim()) {
            direccionInput.classList.add('is-invalid');
            valido = false;
        } else if (direccionInput) {
            direccionInput.classList.remove('is-invalid');
        }
    }

    const metodoPagoSeleccionado = document.querySelector('input[name="metodoPago"]:checked');
    if (!metodoPagoSeleccionado) {
        mostrarNotificacion(' Por favor selecciona un método de pago', 'error');
        valido = false;
    }

    if (metodoPagoSeleccionado && metodoPagoSeleccionado.value === 'tarjeta') {
        if (!validarTarjeta()) {
            valido = false;
        }
    }

    if (!validarFechaEntrega()) {
        valido = false;
    }

    return valido;
}

//  Obtener datos del formulario de pedido
function obtenerDatosPedido() {
    const tipoEntrega = document.getElementById('tipoEntrega').value;
    const metodoPagoSeleccionado = document.querySelector('input[name="metodoPago"]:checked');

    return {
        tipoEntrega: tipoEntrega,
        direccion: tipoEntrega === 'delivery' ?
                   document.querySelector('#direccionField input')?.value : null,
        instrucciones: document.querySelector('.info-entrega textarea')?.value,
        fechaEntrega: document.getElementById('fechaEntrega')?.value,
        horaEntrega: document.getElementById('horaEntrega')?.value,
        nombre: document.querySelector('.info-contacto input[type="text"]')?.value,
        telefono: document.querySelector('.info-contacto input[type="tel"]')?.value,
        email: document.querySelector('.info-contacto input[type="email"]')?.value,
        recibirOfertas: document.getElementById('recibirOfertas')?.checked,
        metodoPago: metodoPagoSeleccionado?.value,
        tarjeta: metodoPagoSeleccionado?.value === 'tarjeta' ? {
            numero: document.querySelector('.tarjeta-info input[placeholder*="1234"]')?.value,
            vencimiento: document.querySelector('.tarjeta-info input[placeholder*="MM/AA"]')?.value,
            cvv: document.querySelector('.tarjeta-info input[placeholder*="123"]')?.value,
            nombre: document.querySelector('.tarjeta-info input[placeholder*="nombre"]')?.value
        } : null
    };
}

//  Manejar selección de dirección
function configurarDirecciones() {
    const selectDireccion = document.getElementById('selectDireccion');
    const inputDireccion = document.getElementById('inputDireccion');

    if (selectDireccion && inputDireccion) {
        selectDireccion.addEventListener('change', function() {
            if (this.value === 'nueva') {
                inputDireccion.value = '';
                inputDireccion.focus();
                inputDireccion.required = true;
            } else if (this.value) {
                inputDireccion.value = this.value;
                inputDireccion.required = true;
            } else {
                inputDireccion.required = true;
            }
        });

        if (inputDireccion.value && inputDireccion.value.trim() !== '') {
            for (let i = 0; i < selectDireccion.options.length; i++) {
                if (selectDireccion.options[i].value === inputDireccion.value) {
                    selectDireccion.selectedIndex = i;
                    break;
                }
            }
        }
    }
}

//  Formatear número de tarjeta
function formatearNumeroTarjeta(input) {
    let valor = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = valor.match(/\d{4,16}/g);
    let match = matches && matches[0] || '';
    let partes = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
        partes.push(match.substring(i, i + 4));
    }

    if (partes.length) {
        input.value = partes.join(' ');
    } else {
        input.value = valor;
    }
}

//  Formatear fecha de vencimiento
function formatearFechaVencimiento(input) {
    let valor = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

    if (valor.length >= 2) {
        input.value = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    } else {
        input.value = valor;
    }
}

//  Mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacionAnterior = document.querySelector('.notificacion-flotante');
    if (notificacionAnterior) {
        notificacionAnterior.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-flotante notificacion-${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-contenido">
            <span class="notificacion-texto">${mensaje}</span>
            <button class="notificacion-cerrar">&times;</button>
        </div>
    `;

    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        border: 1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : '#bee5eb'};
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificacion.remove(), 300);
    };

    document.body.appendChild(notificacion);

    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 5000);
}

//  CSS dinámico para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .is-invalid {
        border-color: #dc3545 !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6.4.4.4-.4'/%3e%3cpath d='M6 7v1'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
    .notificacion-cerrar {
        background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px; color: inherit;
    }
    .notificacion-contenido { display: flex; align-items: center; justify-content: space-between; }
    .btn:disabled { cursor: not-allowed; opacity: 0.6; }
    @media (max-width: 768px) {
        .notificacion-flotante { left: 10px; right: 10px; max-width: none; }
    }
`;
document.head.appendChild(style);

console.log('Pago.js cargado - Listo para procesar pedidos');