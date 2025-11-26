// delivery.js

// Variables globales
let pedidoSeleccionado = null;
let pedidosPendientesEntrega = [];
let pedidosEnCamino = [];

// Elementos del DOM
const elementos = {
    metricas: {
        pendientesEntrega: document.getElementById('total-pendientes-entrega'),
        enCamino: document.getElementById('total-en-camino'),
        entregadosHoy: document.getElementById('total-entregados-hoy'),
        badges: {
            pendientes: document.getElementById('badge-pendientes'),
            enCamino: document.getElementById('badge-en-camino')
        }
    },
    listas: {
        pendientesEntrega: document.getElementById('lista-pendientes-entrega'),
        enCamino: document.getElementById('lista-en-camino')
    },
    mensajes: {
        sinPendientes: document.getElementById('sin-pedidos-pendientes'),
        sinEnCamino: document.getElementById('sin-pedidos-camino')
    },
    detalle: {
        contenedor: document.getElementById('detalle-pedido-container'),
        numero: document.getElementById('detalle-numero-pedido'),
        items: document.getElementById('detalle-items-pedido'),
        total: document.getElementById('detalle-total-pedido'),
        cliente: document.getElementById('detalle-cliente'),
        telefono: document.getElementById('detalle-telefono'),
        direccion: document.getElementById('detalle-direccion'),
        referencia: document.getElementById('detalle-referencia'),
        tipoEntrega: document.getElementById('detalle-tipo-entrega'),
        horaPedido: document.getElementById('detalle-hora-pedido'),
        tiempoTranscurrido: document.getElementById('detalle-tiempo-transcurrido'),
        acciones: document.getElementById('acciones-delivery'),
        observaciones: {
            contenedor: document.getElementById('detalle-observaciones-container'),
            texto: document.getElementById('detalle-observaciones')
        }
    }
};

// ================== FUNCIONES DE CONEXIÓN CON BACKEND ==================

// OBTENER TOKEN CSRF
function getCsrfToken() {
    const csrfInput = document.querySelector('input[name="_csrf"]');
    const csrfMeta = document.querySelector('meta[name="_csrf"]');
    const token = csrfInput ? csrfInput.value : (csrfMeta ? csrfMeta.content : '');

    if (!token) {
        console.warn('⚠️ No se encontró token CSRF');
    }
    return token;
}

// FETCH CON CSRF
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

    const response = await fetch(url, config);

    if (response.redirected && response.url.includes('/login')) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    return response;
}

// CARGAR PEDIDOS PARA DELIVERY
async function cargarPedidosDelivery() {
    try {
        console.log('Cargando pedidos para delivery...');

        const [pendientes, enCamino] = await Promise.all([
            fetchConCSRF('/delivery/pedidos-para-entrega').then(r => r.json()),
            fetchConCSRF('/delivery/pedidos-en-camino').then(r => r.json())
        ]);

        pedidosPendientesEntrega = Array.isArray(pendientes) ? pendientes : [];
        pedidosEnCamino = Array.isArray(enCamino) ? enCamino : [];

        console.log(` Pedidos cargados: ${pedidosPendientesEntrega.length} pendientes, ${pedidosEnCamino.length} en camino`);

        mostrarPedidos();
        cargarMetricasDelivery();

    } catch (error) {
        console.error(' Error cargando pedidos delivery:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta('Error al cargar pedidos de delivery', 'error');
        }
    }
}

// CARGAR MÉTRICAS DEL DELIVERY
async function cargarMetricasDelivery() {
    try {
        console.log('Cargando métricas de delivery...');
        const response = await fetchConCSRF('/delivery/metricas-delivery');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const metricas = await response.json();
        console.log(' Métricas delivery cargadas:', metricas);

        if (metricas.success) {
            actualizarMetricas(metricas);
        } else {
            actualizarMetricasConDatosLocales();
        }

    } catch (error) {
        console.error(' Error cargando métricas delivery:', error);
        actualizarMetricasConDatosLocales();
    }
}

