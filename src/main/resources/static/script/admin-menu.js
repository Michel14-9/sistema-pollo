// Variables globales
let salesChart = null;
let currentEditingId = null;
let products = [];
let users = [];
let sales = [];

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

// Funciones para persistencia de datos en localStorage
function guardarDatosEnLocalStorage() {
    localStorage.setItem('lurenProducts', JSON.stringify(products));
    localStorage.setItem('lurenUsers', JSON.stringify(users));
    console.log('Datos guardados en localStorage');
}

function cargarDatosDesdeLocalStorage() {
    const productosGuardados = localStorage.getItem('lurenProducts');
    const usuariosGuardados = localStorage.getItem('lurenUsers');

    if (productosGuardados) {
        products = JSON.parse(productosGuardados);
    } else {
        // Datos de ejemplo si no hay nada en localStorage
        products = [
            {
                id: 1,
                nombre: "Pollo a la Brasa",
                categoria: "pollos",
                precio: 35.00,
                descripcion: "Delicioso pollo a la brasa con papas fritas y ensalada",
                imagen: "https://via.placeholder.com/300x200?text=Pollo+Brasa",
                estado: "activo"
            },
            {
                id: 2,
                nombre: "Parrilla Familiar",
                categoria: "parrillas",
                precio: 85.00,
                descripcion: "Parrilla completa para 4 personas con carnes variadas",
                imagen: "https://via.placeholder.com/300x200?text=Parrilla",
                estado: "activo"
            }
        ];
    }

    if (usuariosGuardados) {
        users = JSON.parse(usuariosGuardados);
    } else {
        // Datos de ejemplo si no hay nada en localStorage
        users = [
            {
                id: 1,
                nombre: "Administrador Principal",
                email: "admin@lurenchicken.com",
                rol: "admin",
                estado: "activo",
                fechaRegistro: "2023-01-15"
            },
            {
                id: 2,
                nombre: "Carlos Rodríguez",
                email: "carlos@lurenchicken.com",
                rol: "cajero",
                estado: "activo",
                fechaRegistro: "2023-02-20"
            }
        ];
    }

    console.log('Datos cargados desde localStorage:', {
        productos: products.length,
        usuarios: users.length
    });
}

// Función para mostrar alertas dinámicas
function mostrarAlerta(mensaje, tipo = 'success') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    const dynamicAlerts = document.getElementById('dynamicAlerts');
    dynamicAlerts.appendChild(alerta);

    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Función para actualizar estadísticas del dashboard
function actualizarEstadisticasDashboard() {
    // Actualizar contador de productos activos
    const productosActivos = products.filter(p => p.estado === 'activo').length;
    document.getElementById('totalProductos').textContent = productosActivos;

    // Actualizar contador de usuarios
    document.getElementById('totalUsuarios').textContent = users.length;

    console.log('Estadísticas actualizadas:', {
        productos: productosActivos,
        usuarios: users.length
    });
}

