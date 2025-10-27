// Configuración global
const CONFIG = {
    restaurantLocation: {
        lat: -14.070617,
        lng: -75.727120,
        name: "Luren Chicken",
        address: "Cerca de Pollería en Ica, Perú"
    },
    updateInterval: 2000,
    simulationSpeed: 2
};

// Estado de la aplicación
const APP_STATE = {
    deliveryOrders: [],
    map: null,
    currentMarkers: [],
    currentOrderId: null,
    restaurantMarker: null,
    driverMarker: null,
    routingControl: null,
    realTimeInterval: null,
    currentOrder: null,
    driverSimulations: new Map()
};

// Datos iniciales de ejemplo
const INITIAL_ORDERS = [
    {
        id: 1,
        orderNumber: "ORD-2024-001234",
        customerName: "María González",
        phone: "+51 987 654 321",
        address: "Av. Los Maestros 234, Urb. San Isidro, Ica",
        district: "Ica",
        total: "S/ 48.50",
        status: "pending",
        orderTime: "12:30 PM",
        items: [
            { name: "Pollo a la Brasa Entero", quantity: 1, price: "S/ 32.00" },
            { name: "Papas Fritas Familiares", quantity: 1, price: "S/ 12.00" },
            { name: "Gaseosa 1L", quantity: 1, price: "S/ 4.50" }
        ],
        coordinates: { lat: -14.065, lng: -75.730 },
        driverPosition: null,
        progress: 0
    },
    {
        id: 2,
        orderNumber: "ORD-2024-001235",
        customerName: "Juan Pérez",
        phone: "+51 987 123 456",
        address: "Jr. Lima 456, Centro de Ica",
        district: "Ica",
        total: "S/ 28.00",
        status: "in-progress",
        orderTime: "12:45 PM",
        items: [
            { name: "1/4 de Pollo + Papas", quantity: 2, price: "S/ 28.00" }
        ],
        coordinates: { lat: -14.068, lng: -75.725 },
        driverPosition: { lat: -14.069, lng: -75.726 },
        progress: 30
    },
    {
        id: 3,
        orderNumber: "ORD-2024-001236",
        customerName: "Ana Martínez",
        phone: "+51 987 789 123",
        address: "Calle Ayacucho 123, Ica",
        district: "Ica",
        total: "S/ 64.00",
        status: "pending",
        orderTime: "1:15 PM",
        items: [
            { name: "Pollo a la Brasa Entero", quantity: 2, price: "S/ 64.00" }
        ],
        coordinates: { lat: -14.073, lng: -75.732 },
        driverPosition: null,
        progress: 0
    }
];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Inicializando sistema de delivery...');
    
    // Cargar datos iniciales
    APP_STATE.deliveryOrders = [...INITIAL_ORDERS];
    
    // Configurar componentes
    updateDateTime();
    setupEventListeners();
    renderDeliveryList();
    updateAllStats();
    
    // Iniciar servicios en segundo plano
    setInterval(updateDateTime, 1000);
    setInterval(updateAllStats, 5000);
    startAllDriverSimulations();
    
    console.log('✅ Sistema de delivery inicializado correctamente');
}

// Actualizar fecha y hora en tiempo real
function updateDateTime() {
    try {
        const now = new Date();
        
        // Formatear fecha
        const optionsDate = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('es-ES', optionsDate);
        document.getElementById('currentDate').textContent = dateString;
        
        // Formatear hora
        const timeString = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('mobileTime').textContent = timeString;
    } catch (error) {
        console.error('Error actualizando fecha/hora:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-buttons .btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            renderDeliveryList(filter);
        });
    });

    // Botón de menú móvil
    document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
        document.querySelector('.delivery-sidebar').classList.toggle('mobile-open');
    });

    // Botones del modal
    document.getElementById('markDeliveredModal').addEventListener('click', function () {
        if (APP_STATE.currentOrderId) {
            markAsDelivered(APP_STATE.currentOrderId);
            const mapModal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
            mapModal.hide();
        }
    });

    document.getElementById('startDeliveryBtn').addEventListener('click', function () {
        if (APP_STATE.currentOrderId) {
            startDelivery(APP_STATE.currentOrderId);
            const mapModal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
            mapModal.hide();
        }
    });

    // Cerrar modal cuando se oculta
    document.getElementById('mapModal').addEventListener('hidden.bs.modal', function () {
        clearMap();
        APP_STATE.currentOrderId = null;
        APP_STATE.currentOrder = null;
    });
}

