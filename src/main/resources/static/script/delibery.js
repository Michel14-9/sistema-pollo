// Ubicación de la pollería en Ica (coordenadas aproximadas)
const restaurantLocation = {
    lat: -14.070617,
    lng: -75.727120,
    name: "Luren Chicken",
    address: "Cerca de Pollería en Ica, Perú"
};

// Datos de ejemplo para pedidos de delivery en Ica
const deliveryOrders = [
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
        coordinates: { lat: -14.065, lng: -75.730 } // Cerca de la pollería
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
        coordinates: { lat: -14.068, lng: -75.725 }
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
        coordinates: { lat: -14.073, lng: -75.732 }
    },
    {
        id: 4,
        orderNumber: "ORD-2024-001237",
        customerName: "Roberto Silva",
        phone: "+51 987 456 789",
        address: "Av. La Angostura 456, Ica",
        district: "Ica",
        total: "S/ 36.50",
        status: "delivered",
        orderTime: "11:20 AM",
        items: [
            { name: "1/2 Pollo + Papas", quantity: 1, price: "S/ 20.00" },
            { name: "Ensalada César", quantity: 1, price: "S/ 10.00" },
            { name: "Gaseosa 1L", quantity: 1, price: "S/ 6.50" }
        ],
        coordinates: { lat: -14.075, lng: -75.720 }
    },
    {
        id: 5,
        orderNumber: "ORD-2024-001238",
        customerName: "Lucía Mendoza",
        phone: "+51 987 321 654",
        address: "Psje. Grau 789, Ica",
        district: "Ica",
        total: "S/ 42.00",
        status: "pending",
        orderTime: "1:45 PM",
        items: [
            { name: "Pollo a la Brasa Entero", quantity: 1, price: "S/ 32.00" },
            { name: "Ensalada César", quantity: 1, price: "S/ 10.00" }
        ],
        coordinates: { lat: -14.072, lng: -75.728 }
    },
    {
        id: 6,
        orderNumber: "ORD-2024-001239",
        customerName: "Miguel Torres",
        phone: "+51 987 654 987",
        address: "Urb. Luren, Ica",
        district: "Ica",
        total: "S/ 55.50",
        status: "in-progress",
        orderTime: "2:00 PM",
        items: [
            { name: "Pollo a la Brasa Entero", quantity: 1, price: "S/ 32.00" },
            { name: "1/4 de Pollo + Papas", quantity: 1, price: "S/ 14.00" },
            { name: "Gaseosa 1L", quantity: 1, price: "S/ 4.50" },
            { name: "Papas Fritas", quantity: 1, price: "S/ 5.00" }
        ],
        coordinates: { lat: -14.066, lng: -75.735 }
    }
];

// Variables globales
let map;
let currentMarkers = [];
let currentOrderId = null;
let restaurantMarker;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function () {
    renderDeliveryList();
    setupEventListeners();
    updateStats();
});