// ACTUALIZAR MÉTRICAS CON DATOS LOCALES
function actualizarMetricasConDatosLocales() {
    const metricasData = {
        totalParaEntregar: pedidosPendientesEntrega.length,
        totalEnCamino: pedidosEnCamino.length,
        totalEntregadosHoy: 0
    };

    actualizarMetricas(metricasData);
}

// ACTUALIZAR MÉTRICAS EN LA INTERFAZ
function actualizarMetricas(metricas) {
    const metricasData = {
        totalParaEntregar: metricas.totalParaEntregar || pedidosPendientesEntrega.length || 0,
        totalEnCamino: metricas.totalEnCamino || pedidosEnCamino.length || 0,
        totalEntregadosHoy: metricas.totalEntregadosHoy || 0
    };

    console.log('Actualizando métricas delivery:', metricasData);

    if (elementos.metricas.pendientesEntrega) {
        elementos.metricas.pendientesEntrega.textContent = metricasData.totalParaEntregar;
    }
    if (elementos.metricas.enCamino) {
        elementos.metricas.enCamino.textContent = metricasData.totalEnCamino;
    }
    if (elementos.metricas.entregadosHoy) {
        elementos.metricas.entregadosHoy.textContent = metricasData.totalEntregadosHoy;
    }

    // Actualizar badges
    if (elementos.metricas.badges.pendientes) {
        elementos.metricas.badges.pendientes.textContent = metricasData.totalParaEntregar;
    }
    if (elementos.metricas.badges.enCamino) {
        elementos.metricas.badges.enCamino.textContent = metricasData.totalEnCamino;
    }
}

// INICIAR ENTREGA
async function iniciarEntrega(pedidoId) {
    try {
        console.log(`Iniciando entrega del pedido ${pedidoId}...`);

        const response = await fetchConCSRF(`/delivery/iniciar-entrega/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText.replace('ERROR: ', ''));
        }

        const resultado = await response.text();
        console.log(' Respuesta del servidor:', resultado);

        if (resultado.includes('SUCCESS')) {
            mostrarAlerta(' Entrega iniciada correctamente', 'success');
            await cargarPedidosDelivery();
            ocultarDetalle();
        } else {
            throw new Error(resultado.replace('ERROR: ', ''));
        }

    } catch (error) {
        console.error(' Error iniciando entrega:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta(` ${error.message}`, 'error');
        }
    }
}

// MARCAR PEDIDO COMO ENTREGADO
async function marcarComoEntregado(pedidoId) {
    try {
        console.log(`Marcando pedido ${pedidoId} como ENTREGADO...`);

        const response = await fetchConCSRF(`/delivery/marcar-entregado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText.replace('ERROR: ', ''));
        }

        const resultado = await response.text();
        console.log(' Respuesta del servidor:', resultado);

        if (resultado.includes('SUCCESS')) {
            mostrarAlerta(' Pedido marcado como ENTREGADO correctamente', 'success');
            await cargarPedidosDelivery();
            ocultarDetalle();
            setTimeout(cargarMetricasDelivery, 500);
        } else {
            throw new Error(resultado.replace('ERROR: ', ''));
        }

    } catch (error) {
        console.error(' Error marcando como entregado:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta(` ${error.message}`, 'error');
        }
    }
}

// ================== FUNCIONES DE INTERFAZ ==================

// MOSTRAR PEDIDOS EN LAS COLUMNAS
function mostrarPedidos() {
    mostrarColumnaPendientes();
    mostrarColumnaEnCamino();
}

// COLUMNA: PENDIENTES ENTREGA
function mostrarColumnaPendientes() {
    if (!elementos.listas.pendientesEntrega) return;

    elementos.listas.pendientesEntrega.innerHTML = '';

    if (pedidosPendientesEntrega.length === 0) {
        elementos.mensajes.sinPendientes.classList.remove('d-none');
        return;
    }

    elementos.mensajes.sinPendientes.classList.add('d-none');

    pedidosPendientesEntrega.forEach(pedido => {
        const item = crearItemPedido(pedido, 'pendientes');
        elementos.listas.pendientesEntrega.appendChild(item);
    });
}

