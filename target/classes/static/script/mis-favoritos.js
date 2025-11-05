// SISTEMA DE GESTIÓN DE FAVORITOS

// Estado global
let favoritos = [];
let productoAEliminar = null;
let modalConfirmacion = null;

// Configuración
const API_BASE_URL = '/favoritos/api/favoritos';
const MAX_FAVORITOS = 50;


document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando gestión de favoritos...");

    if (document.getElementById('favoritosLista')) {

        const modalElement = document.getElementById('modalConfirmarEliminacion');
        if (modalElement) {
            modalConfirmacion = new bootstrap.Modal(modalElement);
            console.log(" Modal de confirmación inicializado");
        }

        configurarEventListeners();
        cargarFavoritos();
        console.log(" Sistema de favoritos inicializado");
    }
});


function configurarEventListeners() {

    const btnLimpiar = document.getElementById('btnLimpiarFavoritos');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', confirmarLimpiarFavoritos);
    }

    // Botón confirmar eliminación en modal
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', eliminarFavoritoConfirmado);
    }

    console.log("Event listeners configurados");
}

// FUNCIONES PRINCIPALES
async function cargarFavoritos() {
    console.log(" Cargando productos favoritos...");

    try {
        mostrarEstadoCarga();

        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log(" Estado HTTP:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(" Error response:", errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(" Datos recibidos:", data);

        if (data && Array.isArray(data)) {
            favoritos = data.map(favorito => validarEstructuraFavorito(favorito));
            console.log(` ${favoritos.length} favoritos procesados correctamente`);
            mostrarFavoritos();
        } else {
            console.warn("Formato de datos inesperado:", data);
            favoritos = [];
            mostrarFavoritos();
        }

    } catch (error) {
        console.error(" Error cargando favoritos:", error);
        mostrarErrorCarga("Error al cargar los favoritos: " + error.message);
    }
}


async function confirmarLimpiarFavoritos() {
    if (favoritos.length === 0) {
        mostrarNotificacion('No hay favoritos para limpiar', 'warning');
        return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar todos tus productos favoritos?')) {
        await limpiarFavoritos();
    }
}

async function limpiarFavoritos() {
    try {
        console.log("🗑️ Limpiando todos los favoritos...");
        const csrfToken = document.getElementById('csrfToken')?.value;

        // Eliminar uno por uno usando el endpoint que funciona
        let eliminados = 0;
        for (const favorito of [...favoritos]) { // Copia del array para evitar problemas de iteración
            const response = await fetch('/favoritos/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                body: new URLSearchParams({
                    'productoId': favorito.producto.id,
                    '_csrf': csrfToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && !data.agregado) {
                    eliminados++;
                }
            }
        }

        console.log(" Favoritos eliminados:", eliminados);
        favoritos = [];
        mostrarFavoritos();
        mostrarNotificacion(`Se eliminaron ${eliminados} favoritos`, 'success');

    } catch (error) {
        console.error(" Error limpiando favoritos:", error);
        mostrarNotificacion('Error al limpiar los favoritos', 'error');
    }
}

