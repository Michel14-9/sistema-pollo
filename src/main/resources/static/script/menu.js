// menu.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MENÚ - INICIADO ===');

    // Inicializar funcionalidades
    function inicializarMenu() {
        configurarAgregarCarrito();
        configurarFiltrosCategorias();
        configurarAnimaciones();
        configurarNavegacionSuave();
        actualizarContadorCarrito();
    }

    // Configurar eventos para agregar al carrito
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

    // Función para agregar producto al carrito usando AJAX
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
                // Éxito
                mostrarNotificacion(` ${data.message} - ${data.productoNombre}`, 'success');
                boton.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';

                // Actualizar contador del carrito
                await actualizarContadorCarrito();

                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    boton.innerHTML = textoOriginal;
                    boton.disabled = false;
                }, 2000);

            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(` ${error.message}`, 'error');

            // Restaurar botón
            const boton = formElement.querySelector('.agregar-carrito-btn');
            boton.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
            boton.disabled = false;
        }
    }

    // Actualizar contador del carrito en el navbar
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
            background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            border: 1px solid ${tipo === 'success' ? '#c3e6cb' : tipo === 'error' ? '#f5c6cb' : '#bee5eb'};
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

    // Configurar filtros de categorías
    function configurarFiltrosCategorias() {
        const categoryTabs = document.querySelectorAll('.category-tab');

        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();

                // Remover clase activa de todos los tabs
                categoryTabs.forEach(t => t.classList.remove('active'));

                // Agregar clase activa al tab clickeado
                this.classList.add('active');

                // Scroll suave a la sección
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Configurar navegación suave
    function configurarNavegacionSuave() {
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Configurar animaciones
    function configurarAnimaciones() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Observar cards de productos
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });

        // Observar títulos de categorías
        const categoryTitles = document.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            title.style.opacity = '0';
            title.style.transform = 'translateX(-20px)';
            title.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(title);
        });
    }

    // Efectos hover para cards
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

    // CSS dinámico para animaciones
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

        .category-tab.active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }

        .product-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
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
        }
    `;
    document.head.appendChild(style);
});

// Utilidades globales
window.MenuUtils = {
    // Agregar producto al carrito manualmente
    agregarProducto: function(productoId, cantidad = 1) {
        const form = document.querySelector(`[name="productoId"][value="${productoId}"]`)?.closest('form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    },

    // Ir al carrito
    irAlCarrito: function() {
        window.location.href = '/carrito';
    },

    // Actualizar carrito
    actualizarCarrito: function() {
        actualizarContadorCarrito();
    }
};

console.log('Menu cargado - Utilidades disponibles en window.MenuUtils');