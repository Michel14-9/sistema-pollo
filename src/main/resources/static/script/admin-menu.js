// Variables globales
let salesChart = null;
let currentEditingId = null;
let products = [];
let users = [];
let sales = [];
let isPublicMenuVisible = false;

// ========== SISTEMA DE PERSISTENCIA ==========
function guardarDatosEnLocalStorage() {
    try {
        localStorage.setItem('lurenProducts', JSON.stringify(products));
        localStorage.setItem('lurenUsers', JSON.stringify(users));
        console.log('💾 Datos guardados:', { productos: products.length, usuarios: users.length });
    } catch (error) {
        console.error('❌ Error al guardar datos:', error);
    }
}

function cargarDatosDesdeLocalStorage() {
    try {
        const productosGuardados = localStorage.getItem('lurenProducts');
        const usuariosGuardados = localStorage.getItem('lurenUsers');
        
        if (productosGuardados) {
            products = JSON.parse(productosGuardados);
            console.log('📦 Productos cargados:', products.length);
        } else {
            products = obtenerProductosPorDefecto();
            guardarDatosEnLocalStorage();
        }
        
        if (usuariosGuardados) {
            users = JSON.parse(usuariosGuardados);
            console.log('👥 Usuarios cargados:', users.length);
        } else {
            users = obtenerUsuariosPorDefecto();
            guardarDatosEnLocalStorage();
        }
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        products = obtenerProductosPorDefecto();
        users = obtenerUsuariosPorDefecto();
        guardarDatosEnLocalStorage();
    }
}

function obtenerProductosPorDefecto() {
    return [
        {
            id: 1,
            nombre: "Pollo a la Brasa Familiar",
            categoria: "pollos",
            precio: 35.00,
            descripcion: "Delicioso pollo a la brasa con papas fritas y ensalada fresca",
            imagen: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=200&fit=crop",
            estado: "activo"
        },
        {
            id: 2,
            nombre: "Parrilla Especial",
            categoria: "parrillas",
            precio: 85.00,
            descripcion: "Parrilla completa para 4 personas con carnes variadas",
            imagen: "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?w=300&h=200&fit=crop",
            estado: "activo"
        }
    ];
}

function obtenerUsuariosPorDefecto() {
    return [
        {
            id: 1,
            nombre: "Administrador Principal",
            email: "admin@lurenchicken.com",
            rol: "admin",
            estado: "activo",
            fechaRegistro: "2024-01-01"
        }
    ];
}

// ========== SISTEMA DE ALERTAS ==========
function mostrarAlerta(mensaje, tipo = 'success') {
    // Crear contenedor de alertas si no existe
    let dynamicAlerts = document.getElementById('dynamicAlerts');
    if (!dynamicAlerts) {
        dynamicAlerts = document.createElement('div');
        dynamicAlerts.id = 'dynamicAlerts';
        dynamicAlerts.className = 'position-fixed top-0 end-0 p-3';
        dynamicAlerts.style.cssText = 'z-index: 9999; min-width: 300px;';
        document.body.appendChild(dynamicAlerts);
    }

    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} me-2"></i>
            <span>${mensaje}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    dynamicAlerts.appendChild(alerta);

    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// ========== SISTEMA DE SINCRONIZACIÓN ==========
function sincronizarMenuPublico() {
    console.log('🔄 Sincronizando menú público...');
    
    // Actualizar estadísticas del dashboard
    actualizarEstadisticasDashboard();
    
    // Guardar cambios
    guardarDatosEnLocalStorage();
    
    // Actualizar menú público SIEMPRE que haya cambios
    actualizarMenuPublico();
    
    console.log('✅ Sincronización completada');
}

// ========== DASHBOARD ==========
function actualizarEstadisticasDashboard() {
    const productosActivos = products.filter(p => p.estado === 'activo').length;
    const totalUsuarios = users.length;
    
    const totalProductosElem = document.getElementById('totalProductos');
    const totalUsuariosElem = document.getElementById('totalUsuarios');
    
    if (totalProductosElem) totalProductosElem.textContent = productosActivos;
    if (totalUsuariosElem) totalUsuariosElem.textContent = totalUsuarios;
    
    console.log('📊 Dashboard actualizado:', { productosActivos, totalUsuarios });
}

// ========== GESTIÓN DE PRODUCTOS ==========
function cargarProductos() {
    mostrarProductos();
}

function mostrarProductos() {
    const tbody = document.getElementById('productsTableBody');
    const noProductsMessage = document.getElementById('noProductsMessage');

    if (!tbody) {
        console.error('❌ No se encontró la tabla de productos');
        return;
    }

    tbody.innerHTML = '';

    if (products.length === 0) {
        if (noProductsMessage) {
            noProductsMessage.classList.remove('d-none');
        }
        if (tbody.parentElement.parentElement) {
            tbody.parentElement.parentElement.classList.add('d-none');
        }
        return;
    }

    if (noProductsMessage) {
        noProductsMessage.classList.add('d-none');
        if (tbody.parentElement.parentElement) {
            tbody.parentElement.parentElement.classList.remove('d-none');
        }
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
                    <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.id}" data-nombre="${product.nombre}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log(`📊 Mostrando ${filteredProducts.length} productos de ${products.length} totales`);
}