// COLUMNA: EN CAMINO
function mostrarColumnaEnCamino() {
    if (!elementos.listas.enCamino) return;

    elementos.listas.enCamino.innerHTML = '';

    if (pedidosEnCamino.length === 0) {
        elementos.mensajes.sinEnCamino.classList.remove('d-none');
        return;
    }

    elementos.mensajes.sinEnCamino.classList.add('d-none');

    pedidosEnCamino.forEach(pedido => {
        const item = crearItemPedido(pedido, 'en-camino');
        elementos.listas.enCamino.appendChild(item);
    });
}

// CREAR ITEM DE PEDIDO PARA LISTA
function crearItemPedido(pedido, columna) {
    const item = document.createElement('div');
    item.className = `list-group-item list-group-item-action pedido-item-delivery estado-${columna}`;

    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fecha);
    const esUrgente = tiempoTranscurrido.minutosTotales > 45;

    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h6 class="mb-1">${pedido.numeroPedido || `#${pedido.id}`}</h6>
                <p class="mb-1 text-muted small">${obtenerNombreCliente(pedido)}</p>
                <p class="mb-1 text-muted small">
                    <i class="bi bi-geo-alt"></i> ${pedido.direccionEntrega || 'Dirección no especificada'}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${formatearFechaCorta(pedido.fecha)}</small>
                    <span class="badge ${esUrgente ? 'bg-danger' : 'bg-warning'} badge-tiempo">
                        ${tiempoTranscurrido.texto}
                    </span>
                </div>
            </div>
        </div>
    `;

    item.addEventListener('click', () => mostrarDetallePedido(pedido, columna));
    return item;
}

// MOSTRAR DETALLE DEL PEDIDO
async function mostrarDetallePedido(pedido, columna) {
    try {
        pedidoSeleccionado = pedido;

        // Cargar información básica
        elementos.detalle.numero.textContent = pedido.numeroPedido || `#${pedido.id}`;
        elementos.detalle.cliente.textContent = obtenerNombreCliente(pedido);
        elementos.detalle.telefono.textContent = obtenerTelefonoCliente(pedido);
        elementos.detalle.direccion.textContent = pedido.direccionEntrega || 'No especificada';
        elementos.detalle.referencia.textContent = pedido.referenciaDireccion || 'No especificada';
        elementos.detalle.tipoEntrega.textContent = pedido.tipoEntrega || 'DELIVERY';
        elementos.detalle.horaPedido.textContent = formatearFecha(pedido.fecha);
        elementos.detalle.total.textContent = `S/ ${(pedido.total || 0).toFixed(2)}`;

        // Calcular y mostrar tiempo transcurrido
        const tiempo = calcularTiempoTranscurrido(pedido.fecha);
        elementos.detalle.tiempoTranscurrido.textContent = tiempo.texto;

        // Usar clases CSS en lugar de estilos inline
        elementos.detalle.tiempoTranscurrido.className = 'badge ';
        if (tiempo.minutosTotales > 45) {
            elementos.detalle.tiempoTranscurrido.classList.add('bg-danger');
        } else if (tiempo.minutosTotales > 30) {
            elementos.detalle.tiempoTranscurrido.classList.add('bg-warning');
        } else {
            elementos.detalle.tiempoTranscurrido.classList.add('bg-info');
        }

        // Mostrar items del pedido
        elementos.detalle.items.innerHTML = '';
        if (pedido.items && pedido.items.length > 0) {
            pedido.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'd-flex justify-content-between border-bottom pb-2 mb-2';
                itemElement.innerHTML = `
                    <div class="d-flex align-items-center">
                        <span class="badge bg-secondary me-2">${item.cantidad || 1}</span>
                        <span>${item.nombreProducto || 'Producto'}</span>
                    </div>
                    <div class="text-end">
                        <div>S/ ${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</div>
                        <small class="text-muted">S/ ${(item.precio || 0).toFixed(2)} c/u</small>
                    </div>
                `;
                elementos.detalle.items.appendChild(itemElement);
            });
        } else {
            elementos.detalle.items.innerHTML = '<p class="text-muted">No hay items disponibles</p>';
        }

        // Mostrar observaciones si existen
        if (pedido.observaciones && pedido.observaciones.trim() !== '') {
            elementos.detalle.observaciones.texto.textContent = pedido.observaciones;
            elementos.detalle.observaciones.contenedor.classList.remove('hidden-element');
            elementos.detalle.observaciones.contenedor.classList.add('visible-element');
        } else {
            elementos.detalle.observaciones.contenedor.classList.add('hidden-element');
            elementos.detalle.observaciones.contenedor.classList.remove('visible-element');
        }

        // Mostrar acciones según la columna
        mostrarAccionesDelivery(columna);

        // Mostrar detalle con animación
        elementos.detalle.contenedor.classList.remove('hidden-element');
        elementos.detalle.contenedor.classList.add('visible-element');
        elementos.detalle.contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error(' Error mostrando detalle:', error);
        mostrarAlerta('Error al cargar detalle del pedido', 'error');
    }
}

