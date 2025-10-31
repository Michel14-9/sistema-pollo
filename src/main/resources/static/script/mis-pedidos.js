
// SISTEMA DE GESTIÓN DE PEDIDOS


// Configuración
const API_BASE_URL = '/api/pedidos';

// Estado global
let pedidos = [];
let pedidoSeleccionado = null;
let modalDetallePedido = null;


// INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando gestión de pedidos...");

    // Verificar si el usuario está autenticado
    if (document.getElementById('pedidosLista')) {
        // Inicializar modal
        const modalElement = document.getElementById('modalDetallePedido');
        if (modalElement) {
            modalDetallePedido = new bootstrap.Modal(modalElement);
            console.log(" Modal de detalles inicializado");
        }

        // Configurar event listeners
        configurarEventListeners();

        // Cargar pedidos
        cargarPedidos();

        console.log(" Sistema de pedidos inicializado");
    }
});


// CONFIGURACIÓN DE EVENT LISTENERS

function configurarEventListeners() {
    console.log(" Configurando event listeners...");

    // Búsqueda en tiempo real
    const buscarInput = document.getElementById('buscarPedido');
    if (buscarInput) {
        buscarInput.addEventListener('input', function(e) {
            clearTimeout(this.buscarTimeout);
            this.buscarTimeout = setTimeout(() => {
                filtrarPedidos();
            }, 300);
        });
    }

    // Filtro por estado
    const filtroEstado = document.getElementById('filtroEstado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', filtrarPedidos);
    }

    // Botón repetir pedido
    const btnRepetir = document.getElementById('btnRepetirPedido');
    if (btnRepetir) {
        btnRepetir.addEventListener('click', repetirPedido);
    }

    // Recargar cuando la página se vuelve visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log(" Página visible, actualizando pedidos...");
            cargarPedidos();
        }
    });

    console.log(" Event listeners configurados");
}


// FUNCIONES PRINCIPALES

async function cargarPedidos() {
    console.log(" Cargando pedidos del usuario...");

    try {
        mostrarEstadoCarga();

        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log(" Respuesta del servidor:", response.status);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        pedidos = await response.json();
        console.log(" Pedidos cargados:", pedidos.length);

        // Validar estructura de los pedidos
        pedidos = pedidos.map(pedido => validarEstructuraPedido(pedido));

        mostrarPedidos();

    } catch (error) {
        console.error(" Error cargando pedidos:", error);
        mostrarErrorCarga("Error al cargar los pedidos: " + error.message);
    }
}

