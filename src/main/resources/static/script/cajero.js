// cajero.js -

// Variables globales
let pedidoSeleccionado = null;
let pedidosPendientes = [];

// Elementos del DOM
const elementos = {
    listaPedidos: document.getElementById('lista-pedidos-pendientes'),
    detallePedido: document.getElementById('detalle-pedido'),
    sinPedidos: document.getElementById('sin-pedidos'),
    metricas: {
        pendientes: document.getElementById('total-pendientes'),
        pagadosHoy: document.getElementById('total-pagados-hoy'),
        ingresosHoy: document.getElementById('ingresos-hoy'),
        badgePendientes: document.getElementById('badge-pendientes')
    },
    acciones: {
        contenedor: document.getElementById('acciones-pedido'),
        sinSeleccion: document.getElementById('sin-pedido-seleccionado'),
        btnPagado: document.getElementById('btn-marcar-pagado'),
        btnCancelar: document.getElementById('btn-cancelar-pedido')
    },
    detalle: {
        numero: document.getElementById('detalle-numero'),
        orderNumber: document.getElementById('order-number'),
        orderTotal: document.getElementById('order-total-display'),
        itemsList: document.getElementById('order-items-list'),
        tipoEntrega: {
            delivery: document.getElementById('delivery-option'),
            pickup: document.getElementById('pickup-option')
        },
        contenido: {
            delivery: document.getElementById('content-delivery'),
            pickup: document.getElementById('content-pickup-info')
        },
        info: {
            direccion: document.getElementById('detalle-direccion'),
            telefono: document.getElementById('detalle-telefono')
        }
    }
};

// FUNCIONES DE CONEXIÓN CON BACKEND

// OBTENER TOKEN CSRF
function getCsrfToken() {
    // Buscar en múltiples ubicaciones posibles
    const csrfInput = document.querySelector('input[name="_csrf"]');
    const csrfMeta = document.querySelector('meta[name="_csrf"]');

    const token = csrfInput ? csrfInput.value : (csrfMeta ? csrfMeta.content : '');

    if (!token) {
        console.warn('⚠️ No se encontró token CSRF');
    } else {
        console.log('🔐 Token CSRF encontrado');
    }

    return token;
}

// FETCH CON CSRF -
async function fetchConCSRF(url, options = {}) {
    const csrfToken = getCsrfToken();

    const config = {
        credentials: 'include',
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            ...options.headers
        },
        ...options
    };

    console.log(`Realizando petición a: ${url}`);
    const response = await fetch(url, config);

    // Verificar si hay redirección (sesión expirada)
    if (response.redirected && response.url.includes('/login')) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    return response;
}

// CARGAR PEDIDOS PENDIENTES DESDE BACKEND
async function cargarPedidosPendientes() {
    try {
        console.log('Cargando pedidos pendientes...');
        const response = await fetchConCSRF('/cajero/pedidos-pendientes');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        pedidosPendientes = await response.json();
        console.log(` Pedidos cargados: ${pedidosPendientes.length}`);
        mostrarPedidosPendientes();
        cargarMetricas();

    } catch (error) {
        console.error('Error cargando pedidos:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta('Error al cargar pedidos pendientes', 'error');
        }
    }
}

// CARGAR MÉTRICAS DESDE BACKEND
async function cargarMetricas() {
    try {
        console.log(' Cargando métricas...');
        const response = await fetchConCSRF('/cajero/metricas-hoy');

        if (!response.ok) {
            console.warn('⚠ Endpoint métricas no disponible, usando cálculo local');
            calcularMetricasLocales();
            return;
        }

        const metricas = await response.json();
        if (metricas.success) {
            actualizarMetricas(metricas);
        }

    } catch (error) {
        console.error('Error cargando métricas:', error);
        calcularMetricasLocales();
    }
}

// CALCULAR MÉTRICAS LOCALMENTE (fallback)
function calcularMetricasLocales() {
    const metricas = {
        totalPedidosPendientes: pedidosPendientes.length,
        totalPedidosPagadosHoy: 0,
        ingresosHoy: 0
    };
    actualizarMetricas(metricas);
}

