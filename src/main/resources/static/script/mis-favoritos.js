
// SISTEMA DE GESTIÓN DE FAVORITOS CON VALIDACIONES


// Estado global
let favoritos = [];
let productoAEliminar = null;
let modalConfirmacion = null;

// Configuración
const API_BASE_URL = '/api/favoritos';
const MAX_FAVORITOS = 50; // Límite máximo de favoritos

// ==========================
// INICIALIZACIÓN
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando gestión de favoritos...");

    if (document.getElementById('favoritosLista')) {
        // Inicializar modal de confirmación
        const modalElement = document.getElementById('modalConfirmarEliminacion');
        if (modalElement) {
            modalConfirmacion = new bootstrap.Modal(modalElement);
        }

        configurarEventListeners();
        cargarFavoritos();
        console.log(" Sistema de favoritos inicializado");
    }
});


// CONFIGURACIÓN DE EVENT LISTENERS

function configurarEventListeners() {
    // Botón limpiar todos los favoritos
    const btnLimpiar = document.getElementById('btnLimpiarFavoritos');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', confirmarLimpiarFavoritos);
    }

    // Botón confirmar eliminación en modal
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', eliminarFavoritoConfirmado);
    }

    // Recargar cuando la página se vuelve visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log(" Página visible, actualizando favoritos...");
            cargarFavoritos();
        }
    });

    // Prevenir envío de formularios no deseados
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        mostrarError('Acción no permitida');
    });
}


// FUNCIONES PRINCIPALES

async function cargarFavoritos() {
    console.log(" Cargando productos favoritos...");

    try {
        // Validar autenticación antes de hacer la petición
        if (!validarAutenticacion()) {
            mostrarEstadoNoAutenticado();
            return;
        }

        mostrarEstadoCarga();

        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        // Validar respuesta HTTP
        if (!validarRespuestaHTTP(response)) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Validar estructura de datos recibida
        if (!validarEstructuraFavoritos(data)) {
            throw new Error('Estructura de datos inválida');
        }

        favoritos = data.map(favorito => validarEstructuraFavorito(favorito));

        // Validar límite de favoritos
        if (favoritos.length > MAX_FAVORITOS) {
            console.warn(` Límite de favoritos excedido: ${favoritos.length}/${MAX_FAVORITOS}`);
            favoritos = favoritos.slice(0, MAX_FAVORITOS);
            await actualizarFavoritosEnServidor();
        }

        console.log(" Favoritos cargados:", favoritos.length);
        mostrarFavoritos();

    } catch (error) {
        console.error(" Error cargando favoritos:", error);
        manejarErrorCarga(error);
    }
}


// VALIDACIONES PRINCIPALES


/**
 * Validar que el usuario esté autenticado
 */
function validarAutenticacion() {
    // Esta validación debería coincidir con tu sistema de autenticación
    const estaAutenticado = document.querySelector('[th\\:if="${#authorization.expression(\\'isAuthenticated()\\')}"]') !== null;

    if (!estaAutenticado) {
        console.warn(" Usuario no autenticado");
        return false;
    }

    return true;
}

/**
 * Validar respuesta HTTP
 */
function validarRespuestaHTTP(response) {
    if (!response) {
        throw new Error('No se recibió respuesta del servidor');
    }

    if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 403) {
        throw new Error('No tienes permisos para acceder a esta información.');
    }

    if (response.status === 404) {
        throw new Error('Servicio de favoritos no disponible.');
    }

    if (response.status >= 500) {
        throw new Error('Error del servidor. Por favor, intenta más tarde.');
    }

    return response.ok;
}

/**
 * Validar estructura general de los favoritos
 */
function validarEstructuraFavoritos(data) {
    if (!data) {
        throw new Error('Datos de favoritos nulos');
    }

    if (!Array.isArray(data)) {
        throw new Error('Los favoritos deben ser un array');
    }

    return true;
}

/**
 * Validar estructura individual de cada favorito
 */