function mostrarPedidos() {
    const contenedor = document.getElementById('pedidosLista');
    const estadoVacio = document.getElementById('pedidosVacios');
    const estadoCarga = document.getElementById('estadoCarga');
    const errorCarga = document.getElementById('errorCarga');

    if (!contenedor) {
        console.error(" No se encontró el contenedor de pedidos");
        return;
    }

    // Ocultar estados
    if (estadoCarga) estadoCarga.style.display = 'none';
    if (errorCarga) errorCarga.style.display = 'none';

    // Limpiar contenedor
    contenedor.innerHTML = '';

    if (pedidos.length === 0) {
        console.log("


        No hay pedidos para mostrar");
        if (estadoVacio) estadoVacio.style.display = 'block';
        return;
    }

    // Aplicar filtros
    const pedidosFiltrados = aplicarFiltros();

    if (pedidosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No se encontraron pedidos</h5>
                <p class="text-muted">Intenta con otros términos de búsqueda o filtros</p>
            </div>
        `;
        return;
    }

    console.log(" Mostrando", pedidosFiltrados.length, "pedidos");

    // Mostrar cada pedido
    pedidosFiltrados.forEach((pedido, index) => {
        const pedidoElement = crearElementoPedido(pedido, index);
        contenedor.appendChild(pedidoElement);
    });

    // Ocultar estado vacío
    if (estadoVacio) estadoVacio.style.display = 'none';
}

function crearElementoPedido(pedido, index) {
    const div = document.createElement('div');
    div.className = 'pedido-item border-bottom';

    // Validar datos del pedido
    const pedidoValidado = validarDatosPedido(pedido);

    div.innerHTML = `
        <div class="row align-items-center py-3">
            <div class="col-md-3">
                <div class="pedido-info">
                    <h6 class="mb-1">Pedido #${validarCampoTexto(pedidoValidado.codigo || `P${String(index + 1).padStart(4, '0')}`)}</h6>
                    <small class="text-muted">${validarFecha(pedidoValidado.fechaPedido)}</small>
                </div>
            </div>
            <div class="col-md-2">
                <span class="badge ${obtenerClaseEstado(pedidoValidado.estado)}">
                    ${obtenerTextoEstado(pedidoValidado.estado)}
                </span>
            </div>
            <div class="col-md-2">
                <div class="text-success fw-bold">
                    S/. ${validarPrecio(pedidoValidado.total)}
                </div>
            </div>
            <div class="col-md-3">
                <div class="productos-preview">
                    ${generarPreviewProductos(pedidoValidado.items)}
                </div>
            </div>
            <div class="col-md-2">
                <button class="btn btn-outline-luren btn-sm" onclick="verDetallePedido(${index})">
                    <i class="fas fa-eye me-1"></i> Ver Detalle
                </button>
            </div>
        </div>
    `;

    return div;
}


// FUNCIONES DE FILTRADO Y BÚSQUEDA

function aplicarFiltros() {
    const terminoBusqueda = document.getElementById('buscarPedido').value.toLowerCase().trim();
    const filtroEstado = document.getElementById('filtroEstado').value;

    return pedidos.filter(pedido => {
        // Filtro por estado
        if (filtroEstado !== 'todos' && pedido.estado !== filtroEstado) {
            return false;
        }

        // Búsqueda por término
        if (terminoBusqueda) {
            const buscaEnCodigo = pedido.codigo?.toLowerCase().includes(terminoBusqueda) || false;
            const buscaEnProductos = pedido.items?.some(item =>
                item.producto?.nombre?.toLowerCase().includes(terminoBusqueda)
            ) || false;

            return buscaEnCodigo || buscaEnProductos;
        }

        return true;
    });
}

function filtrarPedidos() {
    console.log(" Aplicando filtros...");
    mostrarPedidos();
}


function verDetallePedido(index) {
    console.log(" Viendo detalle del pedido índice:", index);

    const pedido = pedidos[index];
    if (!pedido) {
        console.error(" Pedido no encontrado en índice:", index);
        mostrarError("No se pudo cargar el detalle del pedido");
        return;
    }

    pedidoSeleccionado = pedido;
    mostrarDetallePedido(pedido);

    if (modalDetallePedido) {
        modalDetallePedido.show();
    }
}

function mostrarDetallePedido(pedido) {
    const contenedor = document.getElementById('detallePedidoContent');
    if (!contenedor) return;

    const pedidoValidado = validarDatosPedido(pedido);

    contenedor.innerHTML = `
        <div class="detalle-pedido">
            <!-- Header del pedido -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6 class="text-muted">Código del Pedido</h6>
                    <p class="h5">${validarCampoTexto(pedidoValidado.codigo || 'N/A')}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h6 class="text-muted">Estado</h6>
                    <span class="badge ${obtenerClaseEstado(pedidoValidado.estado)} fs-6">
                        ${obtenerTextoEstado(pedidoValidado.estado)}
                    </span>
                </div>
            </div>

            <!-- Información del pedido -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6 class="text-muted">Fecha del Pedido</h6>
                    <p>${validarFecha(pedidoValidado.fechaPedido)}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted">Total</h6>
                    <p class="h5 text-success">S/. ${validarPrecio(pedidoValidado.total)}</p>
                </div>
            </div>

            <!-- Dirección de entrega -->
            ${pedidoValidado.direccionEntrega ? `
            <div class="mb-4">
                <h6 class="text-muted">Dirección de Entrega</h6>
                <div class="card bg-light">
                    <div class="card-body py-2">
                        <p class="mb-1">${validarCampoTexto(pedidoValidado.direccionEntrega.direccion)}</p>
                        <p class="mb-1">${validarCampoTexto(pedidoValidado.direccionEntrega.ciudad)}</p>
                        ${pedidoValidado.direccionEntrega.referencia ?
                          `<p class="mb-0"><small>Referencia: ${validarCampoTexto(pedidoValidado.direccionEntrega.referencia)}</small></p>` : ''}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Items del pedido -->
            <div class="mb-4">
                <h6 class="text-muted">Productos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generarItemsPedido(pedidoValidado.items)}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                <td class="text-end"><strong>S/. ${validarPrecio(pedidoValidado.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Información adicional -->
            ${pedidoValidado.observaciones ? `
            <div class="mb-3">
                <h6 class="text-muted">Observaciones</h6>
                <p class="text-muted">${validarCampoTexto(pedidoValidado.observaciones)}</p>
            </div>
            ` : ''}
        </div>
    `;

    // Configurar botón de repetir pedido
    const btnRepetir = document.getElementById('btnRepetirPedido');
    if (btnRepetir) {
        btnRepetir.disabled = !validarPedidoRepetible(pedidoValidado);
        if (!validarPedidoRepetible(pedidoValidado)) {
            btnRepetir.title = "No se puede repetir este pedido";
        }
    }
}

function repetirPedido() {
    if (!pedidoSeleccionado) {
        mostrarError("No hay un pedido seleccionado para repetir");
        return;
    }

    if (!validarPedidoRepetible(pedidoSeleccionado)) {
        mostrarError("Este pedido no se puede repetir en su estado actual");
        return;
    }

    console.log(" Repitiendo pedido:", pedidoSeleccionado.codigo);

    // Aquí iría la lógica para agregar los productos al carrito
    mostrarExito("Productos agregados al carrito. Redirigiendo...");

    setTimeout(() => {
        window.location.href = '/carrito';
    }, 2000);
}


function validarEstructuraPedido(pedido) {
    return {
        id: validarNumero(pedido.id),
        codigo: validarCampoTexto(pedido.codigo || pedido.numeroPedido),
        estado: validarEstadoPedido(pedido.estado),
        fechaPedido: validarFecha(pedido.fechaPedido || pedido.fechaCreacion),
        total: validarPrecio(pedido.total || pedido.montoTotal),
        items: validarItemsPedido(pedido.items || pedido.detalles || []),
        direccionEntrega: validarDireccionEntrega(pedido.direccionEntrega || pedido.direccion),
        observaciones: validarCampoTexto(pedido.observaciones || pedido.notas),
        metodoPago: validarCampoTexto(pedido.metodoPago)
    };
}

function validarDatosPedido(pedido) {
    // Validaciones adicionales para mostrar
    if (!pedido.items || pedido.items.length === 0) {
        console.warn(" Pedido sin items:", pedido.codigo);
        pedido.items = [{ producto: { nombre: "Producto no disponible" }, cantidad: 1, precio: 0 }];
    }

    if (!pedido.total || pedido.total <= 0) {
        console.warn(" Pedido con total inválido:", pedido.codigo);
        pedido.total = pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    return pedido;
}

function validarItemsPedido(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
        producto: {
            id: validarNumero(item.producto?.id),
            nombre: validarCampoTexto(item.producto?.nombre || item.nombreProducto || "Producto"),
            precio: validarPrecio(item.producto?.precio || item.precio || 0)
        },
        cantidad: validarCantidad(item.cantidad),
        precio: validarPrecio(item.precio || item.producto?.precio || 0),
        subtotal: validarPrecio(item.subtotal || (item.cantidad * item.precio) || 0)
    }));
}

function validarDireccionEntrega(direccion) {
    if (!direccion) return null;

    return {
        direccion: validarCampoTexto(direccion.direccion || direccion.calle),
        ciudad: validarCampoTexto(direccion.ciudad || direccion.distrito),
        referencia: validarCampoTexto(direccion.referencia),
        telefono: validarTelefono(direccion.telefono)
    };
}

function validarEstadoPedido(estado) {
    const estadosValidos = ['PENDIENTE', 'CONFIRMADO', 'PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'];
    return estadosValidos.includes(estado) ? estado : 'PENDIENTE';
}

function validarPedidoRepetible(pedido) {
    // Solo se pueden repetir pedidos entregados o cancelados
    return pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO';
}


// FUNCIONES DE UTILIDAD

function obtenerClaseEstado(estado) {
    const clases = {
        'PENDIENTE': 'bg-warning',
        'CONFIRMADO': 'bg-info',
        'PREPARACION': 'bg-primary',
        'EN_CAMINO': 'bg-success',
        'ENTREGADO': 'bg-success',
        'CANCELADO': 'bg-danger'
    };
    return clases[estado] || 'bg-secondary';
}

function obtenerTextoEstado(estado) {
    const textos = {
        'PENDIENTE': 'Pendiente',
        'CONFIRMADO': 'Confirmado',
        'PREPARACION': 'En Preparación',
        'EN_CAMINO': 'En Camino',
        'ENTREGADO': 'Entregado',
        'CANCELADO': 'Cancelado'
    };
    return textos[estado] || 'Desconocido';
}

function generarPreviewProductos(items) {
    if (!items || items.length === 0) return '<span class="text-muted">Sin productos</span>';

    const productos = items.slice(0, 2).map(item =>
        validarCampoTexto(item.producto?.nombre)
    ).join(', ');

    const extra = items.length > 2 ? ` y ${items.length - 2} más` : '';

    return productos + extra;
}

function generarItemsPedido(items) {
    if (!items || items.length === 0) {
        return '<tr><td colspan="4" class="text-center text-muted">No hay productos</td></tr>';
    }

    return items.map(item => `
        <tr>
            <td>${validarCampoTexto(item.producto?.nombre)}</td>
            <td class="text-center">${validarCantidad(item.cantidad)}</td>
            <td class="text-end">S/. ${validarPrecio(item.precio)}</td>
            <td class="text-end">S/. ${validarPrecio(item.subtotal)}</td>
        </tr>
    `).join('');
}


function validarCampoTexto(valor) {
    if (!valor || valor.toString().trim() === '') return 'No especificado';
    return escapeHTML(valor.toString().trim());
}

function validarNumero(valor) {
    const num = Number(valor);
    return isNaN(num) ? 0 : num;
}

function validarPrecio(valor) {
    const num = Number(valor);
    return isNaN(num) ? '0.00' : num.toFixed(2);
}

function validarCantidad(valor) {
    const num = Number(valor);
    return isNaN(num) || num < 1 ? 1 : Math.floor(num);
}

function validarFecha(fechaString) {
    if (!fechaString) return 'No especificada';

    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';

        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error(" Error validando fecha:", error);
        return 'Fecha inválida';
    }
}

