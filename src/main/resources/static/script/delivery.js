// delivery.js - SISTEMA DE DELIVERY CON BACKEND REAL

// Variables globales
let pedidos = [];
let pedidoSeleccionado = null;
let mapa = null;
let rutaControl = null;
let filtroActual = 'all';
let usuarioDelivery = null;

// Coordenadas del restaurante (configurables)
const COORDENADAS_RESTAURANTE = [-14.068, -75.728]; // Ica, Perú por defecto

// Elementos del DOM
const elementos = {
    // Información del usuario
    driverName: document.getElementById('driverName'),
    driverInitials: document.getElementById('driverInitials'),
    modalDriverName: document.getElementById('modalDriverName'),
    modalDriverInitials: document.getElementById('modalDriverInitials'),

    // Métricas
    metricas: {
        pendientes: document.getElementById('pendingCount'),
        enCamino: document.getElementById('inProgressCount'),
        entregados: document.getElementById('deliveredCount'),
        total: document.getElementById('totalCount'),
        sidebar: {
            pendientes: document.getElementById('sidebarPendingCount'),
            enCamino: document.getElementById('sidebarProgressCount')
        }
    },

    // Listas y contenedores
    listaPedidos: document.getElementById('deliveryList'),
    estadoVacio: document.getElementById('emptyState'),

    // Modal del mapa
    modalMapa: {
        elemento: document.getElementById('mapModal'),
        numeroPedido: document.getElementById('modalOrderNumber'),
        infoCliente: document.getElementById('modalCustomerInfo'),
        direccion: document.getElementById('modalDeliveryAddress'),
        distrito: document.getElementById('modalDistrict'),
        total: document.getElementById('modalOrderTotal'),
        hora: document.getElementById('modalOrderTime'),
        progreso: document.getElementById('deliveryProgress'),
        porcentaje: document.getElementById('progressPercentage'),
        distancia: document.getElementById('routeDistance'),
        tiempo: document.getElementById('routeTime'),
        estado: document.getElementById('routeStatus')
    },

    // Botones de acción
    botones: {
        iniciarEntrega: document.getElementById('startDeliveryBtn'),
        marcarEntregado: document.getElementById('markDeliveredModal')
    },

    // Filtros
    filtros: document.querySelectorAll('.btn-filter')
};

// ================== FUNCIONES DE CONEXIÓN CON BACKEND ==================

// CARGAR INFORMACIÓN DEL USUARIO DELIVERY
async function cargarUsuarioDelivery() {
    try {
        // Esta información vendría del backend, por ahora simulamos
        usuarioDelivery = {
            nombres: "Repartidor",
            apellidos: "Delivery",
            telefono: "+51 999 999 999"
        };

        // Actualizar interfaz con información del usuario
        actualizarInfoUsuario();

    } catch (error) {
        console.error('Error cargando información del usuario:', error);
    }
}

// CARGAR TODOS LOS PEDIDOS DEL DELIVERY
async function cargarPedidosDelivery() {
    try {
        console.log('Cargando pedidos de delivery...');

        const [paraEntregar, enCamino, entregados] = await Promise.all([
            fetch('/delivery/pedidos-para-entrega').then(r => {
                if (!r.ok) throw new Error('Error en pedidos para entrega');
                return r.json();
            }),
            fetch('/delivery/pedidos-en-camino').then(r => {
                if (!r.ok) throw new Error('Error en pedidos en camino');
                return r.json();
            }),
            fetch('/delivery/pedidos-entregados-hoy').then(r => {
                if (!r.ok) throw new Error('Error en pedidos entregados');
                return r.json();
            })
        ]);

        console.log('Pedidos cargados:', {
            paraEntregar: paraEntregar.length,
            enCamino: enCamino.length,
            entregados: entregados.length
        });

        // Combinar todos los pedidos con su estado
        pedidos = [
            ...paraEntregar.map(p => ({ ...p, estado: 'LISTO' })),
            ...enCamino.map(p => ({ ...p, estado: 'EN_CAMINO' })),
            ...entregados.map(p => ({ ...p, estado: 'ENTREGADO' }))
        ];

        mostrarPedidos();
        await cargarMetricasDelivery();

    } catch (error) {
        console.error('Error cargando pedidos:', error);
        mostrarNotificacion('Error al cargar pedidos: ' + error.message, 'error');
    }
}