function confirmarEliminarFavorito(index) {
    const favorito = favoritos[index];
    if (!favorito) {
        mostrarNotificacion('Favorito no encontrado', 'error');
        return;
    }

    productoAEliminar = {
        index,
        productoId: favorito.producto.id // Usar productoId en lugar de favorito.id
    };

    // Actualizar mensaje del modal
    const modalBody = document.querySelector('#modalConfirmarEliminacion .modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <p>¿Estás seguro de que quieres eliminar <strong>"${favorito.producto.nombre}"</strong> de tus favoritos?</p>
        `;
    }

    if (modalConfirmacion) {
        modalConfirmacion.show();
    }
}

async function eliminarFavoritoConfirmado() {
    if (!productoAEliminar) return;

    try {
        console.log("Eliminando favorito:", productoAEliminar);
        const csrfToken = document.getElementById('csrfToken')?.value;

        // USAR EL ENDPOINT QUE FUNCIONA EN MENU.JS
        const response = await fetch('/favoritos/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: new URLSearchParams({
                'productoId': productoAEliminar.productoId,
                '_csrf': csrfToken
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(" Favorito eliminado:", data);

        if (data.success && !data.agregado) {
            // Eliminar del array local
            favoritos.splice(productoAEliminar.index, 1);

            // Cerrar modal
            if (modalConfirmacion) {
                modalConfirmacion.hide();
            }

            // Actualizar vista
            mostrarFavoritos();
            mostrarNotificacion('Producto eliminado de favoritos', 'success');

            productoAEliminar = null;
        } else {
            throw new Error('No se pudo eliminar el favorito');
        }

    } catch (error) {
        console.error(" Error eliminando favorito:", error);
        mostrarNotificacion('Error al eliminar el favorito: ' + error.message, 'error');
    }
}



async function agregarAlCarrito(index) {
    const favorito = favoritos[index];
    if (!favorito || !favorito.producto.disponible) {
        mostrarNotificacion('Producto no disponible', 'warning');
        return;
    }

    try {
        console.log("🛒 Agregando al carrito:", favorito.producto.nombre);

        const csrfToken = document.getElementById('csrfToken')?.value;
        const boton = event?.target || document.querySelector(`[onclick="agregarAlCarrito(${index})"]`);

        // Guardar estado original del botón
        const textoOriginal = boton?.innerHTML;
        if (boton) {
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            boton.disabled = true;
        }

        const response = await fetch('/carrito/agregar-ajax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: new URLSearchParams({
                'productoId': favorito.producto.id,
                'cantidad': '1',
                '_csrf': csrfToken
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(" Producto agregado al carrito:", data);

        if (data.success) {
            mostrarNotificacion(` ${data.message} - ${data.productoNombre}`, 'success');

            // Actualizar botón temporalmente
            if (boton) {
                boton.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';

                // Restaurar después de 2 segundos
                setTimeout(() => {
                    if (boton) {
                        boton.innerHTML = textoOriginal;
                        boton.disabled = false;
                    }
                }, 2000);
            }

            // Actualizar contador del carrito en el header
            await actualizarContadorCarrito();

        } else {
            throw new Error(data.message || 'Error al agregar al carrito');
        }

    } catch (error) {
        console.error(" Error agregando al carrito:", error);
        mostrarNotificacion(` Error: ${error.message}`, 'error');

        // Restaurar botón en caso de error
        const boton = event?.target || document.querySelector(`[onclick="agregarAlCarrito(${index})"]`);
        if (boton) {
            boton.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Agregar al Carrito';
            boton.disabled = false;
        }
    }
}

// Función para actualizar contador del carrito
async function actualizarContadorCarrito() {
    try {
        const response = await fetch('/carrito/total');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Actualizar el botón del carrito en el header
                const carritoBtn = document.querySelector('.btn-success[th\\:href="@{/carrito}"]');
                if (carritoBtn) {
                    const totalSpan = carritoBtn.querySelector('span');
                    if (totalSpan) {
                        totalSpan.textContent = data.total.toFixed(2);
                    } else {
                        // Si no existe el span, actualizar el texto completo
                        carritoBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> S/. ${data.total.toFixed(2)}`;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error actualizando contador del carrito:", error);
    }
}



function toggleFavorito(productoId, event) {
    console.log(" Toggle favorito para producto:", productoId);

    const botonCorazon = event.currentTarget;
    const icono = botonCorazon.querySelector('i');


    const esFavorito = botonCorazon.classList.contains('active');

    if (esFavorito) {
        quitarDeFavoritos(productoId, botonCorazon, icono);
    } else {
        agregarAFavoritos(productoId, botonCorazon, icono);
    }
}