// MARCAR PEDIDO COMO PAGADO
async function marcarComoPagado(pedidoId) {
    try {
        console.log(` Marcando pedido ${pedidoId} como PAGADO...`);
        console.log(' Token CSRF actual:', getCsrfToken().substring(0, 20) + '...');

        const response = await fetch(`/cajero/marcar-pagado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            credentials: 'include'
        });

        console.log(' Estado respuesta:', response.status, response.statusText);
        console.log(' Redireccionó?:', response.redirected);

        // Manejar diferentes códigos de estado
        if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        }

        if (response.status === 403) {
            const errorText = await response.text();
            throw new Error(errorText.replace('ERROR: ', '') || 'No tiene permisos para esta acción.');
        }

        if (response.status === 400) {
            const errorText = await response.text();
            throw new Error(errorText.replace('ERROR: ', ''));
        }

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        const resultado = await response.text();
        console.log(' Respuesta del servidor:', resultado);

        if (resultado.includes('SUCCESS')) {
            mostrarAlerta('Pedido marcado como PAGADO exitosamente', 'success');
            await cargarPedidosPendientes();
            ocultarDetalle();
        } else {
            throw new Error(resultado.replace('ERROR: ', ''));
        }

    } catch (error) {
        console.error(' Error marcando como pagado:', error);

        if (error.message.includes('Sesión expirada')) {
            mostrarAlerta(' Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/login?sessionExpired=true';
            }, 2000);
        } else {
            mostrarAlerta(`${error.message}`, 'error');
        }
    }
}

// ================== FUNCIONES PARA BOLETA ==================

// MARCAR PEDIDO COMO PAGADO CON GENERACIÓN DE BOLETA
async function marcarComoPagadoConBoleta(pedidoId) {
    try {
        console.log(` Marcando pedido ${pedidoId} como PAGADO y generando boleta...`);

        const response = await fetch(`/cajero/marcar-pagado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            credentials: 'include'
        });

        console.log(' Estado respuesta:', response.status);

        if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        }

        if (response.status === 403) {
            throw new Error('No tiene permisos para esta acción.');
        }

        if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la solicitud');
        }

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }


        const resultado = await response.json();
        console.log(' Respuesta JSON del servidor:', resultado);

        if (resultado.status === 'SUCCESS') {
            let mensaje = 'Pedido marcado como PAGADO exitosamente';

            if (resultado.boletaPath && !resultado.boletaPath.includes('Error')) {
                mensaje += `<br> Boleta generada: ${resultado.boletaPath}`;

                // Descargar automáticamente la boleta después de 1 segundo
                setTimeout(() => {
                    descargarBoleta(resultado.boletaPath);
                }, 1000);
            }

            mostrarAlerta(mensaje, 'success');
            await cargarPedidosPendientes();
            ocultarDetalle();
        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error marcando como pagado:', error);

        if (error.message.includes('Sesión expirada')) {
            mostrarAlerta(' Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => {
                window.location.href = '/login?sessionExpired=true';
            }, 2000);
        } else {
            mostrarAlerta(`${error.message}`, 'error');
        }
    }
}


function descargarBoleta(boletaFileName) {
    try {
        console.log(' Descargando boleta:', boletaFileName);

        // Construir URL completa al endpoint de descarga
        const downloadUrl = `/boletas/${boletaFileName}`;
        console.log('URL de descarga:', downloadUrl);

        // Crear enlace temporal
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = boletaFileName;
        link.target = '_blank';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('Descarga iniciada');

    } catch (error) {
        console.error('Error en descarga automática:', error);
        // Fallback: abrir en nueva pestaña
        window.open(`/boletas/${boletaFileName}`, '_blank');
    }
}


