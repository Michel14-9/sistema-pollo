// Base de datos simulada en localStorage
let productos = JSON.parse(localStorage.getItem('productos')) || [
    {
        id: 1,
        nombre: "Pollo a la Brasa Familiar",
        tipo: "Pollos",
        descripcion: "Pollo entero con papas fritas y ensalada fresca",
        precio: 42.00,
        imagenUrl: "/imagenes/pollo-brasa.jpg",
        activo: true
    },
    {
        id: 2,
        nombre: "Combo Familiar",
        tipo: "Combos",
        descripcion: "2 pollos + papas + ensalada + 4 gaseosas",
        precio: 85.00,
        imagenUrl: "/imagenes/combo-familiar.jpg",
        activo: true
    },
    {
        id: 3,
        nombre: "Chicharrón Especial",
        tipo: "Chicharrón",
        descripcion: "Chicharrón crocante con yuca y salsa criolla",
        precio: 35.00,
        imagenUrl: "/imagenes/chicharron.jpg",
        activo: true
    },
    {
        id: 4,
        nombre: "Hamburguesa Clásica",
        tipo: "Hamburguesas",
        descripcion: "Hamburguesa con carne, queso, lechuga y tomate",
        precio: 18.00,
        imagenUrl: "/imagenes/hamburguesa.jpg",
        activo: true
    },
    {
        id: 5,
        nombre: "Parrilla Mixta",
        tipo: "Parrillas",
        descripcion: "Carne, pollo y chorizo a la parrilla",
        precio: 65.00,
        imagenUrl: "/imagenes/parrilla.jpg",
        activo: true
    }
];

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [
    {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan.perez@example.com",
        rol: "admin",
        estado: "active",
        fechaRegistro: "15/03/2023"
    },
    {
        id: 2,
        nombre: "María García",
        email: "maria.garcia@example.com",
        rol: "user",
        estado: "active",
        fechaRegistro: "22/04/2023"
    },
    {
        id: 3,
        nombre: "Carlos López",
        email: "carlos.lopez@example.com",
        rol: "user",
        estado: "inactive",
        fechaRegistro: "05/05/2023"
    },
    {
        id: 4,
        nombre: "Ana Martínez",
        email: "ana.martinez@example.com",
        rol: "moderator",
        estado: "active",
        fechaRegistro: "12/06/2023"
    }
];