function abrirModalProducto(producto = null) {
    const modalElement = document.getElementById('productModal');
    if (!modalElement) {
        console.error('❌ Modal de producto no encontrado');
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('productModalLabel');
    const imagePreview = document.getElementById('imagePreview');

    if (!form || !modalTitle) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }

    // Limpiar formulario
    form.reset();
    if (imagePreview) {
        imagePreview.classList.add('d-none');
    }

    if (producto) {
        // Modo edición
        modalTitle.textContent = 'Editar Producto';
        document.getElementById('productId').value = producto.id;
        document.getElementById('productName').value = producto.nombre;
        document.getElementById('productCategory').value = producto.categoria;
        document.getElementById('productPrice').value = producto.precio;
        document.getElementById('productDescription').value = producto.descripcion || '';
        document.getElementById('productStatus').value = producto.estado;

        if (producto.imagen && imagePreview) {
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
            const index = products.findIndex(p => p.id == currentEditingId);
            if (index !== -1) {
                productoData = {
                    ...products[index],
                    nombre,
                    categoria,
                    precio,
                    descripcion,
                    estado,
                    imagen
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
                imagen
            };
            products.push(productoData);
            accion = 'agregado';
            console.log(`🆕 Producto agregado: ${productoData.nombre} (ID: ${nuevoId})`);
        }

        // SINCRONIZAR INMEDIATAMENTE
        sincronizarMenuPublico();

        mostrarAlerta(`Producto "${nombre}" ${accion} correctamente`, 'success');

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (modal) {
            modal.hide();
        }
        
        // Actualizar vista de productos
        mostrarProductos();

    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarAlerta('Error al guardar el producto', 'danger');
    }
}

function eliminarProducto(id) {
    const producto = products.find(p => p.id == id);
    if (!producto) {
        mostrarAlerta('Error: Producto no encontrado', 'danger');
        return;
    }

    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
        const productoEliminado = products.splice(index, 1)[0];
        
        // SINCRONIZAR INMEDIATAMENTE
        sincronizarMenuPublico();
        
        mostrarAlerta(`Producto "${productoEliminado.nombre}" eliminado correctamente`, 'success');
        mostrarProductos();
        
        console.log(`🗑️ Producto eliminado: ${productoEliminado.nombre}`);
    }
}

// ========== GESTIÓN DE USUARIOS ==========
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
                    <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}" data-nombre="${user.nombre}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalUsuario(usuario = null) {
    const modalElement = document.getElementById('userModal');
    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement);
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
            const index = users.findIndex(u => u.id == currentEditingId);
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
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
        if (modal) modal.hide();
        
        mostrarUsuarios();
        actualizarEstadisticasDashboard();

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar el usuario', 'danger');
    }
}