async function marcarComoPagadoConBoleta(pedidoId) {
    try {
        console.log(` Marcando pedido ${pedidoId} como PAGADO...`);

        const response = await fetch(`/cajero/marcar-pagado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const resultado = await response.json();
        console.log(' Respuesta del servidor:', resultado);

        if (resultado.status === 'SUCCESS') {
            let mensaje = 'Pedido marcado como PAGADO exitosamente';


            if (resultado.boletaPath &&
                resultado.boletaPath !== 'error_generacion' &&
                !resultado.boletaPath.includes('Error')) {

                mensaje += `<br> Boleta generada: ${resultado.boletaPath}`;

                // Descargar automáticamente después de 1 segundo
                setTimeout(() => {
                    descargarBoleta(resultado.boletaPath);
                }, 1000);
            } else {
                mensaje += `<br> Boleta no generada (pero pedido procesado)`;
            }

            mostrarAlerta(mensaje, 'success');
            await cargarPedidosPendientes();
            ocultarDetalle();
        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error(' Error marcando como pagado:', error);
        mostrarAlerta(` ${error.message}`, 'error');
    }
}


function visualizarBoleta(boletaPath) {
    try {
        let viewUrl = boletaPath;
        if (!boletaPath.startsWith('http')) {
            viewUrl = `/${boletaPath}`;
        }

        window.open(viewUrl, '_blank');
        console.log('Boleta abierta en nueva pestaña:', viewUrl);
    } catch (error) {
        console.error(' Error visualizando boleta:', error);
    }
}

// CANCELAR PEDIDO
async function cancelarPedido(pedidoId, motivo = '') {
    try {
        console.log(` Cancelando pedido ${pedidoId}...`);

        const formData = new URLSearchParams();
        if (motivo) formData.append('motivo', motivo);

        const response = await fetchConCSRF(`/cajero/marcar-cancelado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const resultado = await response.text();
        console.log(' Respuesta del servidor:', resultado);

        if (resultado.includes('SUCCESS') || response.ok) {
            mostrarAlerta('Pedido cancelado exitosamente', 'success');
            await cargarPedidosPendientes();
            ocultarDetalle();
        } else {
            throw new Error(resultado.replace('ERROR: ', '') || 'Error desconocido');
        }

    } catch (error) {
        console.error(' Error cancelando pedido:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta(` Error: ${error.message}`, 'error');
        }
    }
}

// MANEJAR SESIÓN EXPIRADA
function manejarSesionExpirada() {
    mostrarAlerta(' Sesión expirada. Redirigiendo al login...', 'error');
    setTimeout(() => {
        window.location.href = '/login?sessionExpired=true';
    }, 2000);
}

// ================== FUNCIONES DE INTERFAZ ==================

// MOSTRAR PEDIDOS PENDIENTES EN LA LISTA
function mostrarPedidosPendientes() {
    if (!elementos.listaPedidos) return;

    elementos.listaPedidos.innerHTML = '';

    if (pedidosPendientes.length === 0) {
        elementos.sinPedidos.classList.remove('d-none');
        return;
    }

    elementos.sinPedidos.classList.add('d-none');

    pedidosPendientes.forEach(pedido => {
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action cursor-pointer';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${pedido.numeroPedido || `#${pedido.id}`}</h6>
                    <p class="mb-1">${obtenerNombreCliente(pedido)}</p>
                    <small class="text-muted">${formatearFecha(pedido.fecha)}</small>
                </div>
                <div class="text-end">
                    <strong class="text-success">S/ ${(pedido.total || 0).toFixed(2)}</strong>
                    <br>
                    <span class="badge bg-warning">PENDIENTE</span>
                </div>
            </div>
        `;

        item.addEventListener('click', () => mostrarDetallePedido(pedido));
        elementos.listaPedidos.appendChild(item);
    });
}

// MOSTRAR DETALLE DEL PEDIDO SELECCIONADO
function mostrarDetallePedido(pedido) {
    pedidoSeleccionado = pedido;

    // Actualizar información básica
    elementos.detalle.numero.textContent = pedido.numeroPedido || `#${pedido.id}`;
    elementos.detalle.orderNumber.textContent = pedido.numeroPedido || `#${pedido.id}`;
    elementos.detalle.orderTotal.textContent = `S/ ${(pedido.total || 0).toFixed(2)}`;

    // Mostrar items del pedido
    elementos.detalle.itemsList.innerHTML = '';
    if (pedido.items && pedido.items.length > 0) {
        pedido.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'd-flex justify-content-between border-bottom pb-2 mb-2';
            itemElement.innerHTML = `
                <span>${item.nombreProductoSeguro || item.nombreProducto || 'Producto'} x ${item.cantidad || 1}</span>
                <span>S/ ${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</span>
            `;
            elementos.detalle.itemsList.appendChild(itemElement);
        });
    } else {
        elementos.detalle.itemsList.innerHTML = '<p class="text-muted">No hay items disponibles</p>';
    }

    // Configurar tipo de entrega
    const tipoEntrega = (pedido.tipoEntrega || 'DELIVERY').toUpperCase();
    configurarTipoEntrega(tipoEntrega, pedido);

    // Mostrar acciones
    elementos.acciones.contenedor.style.display = 'block';
    elementos.acciones.sinSeleccion.style.display = 'none';

    // Mostrar detalle con animación
    elementos.detallePedido.style.display = 'block';
    elementos.detallePedido.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// CONFIGURAR TIPO DE ENTREGA
function configurarTipoEntrega(tipoEntrega, pedido) {
    // Resetear todos
    elementos.detalle.tipoEntrega.delivery.classList.remove('active', 'bg-primary', 'text-white');
    elementos.detalle.tipoEntrega.pickup.classList.remove('active', 'bg-primary', 'text-white');
    elementos.detalle.contenido.delivery.style.display = 'none';
    elementos.detalle.contenido.pickup.style.display = 'none';

    if (tipoEntrega === 'DELIVERY') {
        elementos.detalle.tipoEntrega.delivery.classList.add('active', 'bg-primary', 'text-white');
        elementos.detalle.contenido.delivery.style.display = 'block';

        // Mostrar información de delivery
        elementos.detalle.info.direccion.textContent = pedido.direccionEntrega || 'No especificada';
        elementos.detalle.info.telefono.textContent = pedido.cliente?.telefono || 'No especificado';
    } else {
        elementos.detalle.tipoEntrega.pickup.classList.add('active', 'bg-primary', 'text-white');
        elementos.detalle.contenido.pickup.style.display = 'block';
    }
}

// OCULTAR DETALLE DEL PEDIDO
function ocultarDetalle() {
    pedidoSeleccionado = null;
    elementos.detallePedido.style.display = 'none';
    elementos.acciones.contenedor.style.display = 'none';
    elementos.acciones.sinSeleccion.style.display = 'block';
}

// ACTUALIZAR MÉTRICAS EN LA INTERFAZ
function actualizarMetricas(metricas) {
    const metricasData = {
        totalPedidosPendientes: metricas.totalPedidosPendientes || pedidosPendientes.length || 0,
        totalPedidosPagadosHoy: metricas.totalPedidosPagadosHoy || 0,
        ingresosHoy: metricas.ingresosHoy || 0
    };

    if (elementos.metricas.pendientes) {
        elementos.metricas.pendientes.textContent = metricasData.totalPedidosPendientes;
    }
    if (elementos.metricas.pagadosHoy) {
        elementos.metricas.pagadosHoy.textContent = metricasData.totalPedidosPagadosHoy;
    }
    if (elementos.metricas.ingresosHoy) {
        elementos.metricas.ingresosHoy.textContent = `S/ ${(metricasData.ingresosHoy).toFixed(2)}`;
    }
    if (elementos.metricas.badgePendientes) {
        elementos.metricas.badgePendientes.textContent = metricasData.totalPedidosPendientes;
    }
}

// ================== FUNCIONES UTILITARIAS ==================

// OBTENER NOMBRE DEL CLIENTE
function obtenerNombreCliente(pedido) {
    if (pedido.cliente) {
        return `${pedido.cliente.nombres || ''} ${pedido.cliente.apellidos || ''}`.trim();
    }
    return pedido.nombreCliente || 'Cliente no especificado';
}

// FORMATEAR FECHA
function formatearFecha(fechaString) {
    if (!fechaString) return 'Fecha no disponible';

    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

// MOSTRAR ALERTA TOAST MEJORADA
function mostrarAlerta(mensaje, tipo = 'info') {
    const toastEl = document.getElementById('liveAlert');
    if (!toastEl) {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        return;
    }

    const toastTitulo = document.getElementById('toast-titulo');
    const toastMensaje = document.getElementById('toast-mensaje');
    const toastIcon = document.getElementById('toast-icon');

    const config = {
        success: {
            titulo: 'Éxito',
            icon: 'bi-check-circle-fill',
            color: 'text-success',
            bgColor: 'bg-success'
        },
        error: {
            titulo: 'Error',
            icon: 'bi-exclamation-triangle-fill',
            color: 'text-danger',
            bgColor: 'bg-danger'
        },
        info: {
            titulo: 'Información',
            icon: 'bi-info-circle-fill',
            color: 'text-info',
            bgColor: 'bg-info'
        }
    }[tipo] || config.info;

    toastTitulo.textContent = config.titulo;
    toastMensaje.textContent = mensaje;
    toastIcon.className = `bi ${config.icon} me-2 ${config.color}`;

    // Estilo del header del toast
    const toastHeader = toastEl.querySelector('.toast-header');
    toastHeader.className = `toast-header ${config.bgColor} text-white`;

    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}

// ================== FUNCIONES DE INICIALIZACIÓN ==================

// ACTUALIZAR HORA Y FECHA EN TIEMPO REAL
function actualizarHoraYFecha() {
    const ahora = new Date();

    // Header (formato simple)
    const headerHora = document.getElementById('header-hora-actual');
    const headerFecha = document.getElementById('header-fecha-actual');

    if (headerHora) {
        headerHora.textContent = ahora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    if (headerFecha) {
        headerFecha.textContent = ahora.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Panel lateral (formato completo)
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');

    if (currentDate) {
        currentDate.textContent = ahora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (currentTime) {
        currentTime.textContent = ahora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}

// ================== EVENT LISTENERS ==================

document.addEventListener('DOMContentLoaded', function () {
    console.log(' Inicializando módulo de cajero...');

    // Verificar que existe el token CSRF
    const csrfToken = getCsrfToken();
    console.log(' Token CSRF disponible:', csrfToken ? 'SÍ' : 'NO');

    // Cargar datos iniciales
    cargarPedidosPendientes();

    // Configurar eventos de botones si existen
    if (elementos.acciones.btnPagado) {
        elementos.acciones.btnPagado.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = new bootstrap.Modal(document.getElementById('modalConfirmarPago'));
                document.getElementById('confirmar-numero-pedido').textContent =
                    pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
                modal.show();
            }
        });
    }

    if (elementos.acciones.btnCancelar) {
        elementos.acciones.btnCancelar.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = new bootstrap.Modal(document.getElementById('modalCancelar'));
                document.getElementById('cancelar-numero-pedido').textContent =
                    pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
                modal.show();
            }
        });
    }

    // Confirmar pago CON BOLETA
    const btnConfirmarPago = document.getElementById('btn-confirmar-pago');
    if (btnConfirmarPago) {
        btnConfirmarPago.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarPago'));
                modal.hide();
                marcarComoPagadoConBoleta(pedidoSeleccionado.id); // Cambiado aquí
            }
        });
    }

    // Confirmar cancelación
    const btnConfirmarCancelacion = document.getElementById('btn-confirmar-cancelacion');
    if (btnConfirmarCancelacion) {
        btnConfirmarCancelacion.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalCancelar'));
                const motivo = document.getElementById('motivoCancelacion').value;
                modal.hide();
                cancelarPedido(pedidoSeleccionado.id, motivo);
            }
        });
    }

    // Cerrar detalle
    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle');
    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', ocultarDetalle);
    }

    // Actualizar hora cada segundo
    actualizarHoraYFecha();
    setInterval(actualizarHoraYFecha, 1000);

    // Recargar datos cada 30 segundos
    setInterval(cargarPedidosPendientes, 30000);

    console.log('Módulo de cajero inicializado correctamente');
});



function convertNumberToWords(number) {
    const totalFixed = number.toFixed(2);
    let [integerPart, decimalPart] = totalFixed.split('.').map(Number);
    let words = integerPart > 0 ? integerPart.toLocaleString('es-ES') + ' SOLES' : '';
    if (decimalPart > 0) {
        words += (words ? ' CON ' : '') + decimalPart.toLocaleString('es-ES', { minimumIntegerDigits: 2, useGrouping: false }) + ' CÉNTIMOS';
    }
    return words.toUpperCase() || 'CERO SOLES';
}

function validateNumericInput(event) {
    const key = event.key;
    if (!/[\d\b\t\r]|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Delete|Backspace/.test(key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
    }
}

function formatPhoneInput(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.startsWith('51') && value.length <= 11) {
        value = '+' + value;
    }

    if (value.startsWith('+51') && value.length > 12) {
        value = value.substring(0, 12);
    }

    input.value = value;
}