let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [
    {
        id: "ORD-00125",
        cliente: "Juan Pérez",
        productos: "Pollo a la Brasa (2)",
        total: 52.00,
        estado: "completado",
        fecha: "2024-01-15"
    },
    {
        id: "ORD-00124",
        cliente: "María García",
        productos: "Combo Familiar",
        total: 85.00,
        estado: "proceso",
        fecha: "2024-01-15"
    },
    {
        id: "ORD-00123",
        cliente: "Carlos López",
        productos: "Chicharrón (1), Gaseosa (2)",
        total: 38.00,
        estado: "completado",
        fecha: "2024-01-14"
    },
    {
        id: "ORD-00122",
        cliente: "Ana Martínez",
        productos: "Hamburguesa Clásica (2)",
        total: 36.00,
        estado: "pendiente",
        fecha: "2024-01-14"
    }
];

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Función para guardar datos en localStorage
function guardarDatos() {
    localStorage.setItem('productos', JSON.stringify(productos));
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    localStorage.setItem('carrito', JSON.stringify(carrito));
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

// Función para cargar el dashboard
function cargarDashboard() {
    // Actualizar estadísticas
    document.getElementById('totalProductos').textContent = productos.filter(p => p.activo).length;
    document.getElementById('totalUsuarios').textContent = usuarios.filter(u => u.estado === 'active').length;

    const pedidosHoy = pedidos.filter(p => p.fecha === new Date().toISOString().split('T')[0]).length;
    document.getElementById('pedidosHoy').textContent = pedidosHoy;

    const ingresosHoy = pedidos
        .filter(p => p.fecha === new Date().toISOString().split('T')[0] && p.estado === 'completado')
        .reduce((sum, p) => sum + p.total, 0);
    document.getElementById('ingresosHoy').textContent = `S/ ${ingresosHoy.toFixed(2)}`;

    // Cargar ventas recientes
    cargarVentasRecientes();

    // Cargar productos populares
    cargarProductosPopulares();
}

function cargarVentasRecientes() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    pedidos.slice(0, 5).forEach(pedido => {
        const tr = document.createElement('tr');
        const estadoClass = {
            'completado': 'bg-success',
            'proceso': 'bg-warning',
            'pendiente': 'bg-secondary'
        }[pedido.estado] || 'bg-secondary';

        const estadoText = {
            'completado': 'Completado',
            'proceso': 'En Proceso',
            'pendiente': 'Pendiente'
        }[pedido.estado] || 'Pendiente';

        tr.innerHTML = `
                <td>${pedido.id}</td>
                <td>${pedido.cliente}</td>
                <td>${pedido.productos}</td>
                <td>S/ ${pedido.total.toFixed(2)}</td>
                <td><span class="badge ${estadoClass}">${estadoText}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetallePedido('${pedido.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
        tbody.appendChild(tr);
    });
}

function cargarProductosPopulares() {
    const container = document.getElementById('productosPopulares');
    container.innerHTML = '';

    // Simular productos populares (en una app real esto vendría de estadísticas)
    const productosPopulares = productos.slice(0, 5).map((producto, index) => ({
        ...producto,
        ventas: Math.floor(Math.random() * 50) + 10
    })).sort((a, b) => b.ventas - a.ventas);

    productosPopulares.forEach(producto => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center fade-in';
        li.innerHTML = `
                <span>${producto.nombre}</span>
                <span class="badge bg-primary rounded-pill">${producto.ventas}</span>
            `;
        container.appendChild(li);
    });
}

// Funciones para la gestión del menú
function cargarMenuGestion() {
    const container = document.getElementById('productosContainer');
    const emptyMessage = document.getElementById('emptyProducts');

    container.innerHTML = '';

    const productosActivos = productos.filter(p => p.activo);

    if (productosActivos.length === 0) {
        emptyMessage.classList.remove('d-none');
        return;
    }

    emptyMessage.classList.add('d-none');

    productosActivos.forEach(producto => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4 producto-item fade-in';
        col.setAttribute('data-categoria', producto.tipo);
        col.setAttribute('data-nombre', producto.nombre.toLowerCase());

        col.innerHTML = `
                <div class="card h-100 product-card">
                    <img src="${producto.imagenUrl || '/imagenes/default-product.jpg'}" 
                         class="card-img-top" alt="${producto.nombre}" 
                         style="height: 200px; object-fit: cover;"
                         onerror="this.src='/imagenes/default-product.jpg'">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <span class="badge bg-primary categoria-badge">${producto.tipo}</span>
                        </div>
                        <p class="card-text text-muted small">${producto.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <strong class="text-success">S/ ${producto.precio.toFixed(2)}</strong>
                            <span class="badge bg-success">Disponible</span>
                        </div>
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm btn-editar" data-id="${producto.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-outline-danger btn-sm btn-eliminar"
                                    data-bs-toggle="modal"
                                    data-bs-target="#confirmDeleteModal"
                                    data-producto-id="${producto.id}"
                                    data-producto-nombre="${producto.nombre}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;

        container.appendChild(col);
    });

    configurarEventosProductos();
    actualizarResultadosFiltro();
}

function configurarEventosProductos() {
    // Eventos para editar productos
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.getAttribute('data-id');
            editarProducto(productId);
        });
    });

    // Eventos para eliminar productos
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.getAttribute('data-producto-id');
            const productName = this.getAttribute('data-producto-nombre');

            document.getElementById('productoNombreModal').textContent = productName;

            // Configurar el evento de eliminación
            document.getElementById('confirmDeleteBtn').onclick = function () {
                eliminarProducto(productId);
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
                modal.hide();
            };
        });
    });
}