function validarEstructuraFavorito(favorito) {
    if (!favorito || typeof favorito !== 'object') {
        console.warn(" Favorito inválido, usando valores por defecto");
        return crearFavoritoPorDefecto();
    }

    return {
        id: validarId(favorito.id),
        producto: validarProducto(favorito.producto),
        fechaAgregado: validarFecha(favorito.fechaAgregado || favorito.fecha_agregado),
        esActivo: validarBooleano(favorito.esActivo, true)
    };
}

/**
 * Validar producto dentro del favorito
 */
function validarProducto(producto) {
    if (!producto || typeof producto !== 'object') {
        console.warn(" Producto inválido en favorito");
        return {
            id: 0,
            nombre: 'Producto no disponible',
            precio: 0,
            imagen: '/images/placeholder.jpg',
            descripcion: '',
            disponible: false
        };
    }

    return {
        id: validarId(producto.id),
        nombre: validarTexto(producto.nombre, 'Producto sin nombre'),
        precio: validarPrecio(producto.precio),
        imagen: validarImagen(producto.imagen),
        descripcion: validarTexto(producto.descripcion, ''),
        disponible: validarBooleano(producto.disponible, false),
        categoria: validarTexto(producto.categoria, ''),
        tiempoPreparacion: validarNumeroPositivo(producto.tiempoPreparacion, 0)
    };
}


// VALIDACIONES ESPECÍFICAS


function validarId(id) {
    const num = Number(id);
    return isNaN(num) || num < 0 ? 0 : Math.floor(num);
}

function validarTexto(texto, valorPorDefecto = '') {
    if (typeof texto !== 'string') return valorPorDefecto;

    const textoLimpio = texto.trim();

    // Validar longitud máxima
    if (textoLimpio.length > 255) {
        console.warn("️ Texto demasiado largo, truncando");
        return textoLimpio.substring(0, 255);
    }

    // Escapar HTML para prevenir XSS
    return escapeHTML(textoLimpio) || valorPorDefecto;
}

function validarPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num) || num < 0) return 0;

    // Redondear a 2 decimales
    return Math.round(num * 100) / 100;
}

function validarImagen(imagen) {
    if (!imagen || typeof imagen !== 'string') {
        return '/images/placeholder.jpg';
    }

    // Validar que sea una URL válida o ruta relativa
    const imagenLimpia = imagen.trim();
    if (imagenLimpia === '') {
        return '/images/placeholder.jpg';
    }

    // Validar extensiones de imagen permitidas
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const tieneExtensionValida = extensionesPermitidas.some(ext =>
        imagenLimpia.toLowerCase().endsWith(ext)
    );

    if (!tieneExtensionValida) {
        console.warn(" Extensión de imagen no válida:", imagenLimpia);
        return '/images/placeholder.jpg';
    }

    return imagenLimpia;
}

function validarFecha(fecha) {
    if (!fecha) return new Date().toISOString();

    try {
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
            throw new Error('Fecha inválida');
        }
        return fechaObj.toISOString();
    } catch (error) {
        console.warn("️ Fecha inválida, usando fecha actual:", error);
        return new Date().toISOString();
    }
}

function validarBooleano(valor, valorPorDefecto = false) {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
        return valor.toLowerCase() === 'true';
    }
    if (typeof valor === 'number') {
        return valor !== 0;
    }
    return valorPorDefecto;
}

function validarNumeroPositivo(numero, valorPorDefecto = 0) {
    const num = Number(numero);
    return isNaN(num) || num < 0 ? valorPorDefecto : Math.floor(num);
}


// FUNCIONES DE UTILIDAD


function crearFavoritoPorDefecto() {
    return {
        id: 0,
        producto: {
            id: 0,
            nombre: 'Producto no disponible',
            precio: 0,
            imagen: '/images/placeholder.jpg',
            descripcion: '',
            disponible: false,
            categoria: '',
            tiempoPreparacion: 0
        },
        fechaAgregado: new Date().toISOString(),
        esActivo: true
    };
}