// Renderizar la lista de pedidos
function renderDeliveryList(filter = 'all') {
    const deliveryList = document.getElementById('deliveryList');
    const emptyState = document.getElementById('emptyState');

    // Filtrar pedidos
    const filteredOrders = filter === 'all'
        ? deliveryOrders
        : deliveryOrders.filter(order => order.status === filter);

    // Mostrar estado vacío si no hay pedidos
    if (filteredOrders.length === 0) {
        deliveryList.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    // Generar HTML para cada pedido
    deliveryList.innerHTML = filteredOrders.map(order => {
        const statusBadge = getStatusBadge(order.status);
        const itemsList = order.items.map(item =>
            `<div class="d-flex justify-content-between">
                        <span>${item.name} x${item.quantity}</span>
                        <span>${item.price}</span>
                    </div>`
        ).join('');

        return `
                    <div class="card delivery-card mb-3 ${order.status === 'delivered' ? 'entregado' : ''}" data-order-id="${order.id}">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <span class="order-number">${order.orderNumber}</span>
                                        ${statusBadge}
                                    </div>
                                    <h5 class="customer-name">${order.customerName}</h5>
                                    <p class="delivery-address mb-2">
                                        <i class="bi bi-geo-alt-fill me-1"></i>${order.address}
                                    </p>
                                    <p class="phone-number mb-2">
                                        <i class="bi bi-telephone-fill me-1"></i>${order.phone}
                                    </p>
                                    <span class="location-badge">${order.district}</span>
                                    <div class="order-items mt-3">
                                        ${itemsList}
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="d-flex flex-column h-100">
                                        <div class="mt-auto text-end">
                                            <div class="order-total mb-2">${order.total}</div>
                                            <div class="order-time mb-3">Orden: ${order.orderTime}</div>
                                            <div class="d-grid gap-2">
                                                <button class="btn btn-view-map view-map-btn" data-order-id="${order.id}">
                                                    <i class="bi bi-map me-1"></i>Ver Mapa
                                                </button>
                                                ${order.status !== 'delivered' ?
                `<button class="btn btn-delivered mark-delivered-btn" data-order-id="${order.id}">
                                                        <i class="bi bi-check-circle me-1"></i>Marcar Entregado
                                                    </button>` :
                ''
            }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    }).join('');

    // Agregar event listeners a los botones
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
}

// Obtener el badge de estado
function getStatusBadge(status) {
    const statusConfig = {
        'pending': { text: 'Pendiente', class: 'bg-warning' },
        'in-progress': { text: 'En Camino', class: 'bg-info' },
        'delivered': { text: 'Entregado', class: 'bg-success' }
    };

    const config = statusConfig[status];
    return `<span class="badge status-badge ${config.class}">${config.text}</span>`;
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Remover clase active de todos los botones
            document.querySelectorAll('.filter-buttons .btn').forEach(b => {
                b.classList.remove('active');
            });

            // Agregar clase active al botón clickeado
            this.classList.add('active');

            // Aplicar filtro
            const filter = this.getAttribute('data-filter');
            renderDeliveryList(filter);
        });
    });

    // Botón de marcar como entregado en el modal
    document.getElementById('markDeliveredModal').addEventListener('click', function () {
        if (currentOrderId) {
            markAsDelivered(currentOrderId);
            const mapModal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
            mapModal.hide();
        }
    });
}

// Mostrar modal con mapa
function showMapModal(orderId) {
    const order = deliveryOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;

    // Actualizar información del modal
    document.getElementById('modalOrderNumber').textContent = order.orderNumber;
    document.getElementById('modalCustomerInfo').textContent = `${order.customerName} - ${order.phone}`;
    document.getElementById('modalDeliveryAddress').textContent = order.address;
    document.getElementById('modalDistrict').textContent = order.district;
    document.getElementById('modalOrderTotal').textContent = order.total;
    document.getElementById('modalOrderTime').textContent = `Orden: ${order.orderTime}`;

    // Inicializar mapa si no existe
    if (!map) {
        initMap();
    } else {
        // Limpiar marcadores existentes
        clearMarkers();
    }

    // Agregar marcador para la pollería (restaurante)
    addRestaurantMarker();

    // Agregar marcador para la ubicación del cliente
    addMarker(order.coordinates, order.customerName, order.orderNumber, 'customer');

    // Centrar mapa para mostrar ambos puntos
    centerMapOnPoints([restaurantLocation, order.coordinates]);

    // Calcular y mostrar información de ruta
    calculateRouteInfo(restaurantLocation, order.coordinates);

    // Mostrar modal
    const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
    mapModal.show();
}

// Inicializar mapa centrado en Ica
function initMap() {
    map = L.map('deliveryMap').setView([restaurantLocation.lat, restaurantLocation.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Agregar marcador del restaurante
function addRestaurantMarker() {
    restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng])
        .addTo(map)
        .bindPopup(`
                    <div class="text-center">
                        <h6>${restaurantLocation.name}</h6>
                        <p class="mb-1">Punto de partida</p>
                        <small>${restaurantLocation.address}</small>
                    </div>
                `)
        .openPopup();

    // Icono personalizado para el restaurante (rojo)
    restaurantMarker.setIcon(
        L.divIcon({
            html: '<i class="bi bi-shop" style="color: #d32f2f; font-size: 24px;"></i>',
            iconSize: [24, 24],
            className: 'restaurant-marker'
        })
    );
}

// Agregar marcador al mapa
function addMarker(coords, title, orderNumber, type = 'customer') {
    const marker = L.marker([coords.lat, coords.lng])
        .addTo(map)
        .bindPopup(`
                    <div class="text-center">
                        <h6>${title}</h6>
                        <p class="mb-1">${orderNumber}</p>
                        <small>${type === 'customer' ? 'Ubicación de entrega' : 'Punto de partida'}</small>
                    </div>
                `);

    // Icono personalizado para clientes (azul)
    if (type === 'customer') {
        marker.setIcon(
            L.divIcon({
                html: '<i class="bi bi-house-fill" style="color: #0d6efd; font-size: 24px;"></i>',
                iconSize: [24, 24],
                className: 'customer-marker'
            })
        );
    }

    currentMarkers.push(marker);
}

// Centrar mapa para mostrar múltiples puntos
function centerMapOnPoints(points) {
    const group = new L.featureGroup([
        L.marker([points[0].lat, points[0].lng]),
        L.marker([points[1].lat, points[1].lng])
    ]);
    map.fitBounds(group.getBounds().pad(0.1));
}

// Calcular información de ruta (simulada)
function calculateRouteInfo(start, end) {
    // En una aplicación real, esto se calcularía con una API de rutas
    // Por ahora, simulamos la información

    // Calcular distancia aproximada (fórmula Haversine simplificada)
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Aprox. km

    // Tiempo estimado basado en distancia
    const timeMinutes = Math.round(distance * 3 + 5); // ~3 min por km + 5 min base

    document.getElementById('routeDistance').textContent = distance.toFixed(1) + ' km';
    document.getElementById('routeTime').textContent = timeMinutes + ' min';
}

// Limpiar marcadores
function clearMarkers() {
    currentMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    currentMarkers = [];

    if (restaurantMarker) {
        map.removeLayer(restaurantMarker);
        restaurantMarker = null;
    }
}

// Marcar pedido como entregado
function markAsDelivered(orderId) {
    const orderIndex = deliveryOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    // Actualizar estado del pedido
    deliveryOrders[orderIndex].status = 'delivered';

    // Encontrar el elemento del pedido en el DOM
    const orderElement = document.querySelector(`.delivery-card[data-order-id="${orderId}"]`);

    if (orderElement) {
        // Agregar animación de desvanecimiento
        orderElement.classList.add('fade-out');

        // Eliminar el elemento después de la animación
        setTimeout(() => {
            orderElement.remove();

            // Actualizar estadísticas
            updateStats();

            // Volver a renderizar la lista si estamos en un filtro específico
            const activeFilter = document.querySelector('.filter-buttons .btn.active').getAttribute('data-filter');
            if (activeFilter !== 'all') {
                renderDeliveryList(activeFilter);
            }
        }, 500);
    }

    // Mostrar confirmación
    showDeliveryConfirmation(deliveryOrders[orderIndex]);
}

// Mostrar confirmación de entrega
function showDeliveryConfirmation(order) {
    // En una aplicación real, aquí se enviaría una notificación al servidor
    // Por ahora, solo mostramos una alerta
    alert(`¡Pedido ${order.orderNumber} marcado como entregado!\nCliente: ${order.customerName}\nDirección: ${order.address}\nTotal: ${order.total}`);
}

// Actualizar estadísticas
function updateStats() {
    const pendingCount = deliveryOrders.filter(o => o.status === 'pending').length;
    const inProgressCount = deliveryOrders.filter(o => o.status === 'in-progress').length;
    const deliveredCount = deliveryOrders.filter(o => o.status === 'delivered').length;
    const totalCount = deliveryOrders.length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('deliveredCount').textContent = deliveredCount;
    document.getElementById('totalCount').textContent = totalCount;
}