function editarProducto(id) {
    const producto = productos.find(p => p.id == id);
    if (!producto) return;

    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = producto.id;
    document.getElementById('productName').value = producto.nombre;
    document.getElementById('productCategory').value = producto.tipo;
    document.getElementById('productPrice').value = producto.precio;
    document.getElementById('productDescription').value = producto.descripcion || '';
    document.getElementById('productImage').value = producto.imagenUrl || '';

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function eliminarProducto(id) {
    productos = productos.filter(p => p.id != id);
    guardarDatos();
    cargarMenuGestion();
    cargarDashboard();
    mostrarAlerta('Producto eliminado correctamente', 'success');
}

// Funciones para la gestión de usuarios
function cargarUsuarios() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="user-avatar me-2">${usuario.nombre.split(' ').map(n => n[0]).join('')}</div>
                        ${usuario.nombre}
                    </div>
                </td>
                <td>${usuario.email}</td>
                <td><span class="badge ${getBadgeClass(usuario.rol)}">${usuario.rol}</span></td>
                <td><span class="badge ${usuario.estado === 'active' ? 'bg-success' : 'bg-warning'}">${usuario.estado === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                <td>${usuario.fechaRegistro}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline-primary btn-edit-user" data-id="${usuario.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-user" 
                            data-bs-toggle="modal" 
                            data-bs-target="#deleteUserModal"
                            data-user-id="${usuario.id}"
                            data-user-name="${usuario.nombre}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        tbody.appendChild(tr);
    });

    configurarEventosUsuarios();
}

function getBadgeClass(rol) {
    switch (rol) {
        case 'admin': return 'bg-primary';
        case 'moderator': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function configurarEventosUsuarios() {
    // Editar usuario
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-id');
            const usuario = usuarios.find(u => u.id == userId);

            if (usuario) {
                document.getElementById('editUserId').value = usuario.id;
                document.getElementById('editUserName').value = usuario.nombre;
                document.getElementById('editUserEmail').value = usuario.email;
                document.getElementById('editUserRole').value = usuario.rol;
                document.getElementById('editUserStatus').value = usuario.estado;

                const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                modal.show();
            }
        });
    });

    // Eliminar usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');

            document.getElementById('userNameModal').textContent = userName;

            document.getElementById('confirmDeleteUserBtn').onclick = function () {
                usuarios = usuarios.filter(u => u.id != userId);
                guardarDatos();
                cargarUsuarios();
                cargarDashboard();

                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
                modal.hide();

                mostrarAlerta('Usuario eliminado correctamente', 'success');
            };
        });
    });
}

// Funciones para el menú público
function cargarMenuPublico() {
    const container = document.getElementById('public-menu-content');
    container.innerHTML = '';

    // Agrupar productos por categoría
    const productosPorCategoria = {};
    productos.forEach(producto => {
        if (producto.activo) {
            if (!productosPorCategoria[producto.tipo]) {
                productosPorCategoria[producto.tipo] = [];
            }
            productosPorCategoria[producto.tipo].push(producto);
        }
    });

    // Generar HTML para cada categoría
    Object.keys(productosPorCategoria).forEach(categoria => {
        const section = document.createElement('div');
        section.className = 'fade-in';
        section.innerHTML = `
                <h2 class="category-title" id="${categoria.toLowerCase()}">${categoria}</h2>
                <div class="row g-3 mb-5" id="row-${categoria.toLowerCase()}">
                    <!-- Los productos se insertarán aquí -->
                </div>
            `;
        container.appendChild(section);

        const row = document.getElementById(`row-${categoria.toLowerCase()}`);
        productosPorCategoria[categoria].forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col-md-4';
            col.innerHTML = `
                    <div class="card h-100 product-card">
                        <img src="${producto.imagenUrl || '/imagenes/default-product.jpg'}" 
                             class="card-img-top" alt="${producto.nombre}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='/imagenes/default-product.jpg'">
                        <div class="card-body">
                            <h5 class="card-title product-title">${producto.nombre}</h5>
                            <p class="card-text product-description">${producto.descripcion || 'Sin descripción'}</p>
                            <p class="fw-bold text-success price-current">S/ ${producto.precio.toFixed(2)}</p>
                            <button class="btn btn-primary w-100 agregar-carrito-btn" data-producto-id="${producto.id}">
                                <i class="fa-solid fa-cart-plus"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                `;
            row.appendChild(col);
        });
    });

    configurarEventosCarrito();
    configurarNavegacionCategorias();
}

