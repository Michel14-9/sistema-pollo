// menu.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MENÚ - INICIADO (100% CSP Compliant) ===');

    // Inicializar funcionalidades
    function inicializarMenu() {
        configurarAgregarCarrito();
        configurarFavoritos();
        configurarFiltrosCategorias();
        configurarAnimaciones();
        configurarNavegacionSuave();
        actualizarContadorCarrito();
        cargarEstadoFavoritos();
    }



    function configurarFavoritos() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');

        favoriteButtons.forEach(button => {
            button.removeAttribute('onclick');
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const productId = this.getAttribute('data-product-id');
                toggleFavorito(productId, this);
            });
        });
    }

    async function toggleFavorito(productId, button) {
        try {
            const csrfToken = document.getElementById('csrfToken').value;
            const heartIcon = button.querySelector('i');

            const isAuthenticated = await verificarAutenticacion();
            if (!isAuthenticated) {
                mostrarNotificacion(' Debes iniciar sesión para agregar favoritos', 'warning');
                return;
            }

            // Estado de carga usando clases CSS
            button.disabled = true;
            button.classList.add('btn-loading');
            heartIcon.className = 'fas fa-spinner fa-spin';

            const response = await fetch('/favoritos/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'productoId': productId,
                    '_csrf': csrfToken
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.agregado) {
                    heartIcon.className = 'fas fa-heart';
                    button.classList.add('favorito-activo');
                    mostrarNotificacion('️ Agregado a favoritos', 'success');
                } else {
                    heartIcon.className = 'far fa-heart';
                    button.classList.remove('favorito-activo');
                    mostrarNotificacion(' Eliminado de favoritos', 'info');
                }
                actualizarContadorFavoritos();
            } else {
                throw new Error(data.message || 'Error al actualizar favoritos');
            }

        } catch (error) {
            console.error('Error en toggleFavorito:', error);
            mostrarNotificacion(`${error.message}`, 'error');

            const heartIcon = button.querySelector('i');
            heartIcon.className = 'far fa-heart';
            button.classList.remove('favorito-activo');
        } finally {
            button.disabled = false;
            button.classList.remove('btn-loading');
        }
    }

    async function verificarAutenticacion() {
        try {
            const response = await fetch('/favoritos/api/auth/check');
            const data = await response.json();
            return data.authenticated;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    async function cargarEstadoFavoritos() {
        try {
            const isAuthenticated = await verificarAutenticacion();
            if (!isAuthenticated) return;

            const response = await fetch('/favoritos/listar');
            const data = await response.json();

            if (data.success && data.favoritos) {
                data.favoritos.forEach(favorito => {
                    const button = document.querySelector(`.favorite-btn[data-product-id="${favorito.id}"]`);
                    if (button) {
                        const heartIcon = button.querySelector('i');
                        heartIcon.className = 'fas fa-heart';
                        button.classList.add('favorito-activo');
                    }
                });
            }
        } catch (error) {
            console.error('Error cargando favoritos:', error);
        }
    }

    async function actualizarContadorFavoritos() {
        try {
            const favoritosCounter = document.querySelector('#favoritos-counter');
            const favoritosCounterMobile = document.querySelector('#favoritos-counter-mobile');

            if (!favoritosCounter && !favoritosCounterMobile) return;

            const response = await fetch('/favoritos/count');
            const data = await response.json();

            if (data.success) {
                const count = data.count;

                if (favoritosCounter) {
                    favoritosCounter.textContent = count;
                    if (count > 0) {
                        favoritosCounter.classList.remove('contador-oculto');
                        favoritosCounter.classList.add('contador-visible');
                    } else {
                        favoritosCounter.classList.add('contador-oculto');
                        favoritosCounter.classList.remove('contador-visible');
                    }
                }

                if (favoritosCounterMobile) {
                    favoritosCounterMobile.textContent = count;
                    if (count > 0) {
                        favoritosCounterMobile.classList.remove('contador-oculto');
                        favoritosCounterMobile.classList.add('contador-visible');
                    } else {
                        favoritosCounterMobile.classList.add('contador-oculto');
                        favoritosCounterMobile.classList.remove('contador-visible');
                    }
                }
            }
        } catch (error) {
            console.error('Error actualizando contador de favoritos:', error);
        }
    }

    // ========== CONFIGURACIÓN DEL CARRITO ==========

    function configurarAgregarCarrito() {
        const forms = document.querySelectorAll('.agregar-carrito-form');

        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const productoId = formData.get('productoId');
                const cantidad = formData.get('cantidad');
                agregarAlCarritoAjax(productoId, cantidad, this);
            });
        });
    }

    async function agregarAlCarritoAjax(productoId, cantidad, formElement) {
        try {
            const csrfToken = document.getElementById('csrfToken').value;
            const boton = formElement.querySelector('.agregar-carrito-btn');
            const textoOriginal = boton.innerHTML;

            // Estado de carga usando clases CSS
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            boton.disabled = true;
            boton.classList.add('btn-loading');

            const response = await fetch('/carrito/agregar-ajax', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'productoId': productoId,
                    'cantidad': cantidad,
                    '_csrf': csrfToken
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarNotificacion(` ${data.message} - ${data.productoNombre}`, 'success');
                boton.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                boton.classList.remove('btn-loading');
                boton.classList.add('btn-success');

                await actualizarContadorCarrito();

                setTimeout(() => {
                    boton.innerHTML = textoOriginal;
                    boton.disabled = false;
                    boton.classList.remove('btn-success');
                }, 2000);

            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(` ${error.message}`, 'error');
            const boton = formElement.querySelector('.agregar-carrito-btn');
            boton.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
            boton.disabled = false;
            boton.classList.remove('btn-loading');
            boton.classList.add('btn-error');

            setTimeout(() => {
                boton.classList.remove('btn-error');
            }, 2000);
        }
    }

    async function actualizarContadorCarrito() {
        try {
            const response = await fetch('/carrito/total');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const carritoBtn = document.querySelector('.carrito-btn');
                    if (carritoBtn) {
                        const totalSpan = carritoBtn.querySelector('span');
                        if (totalSpan) {
                            totalSpan.textContent = data.total.toFixed(2);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error al actualizar contador del carrito:', error);
        }
    }



    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacionAnterior = document.querySelector('.notificacion-flotante');
        if (notificacionAnterior) {
            cerrarNotificacion(notificacionAnterior);
        }

        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-flotante notificacion-${tipo}`;
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-texto">${mensaje}</span>
                <button class="notificacion-cerrar" aria-label="Cerrar notificación">&times;</button>
            </div>
        `;

        const btnCerrar = notificacion.querySelector('.notificacion-cerrar');
        btnCerrar.addEventListener('click', () => cerrarNotificacion(notificacion));

        document.body.appendChild(notificacion);

        // Mostrar con animación usando clase CSS
        setTimeout(() => {
            notificacion.classList.add('notificacion-visible');
        }, 10);

        // Auto-cerrar después de 4 segundos
        setTimeout(() => {
            cerrarNotificacion(notificacion);
        }, 4000);
    }

    function cerrarNotificacion(notificacion) {
        if (!notificacion || !notificacion.parentNode) return;

        notificacion.classList.remove('notificacion-visible');
        notificacion.classList.add('notificacion-salida');

        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    }



    function configurarFiltrosCategorias() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                categoryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    function configurarNavegacionSuave() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }



    function configurarAnimaciones() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animacion-visible');
                    entry.target.classList.remove('animacion-oculta');
                }
            });
        }, { threshold: 0.1 });

        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.classList.add('animacion-oculta');
            observer.observe(card);
        });

        const categoryTitles = document.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            title.classList.add('animacion-oculta-titulo');
            observer.observe(title);
        });
    }

    function configurarEfectosHover() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('card-hover');
            });
            card.addEventListener('mouseleave', function() {
                this.classList.remove('card-hover');
            });
        });
    }



    inicializarMenu();
    configurarEfectosHover();

    console.log(' Menu.js cargado - 100% CSP Compliant');
});



window.MenuUtils = {
    agregarProducto: function(productoId, cantidad = 1) {
        const form = document.querySelector(`[name="productoId"][value="${productoId}"]`)?.closest('form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    },

    toggleFavorito: function(productoId) {
        const button = document.querySelector(`.favorite-btn[data-product-id="${productoId}"]`);
        if (button) {
            button.click();
        }
    },

    irAlCarrito: function() {
        window.location.href = '/carrito';
    },

    irAFavoritos: function() {
        window.location.href = '/favoritos';
    },

    actualizarCarrito: async function() {
        const response = await fetch('/carrito/total');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const carritoBtn = document.querySelector('.carrito-btn');
                if (carritoBtn) {
                    const totalSpan = carritoBtn.querySelector('span');
                    if (totalSpan) {
                        totalSpan.textContent = data.total.toFixed(2);
                    }
                }
            }
        }
    }
};

// Función global para compatibilidad
window.toggleFavorito = async function(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const button = event?.currentTarget || document.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
    if (button) {
        button.click();
    }
};

console.log(' MenuUtils disponible globalmente');