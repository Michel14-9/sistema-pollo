// Variables globales
let salesChart = null;
let currentEditingId = null;
let products = [];
let users = [];
let sales = [];
let isPublicMenuVisible = false;

// Sistema de Eventos Mejorado para sincronización en tiempo real
const EventSystem = {
    events: {},
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    emit(event, data) {
        console.log(`🎯 Emitiendo evento: ${event}`, data);
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en evento ${event}:`, error);
                }
            });
        }
    },
    
    // Nuevo: Limpiar eventos específicos
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
};

// Funciones para exportación
function exportarVentasPDF() {
    if (sales.length === 0) {
        mostrarAlerta('No hay ventas para exportar', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Ventas - Luren Chicken', 14, 22);

        // Fecha de generación
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);

        // Encabezados de tabla
        const headers = [['ID', 'Cliente', 'Productos', 'Total', 'Fecha', 'Estado', 'Tipo', 'Cajero']];

        // Datos de la tabla
        const data = sales.map(venta => [
            venta.id.toString(),
            venta.cliente || 'Cliente no registrado',
            (venta.cantidadProductos || 0).toString() + ' productos',
            `S/ ${venta.total.toFixed(2)}`,
            new Date(venta.fecha).toLocaleDateString('es-PE'),
            venta.estado || 'Pendiente',
            venta.tipo || 'Local',
            venta.cajero || 'Sistema'
        ]);

        // Crear tabla
        doc.autoTable({
            startY: 35,
            head: headers,
            body: data,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [13, 110, 253] }
        });

        // Guardar PDF
        doc.save(`ventas_luren_chicken_${new Date().toISOString().split('T')[0]}.pdf`);

        mostrarAlerta('Reporte PDF descargado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarAlerta('Error al generar el reporte PDF', 'danger');
    }
}

function exportarVentasExcel() {
    if (sales.length === 0) {
        mostrarAlerta('No hay ventas para exportar', 'warning');
        return;
    }

    try {
        // Preparar datos para Excel
        const datosExcel = sales.map(venta => ({
            'ID Pedido': venta.id,
            'Cliente': venta.cliente || 'Cliente no registrado',
            'Cantidad Productos': venta.cantidadProductos || 0,
            'Total (S/)': venta.total,
            'Fecha': new Date(venta.fecha).toLocaleDateString('es-PE'),
            'Estado': venta.estado || 'Pendiente',
            'Tipo': venta.tipo || 'Local',
            'Cajero': venta.cajero || 'Sistema'
        }));

        // Crear hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

        // Generar archivo Excel
        XLSX.writeFile(wb, `ventas_luren_chicken_${new Date().toISOString().split('T')[0]}.xlsx`);

        mostrarAlerta('Reporte Excel descargado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar Excel:', error);
        mostrarAlerta('Error al generar el reporte Excel', 'danger');
    }
}

// Funciones para persistencia de datos en localStorage - MEJORADO
function guardarDatosEnLocalStorage() {
    try {
        const datosCompletos = {
            products: products,
            users: users,
            lastSave: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('lurenData', JSON.stringify(datosCompletos));
        console.log('💾 Datos guardados en localStorage:', {
            productos: products.length,
            usuarios: users.length,
            hora: new Date().toLocaleTimeString()
        });
    } catch (error) {
        console.error('❌ Error al guardar en localStorage:', error);
        mostrarAlerta('Error al guardar los datos', 'danger');
    }
}

function cargarDatosDesdeLocalStorage() {
    try {
        const datosGuardados = localStorage.getItem('lurenData');
        
        if (datosGuardados) {
            const datos = JSON.parse(datosGuardados);
            products = datos.products || [];
            users = datos.users || [];
            
            console.log('📦 Datos cargados:', {
                productos: products.length,
                usuarios: users.length,
                version: datos.version || 'N/A'
            });
            
            if (datos.lastSave) {
                console.log('🕒 Última sincronización:', new Date(datos.lastSave).toLocaleString());
            }
        } else {
            // Datos iniciales por defecto
            inicializarDatosPorDefecto();
        }
        
        // Verificar integridad de datos
        verificarIntegridadDatos();
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        mostrarAlerta('Error al cargar los datos guardados', 'warning');
        inicializarDatosPorDefecto();
    }
}

function inicializarDatosPorDefecto() {
    console.log('🆕 Inicializando datos por defecto...');
    
    products = [
        {
            id: 1,
            nombre: "Pollo a la Brasa Familiar",
            categoria: "pollos",
            precio: 35.00,
            descripcion: "Delicioso pollo a la brasa con papas fritas y ensalada fresca",
            imagen: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=200&fit=crop",
            estado: "activo",
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 2,
            nombre: "Parrilla Especial",
            categoria: "parrillas",
            precio: 85.00,
            descripcion: "Parrilla completa para 4 personas con carnes variadas y guarniciones",
            imagen: "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?w=300&h=200&fit=crop",
            estado: "activo",
            fechaCreacion: new Date().toISOString()
        },
        {
            id: 3,
            nombre: "Chicharrón de Pollo",
            categoria: "chicharron",
            precio: 25.00,
            descripcion: "Crujiente chicharrón de pollo con yuca frita y salsa criolla",
            imagen: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop",
            estado: "activo",
            fechaCreacion: new Date().toISOString()
        }
    ];

    users = [
        {
            id: 1,
            nombre: "Administrador Principal",
            email: "admin@lurenchicken.com",
            rol: "admin",
            estado: "activo",
            fechaRegistro: "2023-01-15"
        }
    ];
    
    guardarDatosEnLocalStorage();
}

function verificarIntegridadDatos() {
    // Verificar que todos los productos tengan los campos requeridos
    products = products.filter(producto => 
        producto && 
        producto.id && 
        producto.nombre && 
        producto.categoria && 
        producto.precio
    );
    
    console.log('🔍 Integridad de datos verificada:', products.length, 'productos válidos');
}

// Función para mostrar alertas dinámicas
function mostrarAlerta(mensaje, tipo = 'success') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} me-2"></i>
            <span>${mensaje}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const dynamicAlerts = document.getElementById('dynamicAlerts');
    dynamicAlerts.appendChild(alerta);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Función para actualizar estadísticas del dashboard
function actualizarEstadisticasDashboard() {
    const productosActivos = products.filter(p => p.estado === 'activo').length;
    document.getElementById('totalProductos').textContent = productosActivos;
    document.getElementById('totalUsuarios').textContent = users.length;
}

// SISTEMA DE SINCRONIZACIÓN MEJORADO
function sincronizarMenuPublico(accion, producto = null) {
    console.log(`🔄 Sincronizando menú público - Acción: ${accion}`, producto);
    
    // Emitir evento para sincronización en tiempo real
    EventSystem.emit('menuChanged', { 
        accion, 
        producto, 
        timestamp: new Date().toISOString(),
        totalProductos: products.length,
        productosActivos: products.filter(p => p.estado === 'activo').length
    });
    
    // Actualizar estadísticas inmediatamente
    actualizarEstadisticasDashboard();
    
    // Si el menú público está visible, actualizarlo inmediatamente
    if (isPublicMenuVisible) {
        console.log('🎯 Menú público visible - Actualizando...');
        actualizarMenuPublico();
    } else {
        console.log('👁️ Menú público no visible - Sincronización diferida');
    }
    
    // Guardar cambios en localStorage
    guardarDatosEnLocalStorage();
    
    // Forzar actualización del DOM
    setTimeout(() => {
        if (isPublicMenuVisible) {
            actualizarMenuPublico();
        }
    }, 100);
}

// Función para cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.getElementById('csrfToken').value
            }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const data = await response.json();
        actualizarEstadisticasPrincipales(data);
        cargarGraficos(data);
        cargarVentasRecientes(data.ventasRecientes);

    } catch (error) {
        console.error('Error:', error);
        cargarDatosEnCero();
    }
}

// Función para cargar datos en cero
function cargarDatosEnCero() {
    const datosEnCero = {
        totalProductos: products.filter(p => p.estado === 'activo').length,
        totalUsuarios: users.length,
        pedidosHoy: 0,
        ingresosHoy: 0,
        ventasMesTotal: 0,
        promedioDiario: 0,
        ventaMaxima: 0,
        totalPedidos: 0,
        graficoVentas: {
            labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
            data: Array(30).fill(0)
        },
        ventasRecientes: []
    };

    actualizarEstadisticasPrincipales(datosEnCero);
    cargarGraficos(datosEnCero);
    cargarVentasRecientes(datosEnCero.ventasRecientes);
}

// Función para actualizar estadísticas principales
function actualizarEstadisticasPrincipales(data) {
    const productosActivos = products.filter(p => p.estado === 'activo').length;

    document.getElementById('totalProductos').textContent = productosActivos;
    document.getElementById('totalUsuarios').textContent = users.length;
    document.getElementById('pedidosHoy').textContent = data.pedidosHoy || '0';
    document.getElementById('ingresosHoy').textContent = `S/ ${(data.ingresosHoy || 0).toFixed(2)}`;

    document.getElementById('ventasMesTotal').textContent = `S/ ${(data.ventasMesTotal || 0).toFixed(2)}`;
    document.getElementById('promedioDiario').textContent = `S/ ${(data.promedioDiario || 0).toFixed(2)}`;
    document.getElementById('ventaMaxima').textContent = `S/ ${(data.ventaMaxima || 0).toFixed(2)}`;
    document.getElementById('totalPedidos').textContent = data.totalPedidos || '0';
}

// Función para cargar gráficos
function cargarGraficos(data) {
    const salesCtx = document.getElementById('salesChart');
    const emptyChartMessage = document.getElementById('emptyChartMessage');

    const tieneDatos = data.graficoVentas && data.graficoVentas.data.some(valor => valor > 0);

    if (!tieneDatos) {
        if (salesChart) {
            salesChart.destroy();
            salesChart = null;
        }
        salesCtx.style.display = 'none';
        emptyChartMessage.classList.remove('d-none');
        return;
    }

    salesCtx.style.display = 'block';
    emptyChartMessage.classList.add('d-none');

    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: data.graficoVentas.labels || [],
            datasets: [{
                label: 'Ventas Diarias (S/)',
                data: data.graficoVentas.data || [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `S/ ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'S/ ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Función para cargar ventas recientes
function cargarVentasRecientes(ventas) {
    const tbody = document.getElementById('salesTableBody');
    const noSalesMessage = document.getElementById('noSalesMessage');

    tbody.innerHTML = '';
    sales = ventas || [];

    if (!ventas || ventas.length === 0) {
        noSalesMessage.classList.remove('d-none');
        tbody.parentElement.parentElement.classList.add('d-none');
        return;
    }

    noSalesMessage.classList.add('d-none');
    tbody.parentElement.parentElement.classList.remove('d-none');

    ventas.forEach(venta => {
        const tr = document.createElement('tr');
        const estadoClass = {
            'completado': 'bg-success',
            'proceso': 'bg-warning',
            'pendiente': 'bg-secondary',
            'cancelado': 'bg-danger'
        }[venta.estado] || 'bg-secondary';

        const estadoText = {
            'completado': 'Completado',
            'proceso': 'En Proceso',
            'pendiente': 'Pendiente',
            'cancelado': 'Cancelado'
        }[venta.estado] || 'Pendiente';

        const fecha = new Date(venta.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        tr.innerHTML = `
            <td><strong>${venta.id}</strong></td>
            <td>${venta.cliente || 'Cliente no registrado'}</td>
            <td><small>${venta.cantidadProductos || 0} productos</small></td>
            <td><strong>S/ ${venta.total.toFixed(2)}</strong></td>
            <td>${fechaFormateada}</td>
            <td><span class="badge ${estadoClass}">${estadoText}</span></td>
            <td><span class="badge bg-info">${venta.tipo || 'Local'}</span></td>
            <td>${venta.cajero || 'Sistema'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Función para actualizar el período del gráfico
async function actualizarPeriodoGrafico() {
    const periodo = document.getElementById('chartPeriod').value;

    try {
        const response = await fetch(`/api/estadisticas/ventas?periodo=${periodo}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.getElementById('csrfToken').value
            }
        });

        if (response.ok) {
            const data = await response.json();
            cargarGraficos(data);
            mostrarAlerta(`Período actualizado a últimos ${periodo} días`, 'success');
        } else {
            throw new Error('Error al actualizar período');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al actualizar el período del gráfico', 'danger');
    }
}

// GESTIÓN DE PRODUCTOS - SISTEMA MEJORADO
function cargarProductos() {
    mostrarProductos();
}

function mostrarProductos() {
    const tbody = document.getElementById('productsTableBody');
    const noProductsMessage = document.getElementById('noProductsMessage');

    if (!tbody) {
        console.error('❌ No se encontró el tbody de productos');
        return;
    }

    tbody.innerHTML = '';

    if (products.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.classList.remove('d-none');
            tbody.parentElement.parentElement.classList.add('d-none');
        }
        return;
    }

    if (noProductsMessage) {
        noProductsMessage.classList.add('d-none');
        tbody.parentElement.parentElement.classList.remove('d-none');
    }

    // Aplicar filtros
    const searchTerm = document.getElementById('searchProducts')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
            (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || product.categoria === categoryFilter;
        const matchesStatus = !statusFilter || product.estado === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    filteredProducts.forEach(product => {
        const tr = document.createElement('tr');
        const estadoClass = product.estado === 'activo' ? 'bg-success' : 'bg-secondary';
        const estadoText = product.estado === 'activo' ? 'Activo' : 'Inactivo';

        tr.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${product.imagen}" alt="${product.nombre}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'">
            </td>
            <td>
                <strong>${product.nombre}</strong>
                ${product.descripcion ? `<br><small class="text-muted">${product.descripcion}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-primary text-capitalize">${product.categoria}</span>
            </td>
            <td><strong>S/ ${product.precio.toFixed(2)}</strong></td>
            <td><span class="badge ${estadoClass}">${estadoText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}" 
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}"
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`📊 Mostrando ${filteredProducts.length} productos filtrados de ${products.length} totales`);
}

function abrirModalProducto(producto = null) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('productModalLabel');
    const imagePreview = document.getElementById('imagePreview');

    if (!form || !modalTitle || !imagePreview) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }

    form.reset();
    imagePreview.classList.add('d-none');

    if (producto) {
        modalTitle.textContent = 'Editar Producto';
        document.getElementById('productId').value = producto.id;
        document.getElementById('productName').value = producto.nombre;
        document.getElementById('productCategory').value = producto.categoria;
        document.getElementById('productPrice').value = producto.precio;
        document.getElementById('productDescription').value = producto.descripcion || '';
        document.getElementById('productStatus').value = producto.estado;

        if (producto.imagen) {
            imagePreview.src = producto.imagen;
            imagePreview.classList.remove('d-none');
        }

        currentEditingId = producto.id;
    } else {
        modalTitle.textContent = 'Agregar Producto';
        currentEditingId = null;
    }

    modal.show();
}

function guardarProducto() {
    const nombre = document.getElementById('productName')?.value.trim();
    const categoria = document.getElementById('productCategory')?.value;
    const precio = parseFloat(document.getElementById('productPrice')?.value);
    const descripcion = document.getElementById('productDescription')?.value.trim();
    const estado = document.getElementById('productStatus')?.value;
    const imagen = document.getElementById('imagePreview')?.src || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop";

    // Validaciones
    if (!nombre) {
        mostrarAlerta('El nombre del producto es requerido', 'warning');
        return;
    }

    if (!categoria) {
        mostrarAlerta('Debe seleccionar una categoría', 'warning');
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        mostrarAlerta('El precio debe ser un número mayor a 0', 'warning');
        return;
    }

    try {
        let productoData;
        let accion = 'actualizado';

        if (currentEditingId) {
            // Actualizar producto existente
            const index = products.findIndex(p => p.id === currentEditingId);
            if (index !== -1) {
                productoData = {
                    ...products[index],
                    nombre,
                    categoria,
                    precio,
                    descripcion,
                    estado,
                    imagen,
                    fechaActualizacion: new Date().toISOString()
                };
                products[index] = productoData;
                console.log(`✏️ Producto actualizado: ${productoData.nombre}`);
            }
        } else {
            // Agregar nuevo producto
            const nuevoId = Math.max(0, ...products.map(p => p.id)) + 1;
            productoData = {
                id: nuevoId,
                nombre,
                categoria,
                precio,
                descripcion,
                estado,
                imagen,
                fechaCreacion: new Date().toISOString()
            };
            products.push(productoData);
            accion = 'agregado';
            console.log(`🆕 Producto agregado: ${productoData.nombre} (ID: ${nuevoId})`);
        }

        // Sincronizar inmediatamente
        sincronizarMenuPublico(accion, productoData);

        mostrarAlerta(`Producto "${nombre}" ${accion} correctamente`, 'success');

        // Cerrar modal y actualizar vista
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
        
        mostrarProductos();

    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarAlerta('Error al guardar el producto', 'danger');
    }
}

function eliminarProducto(id) {
    const producto = products.find(p => p.id === id);
    if (!producto) {
        mostrarAlerta('Error: Producto no encontrado', 'danger');
        return;
    }

    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        // Eliminar producto
        const productoEliminado = products.splice(index, 1)[0];
        
        // Sincronizar inmediatamente
        sincronizarMenuPublico('eliminado', productoEliminado);
        
        mostrarAlerta(`Producto "${productoEliminado.nombre}" eliminado correctamente`, 'success');
        mostrarProductos();
        
        console.log(`🗑️ Producto eliminado: ${productoEliminado.nombre}`);
    }
}

// GESTIÓN DE USUARIOS
function cargarUsuarios() {
    mostrarUsuarios();
}

function mostrarUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (users.length === 0) {
        if (noUsersMessage) {
            noUsersMessage.classList.remove('d-none');
            tbody.parentElement.parentElement.classList.add('d-none');
        }
        return;
    }

    if (noUsersMessage) {
        noUsersMessage.classList.add('d-none');
        tbody.parentElement.parentElement.classList.remove('d-none');
    }

    const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const statusFilter = document.getElementById('userStatusFilter')?.value || '';

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.rol === roleFilter;
        const matchesStatus = !statusFilter || user.estado === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');
        const estadoClass = user.estado === 'activo' ? 'bg-success' : 'bg-secondary';
        const estadoText = user.estado === 'activo' ? 'Activo' : 'Inactivo';
        const rolText = {
            'admin': 'Administrador',
            'cajero': 'Cajero',
            'cocinero': 'Cocinero'
        }[user.rol] || user.rol;

        const iniciales = user.nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        tr.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="user-avatar">${iniciales}</div>
            </td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td>${rolText}</td>
            <td><span class="badge ${estadoClass}">${estadoText}</span></td>
            <td>${new Date(user.fechaRegistro).toLocaleDateString('es-PE')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalUsuario(usuario = null) {
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    const form = document.getElementById('userForm');
    const modalTitle = document.getElementById('userModalLabel');
    const passwordField = document.getElementById('passwordField');

    if (!form || !modalTitle) return;

    form.reset();

    if (usuario) {
        modalTitle.textContent = 'Editar Usuario';
        document.getElementById('userId').value = usuario.id;
        document.getElementById('userName').value = usuario.nombre;
        document.getElementById('userEmail').value = usuario.email;
        document.getElementById('userRole').value = usuario.rol;
        document.getElementById('userStatus').value = usuario.estado;
        if (passwordField) passwordField.style.display = 'none';
        currentEditingId = usuario.id;
    } else {
        modalTitle.textContent = 'Agregar Usuario';
        if (passwordField) {
            passwordField.style.display = 'block';
            document.getElementById('userPassword').required = true;
        }
        currentEditingId = null;
    }

    modal.show();
}

function guardarUsuario() {
    const nombre = document.getElementById('userName')?.value.trim();
    const email = document.getElementById('userEmail')?.value.trim();
    const rol = document.getElementById('userRole')?.value;
    const estado = document.getElementById('userStatus')?.value;

    if (!nombre || !email || !rol) {
        mostrarAlerta('Todos los campos son requeridos', 'warning');
        return;
    }

    try {
        if (currentEditingId) {
            const index = users.findIndex(u => u.id === currentEditingId);
            if (index !== -1) {
                users[index] = { ...users[index], nombre, email, rol, estado };
            }
        } else {
            const nuevoId = Math.max(0, ...users.map(u => u.id)) + 1;
            users.push({
                id: nuevoId,
                nombre,
                email,
                rol,
                estado,
                fechaRegistro: new Date().toISOString().split('T')[0]
            });
        }

        guardarDatosEnLocalStorage();
        mostrarAlerta(`Usuario ${currentEditingId ? 'actualizado' : 'agregado'} correctamente`, 'success');
        
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
        
        mostrarUsuarios();
        actualizarEstadisticasDashboard();

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar el usuario', 'danger');
    }
}

function eliminarUsuario(id) {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        const usuarioEliminado = users.splice(index, 1)[0];
        guardarDatosEnLocalStorage();
        mostrarAlerta(`Usuario "${usuarioEliminado.nombre}" eliminado correctamente`, 'success');
        mostrarUsuarios();
        actualizarEstadisticasDashboard();
    } else {
        mostrarAlerta('Error: Usuario no encontrado', 'danger');
    }
}

// SISTEMA DE MENÚ PÚBLICO MEJORADO - CORREGIDO
function mostrarMenuPublico() {
    isPublicMenuVisible = true;
    console.log('🔍 Menú público activado - Sincronización ACTIVA');
    actualizarMenuPublico();
}

function actualizarMenuPublico() {
    const container = document.getElementById('publicMenuContainer');
    if (!container) {
        console.log('❌ Contenedor del menú público no encontrado');
        return;
    }

    console.log('🎯 Actualizando menú público...');
    container.innerHTML = '';

    const productosActivos = products.filter(p => p.estado === 'activo');
    console.log(`📦 Productos activos encontrados: ${productosActivos.length}`);

    if (productosActivos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state text-center py-5">
                    <i class="fas fa-concierge-bell fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No hay productos disponibles</h4>
                    <p class="text-muted">Agrega productos activos para que aparezcan en el menú público.</p>
                    <button class="btn btn-primary mt-3" onclick="abrirModalProducto()">
                        <i class="fas fa-plus"></i> Agregar Primer Producto
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // Agrupar por categorías
    const productosPorCategoria = {};
    productosActivos.forEach(producto => {
        if (!productosPorCategoria[producto.categoria]) {
            productosPorCategoria[producto.categoria] = [];
        }
        productosPorCategoria[producto.categoria].push(producto);
    });

    console.log('🏷️ Categorías encontradas:', Object.keys(productosPorCategoria));

    // Mostrar por categorías
    Object.keys(productosPorCategoria).forEach(categoria => {
        const productosCategoria = productosPorCategoria[categoria];
        
        // Título de categoría
        const categoriaTitle = document.createElement('div');
        categoriaTitle.className = 'col-12 mb-4';
        categoriaTitle.innerHTML = `
            <div class="categoria-header">
                <h4 class="text-capitalize mb-3">
                    <i class="fas ${getCategoriaIcon(categoria)} me-2"></i>
                    ${categoria}
                    <span class="badge bg-secondary ms-2">${productosCategoria.length}</span>
                </h4>
                <hr>
            </div>
        `;
        container.appendChild(categoriaTitle);

        // Productos de la categoría
        productosCategoria.forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            col.innerHTML = `
                <div class="card product-card h-100 shadow-sm">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}"
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text flex-grow-1 text-muted">${producto.descripcion || 'Descripción no disponible'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="h5 mb-0 text-primary">S/ ${producto.precio.toFixed(2)}</span>
                            <span class="badge bg-secondary text-capitalize">${producto.categoria}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    });

    console.log('✅ Menú público actualizado correctamente');
}

function getCategoriaIcon(categoria) {
    const icons = {
        'pollos': 'fa-drumstick-bite',
        'parrillas': 'fa-fire',
        'chicharron': 'fa-bacon',
        'broaster': 'fa-utensils',
        'hamburguesas': 'fa-hamburger',
        'criollos': 'fa-flag',
        'combos': 'fa-gift'
    };
    return icons[categoria] || 'fa-utensils';
}

// Función para mostrar modal de confirmación
function mostrarConfirmacion(mensaje, accionConfirmar) {
    const modalBody = document.getElementById('confirmModalBody');
    const confirmBtn = document.getElementById('confirmActionBtn');

    if (!modalBody || !confirmBtn) {
        console.error('❌ Elementos del modal de confirmación no encontrados');
        return;
    }

    modalBody.textContent = mensaje;

    const nuevoConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(nuevoConfirmBtn, confirmBtn);

    document.getElementById('confirmActionBtn').addEventListener('click', function () {
        accionConfirmar();
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
    });

    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

// INICIALIZACIÓN MEJORADA
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando Luren Chicken Admin Dashboard...');
    
    // Cargar datos persistentes
    cargarDatosDesdeLocalStorage();
    
    // Configurar sistema de eventos para sincronización
    EventSystem.on('menuChanged', (data) => {
        console.log('📢 Evento de cambio en menú recibido:', data);
        if (isPublicMenuVisible) {
            console.log('🔄 Actualizando menú público por evento...');
            setTimeout(() => {
                actualizarMenuPublico();
            }, 50);
        }
    });

    // Inicializar datos
    cargarDatosEnCero();
    cargarProductos();
    cargarUsuarios();
    actualizarEstadisticasDashboard();

    // Eventos del dashboard
    const refreshSalesBtn = document.getElementById('refreshSales');
    if (refreshSalesBtn) {
        refreshSalesBtn.addEventListener('click', function () {
            cargarEstadisticas();
            mostrarAlerta('Datos actualizados correctamente', 'info');
        });
    }

    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', actualizarPeriodoGrafico);
    }

    // Eventos para exportación
    const exportPDF = document.getElementById('exportPDF');
    if (exportPDF) {
        exportPDF.addEventListener('click', function (e) {
            e.preventDefault();
            exportarVentasPDF();
        });
    }

    const exportExcel = document.getElementById('exportExcel');
    if (exportExcel) {
        exportExcel.addEventListener('click', function (e) {
            e.preventDefault();
            exportarVentasExcel();
        });
    }

    // Auto-actualización
    setInterval(cargarEstadisticas, 120000);

    // Toggle sidebar
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const app = document.getElementById('app');
    if (toggleSidebarBtn && app) {
        toggleSidebarBtn.addEventListener('click', function () {
            app.classList.toggle('collapsed');
        });
    }

    // Navigation between sections - MEJORADO
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const sectionContents = document.querySelectorAll('.section-content');
    const sectionTitle = document.getElementById('sectionTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('data-section')) {
                e.preventDefault();

                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');

                sectionContents.forEach(section => section.classList.add('d-none'));

                const sectionId = this.getAttribute('data-section') + '-section';
                const selectedSection = document.getElementById(sectionId);
                if (selectedSection) {
                    selectedSection.classList.remove('d-none');
                    const linkText = this.querySelector('span').textContent;
                    if (sectionTitle) {
                        sectionTitle.textContent = linkText;
                    }

                    // Control de visibilidad del menú público - MEJORADO
                    if (sectionId === 'public-menu-section') {
                        isPublicMenuVisible = true;
                        console.log('🎯 Navegando al menú público - Actualizando...');
                        setTimeout(() => {
                            mostrarMenuPublico();
                        }, 100);
                    } else {
                        isPublicMenuVisible = false;
                        console.log('👁️ Saliendo del menú público');
                    }

                    // Cargar datos específicos
                    if (sectionId === 'menu-section') {
                        cargarProductos();
                    } else if (sectionId === 'users-section') {
                        cargarUsuarios();
                    }
                }
            }
        });
    });

    // Eventos para gestión de productos
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => abrirModalProducto());
    }

    const addFirstProductBtn = document.getElementById('addFirstProductBtn');
    if (addFirstProductBtn) {
        addFirstProductBtn.addEventListener('click', () => abrirModalProducto());
    }

    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', guardarProducto);
    }

    // Eventos para búsqueda y filtros de productos
    const searchProducts = document.getElementById('searchProducts');
    if (searchProducts) {
        searchProducts.addEventListener('input', mostrarProductos);
    }

    const searchProductsBtn = document.getElementById('searchProductsBtn');
    if (searchProductsBtn) {
        searchProductsBtn.addEventListener('click', mostrarProductos);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', mostrarProductos);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', mostrarProductos);
    }

    // Eventos para gestión de usuarios
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => abrirModalUsuario());
    }

    const addFirstUserBtn = document.getElementById('addFirstUserBtn');
    if (addFirstUserBtn) {
        addFirstUserBtn.addEventListener('click', () => abrirModalUsuario());
    }

    const saveUserBtn = document.getElementById('saveUserBtn');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', guardarUsuario);
    }

    // Eventos para búsqueda y filtros de usuarios
    const searchUsers = document.getElementById('searchUsers');
    if (searchUsers) {
        searchUsers.addEventListener('input', mostrarUsuarios);
    }

    const searchUsersBtn = document.getElementById('searchUsersBtn');
    if (searchUsersBtn) {
        searchUsersBtn.addEventListener('click', mostrarUsuarios);
    }

    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', mostrarUsuarios);
    }

    const userStatusFilter = document.getElementById('userStatusFilter');
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', mostrarUsuarios);
    }

    // Evento para actualizar menú público
    const refreshPublicMenu = document.getElementById('refreshPublicMenu');
    if (refreshPublicMenu) {
        refreshPublicMenu.addEventListener('click', function() {
            mostrarMenuPublico();
            mostrarAlerta('Menú público actualizado', 'success');
        });
    }

    // Eventos delegados para acciones en tablas - MEJORADO
    document.addEventListener('click', function (e) {
        // Editar producto
        if (e.target.closest('.edit-product')) {
            const btn = e.target.closest('.edit-product');
            const id = parseInt(btn.getAttribute('data-id'));
            const producto = products.find(p => p.id === id);
            if (producto) {
                console.log(`✏️ Editando producto: ${producto.nombre}`);
                abrirModalProducto(producto);
            }
        }

        // Eliminar producto
        if (e.target.closest('.delete-product')) {
            const btn = e.target.closest('.delete-product');
            const id = parseInt(btn.getAttribute('data-id'));
            const producto = products.find(p => p.id === id);
            if (producto) {
                console.log(`🗑️ Solicitando eliminación de: ${producto.nombre}`);
                mostrarConfirmacion(
                    `¿Está seguro de que desea eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
                    () => eliminarProducto(id)
                );
            }
        }

        // Editar usuario
        if (e.target.closest('.edit-user')) {
            const btn = e.target.closest('.edit-user');
            const id = parseInt(btn.getAttribute('data-id'));
            const usuario = users.find(u => u.id === id);
            if (usuario) abrirModalUsuario(usuario);
        }

        // Eliminar usuario
        if (e.target.closest('.delete-user')) {
            const btn = e.target.closest('.delete-user');
            const id = parseInt(btn.getAttribute('data-id'));
            const usuario = users.find(u => u.id === id);
            if (usuario) {
                mostrarConfirmacion(
                    `¿Está seguro de que desea eliminar al usuario "${usuario.nombre}"?`,
                    () => eliminarUsuario(id)
                );
            }
        }
    });

    // Vista previa de imagen
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.addEventListener('change', function (e) {
            const file = e.target.files[0];
            const preview = document.getElementById('imagePreview');

            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    mostrarAlerta('La imagen debe ser menor a 2MB', 'warning');
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                    preview.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            } else {
                preview.classList.add('d-none');
            }
        });
    }

    // Guardar datos antes de cerrar sesión o recargar - MEJORADO
    window.addEventListener('beforeunload', function() {
        console.log('💾 Guardando datos antes de salir...');
        guardarDatosEnLocalStorage();
    });

    // Guardar datos periódicamente
    setInterval(guardarDatosEnLocalStorage, 30000);

    console.log('✅ Dashboard Luren Chicken inicializado correctamente');
    console.log('🔄 Sistema de sincronización en tiempo real ACTIVADO');
    console.log('💾 Sistema de persistencia ACTIVADO');
});

// Simulación de endpoints API
window.fetch = window.fetch || function (url, options) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (url === '/api/estadisticas/dashboard') {
                resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        totalProductos: products.filter(p => p.estado === 'activo').length,
                        totalUsuarios: users.length,
                        pedidosHoy: 12,
                        ingresosHoy: 450.50,
                        ventasMesTotal: 12500.75,
                        promedioDiario: 416.69,
                        ventaMaxima: 850.00,
                        totalPedidos: 156,
                        graficoVentas: {
                            labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
                            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000) + 200)
                        },
                        ventasRecientes: [
                            {
                                id: 1001,
                                cliente: "Juan Pérez",
                                cantidadProductos: 3,
                                total: 125.50,
                                fecha: new Date().toISOString(),
                                estado: "completado",
                                tipo: "Delivery",
                                cajero: "María García"
                            }
                        ]
                    })
                });
            }
            resolve({ ok: false, status: 500 });
        }, 1000);
    });
};