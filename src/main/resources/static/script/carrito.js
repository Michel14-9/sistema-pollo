// carrito.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CARRITO - INICIADO ===');
    inicializarCarrito();
});

// Inicializar carrito
function inicializarCarrito() {
    configurarModalConfirmacion();
    configurarEventListeners();
    console.log('Carrito inicializado');
}

// Configurar modal de confirmación
function configurarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    if (modal) {
        window.carritoModal = new bootstrap.Modal(modal);
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Event delegation para botones de cantidad
    document.addEventListener('click', function(e) {
        // Botones aumentar cantidad
        if (e.target.closest('.cantidad-btn.aumentar')) {
            const boton = e.target.closest('.cantidad-btn.aumentar');
            actualizarCantidad(boton, 1);
        }

        // Botones disminuir cantidad
        if (e.target.closest('.cantidad-btn.disminuir')) {
            const boton = e.target.closest('.cantidad-btn.disminuir');
            actualizarCantidad(boton, -1);
        }

        // Botones eliminar producto
        if (e.target.closest('.eliminar-btn')) {
            const boton = e.target.closest('.eliminar-btn');
            eliminarProducto(boton);
        }
    });

    // Botón vaciar carrito
    const btnVaciar = document.querySelector('.btn-vaciar-carrito');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', vaciarCarrito);
    }
}

// Actualizar cantidad
async function actualizarCantidad(boton, cambio) {
    console.log('Actualizando cantidad...', cambio);

    const itemId = boton.getAttribute('data-item-id');
    const cantidadDisplay = boton.parentElement.querySelector('.cantidad-display');
    let cantidadActual = parseInt(cantidadDisplay.textContent) || 1;
    let nuevaCantidad = cantidadActual + cambio;

    // Validaciones básicas
    if (nuevaCantidad < 1) {
        mostrarNotificacion('La cantidad mínima es 1', 'error');
        return;
    }

    if (nuevaCantidad > 50) {
        mostrarNotificacion('La cantidad máxima es 50', 'error');
        return;
    }

    try {
        // Mostrar loading
        boton.disabled = true;
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        console.log(`Actualizando item ${itemId} a cantidad ${nuevaCantidad}`);

        // Obtener CSRF token
        const csrfToken = document.getElementById('csrfToken')?.value;
        if (!csrfToken) {
            throw new Error('Token de seguridad no encontrado');
        }

        // SOLO ACTUALIZAR EN EL SERVIDOR
        const response = await fetch(`/carrito/actualizar/${itemId}?cantidad=${nuevaCantidad}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                '_csrf': csrfToken
            })
        });

        if (response.ok) {
            console.log('Cantidad actualizada en servidor, recargando...');
            mostrarNotificacion('Cantidad actualizada', 'success');

            // Pequeño delay para mostrar la notificación antes de recargar
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error('Error al actualizar cantidad');
        }

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');

        // Revertir visualmente
        cantidadDisplay.textContent = cantidadActual;
    } finally {
        // Restaurar botón
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

// Eliminar producto
async function eliminarProducto(boton) {
    const itemId = boton.getAttribute('data-item-id');
    const productoItem = boton.closest('.producto-item');
    const productoNombre = productoItem.querySelector('.producto-nombre').textContent;

    console.log('Eliminando producto:', productoNombre);

    mostrarModalConfirmacion(
        `¿Estás seguro de eliminar "${productoNombre}" del carrito?`,
        async () => {
            try {
                boton.disabled = true;
                boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                // SOLO ELIMINAR EN EL SERVIDOR
                const response = await fetch(`/carrito/eliminar/${itemId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });

                if (response.ok) {
                    console.log('Producto eliminado, recargando...');

                    // Animación de eliminación usando clases CSS
                    productoItem.classList.add('animacion-eliminar');
                    mostrarNotificacion('Producto eliminado', 'success');

                    setTimeout(() => {
                        // RECARGAR para que Spring Boot actualice todo
                        window.location.reload();
                    }, 1000);

                } else {
                    throw new Error('Error al eliminar producto');
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al eliminar producto', 'error');
            } finally {
                boton.disabled = false;
                boton.innerHTML = '<i class="fas fa-trash"></i>';
            }
        }
    );
}

// Vaciar carrito con POST
async function vaciarCarrito() {
    const productos = document.querySelectorAll('.producto-item');
    if (productos.length === 0) {
        mostrarNotificacion('🛒 El carrito ya está vacío', 'info');
        return;
    }

    console.log('Vaciando carrito...');

    mostrarModalConfirmacion(
        '¿Estás seguro de vaciar todo el carrito? Esta acción no se puede deshacer.',
        async () => {
            try {
                // Obtener CSRF token
                const csrfToken = document.getElementById('csrfToken')?.value;
                if (!csrfToken) {
                    throw new Error('Token de seguridad no encontrado');
                }

                // POST
                const response = await fetch('/carrito/vaciar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        '_csrf': csrfToken
                    })
                });

                if (response.ok) {
                    console.log('Carrito vaciado, recargando...');

                    // Animación para vaciar carrito usando clases CSS
                    productos.forEach((producto, index) => {
                        setTimeout(() => {
                            producto.classList.add('animacion-vaciar');
                        }, index * 100);
                    });

                    mostrarNotificacion('Carrito vaciado', 'success');

                    // RECARGAR después de la animación
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);

                } else {
                    const errorText = await response.text();
                    console.error('Error del servidor:', errorText);
                    throw new Error('Error al vaciar carrito: ' + errorText);
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion(' ' + error.message, 'error');
            }
        }
    );
}

// Mostrar modal de confirmación
function mostrarModalConfirmacion(mensaje, callbackConfirmar) {
    const modal = document.getElementById('modalConfirmacion');
    const modalMensaje = document.getElementById('modalMensaje');
    const btnConfirmar = document.getElementById('btnConfirmarAccion');

    if (!modal || !modalMensaje || !btnConfirmar) {
        // Fallback: usar confirm nativo
        if (confirm(mensaje)) {
            callbackConfirmar();
        }
        return;
    }

    // Configurar el mensaje
    modalMensaje.textContent = mensaje;

    // Remover event listeners anteriores y agregar uno nuevo
    const nuevoBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(nuevoBtnConfirmar, btnConfirmar);

    // Configurar el evento
    nuevoBtnConfirmar.onclick = function() {
        if (window.carritoModal) {
            window.carritoModal.hide();
        }
        callbackConfirmar();
    };

    // Mostrar el modal
    if (window.carritoModal) {
        window.carritoModal.show();
    }
}

// Mostrar notificaciones (versión CSP compliant)
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

    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.classList.add('notificacion-salida');
        setTimeout(() => notificacion.remove(), 300);
    };

    document.body.appendChild(notificacion);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.classList.add('notificacion-salida');
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 4000);
}

console.log('Carrito cargado - Listo para usar (CSP Compliant)');