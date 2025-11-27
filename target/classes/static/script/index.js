// index.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== LUREN CHICKEN - INICIO ===');

    function inicializarPaginaInicio() {
        cargarCombosEnCarrusel();
        configurarCarruselAutoplay();
        configurarScrollSuave();
        configurarAnimacionesScroll();
        actualizarContadorCarrito();
        configurarHoverCategorias();
    }

    // ========== CARGAR COMBOS EN CARRUSEL ==========
    async function cargarCombosEnCarrusel() {
        try {
            console.log(' Cargando combos desde /api/combos...');

            const response = await fetch('/api/combos');

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const combos = await response.json();
            console.log(` ${combos.length} combos cargados exitosamente`);

            if (combos.length > 0) {
                mostrarCombosEnCarrusel(combos);
            } else {
                mostrarCarruselFallback();
            }

        } catch (error) {
            console.error(' Error cargando combos:', error);
            mostrarCarruselFallback();
        }
    }

    function mostrarCombosEnCarrusel(combos) {
        const carouselInner = document.getElementById('combos-inner');
        const carouselIndicators = document.getElementById('combos-indicators');

        if (!carouselInner || !carouselIndicators) {
            console.error(' No se encontraron elementos del carrusel');
            return;
        }

        // Limpiar contenido existente
        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';

        // Agrupar combos en grupos de 3 para el carrusel
        const comboGroups = [];
        for (let i = 0; i < combos.length; i += 3) {
            comboGroups.push(combos.slice(i, i + 3));
        }

        console.log(` Creando ${comboGroups.length} slides para el carrusel`);

        // Generar indicadores
        comboGroups.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.type = 'button';
            indicator.dataset.bsTarget = '#combosCarousel';
            indicator.dataset.bsSlideTo = index;
            indicator.ariaLabel = `Slide ${index + 1}`;
            if (index === 0) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            }

            carouselIndicators.appendChild(indicator);
        });

        // Generar slides
        comboGroups.forEach((group, groupIndex) => {
            const slide = document.createElement('div');
            slide.className = `carousel-item ${groupIndex === 0 ? 'active' : ''}`;

            let combosHTML = '<div class="row justify-content-center">';

            group.forEach(combo => {
                const imagenUrl = combo.imagenUrl || '/imagenes/default-product.jpg';
                const descripcion = combo.descripcion || 'Delicioso combo preparado con los mejores ingredientes';


                combosHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="combo-card h-100">
                            <div class="position-relative">
                                <img src="${imagenUrl}"
                                     alt="${combo.nombre}"
                                     class="combo-image-carousel img-fluid"
                                     onerror="this.src='/imagenes/default-product.jpg'">
                                <div class="combo-badge">COMBO</div>
                            </div>
                            <div class="combo-content p-3">
                                <h4 class="combo-title">${combo.nombre}</h4>
                                <p class="combo-description">${descripcion}</p>
                                <div class="price-section d-flex justify-content-between align-items-center mb-3">
                                    <div class="price-left">
                                        <span class="current-price text-success fw-bold">S/ ${combo.precio.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button class="btn btn-success w-100 agregar-combo-btn"
                                        onclick="agregarAlCarritoDesdeIndex(${combo.id})"
                                        data-producto-id="${combo.id}">
                                    <i class="fas fa-cart-plus me-2"></i>AGREGAR AL PEDIDO
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            combosHTML += '</div>';
            slide.innerHTML = combosHTML;
            carouselInner.appendChild(slide);
        });

        console.log(' Carrusel de combos actualizado con productos reales');
    }

    function mostrarCarruselFallback() {
        const carouselInner = document.getElementById('combos-inner');
        const carouselIndicators = document.getElementById('combos-indicators');

        if (!carouselInner) return;

        // Limpiar indicadores
        if (carouselIndicators) {
            carouselIndicators.innerHTML = `
                <button type="button" data-bs-target="#combosCarousel" data-bs-slide-to="0" class="active" aria-current="true"></button>
            `;
        }

        // Mostrar mensaje de fallback
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="row">
                    <div class="col-12 text-center py-5">
                        <div class="alert alert-info border-0">
                            <i class="fas fa-utensils fa-3x mb-3 text-orange"></i>
                            <h4>Próximamente Nuevos Combos</h4>
                            <p class="mb-3">Estamos preparando deliciosos combos especiales para ti.</p>
                            <a href="/menu" class="btn btn-primary">
                                <i class="fas fa-utensils me-2"></i>Ver Menú Completo
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log(' Mostrando carrusel de respaldo');
    }

    // ========== CONFIGURAR CARRUSEL ==========
    function configurarCarruselAutoplay() {
        const carousel = document.getElementById('combosCarousel');
        if (!carousel) return;

        const bsCarousel = new bootstrap.Carousel(carousel, {
            interval: 5000,
            wrap: true,
            pause: 'hover'
        });

        console.log(' Carrusel configurado con autoplay');
    }

    // ========== AGREGAR AL CARRITO ==========
    window.agregarAlCarritoDesdeIndex = async function(productoId) {
        try {
            console.log(' Agregando producto al carrito desde index:', productoId);

            // Obtener token CSRF
            const csrfToken = document.getElementById('csrfToken')?.value;

            if (!csrfToken) {
                console.error(' No se encontró el token CSRF');
                mostrarNotificacion(' Error de seguridad. Recarga la página.', 'error');
                return;
            }

            const boton = document.querySelector(`.agregar-combo-btn[data-producto-id="${productoId}"]`);
            const textoOriginal = boton ? boton.innerHTML : null;

            if (boton) {
                boton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>AGREGANDO...';
                boton.disabled = true;
                boton.classList.add('btn-loading');
            }

            const response = await fetch('/carrito/agregar-ajax', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'productoId': productoId,
                    'cantidad': '1',
                    '_csrf': csrfToken
                })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error(' El servidor devolvió HTML en lugar de JSON:', textResponse.substring(0, 200));

                if (textResponse.includes('login') || response.status === 403 || response.status === 401) {
                    throw new Error('Debes iniciar sesión para agregar productos al carrito');
                } else {
                    throw new Error('Error del servidor: Respuesta inesperada');
                }
            }

            const data = await response.json();

            if (response.ok && data.success) {
                mostrarNotificacion(` ${data.message}`, 'success');
                await actualizarContadorCarrito();

                // Restaurar botón después de éxito
                if (boton) {
                    boton.classList.remove('btn-loading');
                    boton.classList.add('btn-success-state');
                    boton.innerHTML = '<i class="fas fa-check me-2"></i>¡AGREGADO!';
                    setTimeout(() => {
                        if (textoOriginal) {
                            boton.innerHTML = textoOriginal;
                        }
                        boton.classList.remove('btn-success-state');
                        boton.disabled = false;
                    }, 2000);
                }
            } else {
                throw new Error(data.message || 'Error al agregar al carrito');
            }

        } catch (error) {
            console.error(' Error agregando al carrito:', error);
            mostrarNotificacion(` ${error.message}`, 'error');

            // Restaurar botón en caso de error
            const boton = document.querySelector(`.agregar-combo-btn[data-producto-id="${productoId}"]`);
            if (boton) {
                boton.classList.remove('btn-loading');
                boton.innerHTML = '<i class="fas fa-cart-plus me-2"></i>AGREGAR AL PEDIDO';
                boton.disabled = false;
            }
        }
    };

    // ========== ACTUALIZAR CONTADOR CARRITO ==========
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
            console.error('Error actualizando contador del carrito:', error);
        }
    }

    // ========== NOTIFICACIONES ==========
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Eliminar notificaciones anteriores
        const notificacionesAnteriores = document.querySelectorAll('.notificacion-index');
        notificacionesAnteriores.forEach(notif => notif.remove());

        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-index notificacion-flotante-index notificacion-${tipo}`;

        notificacion.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <i class="fas ${getIconoNotificacion(tipo)} me-2"></i>
                    <span>${mensaje}</span>
                </div>
                <button type="button" class="btn-close-notif" aria-label="Cerrar">&times;</button>
            </div>
        `;

        // Agregar event listener al botón de cerrar
        const btnCerrar = notificacion.querySelector('.btn-close-notif');
        btnCerrar.addEventListener('click', () => {
            cerrarNotificacion(notificacion);
        });

        document.body.appendChild(notificacion);

        // Mostrar con animación
        setTimeout(() => {
            notificacion.classList.add('notificacion-visible');
        }, 10);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            cerrarNotificacion(notificacion);
        }, 5000);
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

    function getIconoNotificacion(tipo) {
        switch(tipo) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    // ========== SCROLL SUAVE ==========
    function configurarScrollSuave() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ========== ANIMACIONES SCROLL ==========
    function configurarAnimacionesScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.category-card, .combo-card, .feature-icon').forEach(el => {
            observer.observe(el);
        });
    }


    function configurarHoverCategorias() {
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('category-card-hover');
            });

            card.addEventListener('mouseleave', function() {
                this.classList.remove('category-card-hover');
            });
        });
    }

    // ========== INICIALIZACIÓN ==========
    inicializarPaginaInicio();


    setInterval(cargarCombosEnCarrusel, 300000);

    console.log(' Página de inicio inicializada correctamente');
});

console.log(' Luren Chicken Index - Cargado y listo (100% CSP Compliant)!');