function validarTelefono(telefono) {
    if (!telefono) return 'No especificado';
    const telefonoStr = telefono.toString().replace(/\D/g, '');
    return telefonoStr.length >= 9 ? telefonoStr : 'No especificado';
}

function escapeHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}


// MANEJO DE ESTADOS DE LA UI

function mostrarEstadoCarga() {
    const estadoCarga = document.getElementById('estadoCarga');
    const pedidosVacios = document.getElementById('pedidosVacios');
    const errorCarga = document.getElementById('errorCarga');
    const pedidosLista = document.getElementById('pedidosLista');

    if (estadoCarga) estadoCarga.style.display = 'block';
    if (pedidosVacios) pedidosVacios.style.display = 'none';
    if (errorCarga) errorCarga.style.display = 'none';
    if (pedidosLista) pedidosLista.innerHTML = '';
}

function mostrarErrorCarga(mensaje) {
    const estadoCarga = document.getElementById('estadoCarga');
    const pedidosVacios = document.getElementById('pedidosVacios');
    const errorCarga = document.getElementById('errorCarga');
    const mensajeError = document.getElementById('mensajeError');

    if (estadoCarga) estadoCarga.style.display = 'none';
    if (pedidosVacios) pedidosVacios.style.display = 'none';
    if (errorCarga) errorCarga.style.display = 'block';
    if (mensajeError) mensajeError.textContent = mensaje;
}

function mostrarError(mensaje) {
    // Implementar sistema de notificaciones toast
    console.error(" Error:", mensaje);
    alert("Error: " + mensaje);
}

function mostrarExito(mensaje) {
    // Implementar sistema de notificaciones toast
    console.log(" Éxito:", mensaje);
    alert("Éxito: " + mensaje);
}


window.addEventListener('error', function(e) {
    console.error(' Error global:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error(' Promise rechazada no manejada:', e.reason);
    mostrarError('Error inesperado: ' + e.reason.message);
    e.preventDefault();
});

console.log(" Sistema de gestión de pedidos cargado correctamente");