// Renderizar lista de pedidos
function renderDeliveryList(filter = 'all') {
    const deliveryList = document.getElementById('deliveryList');
    const emptyState = document.getElementById('emptyState');

    if (!deliveryList || !emptyState) {
        console.error('Elementos del DOM no encontrados');
        return;
    }

    const filteredOrders = filter === 'all' 
        ? APP_STATE.deliveryOrders 
        : APP_STATE.deliveryOrders.filter(order => order.status === filter);

    if (filteredOrders.length === 0) {
        deliveryList.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    deliveryList.innerHTML = filteredOrders.map(order => `
        <div class="card delivery-card mb-3 ${order.status === 'delivered' ? 'entregado' : ''}" data-order-id="${order.id}">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="order-number">${order.orderNumber}</span>
                            ${getStatusBadge(order.status)}
                        </div>
                        <h5 class="customer-name">${order.customerName}</h5>
                        <p class="delivery-address mb-2">
                            <i class="bi bi-geo-alt-fill me-1"></i>${order.address}
                        </p>
                        <p class="phone-number mb-2">
                            <i class="bi bi-telephone-fill me-1"></i>${order.phone}
                        </p>
                        <span class="location-badge">${order.district}</span>
                        ${order.status === 'in-progress' ? getProgressBar(order.progress) : ''}
                        <div class="order-items mt-3">
                            ${order.items.map(item => `
                                <div class="d-flex justify-content-between">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>${item.price}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex flex-column h-100">
                            <div class="mt-auto text-end">
                                <div class="order-total mb-2">${order.total}</div>
                                <div class="order-time mb-3">Orden: ${order.orderTime}</div>
                                <div class="d-grid gap-2">
                                    ${getActionButtons(order)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    setupOrderEventListeners();
}

// Obtener badge de estado
function getStatusBadge(status) {
    const config = {
        'pending': { text: 'Pendiente', class: 'bg-warning' },
        'in-progress': { text: 'En Camino', class: 'bg-info' },
        'delivered': { text: 'Entregado', class: 'bg-success' }
    }[status] || { text: 'Desconocido', class: 'bg-secondary' };
    
    return `<span class="badge status-badge ${config.class}">${config.text}</span>`;
}

// Obtener barra de progreso
function getProgressBar(progress) {
    return `
        <div class="progress-container mt-2">
            <div class="d-flex justify-content-between mb-1">
                <small>Restaurante</small>
                <small>${progress}%</small>
                <small>Destino</small>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
            </div>
        </div>
    `;
}

// Obtener botones de acción
function getActionButtons(order) {
    switch (order.status) {
        case 'pending':
            return `
                <button class="btn btn-start-delivery start-delivery-btn" data-order-id="${order.id}">
                    <i class="bi bi-play-circle me-1"></i>Iniciar Entrega
                </button>
                <button class="btn btn-view-map view-map-btn" data-order-id="${order.id}">
                    <i class="bi bi-map me-1"></i>Ver Mapa
                </button>
            `;
        case 'in-progress':
            return `
                <button class="btn btn-view-map view-map-btn" data-order-id="${order.id}">
                    <i class="bi bi-map me-1"></i>Seguir Ruta
                </button>
                <button class="btn btn-delivered mark-delivered-btn" data-order-id="${order.id}">
                    <i class="bi bi-check-circle me-1"></i>Marcar Entregado
                </button>
            `;
        default:
            return `
                <button class="btn btn-view-map view-map-btn" data-order-id="${order.id}">
                    <i class="bi bi-map me-1"></i>Ver Detalles
                </button>
            `;
    }
}

// Configurar event listeners de pedidos
function setupOrderEventListeners() {
    document.querySelectorAll('.view-map-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const orderId = parseInt(this.getAttribute('data-order-id'));
            showMapModal(orderId);
        });
    });

    document.querySelectorAll('.mark-delivered-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const orderId = parseInt(this.getAttribute('data-order-id'));
            markAsDelivered(orderId);
        });
    });

    document.querySelectorAll('.start-delivery-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const orderId = parseInt(this.getAttribute('data-order-id'));
            startDelivery(orderId);
        });
    });
}

// Mostrar modal del mapa
function showMapModal(orderId) {
    const order = APP_STATE.deliveryOrders.find(o => o.id === orderId);
    if (!order) {
        showConfirmation('Error', 'Pedido no encontrado');
        return;
    }

    APP_STATE.currentOrderId = orderId;
    APP_STATE.currentOrder = order;

    // Actualizar información del modal
    updateModalInfo(order);

    // Configurar botones según estado
    updateModalButtons(order.status);

    // Inicializar y configurar mapa
    initMap();
    setupMapForOrder(order);

    // Mostrar modal
    const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
    mapModal.show();
}