// MOSTRAR ACCIONES SEGÚN EL ESTADO
function mostrarAccionesDelivery(columna) {
    let accionesHTML = '';

    switch(columna) {
        case 'pendientes':
            accionesHTML = `
                <button class="btn btn-primary btn-lg w-100 mb-2" id="btn-iniciar-entrega">
                    <i class="bi bi-truck me-2"></i>Iniciar Entrega
                </button>
                <small class="text-muted d-block text-center">
                    El pedido pasará a "En Camino"
                </small>
            `;
            break;

        case 'en-camino':
            accionesHTML = `
                <button class="btn btn-success btn-lg w-100 mb-2" id="btn-marcar-entregado">
                    <i class="bi bi-check2-all me-2"></i>Marcar como Entregado
                </button>
                <small class="text-muted d-block text-center">
                    Confirmar entrega al cliente
                </small>
            `;
            break;
    }

    elementos.detalle.acciones.innerHTML = accionesHTML;

    // Configurar eventos de los botones
    const btnIniciar = document.getElementById('btn-iniciar-entrega');
    const btnEntregado = document.getElementById('btn-marcar-entregado');

    if (btnIniciar) {
        btnIniciar.addEventListener('click', () => {
            const modalElement = document.getElementById('modalIniciarEntrega');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                document.getElementById('modal-numero-pedido').textContent =
                    pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
                modal.show();
            }
        });
    }

    if (btnEntregado) {
        btnEntregado.addEventListener('click', () => {
            const modalElement = document.getElementById('modalMarcarEntregado');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                document.getElementById('modal-numero-pedido-entregado').textContent =
                    pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
                modal.show();
            }
        });
    }
}

// ================== FUNCIONES UTILITARIAS ==================

// CALCULAR TIEMPO TRANSCURRIDO
function calcularTiempoTranscurrido(fechaString) {
    if (!fechaString) return { texto: 'N/A', minutosTotales: 0 };

    try {
        const fechaPedido = new Date(fechaString);
        if (isNaN(fechaPedido.getTime())) {
            return { texto: 'N/A', minutosTotales: 0 };
        }

        const ahora = new Date();
        const diferenciaMs = ahora - fechaPedido;
        const minutosTotales = Math.floor(diferenciaMs / (1000 * 60));

        if (minutosTotales > 360) {
            console.warn(' Tiempo muy largo detectado:', minutosTotales, 'minutos para pedido');
            return { texto: 'Revisar', minutosTotales };
        }

        if (minutosTotales < 60) {
            return { texto: `${minutosTotales}min`, minutosTotales };
        } else {
            const horas = Math.floor(minutosTotales / 60);
            const minutos = minutosTotales % 60;
            return { texto: `${horas}h ${minutos}m`, minutosTotales };
        }
    } catch (error) {
        console.error('Error calculando tiempo:', error);
        return { texto: 'N/A', minutosTotales: 0 };
    }
}