async function agregarAFavoritos(productoId, boton, icono) {
    try {
        console.log(" Agregando a favoritos:", productoId);
        const csrfToken = document.getElementById('csrfToken')?.value;

        const response = await fetch('/favoritos/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: new URLSearchParams({
                'productoId': productoId,
                '_csrf': csrfToken
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log(" Agregado a favoritos:", data);

        if (data.success && data.agregado) {
            boton.classList.add('active');
            icono.classList.remove('far');
            icono.classList.add('fas');
            mostrarNotificacion('Producto agregado a favoritos', 'success');


            if (document.getElementById('favoritosLista')) {
                cargarFavoritos();
            }
        } else {
            throw new Error('No se pudo agregar el favorito');
        }

    } catch (error) {
        console.error(" Error agregando a favoritos:", error);
        mostrarNotificacion('Error al agregar a favoritos', 'error');
    }
}

async function quitarDeFavoritos(productoId, boton, icono) {
    try {
        console.log(" Quitando de favoritos:", productoId);
        const csrfToken = document.getElementById('csrfToken')?.value;

        const response = await fetch('/favoritos/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include',
            body: new URLSearchParams({
                'productoId': productoId,
                '_csrf': csrfToken
            })
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log(" Eliminado de favoritos:", data);

        if (data.success && !data.agregado) {
            boton.classList.remove('active');
            icono.classList.remove('fas');
            icono.classList.add('far');
            mostrarNotificacion('Producto eliminado de favoritos', 'success');

            // Recargar lista de favoritos si estamos en la página de favoritos
            if (document.getElementById('favoritosLista')) {
                cargarFavoritos();
            }
        } else {
            throw new Error('No se pudo eliminar el favorito');
        }

    } catch (error) {
        console.error(" Error eliminando de favoritos:", error);
        mostrarNotificacion('Error al eliminar de favoritos', 'error');
    }
}

function inicializarCorazones() {
    document.querySelectorAll('.favorite-btn').forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const productoId = this.getAttribute('data-product-id');
            toggleFavorito(productoId, e);
        });
    });
}



// VALIDACIONES
function validarEstructuraFavorito(favorito) {
    if (!favorito || typeof favorito !== 'object') {
        console.warn(" Favorito inválido, usando valores por defecto");
        return crearFavoritoPorDefecto();
    }

    return {
        id: validarId(favorito.id),
        producto: validarProducto(favorito.producto),
        fechaAgregado: validarFecha(favorito.fechaAgregado),
        esActivo: validarBooleano(favorito.esActivo, true)
    };
}