// Actualizar información del modal
function updateModalInfo(order) {
    document.getElementById('modalOrderNumber').textContent = order.orderNumber;
    document.getElementById('modalCustomerInfo').textContent = `${order.customerName} - ${order.phone}`;
    document.getElementById('modalDeliveryAddress').textContent = order.address;
    document.getElementById('modalDistrict').textContent = order.district;
    document.getElementById('modalOrderTotal').textContent = order.total;
    document.getElementById('modalOrderTime').textContent = `Orden: ${order.orderTime}`;
    document.getElementById('deliveryProgress').style.width = `${order.progress}%`;
    document.getElementById('progressPercentage').textContent = `${order.progress}%`;
}

// Actualizar botones del modal
function updateModalButtons(status) {
    const markDeliveredBtn = document.getElementById('markDeliveredModal');
    const startDeliveryBtn = document.getElementById('startDeliveryBtn');
    
    markDeliveredBtn.style.display = status === 'in-progress' ? 'inline-block' : 'none';
    startDeliveryBtn.style.display = status === 'pending' ? 'inline-block' : 'none';
}

// Inicializar mapa
function initMap() {
    if (!APP_STATE.map) {
        APP_STATE.map = L.map('deliveryMap').setView([CONFIG.restaurantLocation.lat, CONFIG.restaurantLocation.lng], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(APP_STATE.map);
    } else {
        APP_STATE.map.setView([CONFIG.restaurantLocation.lat, CONFIG.restaurantLocation.lng], 14);
    }
    
    clearMap();
}

// Configurar mapa según el pedido
function setupMapForOrder(order) {
    addRestaurantMarker();
    addCustomerMarker(order);
    
    if (order.status === 'in-progress') {
        if (order.driverPosition) {
            addDriverMarker(order.driverPosition);
        }
        calculateRealTimeRoute(order);
        startRealTimeSimulation(order);
        document.getElementById('routeStatus').textContent = 'En camino';
        document.getElementById('routeStatus').className = 'badge bg-info';
    } else {
        calculateRouteInfo(CONFIG.restaurantLocation, order.coordinates);
        document.getElementById('routeStatus').textContent = 'Pendiente';
        document.getElementById('routeStatus').className = 'badge bg-warning';
    }
    
    centerMapOnPoints([CONFIG.restaurantLocation, order.coordinates]);
}

// Agregar marcador del restaurante
function addRestaurantMarker() {
    APP_STATE.restaurantMarker = L.marker([CONFIG.restaurantLocation.lat, CONFIG.restaurantLocation.lng])
        .addTo(APP_STATE.map)
        .bindPopup(`
            <div class="text-center">
                <h6>${CONFIG.restaurantLocation.name}</h6>
                <p class="mb-1">Punto de partida</p>
                <small>${CONFIG.restaurantLocation.address}</small>
            </div>
        `)
        .setIcon(L.divIcon({
            html: '<div class="marker-icon restaurant-marker"><i class="bi bi-shop"></i></div>',
            iconSize: [40, 40],
            className: 'restaurant-marker-icon'
        }));
}

// Agregar marcador del cliente
function addCustomerMarker(order) {
    const customerMarker = L.marker([order.coordinates.lat, order.coordinates.lng])
        .addTo(APP_STATE.map)
        .bindPopup(`
            <div class="text-center">
                <h6>${order.customerName}</h6>
                <p class="mb-1">${order.orderNumber}</p>
                <small>${order.address}</small>
            </div>
        `)
        .setIcon(L.divIcon({
            html: '<div class="marker-icon customer-marker"><i class="bi bi-house"></i></div>',
            iconSize: [40, 40],
            className: 'customer-marker-icon'
        }));
    
    APP_STATE.currentMarkers.push(customerMarker);
}

// Agregar marcador del repartidor
function addDriverMarker(position) {
    APP_STATE.driverMarker = L.marker([position.lat, position.lng])
        .addTo(APP_STATE.map)
        .setIcon(L.divIcon({
            html: '<div class="marker-icon driver-marker"><i class="bi bi-person-bicycle"></i></div>',
            iconSize: [40, 40],
            className: 'driver-marker-icon'
        }));
    
    APP_STATE.currentMarkers.push(APP_STATE.driverMarker);
}

// Calcular ruta en tiempo real
function calculateRealTimeRoute(order) {
    if (APP_STATE.routingControl) {
        APP_STATE.map.removeControl(APP_STATE.routingControl);
    }

    const waypoints = [
        L.latLng(CONFIG.restaurantLocation.lat, CONFIG.restaurantLocation.lng),
        L.latLng(order.coordinates.lat, order.coordinates.lng)
    ];

    APP_STATE.routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        showAlternatives: false,
        lineOptions: {
            styles: [{ color: '#d32f2f', weight: 6, opacity: 0.7 }]
        },
        createMarker: function() { return null; }
    }).addTo(APP_STATE.map);

    APP_STATE.routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
            const route = routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(1);
            const time = Math.round(route.summary.totalTime / 60);
            
            document.getElementById('routeDistance').textContent = distance + ' km';
            document.getElementById('routeTime').textContent = time + ' min';
        }
    });
}

