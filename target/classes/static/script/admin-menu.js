// admin-menu.js - VERSIÓN COMPLETA CON GESTIÓN DE USUARIOS
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADMIN MENÚ - INICIADO ===');

    // Variables globales
    let currentEditingId = null;
    let products = [];
    let users = [];
    let estadisticas = {};
    let currentSection = 'dashboard';

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
        dynamicAlerts.innerHTML = ''; // Limpiar alertas anteriores
        dynamicAlerts.appendChild(alerta);

        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 5000);
    }

    // CARGAR ESTADÍSTICAS DEL DASHBOARD
    async function cargarEstadisticas() {
        try {
            console.log('Cargando estadísticas...');
            const response = await fetch('/admin-menu/estadisticas');

            if (!response.ok) {
                throw new Error('Error al cargar estadísticas: ' + response.status);
            }

            const data = await response.json();
            console.log('Estadísticas cargadas:', data);

            if (data.success !== false) {
                estadisticas = data;
                actualizarDashboard();
            } else {
                throw new Error(data.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            mostrarAlerta('Error al cargar estadísticas del dashboard', 'warning');
        }
    }

    // ACTUALIZAR EL DASHBOARD CON LOS DATOS
    function actualizarDashboard() {
        // Actualizar tarjetas
        if (document.getElementById('totalProductos')) {
            document.getElementById('totalProductos').textContent = estadisticas.totalProductos || 0;
        }
        if (document.getElementById('totalUsuarios')) {
            document.getElementById('totalUsuarios').textContent = estadisticas.totalUsuarios || 0;
        }
        if (document.getElementById('pedidosHoy')) {
            document.getElementById('pedidosHoy').textContent = estadisticas.pedidosHoy || 0;
        }
        if (document.getElementById('ingresosHoy')) {
            document.getElementById('ingresosHoy').textContent = `S/ ${(estadisticas.ingresosHoy || 0).toFixed(2)}`;
        }
    }

    // CARGAR PRODUCTOS DESDE EL BACKEND
    async function cargarProductos() {
        try {
            console.log('Cargando productos desde el backend...');
            const response = await fetch('/admin-menu/productos');

            if (!response.ok) {
                throw new Error('Error al cargar productos: ' + response.status);
            }

            products = await response.json();
            console.log('Productos cargados:', products.length, 'productos');

            mostrarProductos();

        } catch (error) {
            console.error('Error cargando productos:', error);
            mostrarAlerta('Error al cargar productos', 'warning');
        }
    }

    // MOSTRAR PRODUCTOS EN LA TABLA
    function mostrarProductos() {
        const tbody = document.getElementById('productsTableBody');
        const noProductsMessage = document.getElementById('noProductsMessage');

        if (!tbody) {
            console.error('No se encontró el tbody de productos');
            return;
        }

        tbody.innerHTML = '';

        if (products.length === 0) {
            if (noProductsMessage) {
                noProductsMessage.classList.remove('d-none');
            }
            if (tbody.parentNode) {
                tbody.parentNode.classList.add('d-none');
            }
            return;
        }

        if (noProductsMessage) {
            noProductsMessage.classList.add('d-none');
        }
        if (tbody.parentNode) {
            tbody.parentNode.classList.remove('d-none');
        }

        // Aplicar filtros
        const searchTerm = document.getElementById('searchProducts')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';

        console.log('Filtrando productos:', {
            searchTerm,
            categoryFilter,
            totalProducts: products.length
        });

        const filteredProducts = products.filter(product => {
            const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilter ||
                product.tipo.toLowerCase() === categoryFilter.toLowerCase();

            return matchesSearch && matchesCategory;
        });

        console.log('Productos filtrados:', filteredProducts.length);

        filteredProducts.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.id}</td>
                <td>
                    <img src="${product.imagenUrl || '/imagenes/default-product.jpg'}"
                         alt="${product.nombre}"
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                         onerror="this.src='/imagenes/default-product.jpg'">
                </td>
                <td>
                    <strong>${product.nombre}</strong>
                    ${product.descripcion ? `<br><small class="text-muted">${product.descripcion}</small>` : ''}
                </td>
                <td>
                    <span class="badge bg-primary">${product.tipo}</span>
                </td>
                <td><strong>S/ ${product.precio.toFixed(2)}</strong></td>
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

        console.log('Productos mostrados en tabla:', filteredProducts.length);
    }

    // ================== GESTIÓN DE USUARIOS ==================

    // CARGAR USUARIOS DESDE EL BACKEND
    async function cargarUsuarios() {
        try {
            console.log('Cargando usuarios desde el backend...');
            const response = await fetch('/admin-menu/usuarios');

            if (!response.ok) {
                throw new Error('Error al cargar usuarios: ' + response.status);
            }

            users = await response.json();
            console.log('Usuarios cargados:', users.length, 'usuarios');

            mostrarUsuarios();

        } catch (error) {
            console.error('Error cargando usuarios:', error);
            mostrarAlerta('Error al cargar usuarios', 'warning');
        }
    }

    // MOSTRAR USUARIOS EN LA TABLA
    function mostrarUsuarios() {
        const tbody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');

        if (!tbody) {
            console.error('No se encontró el tbody de usuarios');
            return;
        }

        tbody.innerHTML = '';

        if (users.length === 0) {
            if (noUsersMessage) {
                noUsersMessage.classList.remove('d-none');
            }
            if (tbody.parentNode) {
                tbody.parentNode.classList.add('d-none');
            }
            return;
        }

        if (noUsersMessage) {
            noUsersMessage.classList.add('d-none');
        }
        if (tbody.parentNode) {
            tbody.parentNode.classList.remove('d-none');
        }

        // Aplicar filtros
        const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';

        console.log('Filtrando usuarios:', {
            searchTerm,
            roleFilter,
            totalUsers: users.length
        });

        const filteredUsers = users.filter(user => {
            const matchesSearch = user.nombres.toLowerCase().includes(searchTerm) ||
                user.apellidos.toLowerCase().includes(searchTerm) ||
                user.username.toLowerCase().includes(searchTerm);

            const matchesRole = !roleFilter ||
                user.rol.toLowerCase() === roleFilter.toLowerCase();

            return matchesSearch && matchesRole;
        });

        console.log('Usuarios filtrados:', filteredUsers.length);

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <div class="user-avatar-small">
                        ${user.nombres.charAt(0)}${user.apellidos.charAt(0)}
                    </div>
                </td>
                <td>
                    <strong>${user.nombres} ${user.apellidos}</strong>
                    <br><small class="text-muted">${user.tipoDocumento}: ${user.numeroDocumento}</small>
                </td>
                <td>${user.username}</td>
                <td>
                    <span class="badge ${getBadgeClassForRole(user.rol)}">${user.rol}</span>
                </td>
                <td>
                    <span class="badge bg-success">Activo</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}"
                                title="Eliminar usuario">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        console.log('Usuarios mostrados en tabla:', filteredUsers.length);
    }

    // OBTENER CLASE BADGE PARA ROL
    function getBadgeClassForRole(rol) {
        switch(rol.toLowerCase()) {
            case 'admin': return 'bg-danger';
            case 'cajero': return 'bg-warning';
            case 'cocinero': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    // ABRIR MODAL DE USUARIO
    function abrirModalUsuario() {
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        const form = document.getElementById('userForm');
        const modalTitle = document.getElementById('userModalLabel');

        if (!form || !modalTitle) {
            console.error('No se encontraron elementos del modal de usuario');
            return;
        }

        form.reset();
        modalTitle.textContent = 'Agregar Usuario';
        modal.show();
    }

    // GUARDAR USUARIO
    async function guardarUsuario(formData) {
        try {
            console.log('Guardando usuario...');

            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch('/admin-menu/usuarios/guardar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
                if (modal) {
                    modal.hide();
                }

                // Recargar usuarios
                await cargarUsuarios();

                // Mostrar mensaje de éxito
                mostrarAlerta(result.message, 'success');


                if (currentSection === 'users') {
                    cambiarSeccion('users');
                }

            } else {
                throw new Error(result.error || 'Error del servidor');
            }

        } catch (error) {
            console.error('Error guardando usuario:', error);
            mostrarAlerta('Error al guardar el usuario: ' + error.message, 'danger');
        }
    }

    // ELIMINAR USUARIO
    async function eliminarUsuario(id) {
        try {
            console.log('Eliminando usuario ID:', id);

            const user = users.find(u => u.id == id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const formData = new FormData();
            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch(`/admin-menu/usuarios/eliminar/${id}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Recargar usuarios
                await cargarUsuarios();
                mostrarAlerta(result.message, 'success');

                // Mantener en la sección actual
                if (currentSection === 'users') {
                    cambiarSeccion('users');
                }
            } else {
                throw new Error(result.error || 'Error del servidor al eliminar');
            }

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            mostrarAlerta('Error al eliminar el usuario: ' + error.message, 'danger');
        }
    }

    // ABRIR MODAL DE PRODUCTO
    function abrirModalProducto(producto = null) {
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        const form = document.getElementById('productForm');
        const modalTitle = document.getElementById('productModalLabel');
        const imagePreview = document.getElementById('imagePreview');

        if (!form || !modalTitle || !imagePreview) {
            console.error('No se encontraron elementos del modal');
            return;
        }

        form.reset();
        imagePreview.classList.add('d-none');

        if (producto) {
            modalTitle.textContent = 'Editar Producto';
            document.getElementById('productId').value = producto.id;
            document.getElementById('productName').value = producto.nombre;
            document.getElementById('productCategory').value = producto.tipo;
            document.getElementById('productPrice').value = producto.precio;
            document.getElementById('productDescription').value = producto.descripcion || '';
            document.getElementById('productImage').value = producto.imagenUrl || '';

            if (producto.imagenUrl && producto.imagenUrl !== '/imagenes/default-product.jpg') {
                imagePreview.src = producto.imagenUrl;
                imagePreview.classList.remove('d-none');
            }

            currentEditingId = producto.id;
        } else {
            modalTitle.textContent = 'Agregar Producto';
            document.getElementById('productId').value = '';
            currentEditingId = null;
        }

        modal.show();
    }

    // GUARDAR PRODUCTO
    async function guardarProducto(formData) {
        try {
            console.log('Guardando producto...', formData);

            const url = currentEditingId
                ? `/admin-menu/actualizar/${currentEditingId}`
                : '/admin-menu/guardar';

            // Agregar CSRF token
            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                if (modal) {
                    modal.hide();
                }

                // Recargar productos
                await cargarProductos();

                // Mostrar mensaje de éxito
                mostrarAlerta(
                    currentEditingId
                        ? 'Producto actualizado exitosamente!'
                        : 'Producto guardado exitosamente!',
                    'success'
                );

                // Mantener en la sección actual (menú)
                if (currentSection === 'menu') {
                    cambiarSeccion('menu');
                }

            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error del servidor');
            }

        } catch (error) {
            console.error('Error guardando producto:', error);
            mostrarAlerta('Error al guardar el producto: ' + error.message, 'danger');
        }
    }

    // ELIMINAR PRODUCTO
    async function eliminarProducto(id) {
        try {
            console.log('Eliminando producto ID:', id);

            const formData = new FormData();
            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);
            formData.append('redirectSection', currentSection);

            const response = await fetch(`/admin-menu/eliminar/${id}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Recargar productos
                await cargarProductos();
                mostrarAlerta('Producto eliminado exitosamente!', 'success');


                if (currentSection === 'menu') {
                    cambiarSeccion('menu');
                }
            } else {
                throw new Error('Error del servidor al eliminar');
            }

        } catch (error) {
            console.error('Error eliminando producto:', error);
            mostrarAlerta('Error al eliminar el producto: ' + error.message, 'danger');
        }
    }

    // FUNCIÓN DE CONFIRMACIÓN
    function mostrarConfirmacion(mensaje, accionConfirmar) {
        const modalBody = document.getElementById('confirmModalBody');
        const confirmBtn = document.getElementById('confirmActionBtn');

        if (!modalBody || !confirmBtn) return;

        modalBody.textContent = mensaje;

        // Limpiar event listeners anteriores
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

    // CAMBIAR SECCIÓN
    function cambiarSeccion(seccion) {
        console.log('Cambiando a sección:', seccion);
        currentSection = seccion;

        const sectionContents = document.querySelectorAll('.section-content');
        const sectionTitle = document.getElementById('sectionTitle');
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        // Ocultar todas las secciones
        sectionContents.forEach(section => section.classList.add('d-none'));

        // Remover active de todos los links
        navLinks.forEach(navLink => navLink.classList.remove('active'));

        // Mostrar sección seleccionada
        const selectedSection = document.getElementById(seccion + '-section');
        if (selectedSection) {
            selectedSection.classList.remove('d-none');
        }

        // Actualizar título
        if (sectionTitle) {
            const activeLink = document.querySelector(`[data-section="${seccion}"]`);
            if (activeLink) {
                const linkText = activeLink.querySelector('span').textContent;
                sectionTitle.textContent = linkText;
            }
        }

        // Activar link correspondiente
        const activeLink = document.querySelector(`[data-section="${seccion}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Cargar datos específicos de la sección
        if (seccion === 'dashboard') {
            cargarEstadisticas();
        } else if (seccion === 'menu') {
            cargarProductos();
        } else if (seccion === 'users') {
            cargarUsuarios();
        }
    }

    // INICIALIZACIÓN MEJORADA
    function inicializarAdminMenu() {
        console.log('Inicializando Admin Menu...');

        // Cargar datos iniciales
        cargarEstadisticas();
        cargarProductos();

        // Navegación entre secciones
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                if (this.getAttribute('href') === '#' || this.getAttribute('data-section')) {
                    e.preventDefault();

                    const section = this.getAttribute('data-section');
                    if (section) {
                        cambiarSeccion(section);
                    }
                }
            });
        });

        // EVENTOS PARA GESTIÓN DE PRODUCTOS
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                console.log('Botón agregar producto clickeado');
                abrirModalProducto();
            });
        }

        const addFirstProductBtn = document.getElementById('addFirstProductBtn');
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => {
                console.log('Botón agregar primer producto clickeado');
                abrirModalProducto();
            });
        }

        // Eventos para búsqueda y filtros de productos
        const searchProducts = document.getElementById('searchProducts');
        if (searchProducts) {
            searchProducts.addEventListener('input', function() {
                console.log('Buscando productos:', this.value);
                mostrarProductos();
            });
        }

        const searchProductsBtn = document.getElementById('searchProductsBtn');
        if (searchProductsBtn) {
            searchProductsBtn.addEventListener('click', function() {
                console.log('Botón buscar productos clickeado');
                mostrarProductos();
            });
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                console.log('Filtro de categoría cambiado:', this.value);
                mostrarProductos();
            });
        }

        // EVENTOS PARA GESTIÓN DE USUARIOS
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                console.log('Botón agregar usuario clickeado');
                abrirModalUsuario();
            });
        }

        const addFirstUserBtn = document.getElementById('addFirstUserBtn');
        if (addFirstUserBtn) {
            addFirstUserBtn.addEventListener('click', () => {
                console.log('Botón agregar primer usuario clickeado');
                abrirModalUsuario();
            });
        }

        // Eventos para búsqueda y filtros de usuarios
        const searchUsers = document.getElementById('searchUsers');
        if (searchUsers) {
            searchUsers.addEventListener('input', function() {
                console.log('Buscando usuarios:', this.value);
                mostrarUsuarios();
            });
        }

        const searchUsersBtn = document.getElementById('searchUsersBtn');
        if (searchUsersBtn) {
            searchUsersBtn.addEventListener('click', function() {
                console.log('Botón buscar usuarios clickeado');
                mostrarUsuarios();
            });
        }

        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', function() {
                console.log('Filtro de rol cambiado:', this.value);
                mostrarUsuarios();
            });
        }

        // FORMULARIO DE PRODUCTO
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', async function(e) {
                e.preventDefault(); // IMPORTANTE: Prevenir envío tradicional

                const nombre = document.getElementById('productName').value.trim();
                const tipo = document.getElementById('productCategory').value;
                const precio = parseFloat(document.getElementById('productPrice').value);
                const descripcion = document.getElementById('productDescription').value.trim();
                const imagenUrl = document.getElementById('productImage').value.trim();

                // Validaciones
                if (!nombre) {
                    mostrarAlerta('El nombre del producto es requerido', 'warning');
                    return;
                }

                if (!tipo) {
                    mostrarAlerta('Debe seleccionar una categoría', 'warning');
                    return;
                }

                if (isNaN(precio) || precio <= 0) {
                    mostrarAlerta('El precio debe ser un número mayor a 0', 'warning');
                    return;
                }

                // Crear FormData
                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('tipo', tipo);
                formData.append('precio', precio);
                formData.append('descripcion', descripcion);
                formData.append('imagenUrl', imagenUrl);

                mostrarAlerta('Guardando producto...', 'info');

                // Llamar a la función guardar
                await guardarProducto(formData);
            });
        }

        // FORMULARIO DE USUARIO
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', async function() {
                const nombres = document.getElementById('userName').value.trim();
                const apellidos = document.getElementById('userLastName').value.trim();
                const tipoDocumento = document.getElementById('userDocumentType').value;
                const numeroDocumento = document.getElementById('userDocumentNumber').value.trim();
                const telefono = document.getElementById('userPhone').value.trim();
                const fechaNacimiento = document.getElementById('userBirthDate').value;
                const email = document.getElementById('userEmail').value.trim();
                const rol = document.getElementById('userRole').value;
                const password = document.getElementById('userPassword').value;

                // Validaciones
                if (!nombres || !apellidos) {
                    mostrarAlerta('Los nombres y apellidos son requeridos', 'warning');
                    return;
                }

                if (!tipoDocumento) {
                    mostrarAlerta('Debe seleccionar un tipo de documento', 'warning');
                    return;
                }

                if (!numeroDocumento) {
                    mostrarAlerta('El número de documento es requerido', 'warning');
                    return;
                }

                if (!telefono) {
                    mostrarAlerta('El teléfono es requerido', 'warning');
                    return;
                }

                if (!fechaNacimiento) {
                    mostrarAlerta('La fecha de nacimiento es requerida', 'warning');
                    return;
                }

                if (!email) {
                    mostrarAlerta('El email es requerido', 'warning');
                    return;
                }

                if (!rol) {
                    mostrarAlerta('Debe seleccionar un rol', 'warning');
                    return;
                }

                if (!password || password.length < 6) {
                    mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'warning');
                    return;
                }

                // Crear FormData
                const formData = new FormData();
                formData.append('nombres', nombres);
                formData.append('apellidos', apellidos);
                formData.append('tipoDocumento', tipoDocumento);
                formData.append('numeroDocumento', numeroDocumento);
                formData.append('telefono', telefono);
                formData.append('fechaNacimiento', fechaNacimiento);
                formData.append('email', email);
                formData.append('rol', rol);
                formData.append('password', password);

                mostrarAlerta('Guardando usuario...', 'info');


                await guardarUsuario(formData);
            });
        }


        document.addEventListener('click', function (e) {
            // Editar producto
            if (e.target.closest('.edit-product')) {
                const btn = e.target.closest('.edit-product');
                const id = btn.getAttribute('data-id');
                console.log('Editando producto ID:', id);

                const producto = products.find(p => p.id == id);
                if (producto) {
                    abrirModalProducto(producto);
                } else {
                    console.error('Producto no encontrado para editar:', id);
                    mostrarAlerta('Error: Producto no encontrado', 'danger');
                }
            }

            // Eliminar producto
            if (e.target.closest('.delete-product')) {
                const btn = e.target.closest('.delete-product');
                const id = btn.getAttribute('data-id');
                console.log('Eliminando producto ID:', id);

                const producto = products.find(p => p.id == id);
                if (producto) {
                    mostrarConfirmacion(
                        `¿Está seguro de que desea eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
                        () => eliminarProducto(id)
                    );
                } else {
                    console.error('Producto no encontrado para eliminar:', id);
                    mostrarAlerta('Error: Producto no encontrado', 'danger');
                }
            }

            // Eliminar usuario
            if (e.target.closest('.delete-user')) {
                const btn = e.target.closest('.delete-user');
                const id = btn.getAttribute('data-id');
                console.log('Eliminando usuario ID:', id);

                const user = users.find(u => u.id == id);
                if (user) {
                    mostrarConfirmacion(
                        `¿Está seguro de que desea eliminar al usuario "${user.nombres} ${user.apellidos}"? Esta acción no se puede deshacer.`,
                        () => eliminarUsuario(id)
                    );
                } else {
                    console.error('Usuario no encontrado para eliminar:', id);
                    mostrarAlerta('Error: Usuario no encontrado', 'danger');
                }
            }
        });


        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.addEventListener('input', function (e) {
                const url = e.target.value.trim();
                const preview = document.getElementById('imagePreview');

                if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
                    preview.src = url;
                    preview.classList.remove('d-none');
                } else {
                    preview.classList.add('d-none');
                }
            });
        }

        // Botón de actualizar ventas
        const refreshSales = document.getElementById('refreshSales');
        if (refreshSales) {
            refreshSales.addEventListener('click', cargarEstadisticas);
        }
    }


    inicializarAdminMenu();

    console.log('Admin Menu inicializado correctamente');
});


window.AdminMenu = {
    recargar: function() {
        window.location.reload();
    },

    limpiarFiltros: function() {
        const searchInput = document.getElementById('searchProducts');
        const categoryFilter = document.getElementById('categoryFilter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';


        if (categoryFilter) {
            categoryFilter.dispatchEvent(new Event('change'));
        }
    }
};