function configurarEventosCarrito() {
    document.querySelectorAll('.agregar-carrito-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.getAttribute('data-producto-id');
            const producto = productos.find(p => p.id == productId);

            if (producto) {
                // Buscar si el producto ya está en el carrito
                const itemExistente = carrito.find(item => item.id == productId);

                if (itemExistente) {
                    itemExistente.cantidad += 1;
                } else {
                    carrito.push({
                        id: producto.id,
                        nombre: producto.nombre,
                        precio: producto.precio,
                        cantidad: 1,
                        imagen: producto.imagenUrl
                    });
                }

                guardarDatos();
                actualizarCarrito();
                mostrarAlerta(`${producto.nombre} agregado al carrito`, 'success');
            }
        });
    });
}

function actualizarCarrito() {
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('cartTotal').textContent = total.toFixed(2);
}

function configurarNavegacionCategorias() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Remover active de todos los tabs
            document.querySelectorAll('.category-tab').forEach(t => {
                t.classList.remove('active');
            });

            // Agregar active al tab clickeado
            this.classList.add('active');

            // Scroll a la categoría
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Funciones de filtrado
function configurarFiltros() {
    const searchInput = document.getElementById('searchInput');
    const categoriaFilter = document.getElementById('categoriaFilter');

    if (searchInput && categoriaFilter) {
        searchInput.addEventListener('input', filtrarProductos);
        categoriaFilter.addEventListener('change', filtrarProductos);
    }

    // Filtros de usuarios
    const userSearchInput = document.getElementById('userSearchInput');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');

    if (userSearchInput && userRoleFilter && userStatusFilter) {
        userSearchInput.addEventListener('input', filtrarUsuarios);
        userRoleFilter.addEventListener('change', filtrarUsuarios);
        userStatusFilter.addEventListener('change', filtrarUsuarios);
    }
}

function filtrarProductos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoriaSeleccionada = document.getElementById('categoriaFilter').value;
    const productosItems = document.querySelectorAll('.producto-item');

    let productosVisibles = 0;

    productosItems.forEach(item => {
        const nombre = item.getAttribute('data-nombre');
        const categoria = item.getAttribute('data-categoria');

        const coincideNombre = nombre.includes(searchTerm);
        const coincideCategoria = !categoriaSeleccionada || categoria === categoriaSeleccionada;

        if (coincideNombre && coincideCategoria) {
            item.style.display = 'block';
            productosVisibles++;
        } else {
            item.style.display = 'none';
        }
    });

    actualizarResultadosFiltro(productosVisibles);
}