// Función para cargar estadísticas desde la base de datos PostgreSQL
async function cargarEstadisticas() {
    try {
        // Simular llamada a la API para obtener estadísticas
        const response = await fetch('/api/estadisticas/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.getElementById('csrfToken').value
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();

        // Actualizar estadísticas principales
        actualizarEstadisticasPrincipales(data);

        // Cargar gráficos
        cargarGraficos(data);

        // Cargar ventas recientes
        cargarVentasRecientes(data.ventasRecientes);

    } catch (error) {
        console.error('Error:', error);
        // Cargar datos en cero (sin ventas)
        cargarDatosEnCero();
    }
}

// Función para cargar datos en cero (sin ventas)
function cargarDatosEnCero() {
    const datosEnCero = {
        totalProductos: 0,
        totalUsuarios: 0,
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
    // Usar datos reales de productos y usuarios
    const productosActivos = products.filter(p => p.estado === 'activo').length;

    document.getElementById('totalProductos').textContent = productosActivos;
    document.getElementById('totalUsuarios').textContent = users.length;
    document.getElementById('pedidosHoy').textContent = data.pedidosHoy || '0';
    document.getElementById('ingresosHoy').textContent = `S/ ${(data.ingresosHoy || 0).toFixed(2)}`;

    // Actualizar resumen de ventas
    document.getElementById('ventasMesTotal').textContent = `S/ ${(data.ventasMesTotal || 0).toFixed(2)}`;
    document.getElementById('promedioDiario').textContent = `S/ ${(data.promedioDiario || 0).toFixed(2)}`;
    document.getElementById('ventaMaxima').textContent = `S/ ${(data.ventaMaxima || 0).toFixed(2)}`;
    document.getElementById('totalPedidos').textContent = data.totalPedidos || '0';
}

// Función para cargar gráficos
function cargarGraficos(data) {
    const salesCtx = document.getElementById('salesChart');
    const emptyChartMessage = document.getElementById('emptyChartMessage');

    // Verificar si hay datos para mostrar
    const tieneDatos = data.graficoVentas && data.graficoVentas.data.some(valor => valor > 0);

    if (!tieneDatos) {
        // Mostrar mensaje de gráfico vacío
        if (salesChart) {
            salesChart.destroy();
            salesChart = null;
        }
        salesCtx.style.display = 'none';
        emptyChartMessage.classList.remove('d-none');
        return;
    }

    // Mostrar gráfico y ocultar mensaje
    salesCtx.style.display = 'block';
    emptyChartMessage.classList.add('d-none');

    // Destruir gráfico anterior si existe
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
                legend: {
                    display: true
                },
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

    // Guardar ventas en variable global para exportación
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

        // Formatear fecha
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
                <td>
                    <small>${venta.cantidadProductos || 0} productos</small>
                </td>
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
        // Simular llamada a la API para obtener datos del período seleccionado
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

// Funciones para gestión de productos
function cargarProductos() {
    mostrarProductos();
}

function mostrarProductos() {
    const tbody = document.getElementById('productsTableBody');
    const noProductsMessage = document.getElementById('noProductsMessage');

    tbody.innerHTML = '';

    if (products.length === 0) {
        noProductsMessage.classList.remove('d-none');
        tbody.parentElement.parentElement.classList.add('d-none');
        return;
    }

    noProductsMessage.classList.add('d-none');
    tbody.parentElement.parentElement.classList.remove('d-none');

    // Aplicar filtros
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

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
                    <img src="${product.imagen}" alt="${product.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                </td>
                <td>${product.nombre}</td>
                <td>${product.categoria}</td>
                <td>S/ ${product.precio.toFixed(2)}</td>
                <td><span class="badge ${estadoClass}">${estadoText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

function abrirModalProducto(producto = null) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('productModalLabel');
    const imagePreview = document.getElementById('imagePreview');

    form.reset();
    imagePreview.classList.add('d-none');

    if (producto) {
        // Modo edición
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
        // Modo agregar
        modalTitle.textContent = 'Agregar Producto';
        currentEditingId = null;
    }

    modal.show();
}

function guardarProducto() {
    // Generar ID único para nuevo producto
    const nuevoId = currentEditingId || Math.max(...products.map(p => p.id), 0) + 1;

    const productoData = {
        id: nuevoId,
        nombre: document.getElementById('productName').value,
        categoria: document.getElementById('productCategory').value,
        precio: parseFloat(document.getElementById('productPrice').value),
        descripcion: document.getElementById('productDescription').value,
        estado: document.getElementById('productStatus').value,
        imagen: document.getElementById('imagePreview').src || "https://via.placeholder.com/300x200?text=Producto"
    };

    try {
        if (currentEditingId) {
            // Actualizar producto existente
            const index = products.findIndex(p => p.id === currentEditingId);
            if (index !== -1) {
                products[index] = { ...products[index], ...productoData };
            }
        } else {
            // Agregar nuevo producto
            products.push(productoData);
        }

        // Guardar en localStorage
        guardarDatosEnLocalStorage();

        mostrarAlerta(`Producto ${currentEditingId ? 'actualizado' : 'agregado'} correctamente`, 'success');

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();

        // Recargar productos
        mostrarProductos();

        // Actualizar dashboard y menú público
        actualizarEstadisticasDashboard();
        if (!document.getElementById('public-menu-section').classList.contains('d-none')) {
            mostrarMenuPublico();
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar el producto', 'danger');
    }
}

// Función para eliminar producto
function eliminarProducto(id) {
    // Encontrar el índice del producto a eliminar
    const index = products.findIndex(p => p.id === id);

    if (index !== -1) {
        // Eliminar el producto del array
        products.splice(index, 1);

        // Guardar en localStorage
        guardarDatosEnLocalStorage();

        // Mostrar alerta de éxito
        mostrarAlerta('Producto eliminado correctamente', 'success');

        // Actualizar la vista de productos
        mostrarProductos();

        // Actualizar dashboard
        actualizarEstadisticasDashboard();

        // Actualizar el menú público si está visible
        if (!document.getElementById('public-menu-section').classList.contains('d-none')) {
            mostrarMenuPublico();
        }
    } else {
        mostrarAlerta('Error: Producto no encontrado', 'danger');
    }
}

// Funciones para gestión de usuarios
function cargarUsuarios() {
    mostrarUsuarios();
}

function mostrarUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');

    tbody.innerHTML = '';

    if (users.length === 0) {
        noUsersMessage.classList.remove('d-none');
        tbody.parentElement.parentElement.classList.add('d-none');
        return;
    }

    noUsersMessage.classList.add('d-none');
    tbody.parentElement.parentElement.classList.remove('d-none');

    // Aplicar filtros
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;

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

        // Generar avatar con iniciales
        const iniciales = user.nombre.split(' ').map(n => n[0]).join('').toUpperCase();

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

    form.reset();

    if (usuario) {
        // Modo edición
        modalTitle.textContent = 'Editar Usuario';
        document.getElementById('userId').value = usuario.id;
        document.getElementById('userName').value = usuario.nombre;
        document.getElementById('userEmail').value = usuario.email;
        document.getElementById('userRole').value = usuario.rol;
        document.getElementById('userStatus').value = usuario.estado;

        // Ocultar campo de contraseña en edición
        passwordField.style.display = 'none';

        currentEditingId = usuario.id;
    } else {
        // Modo agregar
        modalTitle.textContent = 'Agregar Usuario';
        passwordField.style.display = 'block';
        document.getElementById('userPassword').required = true;
        currentEditingId = null;
    }

    modal.show();
}

function guardarUsuario() {
    // Generar ID único para nuevo usuario
    const nuevoId = currentEditingId || Math.max(...users.map(u => u.id), 0) + 1;

    const usuarioData = {
        id: nuevoId,
        nombre: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        rol: document.getElementById('userRole').value,
        estado: document.getElementById('userStatus').value,
        fechaRegistro: currentEditingId ? users.find(u => u.id === currentEditingId).fechaRegistro : new Date().toISOString().split('T')[0]
    };

    try {
        if (currentEditingId) {
            // Actualizar usuario existente
            const index = users.findIndex(u => u.id === currentEditingId);
            if (index !== -1) {
                users[index] = { ...users[index], ...usuarioData };
            }
        } else {
            // Agregar nuevo usuario
            users.push(usuarioData);
        }

        // Guardar en localStorage
        guardarDatosEnLocalStorage();

        mostrarAlerta(`Usuario ${currentEditingId ? 'actualizado' : 'agregado'} correctamente`, 'success');

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();

        // Recargar usuarios
        mostrarUsuarios();

        // Actualizar dashboard
        actualizarEstadisticasDashboard();

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar el usuario', 'danger');
    }
}

// Función para eliminar usuario
function eliminarUsuario(id) {
    // Encontrar el índice del usuario a eliminar
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
        // Eliminar el usuario del array
        users.splice(index, 1);

        // Guardar en localStorage
        guardarDatosEnLocalStorage();

        // Mostrar alerta de éxito
        mostrarAlerta('Usuario eliminado correctamente', 'success');

        // Actualizar la vista de usuarios
        mostrarUsuarios();

        // Actualizar dashboard
        actualizarEstadisticasDashboard();
    } else {
        mostrarAlerta('Error: Usuario no encontrado', 'danger');
    }
}

// Función para mostrar menú público
function mostrarMenuPublico() {
    const container = document.getElementById('publicMenuContainer');
    container.innerHTML = '';

    const productosActivos = products.filter(p => p.estado === 'activo');

    if (productosActivos.length === 0) {
        container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-concierge-bell"></i>
                        <h4>No hay productos disponibles</h4>
                        <p>Agrega productos activos para que aparezcan en el menú público.</p>
                    </div>
                </div>
            `;
        return;
    }

    productosActivos.forEach(producto => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';

        col.innerHTML = `
                <div class="card product-card h-100">
                    <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text flex-grow-1">${producto.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <span class="h5 mb-0 text-primary">S/ ${producto.precio.toFixed(2)}</span>
                            <span class="badge bg-secondary">${producto.categoria}</span>
                        </div>
                    </div>
                </div>
            `;

        container.appendChild(col);
    });
}

// Función para mostrar modal de confirmación
function mostrarConfirmacion(mensaje, accionConfirmar) {
    const modalBody = document.getElementById('confirmModalBody');
    const confirmBtn = document.getElementById('confirmActionBtn');

    modalBody.textContent = mensaje;

    // Remover event listeners anteriores
    const nuevoConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(nuevoConfirmBtn, confirmBtn);

    // Agregar nuevo event listener
    document.getElementById('confirmActionBtn').addEventListener('click', function () {
        accionConfirmar();
        bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
    });

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    // Cargar datos desde localStorage al iniciar
    cargarDatosDesdeLocalStorage();

    // Cargar datos iniciales
    cargarDatosEnCero();
    cargarProductos();
    cargarUsuarios();

    // Actualizar estadísticas del dashboard con datos reales
    actualizarEstadisticasDashboard();

    // Configurar eventos del dashboard
    document.getElementById('refreshSales').addEventListener('click', function () {
        cargarEstadisticas();
        mostrarAlerta('Datos actualizados', 'info');
    });

    document.getElementById('chartPeriod').addEventListener('change', actualizarPeriodoGrafico);

    // Eventos para exportación
    document.getElementById('exportPDF').addEventListener('click', function (e) {
        e.preventDefault();
        exportarVentasPDF();
    });

    document.getElementById('exportExcel').addEventListener('click', function (e) {
        e.preventDefault();
        exportarVentasExcel();
    });

    // Configurar auto-actualización cada 2 minutos
    setInterval(cargarEstadisticas, 120000);

    // Toggle sidebar
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const app = document.getElementById('app');

    if (toggleSidebarBtn && app) {
        toggleSidebarBtn.addEventListener('click', function () {
            app.classList.toggle('collapsed');
        });
    }

    // Navigation between sections
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const sectionContents = document.querySelectorAll('.section-content');
    const sectionTitle = document.getElementById('sectionTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('data-section')) {
                e.preventDefault();

                // Remove active class from all links
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });

                // Add active class to clicked link
                this.classList.add('active');

                // Hide all sections
                sectionContents.forEach(section => {
                    section.classList.add('d-none');
                });

                // Show selected section
                const sectionId = this.getAttribute('data-section') + '-section';
                const selectedSection = document.getElementById(sectionId);
                if (selectedSection) {
                    selectedSection.classList.remove('d-none');

                    // Update section title
                    const linkText = this.querySelector('span').textContent;
                    sectionTitle.textContent = linkText;

                    // Cargar datos específicos de la sección
                    if (sectionId === 'menu-section') {
                        cargarProductos();
                    } else if (sectionId === 'users-section') {
                        cargarUsuarios();
                    } else if (sectionId === 'public-menu-section') {
                        mostrarMenuPublico();
                    }
                }
            }
        });
    });

    // Eventos para gestión de productos
    document.getElementById('addProductBtn').addEventListener('click', () => abrirModalProducto());
    document.getElementById('addFirstProductBtn').addEventListener('click', () => abrirModalProducto());
    document.getElementById('saveProductBtn').addEventListener('click', guardarProducto);

    // Eventos para búsqueda y filtros de productos
    document.getElementById('searchProducts').addEventListener('input', mostrarProductos);
    document.getElementById('searchProductsBtn').addEventListener('click', mostrarProductos);
    document.getElementById('categoryFilter').addEventListener('change', mostrarProductos);
    document.getElementById('statusFilter').addEventListener('change', mostrarProductos);

    // Eventos para gestión de usuarios
    document.getElementById('addUserBtn').addEventListener('click', () => abrirModalUsuario());
    document.getElementById('addFirstUserBtn').addEventListener('click', () => abrirModalUsuario());
    document.getElementById('saveUserBtn').addEventListener('click', guardarUsuario);

    // Eventos para búsqueda y filtros de usuarios
    document.getElementById('searchUsers').addEventListener('input', mostrarUsuarios);
    document.getElementById('searchUsersBtn').addEventListener('click', mostrarUsuarios);
    document.getElementById('roleFilter').addEventListener('change', mostrarUsuarios);
    document.getElementById('userStatusFilter').addEventListener('change', mostrarUsuarios);

    // Evento para actualizar menú público
    document.getElementById('refreshPublicMenu').addEventListener('click', mostrarMenuPublico);

    // Eventos delegados para acciones en tablas
    document.addEventListener('click', function (e) {
        // Editar producto
        if (e.target.closest('.edit-product')) {
            const id = parseInt(e.target.closest('.edit-product').getAttribute('data-id'));
            const producto = products.find(p => p.id === id);
            if (producto) abrirModalProducto(producto);
        }

        // Eliminar producto
        if (e.target.closest('.delete-product')) {
            const id = parseInt(e.target.closest('.delete-product').getAttribute('data-id'));
            const producto = products.find(p => p.id === id);
            if (producto) {
                mostrarConfirmacion(
                    `¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`,
                    () => eliminarProducto(id)
                );
            }
        }

        // Editar usuario
        if (e.target.closest('.edit-user')) {
            const id = parseInt(e.target.closest('.edit-user').getAttribute('data-id'));
            const usuario = users.find(u => u.id === id);
            if (usuario) abrirModalUsuario(usuario);
        }

        // Eliminar usuario
        if (e.target.closest('.delete-user')) {
            const id = parseInt(e.target.closest('.delete-user').getAttribute('data-id'));
            const usuario = users.find(u => u.id === id);
            if (usuario) {
                mostrarConfirmacion(
                    `¿Está seguro de que desea eliminar al usuario "${usuario.nombre}"?`,
                    () => eliminarUsuario(id)
                );
            }
        }
    });

    // Vista previa de imagen en formulario de producto
    document.getElementById('productImage').addEventListener('change', function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');

        if (file) {
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

    console.log('Dashboard Luren Chicken - Inicializado correctamente con todas las funcionalidades');
});

// Simulación de endpoints API para PostgreSQL
window.fetch = window.fetch || function (url, options) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simular respuesta de la base de datos PostgreSQL
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
                            },
                            {
                                id: 1002,
                                cliente: "Ana López",
                                cantidadProductos: 2,
                                total: 85.00,
                                fecha: new Date(Date.now() - 3600000).toISOString(),
                                estado: "proceso",
                                tipo: "Local",
                                cajero: "Carlos Rodríguez"
                            },
                            {
                                id: 1003,
                                cliente: "Roberto Silva",
                                cantidadProductos: 5,
                                total: 210.75,
                                fecha: new Date(Date.now() - 7200000).toISOString(),
                                estado: "completado",
                                tipo: "Delivery",
                                cajero: "María García"
                            }
                        ]
                    })
                });
            }

            // Para otras URLs, simular error
            resolve({
                ok: false,
                status: 500
            });
        }, 1000);
    });
};