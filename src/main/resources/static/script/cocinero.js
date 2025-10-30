// cocinero.js - SISTEMA KANBAN PARA COCINA - VERSIÓN OPTIMIZADA

// Variables globales
let pedidoSeleccionado = null;
let pedidosPorPreparar = [];
let pedidosEnPreparacion = [];
let pedidosListos = [];

// Elementos del DOM
const elementos = {
    metricas: {
        porPreparar: document.getElementById('total-pendientes'),
        enPreparacion: document.getElementById('total-preparando'),
        listos: document.getElementById('total-listos'),
        tiempoPromedio: document.getElementById('tiempo-promedio'),
        badges: {
            porPreparar: document.getElementById('badge-pendientes'),
            enPreparacion: document.getElementById('badge-preparando'),
            listos: document.getElementById('badge-listos')
        }
    },
    listas: {
        porPreparar: document.getElementById('lista-por-preparar'),
        enPreparacion: document.getElementById('lista-en-preparacion'),
        listos: document.getElementById('lista-listos')
    },
    mensajes: {
        sinPorPreparar: document.getElementById('sin-pedidos-preparar'),
        sinEnPreparacion: document.getElementById('sin-pedidos-preparacion'),
        sinListos: document.getElementById('sin-pedidos-listos')
    },
    detalle: {
        contenedor: document.getElementById('detalle-pedido-container'),
        numero: document.getElementById('detalle-numero-pedido'),
        items: document.getElementById('detalle-items-pedido'),
        total: document.getElementById('detalle-total-pedido'),
        cliente: document.getElementById('detalle-cliente'),
        tipoEntrega: document.getElementById('detalle-tipo-entrega'),
        horaPedido: document.getElementById('detalle-hora-pedido'),
        tiempoTranscurrido: document.getElementById('detalle-tiempo-transcurrido'),
        acciones: document.getElementById('acciones-cocinero'),
        observaciones: {
            contenedor: document.getElementById('detalle-observaciones-container'),
            texto: document.getElementById('detalle-observaciones')
        }
    }
};

// ================== FUNCIONES DE CONEXIÓN CON BACKEND ==================

// OBTENER TOKEN CSRF (igual que en cajero.js)
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

// CARGAR TODOS LOS PEDIDOS DEL COCINERO
async function cargarPedidosCocina() {
    try {
        console.log('🍳 Cargando pedidos de cocina...');

        const [porPreparar, enPreparacion, listos] = await Promise.all([
            fetchConCSRF('/cocinero/pedidos-por-preparar').then(r => r.json()),
            fetchConCSRF('/cocinero/pedidos-en-preparacion').then(r => r.json()),
            fetchConCSRF('/cocinero/pedidos-listos-hoy').then(r => r.json())
        ]);

        pedidosPorPreparar = Array.isArray(porPreparar) ? porPreparar : [];
        pedidosEnPreparacion = Array.isArray(enPreparacion) ? enPreparacion : [];
        pedidosListos = Array.isArray(listos) ? listos : [];

        console.log(`✅ Pedidos cargados: ${pedidosPorPreparar.length} por preparar, ${pedidosEnPreparacion.length} en preparación, ${pedidosListos.length} listos`);

        mostrarPedidos();
        cargarMetricasCocina();

    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta('Error al cargar pedidos de cocina', 'error');
        }
    }
}

// CARGAR MÉTRICAS DEL COCINERO
async function cargarMetricasCocina() {
    try {
        console.log('📊 Cargando métricas de cocina...');
        const response = await fetchConCSRF('/cocinero/metricas-cocina');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const metricas = await response.json();
        console.log('📈 Métricas cargadas:', metricas);

        if (metricas.success) {
            actualizarMetricas(metricas);
        }

    } catch (error) {
        console.error('❌ Error cargando métricas:', error);
    }
}