function eliminarUsuario(id) {
    const index = users.findIndex(u => u.id == id);
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

// ========== MENÚ PÚBLICO ==========
function mostrarMenuPublico() {
    isPublicMenuVisible = true;
    console.log('🔍 Activando menú público...');
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
    console.log(`📦 Productos activos para mostrar: ${productosActivos.length}`);

    if (productosActivos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
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

// ========== UTILIDADES ==========
function mostrarConfirmacion(mensaje, accionConfirmar) {
    const modalBody = document.getElementById('confirmModalBody');
    const confirmBtn = document.getElementById('confirmActionBtn');

    if (!modalBody || !confirmBtn) return;

    modalBody.textContent = mensaje;

    // Reemplazar botón para evitar múltiples event listeners
    const nuevoConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(nuevoConfirmBtn, confirmBtn);

    // Agregar nuevo event listener
    document.getElementById('confirmActionBtn').addEventListener('click', function () {
        accionConfirmar();
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        if (modal) modal.hide();
    });

    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}

// ========== INICIALIZACIÓN COMPLETA ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando Luren Chicken Admin Dashboard...');
    
    // Cargar datos persistentes
    cargarDatosDesdeLocalStorage();
    
    // Inicializar datos
    actualizarEstadisticasDashboard();
    cargarProductos();
    cargarUsuarios();

    // ========== CONFIGURACIÓN DE NAVEGACIÓN ==========
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const sectionContents = document.querySelectorAll('.section-content');
    const sectionTitle = document.getElementById('sectionTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('data-section')) {
                e.preventDefault();

                // Remover active de todos los links
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                
                // Agregar active al link clickeado
                this.classList.add('active');

                // Ocultar todas las secciones
                sectionContents.forEach(section => section.classList.add('d-none'));

                // Mostrar sección seleccionada
                const sectionId = this.getAttribute('data-section') + '-section';
                const selectedSection = document.getElementById(sectionId);
                
                if (selectedSection) {
                    selectedSection.classList.remove('d-none');
                    
                    // Actualizar título
                    const linkText = this.querySelector('span').textContent;
                    if (sectionTitle) {
                        sectionTitle.textContent = linkText;
                    }

                    console.log(`📍 Navegando a: ${sectionId}`);

                    // Control de visibilidad del menú público
                    if (sectionId === 'public-menu-section') {
                        isPublicMenuVisible = true;
                        console.log('🎯 Menú público ACTIVADO');
                        mostrarMenuPublico();
                    } else {
                        isPublicMenuVisible = false;
                        console.log('👁️ Menú público DESACTIVADO');
                    }

                    // Cargar datos específicos de la sección
                    if (sectionId === 'menu-section') {
                        cargarProductos();
                    } else if (sectionId === 'users-section') {
                        cargarUsuarios();
                    } else if (sectionId === 'dashboard-section') {
                        actualizarEstadisticasDashboard();
                    }
                }
            }
        });
    });

    // ========== BOTÓN TOGGLE SIDEBAR ==========
    const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
    const app = document.getElementById('app');
    
    if (toggleSidebarBtn && app) {
        toggleSidebarBtn.addEventListener('click', function () {
            app.classList.toggle('collapsed');
            console.log('📱 Sidebar toggled');
        });
    }

    // ========== EVENTOS DE PRODUCTOS ==========
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

    // Filtros de productos
    const searchProducts = document.getElementById('searchProducts');
    if (searchProducts) {
        searchProducts.addEventListener('input', mostrarProductos);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', mostrarProductos);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', mostrarProductos);
    }

    // ========== EVENTOS DE USUARIOS ==========
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

    // Filtros de usuarios
    const searchUsers = document.getElementById('searchUsers');
    if (searchUsers) {
        searchUsers.addEventListener('input', mostrarUsuarios);
    }

    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', mostrarUsuarios);
    }

    const userStatusFilter = document.getElementById('userStatusFilter');
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', mostrarUsuarios);
    }

    // ========== EVENTO ACTUALIZAR MENÚ PÚBLICO ==========
    const refreshPublicMenu = document.getElementById('refreshPublicMenu');
    if (refreshPublicMenu) {
        refreshPublicMenu.addEventListener('click', function() {
            mostrarMenuPublico();
            mostrarAlerta('Menú público actualizado manualmente', 'success');
        });
    }

    // ========== EVENTOS DELEGADOS PARA ACCIONES ==========
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
            if (usuario) {
                console.log(`✏️ Editando usuario: ${usuario.nombre}`);
                abrirModalUsuario(usuario);
            }
        }

        // Eliminar usuario
        if (e.target.closest('.delete-user')) {
            const btn = e.target.closest('.delete-user');
            const id = parseInt(btn.getAttribute('data-id'));
            const usuario = users.find(u => u.id === id);
            if (usuario) {
                console.log(`🗑️ Solicitando eliminación de: ${usuario.nombre}`);
                mostrarConfirmacion(
                    `¿Está seguro de que desea eliminar al usuario "${usuario.nombre}"?`,
                    () => eliminarUsuario(id)
                );
            }
        }
    });

    // ========== VISTA PREVIA DE IMAGEN ==========
    const productImage = document.getElementById('productImage');
    if (productImage) {
        productImage.addEventListener('change', function (e) {
            const file = e.target.files[0];
            const preview = document.getElementById('imagePreview');

            if (file && preview) {
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
            } else if (preview) {
                preview.classList.add('d-none');
            }
        });
    }

    // ========== GUARDADO AUTOMÁTICO ==========
    window.addEventListener('beforeunload', function() {
        console.log('💾 Guardando datos antes de salir...');
        guardarDatosEnLocalStorage();
    });

    // Guardar datos cada 30 segundos
    setInterval(guardarDatosEnLocalStorage, 30000);

    console.log('✅ Sistema completamente inicializado y listo');
    console.log('🔄 Sincronización instantánea ACTIVADA');
    console.log('💾 Persistencia automática ACTIVADA');
});

// ========== FUNCIONES GLOBALES PARA TESTING ==========
window.agregarProductoDemo = function() {
    const nuevoProducto = {
        id: Math.max(0, ...products.map(p => p.id)) + 1,
        nombre: `Producto Demo ${Date.now()}`,
        categoria: ['pollos', 'parrillas', 'hamburguesas'][Math.floor(Math.random() * 3)],
        precio: Math.floor(Math.random() * 50) + 10,
        descripcion: 'Este es un producto de demostración',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
        estado: 'activo'
    };
    
    products.push(nuevoProducto);
    sincronizarMenuPublico();
    mostrarAlerta('Producto demo agregado', 'success');
};

window.mostrarEstado = function() {
    console.log('📊 Estado actual:', {
        productos: products.length,
        productosActivos: products.filter(p => p.estado === 'activo').length,
        usuarios: users.length,
        menuPublicoVisible: isPublicMenuVisible
    });
};