// OBTENER NOMBRE DEL CLIENTE
function obtenerNombreCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        const nombres = pedido.cliente.nombres || '';
        const apellidos = pedido.cliente.apellidos || '';
        return `${nombres} ${apellidos}`.trim();
    } else if (pedido.cliente && typeof pedido.cliente === 'string') {
        return pedido.cliente;
    }
    return 'Cliente no especificado';
}

// OBTENER TELÉFONO DEL CLIENTE
function obtenerTelefonoCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        return pedido.cliente.telefono || 'No especificado';
    }
    return 'No especificado';
}

// FORMATEAR FECHA COMPLETA
function formatearFecha(fechaString) {
    if (!fechaString) return 'Fecha no disponible';

    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';

        return fecha.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Lima'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

// FORMATEAR FECHA CORTA (para items)
function formatearFechaCorta(fechaString) {
    if (!fechaString) return '';

    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return '';

        return fecha.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Lima'
        });
    } catch (error) {
        return '';
    }
}

// MANEJAR SESIÓN EXPIRADA
function manejarSesionExpirada() {
    mostrarAlerta(' Sesión expirada. Redirigiendo al login...', 'error');
    setTimeout(() => {
        window.location.href = '/login?sessionExpired=true';
    }, 2000);
}

// MOSTRAR ALERTA TOAST
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

    const toastHeader = toastEl.querySelector('.toast-header');
    toastHeader.className = `toast-header ${config.bgColor} text-white`;

    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();
}

// OCULTAR DETALLE
function ocultarDetalle() {
    pedidoSeleccionado = null;
    if (elementos.detalle.contenedor) {
        elementos.detalle.contenedor.classList.add('hidden-element');
        elementos.detalle.contenedor.classList.remove('visible-element');
    }
}

// ACTUALIZAR HORA Y FECHA EN TIEMPO REAL
function actualizarHoraYFecha() {
    const ahora = new Date();

    const headerHora = document.getElementById('header-hora-actual');
    const headerFecha = document.getElementById('header-fecha-actual');

    if (headerHora) {
        headerHora.textContent = ahora.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Lima'
        });
    }

    if (headerFecha) {
        headerFecha.textContent = ahora.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'America/Lima'
        });
    }
}

// ================== INICIALIZACIÓN ==================

document.addEventListener('DOMContentLoaded', function () {
    console.log(' Inicializando módulo de delivery...');

    // Verificar token CSRF
    const csrfToken = getCsrfToken();
    console.log(' Token CSRF disponible:', csrfToken ? 'SÍ' : 'NO');

    // Cargar datos iniciales
    cargarPedidosDelivery();

    // Configurar eventos de botones
    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle');
    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', ocultarDetalle);
    }

    // Confirmar iniciar entrega
    const btnConfirmarIniciar = document.getElementById('btn-confirmar-iniciar-entrega');
    if (btnConfirmarIniciar) {
        btnConfirmarIniciar.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalIniciarEntrega'));
                if (modal) modal.hide();
                iniciarEntrega(pedidoSeleccionado.id);
            }
        });
    }

    // Confirmar marcar como entregado
    const btnConfirmarEntregado = document.getElementById('btn-confirmar-entregado');
    if (btnConfirmarEntregado) {
        btnConfirmarEntregado.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalMarcarEntregado'));
                if (modal) modal.hide();
                marcarComoEntregado(pedidoSeleccionado.id);
            }
        });
    }

    // Actualizar hora cada segundo
    actualizarHoraYFecha();
    setInterval(actualizarHoraYFecha, 1000);

    // Recargar datos cada 30 segundos
    setInterval(cargarPedidosDelivery, 30000);

    console.log('Módulo de delivery inicializado correctamente');
});