// menu.js - VERSIÓN CORREGIDA COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MENÚ - INICIADO ===');

    // Inicializar funcionalidades
    function inicializarMenu() {
        configurarAgregarCarrito();
        configurarFavoritos(); // ← NUEVA FUNCIÓN
        configurarFiltrosCategorias();
        configurarAnimaciones();
        configurarNavegacionSuave();
        actualizarContadorCarrito();
        cargarEstadoFavoritos(); // ← NUEVA FUNCIÓN
    }

    // ========== CONFIGURACIÓN DE FAVORITOS ==========

    // Configurar eventos para favoritos
    function configurarFavoritos() {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');

        favoriteButtons.forEach(button => {
            // Remover onclick del HTML si existe para evitar conflictos
            button.removeAttribute('onclick');

            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const productId = this.getAttribute('data-product-id');
                toggleFavorito(productId, this);
            });
        });
    }

    // Función principal para toggle favorito
    async function toggleFavorito(productId, button) {
        try {
            const csrfToken = document.getElementById('csrfToken').value;
            const heartIcon = button.querySelector('i');

            // Verificar si el usuario está autenticado - RUTA CORREGIDA
            const isAuthenticated = await verificarAutenticacion();
            if (!isAuthenticated) {
                mostrarNotificacion('⚠️ Debes iniciar sesión para agregar favoritos', 'warning');
                // Opcional: redirigir al login
                // window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                return;
            }

            // Mostrar estado de carga
            button.disabled = true;
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
                // Actualizar icono según el estado
                if (data.agregado) {
                    heartIcon.className = 'fas fa-heart';
                    button.classList.add('favorito-activo');
                    mostrarNotificacion('❤️ Agregado a favoritos', 'success');
                } else {
                    heartIcon.className = 'far fa-heart';
                    button.classList.remove('favorito-activo');
                    mostrarNotificacion('💔 Eliminado de favoritos', 'info');
                }

                // Actualizar contador de favoritos en la UI si existe
                actualizarContadorFavoritos();

            } else {
                throw new Error(data.message || 'Error al actualizar favoritos');
            }

        } catch (error) {
            console.error('Error en toggleFavorito:', error);
            mostrarNotificacion(`❌ ${error.message}`, 'error');

            // Restaurar estado anterior
            const heartIcon = button.querySelector('i');
            heartIcon.className = 'far fa-heart';
            button.classList.remove('favorito-activo');
        } finally {
            button.disabled = false;
        }
    }

    // Verificar si el usuario está autenticado - CORREGIDO
    async function verificarAutenticacion() {
        try {
            // CAMBIAR ESTA RUTA según tu configuración
            const response = await fetch('/favoritos/api/auth/check'); // ← RUTA CORREGIDA
            const data = await response.json();
            return data.authenticated;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    // Cargar estado inicial de favoritos
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

    // Actualizar contador de favoritos en la UI
    async function actualizarContadorFavoritos() {
        try {
            const favoritosCounter = document.querySelector('#favoritos-counter');
            const favoritosCounterMobile = document.querySelector('#favoritos-counter-mobile');

            if (!favoritosCounter && !favoritosCounterMobile) return;

            const response = await fetch('/favoritos/count');
            const data = await response.json();

            if (data.success) {
                const count = data.count;

                // Actualizar contador desktop
                if (favoritosCounter) {
                    favoritosCounter.textContent = count;
                    favoritosCounter.style.display = count > 0 ? 'inline' : 'none';
                }

                // Actualizar contador móvil
                if (favoritosCounterMobile) {
                    favoritosCounterMobile.textContent = count;
                    favoritosCounterMobile.style.display = count > 0 ? 'inline' : 'none';
                }
            }
        } catch (error) {
            console.error('Error actualizando contador de favoritos:', error);
        }
    }

    // ========== CONFIGURACIÓN DEL CARRITO (tu código existente) ==========

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

            // Mostrar loading
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            boton.disabled = true;

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
                mostrarNotificacion(`✅ ${data.message} - ${data.productoNombre}`, 'success');
                boton.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                await actualizarContadorCarrito();

                setTimeout(() => {
                    boton.innerHTML = textoOriginal;
                    boton.disabled = false;
                }, 2000);

            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(`❌ ${error.message}`, 'error');
            const boton = formElement.querySelector('.agregar-carrito-btn');
            boton.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
            boton.disabled = false;
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

    // ========== FUNCIÓN MOSTRAR NOTIFICACIÓN CORREGIDA ==========

    function mostrarNotificacion(mensaje, tipo = 'info') {
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

        // CORREGIDO: Error de variable 'type' que no existe
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

    // ========== FUNCIONES EXISTENTES ==========

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
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });

        const categoryTitles = document.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            title.style.opacity = '0';
            title.style.transform = 'translateX(-20px)';
            title.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(title);
        });
    }

    function configurarEfectosHover() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            });
        });
    }

    // Inicializar todas las funcionalidades
    inicializarMenu();
    configurarEfectosHover();

    // CSS dinámico para animaciones y estilos de favoritos
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

        @keyframes heartBeat {
            0% { transform: scale(1); }
            25% { transform: scale(1.3); }
            50% { transform: scale(1); }
            75% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .category-tab.active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }

        .product-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
        }

        .favorite-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: all 0.3s ease;
        }

        .favorite-btn:hover {
            background: white;
            transform: scale(1.1);
        }

        .favorite-btn:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        .favorito-activo i {
            color: #dc3545;
            animation: heartBeat 0.6s ease;
        }

        .favorite-btn i {
            font-size: 1.2rem;
            transition: color 0.3s ease;
        }

        .agregar-carrito-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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

        /* Responsive */
        @media (max-width: 768px) {
            .notificacion-flotante {
                left: 10px;
                right: 10px;
                max-width: none;
            }

            .favorite-btn {
                width: 35px;
                height: 35px;
            }

            .favorite-btn i {
                font-size: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
});

// Utilidades globales - MANTENIDAS
window.MenuUtils = {
    // Agregar producto al carrito manualmente
    agregarProducto: function(productoId, cantidad = 1) {
        const form = document.querySelector(`[name="productoId"][value="${productoId}"]`)?.closest('form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    },

    // Agregar/eliminar favorito
    toggleFavorito: function(productoId) {
        const button = document.querySelector(`.favorite-btn[data-product-id="${productoId}"]`);
        if (button) {
            button.click();
        }
    },

    // Ir al carrito
    irAlCarrito: function() {
        window.location.href = '/carrito';
    },

    // Ir a favoritos
    irAFavoritos: function() {
        window.location.href = '/favoritos';
    },

    // Actualizar carrito
    actualizarCarrito: function() {
        actualizarContadorCarrito();
    }
};

// Función global para compatibilidad con onclick del HTML
window.toggleFavorito = async function(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const button = event?.currentTarget || document.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
    if (button) {
        const clickEvent = new Event('click');
        button.dispatchEvent(clickEvent);
    }
};

console.log('Menu cargado - Utilidades disponibles en window.MenuUtils');