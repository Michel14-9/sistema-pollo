// carrito.js - Versión final corregida
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CARRITO - INICIADO ===');
    inicializarCarrito();
});

//  Inicializar carrito
function inicializarCarrito() {
    configurarModalConfirmacion();
    console.log('Carrito inicializado');
}

//  Configurar modal de confirmación
function configurarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacion');
    if (modal) {
        window.carritoModal = new bootstrap.Modal(modal);
    }
}

//  Actualizar cantidad
async function actualizarCantidad(boton, cambio) {
    console.log('Actualizando cantidad...', cambio);

    const itemId = boton.getAttribute('data-item-id');
    const cantidadDisplay = boton.parentElement.querySelector('.cantidad-display');
    let cantidadActual = parseInt(cantidadDisplay.textContent) || 1;
    let nuevaCantidad = cantidadActual + cambio;

    // Validaciones básicas
    if (nuevaCantidad < 1) {
        mostrarNotificacion(' La cantidad mínima es 1', 'error');
        return;
    }

    if (nuevaCantidad > 50) {
        mostrarNotificacion(' La cantidad máxima es 50', 'error');
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

        //  SOLO ACTUALIZAR EN EL SERVIDOR
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
            console.log(' Cantidad actualizada en servidor, recargando...');
            mostrarNotificacion(' Cantidad actualizada', 'success');

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
        mostrarNotificacion(' Error al actualizar cantidad', 'error');

        // Revertir visualmente
        cantidadDisplay.textContent = cantidadActual;
    } finally {
        // Restaurar botón
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

//  Eliminar producto
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

                //  SOLO ELIMINAR EN EL SERVIDOR
                const response = await fetch(`/carrito/eliminar/${itemId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });

                if (response.ok) {
                    console.log(' Producto eliminado, recargando...');

                    // Animación de eliminación
                    productoItem.style.animation = 'fadeOut 0.3s ease-out';
                    mostrarNotificacion(' Producto eliminado', 'success');

                    setTimeout(() => {
                        //  RECARGAR para que Spring Boot actualice todo
                        window.location.reload();
                    }, 1000);

                } else {
                    throw new Error('Error al eliminar producto');
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion(' Error al eliminar producto', 'error');
            } finally {
                boton.disabled = false;
                boton.innerHTML = '<i class="fas fa-trash"></i>';
            }
        }
    );
}


//   Vaciar carrito con POST
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

                //   POST
                const response = await fetch('/carrito/vaciar', {
                    method: 'POST', // ← Cambiado a POST
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        '_csrf': csrfToken
                    })
                });

                if (response.ok) {
                    console.log(' Carrito vaciado, recargando...');

                    // Animación para vaciar carrito
                    productos.forEach((producto, index) => {
                        setTimeout(() => {
                            producto.style.animation = 'slideOutLeft 0.3s ease-out';
                        }, index * 100);
                    });

                    mostrarNotificacion(' Carrito vaciado', 'success');

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

//  Mostrar modal de confirmación (CORREGIDO)
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

// Mostrar notificaciones
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

    // Estilos para la notificación
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : tipo === 'info' ? '#d1ecf1' : '#fff3cd'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : tipo === 'info' ? '#0c5460' : '#856404'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        border: 1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : tipo === 'info' ? '#bee5eb' : '#ffeaa7'};
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;

    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificacion.remove(), 300);
    };

    document.body.appendChild(notificacion);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 4000);
}

//  CSS dinámico para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }

    @keyframes slideOutLeft {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
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

    .cantidad-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .eliminar-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

console.log('Carrito cargado - Listo para usar');