// Iniciar simulación en tiempo real
function startRealTimeSimulation(order) {
    if (APP_STATE.realTimeInterval) {
        clearInterval(APP_STATE.realTimeInterval);
    }

    APP_STATE.realTimeInterval = setInterval(() => {
        if (order.status !== 'in-progress' || order.progress >= 100) {
            clearInterval(APP_STATE.realTimeInterval);
            return;
        }
        simulateDriverMovement(order);
        updateRealTimeUI(order);
    }, CONFIG.updateInterval);
}

// Simular movimiento del repartidor
function simulateDriverMovement(order) {
    if (!order.driverPosition) {
        order.driverPosition = { ...CONFIG.restaurantLocation };
    }

    const start = CONFIG.restaurantLocation;
    const end = order.coordinates;
    
    const latStep = (end.lat - start.lat) / 100;
    const lngStep = (end.lng - start.lng) / 100;
    
    order.driverPosition.lat += latStep * CONFIG.simulationSpeed;
    order.driverPosition.lng += lngStep * CONFIG.simulationSpeed;
    
    const progress = calculateProgress(order.driverPosition, start, end);
    order.progress = Math.min(100, Math.round(progress));
    
    if (APP_STATE.driverMarker) {
        APP_STATE.driverMarker.setLatLng([order.driverPosition.lat, order.driverPosition.lng]);
    }
    
    if (order.progress >= 100) {
        order.driverPosition = { ...end };
        showConfirmation('¡Entrega completada!', 'El pedido ha llegado a su destino.');
    }
}

// Calcular progreso
function calculateProgress(current, start, end) {
    const totalDistance = Math.sqrt(
        Math.pow(end.lat - start.lat, 2) + 
        Math.pow(end.lng - start.lng, 2)
    );
    
    const currentDistance = Math.sqrt(
        Math.pow(current.lat - start.lat, 2) + 
        Math.pow(current.lng - start.lng, 2)
    );
    
    return (currentDistance / totalDistance) * 100;
}

// Actualizar UI en tiempo real
function updateRealTimeUI(order) {
    document.getElementById('deliveryProgress').style.width = `${order.progress}%`;
    document.getElementById('progressPercentage').textContent = `${order.progress}%`;
    
    if (order.progress >= 95) {
        document.getElementById('routeStatus').textContent = 'Llegando';
        document.getElementById('routeStatus').className = 'badge bg-success';
    }
}

// Centrar mapa en puntos
function centerMapOnPoints(points) {
    const group = new L.featureGroup([
        L.marker([points[0].lat, points[0].lng]),
        L.marker([points[1].lat, points[1].lng])
    ]);
    APP_STATE.map.fitBounds(group.getBounds().pad(0.1));
}

// Calcular información de ruta
function calculateRouteInfo(start, end) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    const timeMinutes = Math.round(distance * 3 + 5);

    document.getElementById('routeDistance').textContent = distance.toFixed(1) + ' km';
    document.getElementById('routeTime').textContent = timeMinutes + ' min';
}

// Limpiar mapa
function clearMap() {
    APP_STATE.currentMarkers.forEach(marker => {
        APP_STATE.map.removeLayer(marker);
    });
    APP_STATE.currentMarkers = [];

    if (APP_STATE.restaurantMarker) {
        APP_STATE.map.removeLayer(APP_STATE.restaurantMarker);
        APP_STATE.restaurantMarker = null;
    }

    if (APP_STATE.driverMarker) {
        APP_STATE.map.removeLayer(APP_STATE.driverMarker);
        APP_STATE.driverMarker = null;
    }

    if (APP_STATE.routingControl) {
        APP_STATE.map.removeControl(APP_STATE.routingControl);
        APP_STATE.routingControl = null;
    }

    if (APP_STATE.realTimeInterval) {
        clearInterval(APP_STATE.realTimeInterval);
        APP_STATE.realTimeInterval = null;
    }
}