function validarProducto(producto) {
    if (!producto || typeof producto !== 'object') {
        console.warn("Producto inválido en favorito");
        return {
            id: 0,
            nombre: 'Producto no disponible',
            precio: 0,
            imagen: '/archivos/placeholder.jpg',
            descripcion: '',
            disponible: false,
            categoria: '',
            tiempoPreparacion: 0
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

function validarId(id) {
    const num = Number(id);
    return isNaN(num) || num < 0 ? 0 : Math.floor(num);
}

function validarTexto(texto, valorPorDefecto = '') {
    if (typeof texto !== 'string') return valorPorDefecto;
    const textoLimpio = texto.trim();
    return escapeHTML(textoLimpio) || valorPorDefecto;
}

function validarPrecio(precio) {
    const num = Number(precio);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100) / 100;
}

function validarImagen(imagen) {
    if (!imagen || typeof imagen !== 'string') {
        return '/archivos/placeholder.jpg';
    }
    const imagenLimpia = imagen.trim();
    return imagenLimpia === '' ? '/archivos/placeholder.jpg' : imagenLimpia;
}

function validarFecha(fecha) {
    if (!fecha) return new Date().toISOString();
    try {
        const fechaObj = new Date(fecha);
        return isNaN(fechaObj.getTime()) ? new Date().toISOString() : fechaObj.toISOString();
    } catch (error) {
        console.warn(" Fecha inválida, usando fecha actual:", error);
        return new Date().toISOString();
    }
}

function validarBooleano(valor, valorPorDefecto = false) {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') return valor.toLowerCase() === 'true';
    if (typeof valor === 'number') return valor !== 0;
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
            imagen: '/archivos/placeholder.jpg',
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

// FUNCIONES DE UI
function mostrarEstadoCarga() {
    const favoritosLista = document.getElementById('favoritosLista');
    const favoritosVacias = document.getElementById('favoritosVacias');

    if (favoritosLista) {
        favoritosLista.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando tus favoritos...</p>
            </div>
        `;
    }
    if (favoritosVacias) favoritosVacias.style.display = 'none';
}

function mostrarFavoritos() {
    const contenedor = document.getElementById('favoritosLista');
    const estadoVacio = document.getElementById('favoritosVacias');

    console.log("Mostrando favoritos. Total:", favoritos.length);

    if (!contenedor) {
        console.error(" No se encontró el contenedor de favoritos");
        return;
    }

    contenedor.innerHTML = '';

    if (favoritos.length === 0) {
        console.log(" No hay favoritos para mostrar");
        if (estadoVacio) estadoVacio.style.display = 'block';
        actualizarContador(0);
        return;
    }

    if (estadoVacio) estadoVacio.style.display = 'none';
    actualizarContador(favoritos.length);

    favoritos.forEach((favorito, index) => {
        if (favorito.esActivo) {
            const favoritoElement = crearElementoFavorito(favorito, index);
            contenedor.appendChild(favoritoElement);
        }
    });
}

function crearElementoFavorito(favorito, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';

    col.innerHTML = `
        <div class="card producto-favorito h-100">
            <div class="position-relative">
                <img src="${favorito.producto.imagen}"
                     class="card-img-top producto-imagen"
                     alt="${favorito.producto.nombre}"
                     style="height: 200px; object-fit: cover;"
                     onerror="this.src='/archivos/placeholder.jpg'">
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
                    <span class="h5 text-success">${formatearPrecio(favorito.producto.precio)}</span>
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

function actualizarContador(cantidad) {
    const contador = document.getElementById('contadorFavoritos');
    if (contador) {
        contador.textContent = cantidad;
    }
}

function mostrarErrorCarga(mensaje) {
    const estadoCarga = document.getElementById('estadoCarga');
    const errorCarga = document.getElementById('errorCarga');
    const mensajeError = document.getElementById('mensajeError');

    if (estadoCarga) estadoCarga.style.display = 'none';
    if (errorCarga) errorCarga.style.display = 'block';
    if (mensajeError) mensajeError.textContent = mensaje;
}


function mostrarNotificacion(mensaje, tipo = 'info') {
    // Remover notificación anterior si existe
    const notificacionAnterior = document.querySelector('.notificacion-flotante');
    if (notificacionAnterior) {
        notificacionAnterior.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-flotante notificacion-${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-contenido">
            <span class="notificacion-texto">${mensaje}</span>
            <button class="notificacion-cerrar">&times;</button>
        </div>
    `;

    let backgroundColor, textColor, borderColor;

    switch(tipo) {
        case 'success':
            backgroundColor = '#d4edda';
            textColor = '#155724';
            borderColor = '#c3e6cb';
            break;
        case 'error':
            backgroundColor = '#f8d7da';
            textColor = '#721c24';
            borderColor = '#f5c6cb';
            break;
        case 'warning':
            backgroundColor = '#fff3cd';
            textColor = '#856404';
            borderColor = '#ffeaa7';
            break;
        default: // info
            backgroundColor = '#d1ecf1';
            textColor = '#0c5460';
            borderColor = '#bee5eb';
    }

    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: ${textColor};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        border: 1px solid ${borderColor};
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;

    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificacion.remove(), 300);
    };

    document.body.appendChild(notificacion);

    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 4000);
}

// CSS para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notificacion-cerrar {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        color: inherit;
    }
    .notificacion-contenido {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    @media (max-width: 768px) {
        .notificacion-flotante {
            left: 10px;
            right: 10px;
            max-width: none;
        }
    }
`;
document.head.appendChild(style);

// Debug global
window.debugFavoritos = {
    getFavoritos: () => favoritos,
    recargar: () => cargarFavoritos(),
    verEstado: () => {
        console.log(" Estado actual:", {
            favoritosEnMemoria: favoritos,
            contenedor: document.getElementById('favoritosLista'),
            estadoVacio: document.getElementById('favoritosVacias')?.style.display
        });
    }
};

// Inicializar corazones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarCorazones();
    console.log(" Corazones de favoritos inicializados");
});

console.log(" Sistema de gestión de favoritos cargado correctamente");