function filtrarUsuarios() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const rolSeleccionado = document.getElementById('userRoleFilter').value;
    const estadoSeleccionado = document.getElementById('userStatusFilter').value;
    const filasUsuarios = document.querySelectorAll('#usersTableBody tr');

    filasUsuarios.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const rol = fila.cells[3].querySelector('.badge').textContent;
        const estado = fila.cells[4].querySelector('.badge').textContent.toLowerCase();

        const coincideNombre = nombre.includes(searchTerm);
        const coincideRol = !rolSeleccionado || rol === rolSeleccionado;
        const coincideEstado = !estadoSeleccionado ||
            (estadoSeleccionado === 'active' && estado === 'activo') ||
            (estadoSeleccionado === 'inactive' && estado === 'inactivo');

        if (coincideNombre && coincideRol && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

function actualizarResultadosFiltro(visibles = null) {
    const filterResults = document.getElementById('filterResults');
    if (!filterResults) return;

    if (visibles === null) {
        visibles = document.querySelectorAll('.producto-item[style="display: block"]').length;
    }

    const total = document.querySelectorAll('.producto-item').length;
    filterResults.textContent = `Mostrando ${visibles} de ${total} productos`;
}

// Función global para limpiar filtros
window.limpiarFiltros = function () {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoriaFilter').value = '';
    filtrarProductos();
};

// Funciones para los modales y formularios
function configurarFormularios() {
    // Guardar nuevo usuario
    document.getElementById('saveUserBtn').addEventListener('click', function () {
        const nombre = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const rol = document.getElementById('userRole').value;

        if (!nombre || !email || !password || !rol) {
            mostrarAlerta('Por favor complete todos los campos', 'danger');
            return;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre: nombre,
            email: email,
            rol: rol,
            estado: 'active',
            fechaRegistro: new Date().toLocaleDateString('es-PE')
        };

        usuarios.push(nuevoUsuario);
        guardarDatos();
        cargarUsuarios();
        cargarDashboard();

        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
        document.getElementById('addUserForm').reset();

        mostrarAlerta('Usuario agregado correctamente', 'success');
    });

    // Actualizar usuario
    document.getElementById('updateUserBtn').addEventListener('click', function () {
        const userId = document.getElementById('editUserId').value;
        const usuario = usuarios.find(u => u.id == userId);

        if (usuario) {
            usuario.nombre = document.getElementById('editUserName').value;
            usuario.email = document.getElementById('editUserEmail').value;
            usuario.rol = document.getElementById('editUserRole').value;
            usuario.estado = document.getElementById('editUserStatus').value;

            guardarDatos();
            cargarUsuarios();

            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();

            mostrarAlerta('Usuario actualizado correctamente', 'success');
        }
    });

    // Guardar producto
    document.getElementById('saveProductBtn').addEventListener('click', function () {
        const id = document.getElementById('productId').value;
        const nombre = document.getElementById('productName').value;
        const tipo = document.getElementById('productCategory').value;
        const precio = parseFloat(document.getElementById('productPrice').value);
        const descripcion = document.getElementById('productDescription').value;
        const imagenUrl = document.getElementById('productImage').value;

        if (!nombre || !tipo || !precio) {
            mostrarAlerta('Por favor complete los campos obligatorios', 'danger');
            return;
        }

        if (id) {
            // Editar producto existente
            const producto = productos.find(p => p.id == id);
            if (producto) {
                producto.nombre = nombre;
                producto.tipo = tipo;
                producto.precio = precio;
                producto.descripcion = descripcion;
                producto.imagenUrl = imagenUrl;
            }
        } else {
            // Agregar nuevo producto
            const nuevoProducto = {
                id: Date.now(),
                nombre: nombre,
                tipo: tipo,
                descripcion: descripcion,
                precio: precio,
                imagenUrl: imagenUrl,
                activo: true
            };
            productos.push(nuevoProducto);
        }

        guardarDatos();
        cargarMenuGestion();
        cargarDashboard();

        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        document.getElementById('productForm').reset();

        mostrarAlerta(`Producto ${id ? 'actualizado' : 'agregado'} correctamente`, 'success');
    });

    // Botón para agregar producto
    document.getElementById('addProductBtn').addEventListener('click', function () {
        document.getElementById('productModalTitle').textContent = 'Agregar Producto';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    });

    document.getElementById('addFirstProductBtn').addEventListener('click', function () {
        document.getElementById('productModalTitle').textContent = 'Agregar Producto';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    });
}

// Funciones de utilidad
window.verDetallePedido = function (pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
        alert(`Detalles del Pedido:\n\nID: ${pedido.id}\nCliente: ${pedido.cliente}\nProductos: ${pedido.productos}\nTotal: S/ ${pedido.total.toFixed(2)}\nEstado: ${pedido.estado}\nFecha: ${pedido.fecha}`);
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    // Guardar datos iniciales si no existen
    guardarDatos();

    // Cargar datos iniciales
    cargarDashboard();
    cargarMenuGestion();
    cargarUsuarios();

    // Configurar eventos
    configurarFiltros();
    configurarFormularios();

    // Toggle sidebar
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const app = document.getElementById('app');

    toggleSidebarBtn.addEventListener('click', function () {
        app.classList.toggle('collapsed');
    });

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
                    if (sectionId === 'public-menu-section') {
                        cargarMenuPublico();
                    }
                }
            }
        });
    });

    // Botones de actualización
    document.getElementById('refreshSales').addEventListener('click', cargarVentasRecientes);
    document.getElementById('refreshPopular').addEventListener('click', cargarProductosPopulares);

    console.log('Dashboard cargado correctamente');
});

// Hacer funciones globales
window.limpiarFiltros = limpiarFiltros;
window.verDetallePedido = verDetallePedido;