// Iniciar entrega
function startDelivery(orderId) {
    const orderIndex = APP_STATE.deliveryOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    APP_STATE.deliveryOrders[orderIndex].status = 'in-progress';
    APP_STATE.deliveryOrders[orderIndex].driverPosition = { ...CONFIG.restaurantLocation };
    APP_STATE.deliveryOrders[orderIndex].progress = 0;

    updateAllStats();
    renderDeliveryList();
    showConfirmation('¡Entrega iniciada!', 'El pedido ha sido marcado como en camino.');
    startDriverSimulation(APP_STATE.deliveryOrders[orderIndex]);
}

// Marcar como entregado
function markAsDelivered(orderId) {
    const orderIndex = APP_STATE.deliveryOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    APP_STATE.deliveryOrders[orderIndex].status = 'delivered';
    APP_STATE.deliveryOrders[orderIndex].progress = 100;

    const orderElement = document.querySelector(`.delivery-card[data-order-id="${orderId}"]`);
    if (orderElement) {
        orderElement.classList.add('fade-out');
        setTimeout(() => {
            orderElement.remove();
            updateAllStats();
            const activeFilter = document.querySelector('.filter-buttons .btn.active').getAttribute('data-filter');
            if (activeFilter !== 'all') {
                renderDeliveryList(activeFilter);
            }
        }, 500);
    }

    showConfirmation('¡Pedido entregado!', 'El pedido ha sido marcado como entregado exitosamente.');
}

// Mostrar confirmación
function showConfirmation(title, message) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();
}

// Iniciar simulación para todos los pedidos
function startAllDriverSimulations() {
    APP_STATE.deliveryOrders.forEach(order => {
        if (order.status === 'in-progress' && order.progress < 100) {
            startDriverSimulation(order);
        }
    });
}

// Iniciar simulación individual
function startDriverSimulation(order) {
    if (APP_STATE.driverSimulations.has(order.id)) {
        clearInterval(APP_STATE.driverSimulations.get(order.id));
    }

    const interval = setInterval(() => {
        const orderIndex = APP_STATE.deliveryOrders.findIndex(o => o.id === order.id);
        if (orderIndex === -1 || APP_STATE.deliveryOrders[orderIndex].status !== 'in-progress' || APP_STATE.deliveryOrders[orderIndex].progress >= 100) {
            clearInterval(interval);
            APP_STATE.driverSimulations.delete(order.id);
            return;
        }

        if (!APP_STATE.deliveryOrders[orderIndex].driverPosition) {
            APP_STATE.deliveryOrders[orderIndex].driverPosition = { ...CONFIG.restaurantLocation };
        }

        const start = CONFIG.restaurantLocation;
        const end = APP_STATE.deliveryOrders[orderIndex].coordinates;
        const progressFactor = APP_STATE.deliveryOrders[orderIndex].progress / 100;

        APP_STATE.deliveryOrders[orderIndex].driverPosition = {
            lat: start.lat + (end.lat - start.lat) * progressFactor,
            lng: start.lng + (end.lng - start.lng) * progressFactor
        };

        APP_STATE.deliveryOrders[orderIndex].progress += 1;

        if (APP_STATE.deliveryOrders[orderIndex].progress >= 100) {
            clearInterval(interval);
            APP_STATE.driverSimulations.delete(order.id);
        }

        const activeFilter = document.querySelector('.filter-buttons .btn.active').getAttribute('data-filter');
        if (activeFilter === 'all' || activeFilter === 'in-progress') {
            renderDeliveryList(activeFilter);
        }
    }, 3000);

    APP_STATE.driverSimulations.set(order.id, interval);
}

// Actualizar todas las estadísticas
function updateAllStats() {
    const pendingCount = APP_STATE.deliveryOrders.filter(o => o.status === 'pending').length;
    const inProgressCount = APP_STATE.deliveryOrders.filter(o => o.status === 'in-progress').length;
    const deliveredCount = APP_STATE.deliveryOrders.filter(o => o.status === 'delivered').length;
    const totalCount = APP_STATE.deliveryOrders.length;

    // Actualizar estadísticas principales
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('deliveredCount').textContent = deliveredCount;
    document.getElementById('totalCount').textContent = totalCount;

    // Actualizar estadísticas del sidebar
    document.getElementById('sidebarPendingCount').textContent = pendingCount;
    document.getElementById('sidebarProgressCount').textContent = inProgressCount;
}

// Exportar funciones globales si es necesario
window.DeliverySystem = {
    initializeApp,
    startDelivery,
    markAsDelivered,
    showMapModal
};