// INICIAR PREPARACIÓN DE PEDIDO - VERSIÓN MEJORADA
async function iniciarPreparacion(pedidoId) {
    try {
        console.log(`🍳 Iniciando preparación del pedido ${pedidoId}...`);

        const response = await fetchConCSRF(`/cocinero/iniciar-preparacion/${pedidoId}`, {
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

        const resultado = await response.json();
        console.log('📨 Respuesta del servidor:', resultado);

        if (resultado.status === 'SUCCESS') {
            mostrarAlerta('✅ Preparación iniciada correctamente', 'success');
            await cargarPedidosCocina();
            ocultarDetalle();
        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error iniciando preparación:', error);

        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta(`❌ ${error.message}`, 'error');
        }
    }
}

// MARCAR PEDIDO COMO LISTO - VERSIÓN MEJORADA
async function marcarComoListo(pedidoId) {
    try {
        console.log(`✅ Marcando pedido ${pedidoId} como LISTO...`);

        const response = await fetchConCSRF(`/cocinero/marcar-listo/${pedidoId}`, {
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

        const resultado = await response.json();
        console.log('📨 Respuesta del servidor:', resultado);

        if (resultado.status === 'SUCCESS') {
            mostrarAlerta('✅ Pedido marcado como LISTO correctamente', 'success');
            await cargarPedidosCocina();
            ocultarDetalle();
        } else {
            throw new Error(resultado.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error marcando como listo:', error);

        if (error.message.includes('Sesión expirada')) {
            manejarSesionExpirada();
        } else {
            mostrarAlerta(`❌ ${error.message}`, 'error');
        }
    }
}

// OBTENER DETALLE COMPLETO DEL PEDIDO
async function obtenerDetallePedido(pedidoId) {
    try {
        const response = await fetchConCSRF(`/cocinero/pedido/${pedidoId}`);

        if (!response.ok) {
            throw new Error('Error al cargar detalle del pedido');
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Error cargando detalle:', error);
        return null;
    }
}

// ================== FUNCIONES DE INTERFAZ ==================

// MOSTRAR PEDIDOS EN LAS COLUMNAS KANBAN
function mostrarPedidos() {
    mostrarColumnaPorPreparar();
    mostrarColumnaEnPreparacion();
    mostrarColumnaListos();
}

// COLUMNA: POR PREPARAR
function mostrarColumnaPorPreparar() {
    if (!elementos.listas.porPreparar) return;

    elementos.listas.porPreparar.innerHTML = '';

    if (pedidosPorPreparar.length === 0) {
        elementos.mensajes.sinPorPreparar.classList.remove('d-none');
        return;
    }

    elementos.mensajes.sinPorPreparar.classList.add('d-none');

    pedidosPorPreparar.forEach(pedido => {
        const item = crearItemPedido(pedido, 'por-preparar');
        elementos.listas.porPreparar.appendChild(item);
    });
}

// COLUMNA: EN PREPARACIÓN
function mostrarColumnaEnPreparacion() {
    if (!elementos.listas.enPreparacion) return;

    elementos.listas.enPreparacion.innerHTML = '';

    if (pedidosEnPreparacion.length === 0) {
        elementos.mensajes.sinEnPreparacion.classList.remove('d-none');
        return;
    }

    elementos.mensajes.sinEnPreparacion.classList.add('d-none');

    pedidosEnPreparacion.forEach(pedido => {
        const item = crearItemPedido(pedido, 'en-preparacion');
        elementos.listas.enPreparacion.appendChild(item);
    });
}

// COLUMNA: LISTOS
function mostrarColumnaListos() {
    if (!elementos.listas.listos) return;

    elementos.listas.listos.innerHTML = '';

    if (pedidosListos.length === 0) {
        elementos.mensajes.sinListos.classList.remove('d-none');
        return;
    }

    elementos.mensajes.sinListos.classList.add('d-none');

    pedidosListos.forEach(pedido => {
        const item = crearItemPedido(pedido, 'listos');
        elementos.listas.listos.appendChild(item);
    });
}

// CREAR ITEM DE PEDIDO PARA LISTA
function crearItemPedido(pedido, columna) {
    const item = document.createElement('div');
    item.className = `list-group-item list-group-item-action pedido-item cursor-pointer estado-${columna}`;
    item.style.cursor = 'pointer';

    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fecha);
    const esUrgente = tiempoTranscurrido.minutosTotales > 30;

    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <h6 class="mb-1">${pedido.numeroPedido || `#${pedido.id}`}</h6>
                <p class="mb-1 text-muted small">${obtenerNombreCliente(pedido)}</p>
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
        elementos.detalle.tipoEntrega.textContent = pedido.tipoEntrega || 'DELIVERY';
        elementos.detalle.horaPedido.textContent = formatearFecha(pedido.fecha);
        elementos.detalle.total.textContent = `S/ ${(pedido.total || 0).toFixed(2)}`;

        // Calcular y mostrar tiempo transcurrido
        const tiempo = calcularTiempoTranscurrido(pedido.fecha);
        elementos.detalle.tiempoTranscurrido.textContent = tiempo.texto;
        elementos.detalle.tiempoTranscurrido.className = `badge ${tiempo.minutosTotales > 30 ? 'bg-danger' : tiempo.minutosTotales > 15 ? 'bg-warning' : 'bg-info'}`;

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
            elementos.detalle.observaciones.contenedor.style.display = 'block';
        } else {
            elementos.detalle.observaciones.contenedor.style.display = 'none';
        }

        // Mostrar acciones según la columna
        mostrarAccionesCocinero(columna);

        // Mostrar detalle con animación
        elementos.detalle.contenedor.style.display = 'block';
        elementos.detalle.contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('❌ Error mostrando detalle:', error);
        mostrarAlerta('Error al cargar detalle del pedido', 'error');
    }
}

// MOSTRAR ACCIONES SEGÚN EL ESTADO
function mostrarAccionesCocinero(columna) {
    let accionesHTML = '';

    switch(columna) {
        case 'por-preparar':
            accionesHTML = `
                <button class="btn btn-primary btn-lg w-100 mb-2" id="btn-iniciar-preparacion">
                    <i class="bi bi-play-circle me-2"></i>Iniciar Preparación
                </button>
                <small class="text-muted d-block text-center">
                    El pedido pasará a "En Preparación"
                </small>
            `;
            break;

        case 'en-preparacion':
            accionesHTML = `
                <button class="btn btn-success btn-lg w-100 mb-2" id="btn-marcar-listo">
                    <i class="bi bi-check-circle me-2"></i>Marcar como Listo
                </button>
                <small class="text-muted d-block text-center">
                    El pedido estará listo para entrega
                </small>
            `;
            break;

        case 'listos':
            accionesHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Pedido listo para entrega</strong>
                    <br>
                    <small>Esperando al repartidor</small>
                </div>
            `;
            break;
    }

    elementos.detalle.acciones.innerHTML = accionesHTML;

    // Configurar eventos de los botones
    const btnIniciar = document.getElementById('btn-iniciar-preparacion');
    const btnListo = document.getElementById('btn-marcar-listo');

    if (btnIniciar) {
        btnIniciar.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('modalIniciarPreparacion'));
            document.getElementById('modal-numero-pedido').textContent =
                pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
            modal.show();
        });
    }

    if (btnListo) {
        btnListo.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('modalMarcarListo'));
            document.getElementById('modal-numero-pedido-listo').textContent =
                pedidoSeleccionado.numeroPedido || `#${pedidoSeleccionado.id}`;
            modal.show();
        });
    }
}

// OCULTAR DETALLE
function ocultarDetalle() {
    pedidoSeleccionado = null;
    elementos.detalle.contenedor.style.display = 'none';
}

// ACTUALIZAR MÉTRICAS EN LA INTERFAZ
function actualizarMetricas(metricas) {
    const metricasData = {
        totalPorPreparar: metricas.totalPorPreparar || pedidosPorPreparar.length || 0,
        totalEnPreparacion: metricas.totalEnPreparacion || pedidosEnPreparacion.length || 0,
        totalListosHoy: metricas.totalListosHoy || pedidosListos.length || 0,
        tiempoPromedio: metricas.tiempoPromedio || 0
    };

    if (elementos.metricas.porPreparar) {
        elementos.metricas.porPreparar.textContent = metricasData.totalPorPreparar;
    }
    if (elementos.metricas.enPreparacion) {
        elementos.metricas.enPreparacion.textContent = metricasData.totalEnPreparacion;
    }
    if (elementos.metricas.listos) {
        elementos.metricas.listos.textContent = metricasData.totalListosHoy;
    }
    if (elementos.metricas.tiempoPromedio) {
        elementos.metricas.tiempoPromedio.textContent = `${metricasData.tiempoPromedio}min`;
    }

    // Actualizar badges
    if (elementos.metricas.badges.porPreparar) {
        elementos.metricas.badges.porPreparar.textContent = metricasData.totalPorPreparar;
    }
    if (elementos.metricas.badges.enPreparacion) {
        elementos.metricas.badges.enPreparacion.textContent = metricasData.totalEnPreparacion;
    }
    if (elementos.metricas.badges.listos) {
        elementos.metricas.badges.listos.textContent = metricasData.totalListosHoy;
    }
}

// ================== FUNCIONES UTILITARIAS ==================

// CALCULAR TIEMPO TRANSCURRIDO
function calcularTiempoTranscurrido(fechaString) {
    if (!fechaString) return { texto: 'N/A', minutosTotales: 0 };

    try {
        const fechaPedido = new Date(fechaString);
        const ahora = new Date();
        const diferenciaMs = ahora - fechaPedido;
        const minutosTotales = Math.floor(diferenciaMs / (1000 * 60));

        if (minutosTotales < 60) {
            return { texto: `${minutosTotales}min`, minutosTotales };
        } else {
            const horas = Math.floor(minutosTotales / 60);
            const minutos = minutosTotales % 60;
            return { texto: `${horas}h ${minutos}m`, minutosTotales };
        }
    } catch (error) {
        return { texto: 'N/A', minutosTotales: 0 };
    }
}

// OBTENER NOMBRE DEL CLIENTE
// OBTENER NOMBRE DEL CLIENTE - VERSIÓN CORREGIDA
function obtenerNombreCliente(pedido) {
    // ✅ CORRECCIÓN: Verificar si cliente es objeto o string
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        // Si es objeto, acceder a las propiedades
        const nombres = pedido.cliente.nombres || '';
        const apellidos = pedido.cliente.apellidos || '';
        return `${nombres} ${apellidos}`.trim();
    } else if (pedido.cliente && typeof pedido.cliente === 'string') {
        // Si ya es string, devolver directamente
        return pedido.cliente;
    }
    return 'Cliente no especificado';
}

// FORMATEAR FECHA COMPLETA
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

// FORMATEAR FECHA CORTA (para items)
function formatearFechaCorta(fechaString) {
    if (!fechaString) return '';

    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
}

// MANEJAR SESIÓN EXPIRADA
function manejarSesionExpirada() {
    mostrarAlerta('🔐 Sesión expirada. Redirigiendo al login...', 'error');
    setTimeout(() => {
        window.location.href = '/login?sessionExpired=true';
    }, 2000);
}

// MOSTRAR ALERTA TOAST (igual que en cajero.js)
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

// ================== FUNCIONES DE INICIALIZACIÓN ==================

// ACTUALIZAR HORA Y FECHA EN TIEMPO REAL
function actualizarHoraYFecha() {
    const ahora = new Date();

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
}

// ================== EVENT LISTENERS ==================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🍳 Inicializando módulo de cocinero...');

    // Verificar token CSRF
    const csrfToken = getCsrfToken();
    console.log('🔐 Token CSRF disponible:', csrfToken ? 'SÍ' : 'NO');

    // Cargar datos iniciales
    cargarPedidosCocina();

    // Configurar eventos de botones
    document.getElementById('btn-cerrar-detalle').addEventListener('click', ocultarDetalle);

    // Confirmar iniciar preparación
    const btnConfirmarIniciar = document.getElementById('btn-confirmar-iniciar');
    if (btnConfirmarIniciar) {
        btnConfirmarIniciar.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalIniciarPreparacion'));
                modal.hide();
                iniciarPreparacion(pedidoSeleccionado.id);
            }
        });
    }

    // Confirmar marcar como listo
    const btnConfirmarListo = document.getElementById('btn-confirmar-listo');
    if (btnConfirmarListo) {
        btnConfirmarListo.addEventListener('click', () => {
            if (pedidoSeleccionado) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalMarcarListo'));
                modal.hide();
                marcarComoListo(pedidoSeleccionado.id);
            }
        });
    }

    // Actualizar hora cada segundo
    actualizarHoraYFecha();
    setInterval(actualizarHoraYFecha, 1000);

    // Recargar datos cada 30 segundos
    setInterval(cargarPedidosCocina, 10000);

    console.log('✅ Módulo de cocinero inicializado correctamente');
});