function escapeHTML(texto) {
    if (typeof texto !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function formatearPrecio(precio) {
    return `S/. ${precio.toFixed(2)}`;
}

function formatearFecha(fechaISO) {
    try {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}


// MANEJO DE ERRORES


function manejarErrorCarga(error) {
    const mensaje = error.message || 'Error desconocido al cargar favoritos';

    if (mensaje.includes('Sesión expirada')) {
        mostrarErrorAutenticacion(mensaje);
    } else if (mensaje.includes('no disponible')) {
        mostrarErrorServicioNoDisponible();
    } else {
        mostrarErrorCarga(mensaje);
    }
}

function mostrarErrorAutenticacion(mensaje) {
    const contenedor = document.getElementById('favoritosLista');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h5>Sesión Expirada</h5>
                    <p>${mensaje}</p>
                    <a th:href="@{/login}" class="btn btn-warning mt-2">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </a>
                </div>
            </div>
        `;
    }
    ocultarEstados();
}

function mostrarErrorServicioNoDisponible() {
    const contenedor = document.getElementById('favoritosLista');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle fa-2x mb-3"></i>
                    <h5>Servicio Temporalmente No Disponible</h5>
                    <p>El sistema de favoritos no está disponible en este momento.</p>
                    <button class="btn btn-primary mt-2" onclick="cargarFavoritos()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            </div>
        `;
    }
    ocultarEstados();
}


// FUNCIONES DE UI (las otras funciones que ya tenías)


function mostrarEstadoCarga() {
    // Tu implementación existente
    const favoritosLista = document.getElementById('favoritosLista');
    const favoritosVacias = document.getElementById('favoritosVacias');

    if (favoritosLista) favoritosLista.innerHTML = '';
    if (favoritosVacias) favoritosVacias.style.display = 'none';
}

function mostrarFavoritos() {
    // Tu implementación existente para mostrar los favoritos
    const contenedor = document.getElementById('favoritosLista');
    const estadoVacio = document.getElementById('favoritosVacias');

    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (favoritos.length === 0) {
        if (estadoVacio) estadoVacio.style.display = 'block';
        actualizarContador(0);
        return;
    }

    if (estadoVacio) estadoVacio.style.display = 'none';
    actualizarContador(favoritos.length);

    // Mostrar cada favorito
    favoritos.forEach((favorito, index) => {
        if (favorito.esActivo) {
            const favoritoElement = crearElementoFavorito(favorito, index);
            contenedor.appendChild(favoritoElement);
        }
    });
}

function crearElementoFavorito(favorito, index) {
    // Tu implementación existente para crear el elemento HTML
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    col.innerHTML = `
        <div class="card producto-favorito h-100">
            <div class="position-relative">
                <img src="${favorito.producto.imagen}"
                     class="card-img-top producto-imagen"
                     alt="${favorito.producto.nombre}"
                     onerror="this.src='/images/placeholder.jpg'">
                ${!favorito.producto.disponible ? `
                    <div class="badge bg-danger position-absolute top-0 start-0 m-2">
                        No Disponible
                    </div>
                ` : ''}
                <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                        onclick="confirmarEliminarFavorito(${index})"
                        title="Eliminar de favoritos">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${favorito.producto.nombre}</h5>
                <p class="card-text text-muted small flex-grow-1">
                    ${favorito.producto.descripcion || 'Sin descripción'}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="producto-precio">${formatearPrecio(favorito.producto.precio)}</span>
                    <small class="text-muted">${formatearFecha(favorito.fechaAgregado)}</small>
                </div>
                <div class="mt-2">
                    <button class="btn btn-luren btn-sm w-100 ${!favorito.producto.disponible ? 'disabled' : ''}"
                            onclick="agregarAlCarrito(${index})"
                            ${!favorito.producto.disponible ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus me-2"></i>
                        ${favorito.producto.disponible ? 'Agregar al Carrito' : 'No Disponible'}
                    </button>
                </div>
            </div>
        </div>
    `;

    return col;
}


// MANEJO DE ERRORES GLOBAL

window.addEventListener('error', function(e) {
    console.error(' Error global:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error(' Promise rechazada no manejada:', e.reason);
    mostrarError('Error inesperado: ' + (e.reason?.message || 'Error desconocido'));
    e.preventDefault();
});

console.log(" Sistema de gestión de favoritos con validaciones cargado");