// CARGAR MÉTRICAS DEL DELIVERY
async function cargarMetricasDelivery() {
    try {
        const response = await fetch('/delivery/metricas-delivery');
        if (!response.ok) throw new Error('Error al cargar métricas');

        const metricas = await response.json();
        console.log('Métricas recibidas:', metricas);

        if (metricas.success) {
            actualizarMetricas(metricas);
        } else {
            throw new Error(metricas.error || 'Error en métricas');
        }

    } catch (error) {
        console.error('Error cargando métricas:', error);
        // Si falla, calculamos métricas localmente
        calcularMetricasLocales();
    }
}

// INICIAR ENTREGA DE PEDIDO
async function iniciarEntrega(pedidoId) {
    try {
        console.log('Iniciando entrega para pedido:', pedidoId);

        const response = await fetch(`/delivery/iniciar-entrega/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const resultado = await response.text();
        console.log('Respuesta iniciar entrega:', resultado);

        if (resultado.includes('SUCCESS')) {
            mostrarNotificacion('Entrega iniciada exitosamente', 'success');
            await cargarPedidosDelivery();
            cerrarModalMapa();
        } else {
            throw new Error(resultado.replace('ERROR: ', ''));
        }

    } catch (error) {
        console.error('Error iniciando entrega:', error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    }
}

// MARCAR PEDIDO COMO ENTREGADO
async function marcarComoEntregado(pedidoId) {
    try {
        console.log('Marcando como entregado pedido:', pedidoId);

        const response = await fetch(`/delivery/marcar-entregado/${pedidoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const resultado = await response.text();
        console.log('Respuesta marcar entregado:', resultado);

        if (resultado.includes('SUCCESS')) {
            mostrarNotificacion('Pedido marcado como ENTREGADO', 'success');
            await cargarPedidosDelivery();
            cerrarModalMapa();
        } else {
            throw new Error(resultado.replace('ERROR: ', ''));
        }

    } catch (error) {
        console.error('Error marcando como entregado:', error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    }
}

// ================== FUNCIONES DE INTERFAZ ==================

// ACTUALIZAR INFORMACIÓN DEL USUARIO EN LA INTERFAZ
function actualizarInfoUsuario() {
    if (usuarioDelivery) {
        const nombreCompleto = `${usuarioDelivery.nombres} ${usuarioDelivery.apellidos}`;
        const iniciales = usuarioDelivery.nombres.charAt(0) + usuarioDelivery.apellidos.charAt(0);

        if (elementos.driverName) elementos.driverName.textContent = nombreCompleto;
        if (elementos.driverInitials) elementos.driverInitials.textContent = iniciales;
        if (elementos.modalDriverName) elementos.modalDriverName.textContent = nombreCompleto;
        if (elementos.modalDriverInitials) elementos.modalDriverInitials.textContent = iniciales;
    }
}

// MOSTRAR PEDIDOS EN LA LISTA
function mostrarPedidos() {
    if (!elementos.listaPedidos) return;

    const pedidosFiltrados = filtrarPedidos();
    elementos.listaPedidos.innerHTML = '';

    if (pedidosFiltrados.length === 0) {
        elementos.estadoVacio.classList.remove('d-none');
        return;
    }

    elementos.estadoVacio.classList.add('d-none');

    pedidosFiltrados.forEach(pedido => {
        const card = crearCardPedido(pedido);
        elementos.listaPedidos.appendChild(card);
    });
}

// FILTRAR PEDIDOS SEGÚN EL FILTRO ACTUAL
function filtrarPedidos() {
    switch(filtroActual) {
        case 'pending':
            return pedidos.filter(p => p.estado === 'LISTO');
        case 'in-progress':
            return pedidos.filter(p => p.estado === 'EN_CAMINO');
        case 'delivered':
            return pedidos.filter(p => p.estado === 'ENTREGADO');
        default:
            return pedidos;
    }
}

// CREAR CARD DE PEDIDO
function crearCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = `delivery-card ${pedido.estado.toLowerCase().replace('_', '-')}`;

    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fecha);
    const esUrgente = tiempoTranscurrido.minutosTotales > 45;

    card.innerHTML = `
        <div class="card-header">
            <div class="order-number">${pedido.numeroPedido || `#${pedido.id}`}</div>
            <div class="order-status ${obtenerClaseEstado(pedido.estado)}">
                ${obtenerTextoEstado(pedido.estado)}
            </div>
        </div>

        <div class="card-body">
            <div class="customer-info">
                <div class="customer-name">
                    <i class="bi bi-person"></i>
                    ${obtenerNombreCliente(pedido)}
                </div>
                <div class="customer-phone">
                    <i class="bi bi-telephone"></i>
                    ${obtenerTelefonoCliente(pedido)}
                </div>
            </div>

            <div class="delivery-info">
                <div class="delivery-address">
                    <i class="bi bi-geo-alt"></i>
                    ${pedido.direccionEntrega || 'Dirección no especificada'}
                </div>
                <div class="delivery-time">
                    <i class="bi bi-clock"></i>
                    ${formatearFecha(pedido.fecha)}
                    ${esUrgente ? '<span class="urgent-indicator">!</span>' : ''}
                </div>
            </div>

            <div class="order-items">
                <strong>Pedido:</strong>
                <div class="items-list">
                    ${generarListaItems(pedido)}
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="order-total">
                Total: <strong>S/ ${(pedido.total || 0).toFixed(2)}</strong>
            </div>
            <div class="card-actions">
                ${generarBotonesAccion(pedido)}
            </div>
        </div>
    `;

    // Configurar eventos de los botones
    configurarEventosCard(card, pedido);

    return card;
}

// CONFIGURAR EVENTOS DE LA CARD DEL PEDIDO
function configurarEventosCard(card, pedido) {
    const btnMapa = card.querySelector('.btn-map');
    const btnIniciar = card.querySelector('.btn-start-delivery');
    const btnEntregado = card.querySelector('.btn-mark-delivered');

    if (btnMapa) {
        btnMapa.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalMapa(pedido);
        });
    }

    if (btnIniciar) {
        btnIniciar.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmarAccion(
                'Iniciar Entrega',
                `¿Iniciar entrega del pedido ${pedido.numeroPedido || '#' + pedido.id}?`,
                () => iniciarEntrega(pedido.id)
            );
        });
    }

    if (btnEntregado) {
        btnEntregado.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmarAccion(
                'Marcar como Entregado',
                `¿Confirmar entrega del pedido ${pedido.numeroPedido || '#' + pedido.id}?`,
                () => marcarComoEntregado(pedido.id)
            );
        });
    }
}

// GENERAR BOTONES DE ACCIÓN SEGÚN EL ESTADO
function generarBotonesAccion(pedido) {
    switch(pedido.estado) {
        case 'LISTO':
            return `
                <button class="btn btn-primary btn-sm btn-start-delivery">
                    <i class="bi bi-play-circle"></i> Iniciar
                </button>
                <button class="btn btn-outline-primary btn-sm btn-map">
                    <i class="bi bi-map"></i> Mapa
                </button>
            `;

        case 'EN_CAMINO':
            return `
                <button class="btn btn-success btn-sm btn-mark-delivered">
                    <i class="bi bi-check-circle"></i> Entregado
                </button>
                <button class="btn btn-outline-primary btn-sm btn-map">
                    <i class="bi bi-map"></i> Mapa
                </button>
            `;

        case 'ENTREGADO':
            return `
                <span class="badge bg-success">
                    <i class="bi bi-check-circle"></i> Entregado
                </span>
            `;

        default:
            return '';
    }
}

// ABRIR MODAL CON MAPA DE ENTREGA
function abrirModalMapa(pedido) {
    pedidoSeleccionado = pedido;

    // Actualizar información del modal
    actualizarModalMapa(pedido);

    // Configurar botones según el estado
    configurarBotonesModal(pedido.estado);

    // Inicializar mapa
    inicializarMapa();

    // Mostrar modal
    const modal = new bootstrap.Modal(elementos.modalMapa.elemento);
    modal.show();
}

// ACTUALIZAR INFORMACIÓN DEL MODAL DEL MAPA
function actualizarModalMapa(pedido) {
    elementos.modalMapa.numeroPedido.textContent = pedido.numeroPedido || `#${pedido.id}`;
    elementos.modalMapa.infoCliente.textContent = obtenerNombreCliente(pedido);
    elementos.modalMapa.direccion.textContent = pedido.direccionEntrega || 'Dirección no especificada';
    elementos.modalMapa.distrito.textContent = obtenerDistrito(pedido);
    elementos.modalMapa.total.textContent = `S/ ${(pedido.total || 0).toFixed(2)}`;
    elementos.modalMapa.hora.textContent = formatearFecha(pedido.fecha);

    // Actualizar estado en el modal
    const estadoInfo = obtenerInfoEstado(pedido.estado);
    elementos.modalMapa.estado.textContent = estadoInfo.texto;
    elementos.modalMapa.estado.className = `badge ${estadoInfo.clase}`;
}

// CONFIGURAR BOTONES DEL MODAL SEGÚN ESTADO
function configurarBotonesModal(estado) {
    const esListo = estado === 'LISTO';
    const esEnCamino = estado === 'EN_CAMINO';

    elementos.botones.iniciarEntrega.style.display = esListo ? 'block' : 'none';
    elementos.botones.marcarEntregado.style.display = esEnCamino ? 'block' : 'none';

    // Configurar eventos
    elementos.botones.iniciarEntrega.onclick = () => {
        confirmarAccion(
            'Iniciar Entrega',
            `¿Iniciar entrega del pedido ${pedidoSeleccionado.numeroPedido || '#' + pedidoSeleccionado.id}?`,
            () => iniciarEntrega(pedidoSeleccionado.id)
        );
    };

    elementos.botones.marcarEntregado.onclick = () => {
        confirmarAccion(
            'Marcar como Entregado',
            `¿Confirmar entrega del pedido ${pedidoSeleccionado.numeroPedido || '#' + pedidoSeleccionado.id}?`,
            () => marcarComoEntregado(pedidoSeleccionado.id)
        );
    };
}

// ================== FUNCIONALIDAD DEL MAPA ==================

// INICIALIZAR MAPA LEAFLET
function inicializarMapa() {
    if (!pedidoSeleccionado) return;

    // Crear mapa
    mapa = L.map('deliveryMap').setView(COORDENADAS_RESTAURANTE, 13);

    // Agregar capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    // Agregar marcadores
    agregarMarcadoresMapa();

    // Calcular y mostrar ruta
    calcularRutaEntrega();
}

// AGREGAR MARCADORES AL MAPA
function agregarMarcadoresMapa() {
    // Marcador del restaurante
    L.marker(COORDENADAS_RESTAURANTE)
        .addTo(mapa)
        .bindPopup(`
            <strong>Luren Chicken</strong><br>
            Punto de partida<br>
            <small>${obtenerDireccionRestaurante()}</small>
        `)
        .openPopup();

    // Coordenadas del cliente (simuladas)
    const coordenadasCliente = generarCoordenadasAleatorias(COORDENADAS_RESTAURANTE, 0.03);

    // Marcador del cliente
    L.marker(coordenadasCliente, {
        icon: L.divIcon({
            className: 'customer-marker',
            html: '<i class="bi bi-house"></i>',
            iconSize: [25, 25]
        })
    }).addTo(mapa).bindPopup(`
        <strong>Cliente:</strong> ${obtenerNombreCliente(pedidoSeleccionado)}<br>
        <strong>Dirección:</strong> ${pedidoSeleccionado.direccionEntrega || 'No especificada'}
    `);

    // Marcador del repartidor (posición simulada)
    const coordenadasRepartidor = generarCoordenadasAleatorias(COORDENADAS_RESTAURANTE, 0.01);

    L.marker(coordenadasRepartidor, {
        icon: L.divIcon({
            className: 'driver-marker',
            html: '<i class="bi bi-truck"></i>',
            iconSize: [30, 30]
        })
    }).addTo(mapa).bindPopup(`
        <strong>Repartidor</strong><br>
        ${usuarioDelivery ? `${usuarioDelivery.nombres} ${usuarioDelivery.apellidos}` : 'En camino'}
    `);

    // Ajustar vista para mostrar todos los marcadores
    const grupo = L.featureGroup([
        L.marker(COORDENADAS_RESTAURANTE),
        L.marker(coordenadasCliente),
        L.marker(coordenadasRepartidor)
    ]);
    mapa.fitBounds(grupo.getBounds().pad(0.1));
}

// CALCULAR RUTA DE ENTREGA
function calcularRutaEntrega() {
    if (rutaControl) {
        mapa.removeControl(rutaControl);
    }

    // Coordenadas simuladas del cliente
    const coordenadasCliente = generarCoordenadasAleatorias(COORDENADAS_RESTAURANTE, 0.03);

    rutaControl = L.Routing.control({
        waypoints: [
            L.latLng(COORDENADAS_RESTAURANTE[0], COORDENADAS_RESTAURANTE[1]),
            L.latLng(coordenadasCliente[0], coordenadasCliente[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        createMarker: function() { return null; }
    }).addTo(mapa);

    // Simular información de la ruta
    rutaControl.on('routesfound', function(e) {
        const rutas = e.routes;
        const ruta = rutas[0];

        const distanciaKm = (ruta.summary.totalDistance / 1000).toFixed(1);
        const tiempoMin = Math.round(ruta.summary.totalTime / 60);

        elementos.modalMapa.distancia.textContent = `${distanciaKm} km`;
        elementos.modalMapa.tiempo.textContent = `${tiempoMin} min`;

        // Iniciar simulación de progreso si el pedido está en camino
        if (pedidoSeleccionado.estado === 'EN_CAMINO') {
            simularProgresoEntrega();
        }
    });
}

// SIMULAR PROGRESO DE ENTREGA
function simularProgresoEntrega() {
    let progreso = 0;
    const intervalo = setInterval(() => {
        progreso += Math.random() * 5;
        if (progreso >= 100) {
            progreso = 100;
            clearInterval(intervalo);
        }

        elementos.modalMapa.progreso.style.width = `${progreso}%`;
        elementos.modalMapa.porcentaje.textContent = `${Math.round(progreso)}%`;
    }, 800);
}

// CERRAR MODAL DEL MAPA
function cerrarModalMapa() {
    const modal = bootstrap.Modal.getInstance(elementos.modalMapa.elemento);
    if (modal) {
        modal.hide();
    }

    // Limpiar mapa
    if (mapa) {
        mapa.remove();
        mapa = null;
        rutaControl = null;
    }
}

// ================== FUNCIONES UTILITARIAS ==================

// ACTUALIZAR MÉTRICAS EN LA INTERFAZ
function actualizarMetricas(metricas) {
    // Métricas principales
    if (elementos.metricas.pendientes) {
        elementos.metricas.pendientes.textContent = metricas.totalParaEntregar || 0;
    }
    if (elementos.metricas.enCamino) {
        elementos.metricas.enCamino.textContent = metricas.totalEnCamino || 0;
    }
    if (elementos.metricas.entregados) {
        elementos.metricas.entregados.textContent = metricas.totalEntregadosHoy || 0;
    }
    if (elementos.metricas.total) {
        const total = (metricas.totalParaEntregar || 0) + (metricas.totalEnCamino || 0) + (metricas.totalEntregadosHoy || 0);
        elementos.metricas.total.textContent = total;
    }

    // Métricas del sidebar
    if (elementos.metricas.sidebar.pendientes) {
        elementos.metricas.sidebar.pendientes.textContent = metricas.totalParaEntregar || 0;
    }
    if (elementos.metricas.sidebar.enCamino) {
        elementos.metricas.sidebar.enCamino.textContent = metricas.totalEnCamino || 0;
    }
}

// CALCULAR MÉTRICAS LOCALMENTE (fallback)
function calcularMetricasLocales() {
    const metricas = {
        totalParaEntregar: pedidos.filter(p => p.estado === 'LISTO').length,
        totalEnCamino: pedidos.filter(p => p.estado === 'EN_CAMINO').length,
        totalEntregadosHoy: pedidos.filter(p => p.estado === 'ENTREGADO').length
    };

    actualizarMetricas(metricas);
}

// GENERAR LISTA DE ITEMS DEL PEDIDO
function generarListaItems(pedido) {
    if (!pedido.items || pedido.items.length === 0) {
        return '<span class="text-muted">No hay items</span>';
    }

    const items = pedido.items.slice(0, 3);
    let html = '';

    items.forEach(item => {
        const nombreProducto = item.nombreProductoSeguro || item.nombreProducto || 'Producto';
        const cantidad = item.cantidad || 1;
        html += `
            <div class="item">
                ${nombreProducto}
                <span class="item-quantity">x${cantidad}</span>
            </div>
        `;
    });

    if (pedido.items.length > 3) {
        html += `<div class="item-more">+${pedido.items.length - 3} más</div>`;
    }

    return html;
}

// OBTENER INFORMACIÓN DEL ESTADO
function obtenerInfoEstado(estado) {
    const estados = {
        'LISTO': { texto: 'Pendiente', clase: 'bg-warning' },
        'EN_CAMINO': { texto: 'En Camino', clase: 'bg-info' },
        'ENTREGADO': { texto: 'Entregado', clase: 'bg-success' }
    };
    return estados[estado] || { texto: estado, clase: 'bg-secondary' };
}

// OBTENER CLASE CSS PARA EL ESTADO
function obtenerClaseEstado(estado) {
    const clases = {
        'LISTO': 'status-pending',
        'EN_CAMINO': 'status-progress',
        'ENTREGADO': 'status-delivered'
    };
    return clases[estado] || 'status-pending';
}

// OBTENER TEXTO LEGIBLE PARA EL ESTADO
function obtenerTextoEstado(estado) {
    const textos = {
        'LISTO': 'Pendiente',
        'EN_CAMINO': 'En Camino',
        'ENTREGADO': 'Entregado'
    };
    return textos[estado] || estado;
}

// OBTENER NOMBRE DEL CLIENTE
function obtenerNombreCliente(pedido) {
    if (pedido.usuario) {
        return `${pedido.usuario.nombres} ${pedido.usuario.apellidos}`;
    }
    return pedido.cliente || 'Cliente no especificado';
}

// OBTENER TELÉFONO DEL CLIENTE
function obtenerTelefonoCliente(pedido) {
    if (pedido.usuario && pedido.usuario.telefono) {
        return pedido.usuario.telefono;
    }
    return 'No especificado';
}

// OBTENER DIRECCIÓN DEL RESTAURANTE
function obtenerDireccionRestaurante() {
    return "Av. Principal 123, Ica, Perú";
}

// OBTENER DISTRITO (simulado)
function obtenerDistrito(pedido) {
    const distritos = ['Ica Centro', 'La Tinguiña', 'Pueblo Nuevo', 'Salas', 'Parcona', 'San José'];
    return distritos[Math.floor(Math.random() * distritos.length)];
}

// CALCULAR TIEMPO TRANSCURRIDO
function calcularTiempoTranscurrido(fechaString) {
    if (!fechaString) return { texto: 'N/A', minutosTotales: 0 };

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
}

// FORMATEAR FECHA
function formatearFecha(fechaString) {
    if (!fechaString) return 'Fecha no disponible';

    const fecha = new Date(fechaString);
    return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// GENERAR COORDENADAS ALEATORIAS CERCA DE UN PUNTO
function generarCoordenadasAleatorias(puntoCentral, radio = 0.02) {
    return [
        puntoCentral[0] + (Math.random() - 0.5) * radio,
        puntoCentral[1] + (Math.random() - 0.5) * radio
    ];
}

// MOSTRAR NOTIFICACIÓN
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Implementación básica - puedes integrar con toast de Bootstrap
    const iconos = {
        success: 'bi-check-circle',
        error: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    };

    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);

    // Aquí podrías integrar con un sistema de toast
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

// CONFIRMAR ACCIÓN CON MODAL
function confirmarAccion(titulo, mensaje, accionConfirmar) {
    const tituloElement = document.getElementById('confirmationTitle');
    const mensajeElement = document.getElementById('confirmationMessage');

    if (tituloElement && mensajeElement) {
        tituloElement.textContent = titulo;
        mensajeElement.textContent = mensaje;

        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();

        // Configurar evento del botón aceptar
        const btnAceptar = document.querySelector('#confirmationModal .btn-primary');
        const btnOriginal = btnAceptar.cloneNode(true);
        btnAceptar.parentNode.replaceChild(btnOriginal, btnAceptar);

        btnOriginal.addEventListener('click', () => {
            modal.hide();
            accionConfirmar();
        });
    } else {
        // Fallback a confirm básico
        if (confirm(`${titulo}\n${mensaje}`)) {
            accionConfirmar();
        }
    }
}

// ================== INICIALIZACIÓN ==================

// ACTUALIZAR HORA EN TIEMPO REAL
function actualizarHora() {
    const ahora = new Date();

    // Fecha completa
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaElement = document.getElementById('currentDate');
    if (fechaElement) {
        fechaElement.textContent = ahora.toLocaleDateString('es-ES', opcionesFecha);
    }

    // Hora completa
    const horaElement = document.getElementById('currentTime');
    if (horaElement) {
        horaElement.textContent = ahora.toLocaleTimeString('es-ES');
    }

    // Hora móvil
    const horaMobile = document.getElementById('mobileTime');
    if (horaMobile) {
        horaMobile.textContent = ahora.toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit'
        });
    }
}

// CONFIGURAR FILTROS
function configurarFiltros() {
    elementos.filtros.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remover active de todos los filtros
            elementos.filtros.forEach(f => f.classList.remove('active'));

            // Agregar active al filtro clickeado
            this.classList.add('active');

            // Actualizar filtro actual
            filtroActual = this.dataset.filter;

            // Volver a mostrar pedidos
            mostrarPedidos();
        });
    });
}

// CONFIGURAR MENÚ MÓVIL
function configurarMenuMovil() {
    const btnMenu = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.delivery-sidebar');

    if (btnMenu && sidebar) {
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

// INICIALIZAR APLICACIÓN
async function inicializarAplicacion() {
    console.log('Inicializando aplicación de delivery...');

    // Cargar información del usuario
    await cargarUsuarioDelivery();

    // Cargar pedidos iniciales
    await cargarPedidosDelivery();

    // Configurar interfaz
    configurarFiltros();
    configurarMenuMovil();

    // Iniciar actualización de hora
    actualizarHora();
    setInterval(actualizarHora, 1000);

    // Recargar pedidos cada 30 segundos
    setInterval(cargarPedidosDelivery, 30000);

    console.log('Aplicación de delivery inicializada correctamente');
}

// INICIAR CUANDO EL DOCUMENTO ESTÉ LISTO
document.addEventListener('DOMContentLoaded', function() {
    inicializarAplicacion().catch(error => {
        console.error('Error inicializando aplicación:', error);
        mostrarNotificacion('Error al inicializar la aplicación', 'error');
    });
});