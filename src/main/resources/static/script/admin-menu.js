// admin-menu.js - Funcionalidades para administración del menú
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADMIN MENÚ - INICIADO ===');

    // Elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const categoriaFilter = document.getElementById('categoriaFilter');
    const productoItems = document.querySelectorAll('.producto-item');
    const deleteModal = document.getElementById('confirmDeleteModal');

    // Inicializar funcionalidades
    function inicializarAdminMenu() {
        configurarFiltros();
        configurarModalEliminacion();
        configurarAnimaciones();
        configurarEfectosHover();
    }

    // Configurar filtros de búsqueda
    function configurarFiltros() {
        if (searchInput && categoriaFilter) {
            searchInput.addEventListener('input', filtrarProductos);
            categoriaFilter.addEventListener('change', filtrarProductos);
        }
    }

    // Filtrar productos en tiempo real
    function filtrarProductos() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoriaSeleccionada = categoriaFilter.value;

        let productosVisibles = 0;

        productoItems.forEach(item => {
            const nombre = item.getAttribute('data-nombre').toLowerCase();
            const categoria = item.getAttribute('data-categoria');

            const coincideNombre = nombre.includes(searchTerm);
            const coincideCategoria = !categoriaSeleccionada || categoria === categoriaSeleccionada;

            if (coincideNombre && coincideCategoria) {
                item.style.display = 'block';
                productosVisibles++;
                // Animación de aparición
                item.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                item.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        mostrarMensajeSinResultados(productosVisibles);
    }

    // Mostrar mensaje cuando no hay resultados
    function mostrarMensajeSinResultados(productosVisibles) {
        const contenedor = document.getElementById('productosContainer');

        // Remover mensaje anterior si existe
        const mensajeAnterior = contenedor.querySelector('.sin-resultados');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }

        // Si no hay productos visibles, mostrar mensaje
        if (productosVisibles === 0 && productoItems.length > 0) {
            const mensajeHTML = `
                <div class="col-12 sin-resultados">
                    <div class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">No se encontraron productos</h4>
                        <p class="text-muted">Intenta con otros términos de búsqueda o categoría.</p>
                        <button class="btn btn-outline-primary" onclick="limpiarFiltros()">
                            <i class="fas fa-times me-2"></i>Limpiar filtros
                        </button>
                    </div>
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', mensajeHTML);
        }
    }

    // Limpiar filtros (función global)
    window.limpiarFiltros = function() {
        if (searchInput) searchInput.value = '';
        if (categoriaFilter) categoriaFilter.value = '';
        filtrarProductos();
    };

    // Configurar modal de eliminación
    function configurarModalEliminacion() {
        if (deleteModal) {
            deleteModal.addEventListener('show.bs.modal', function(event) {
                const button = event.relatedTarget;
                const productoId = button.getAttribute('data-producto-id');
                const productoNombre = button.getAttribute('data-producto-nombre');

                // Actualizar el nombre del producto en el modal
                document.getElementById('productoNombreModal').textContent = productoNombre;

                // CORREGIDO: Construir la URL de eliminación dinámicamente
                const deleteForm = document.getElementById('deleteForm');
                deleteForm.action = `/admin-menu/eliminar/${productoId}`;

                console.log(`Configurado eliminación para producto ID: ${productoId}, Nombre: ${productoNombre}`);
            });
        }
    }

    // Configurar animaciones
    function configurarAnimaciones() {
        // Animación de carga para las cards
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Aplicar a cada producto
        productoItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(item);
        });
    }

    // Efectos hover mejorados para cards
    function configurarEfectosHover() {
        productoItems.forEach(item => {
            const card = item.querySelector('.product-card');

            if (card) {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                    this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = '';
                });
            }
        });
    }

    // Confirmación rápida para eliminación
    function configurarConfirmacionesRapidas() {
        const deleteButtons = document.querySelectorAll('.btn-outline-danger');

        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                const productoNombre = this.getAttribute('data-producto-nombre');
                if (!confirm(`¿Estás seguro de que quieres eliminar "${productoNombre}"?`)) {
                    e.preventDefault();
                }
            });
        });
    }

    // Inicializar todas las funcionalidades
    inicializarAdminMenu();
    configurarConfirmacionesRapidas();

    // Exportar funciones para uso global
    window.filtrarProductos = filtrarProductos;
    window.mostrarMensajeSinResultados = mostrarMensajeSinResultados;
});

// CSS dinámico para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .product-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: 1px solid #dee2e6;
    }

    .product-card:hover {
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .sin-resultados {
        animation: fadeIn 0.5s ease-in;
    }

    .categoria-badge {
        font-size: 0.75em;
    }

    /* Responsive improvements */
    @media (max-width: 768px) {
        .producto-item {
            margin-bottom: 1rem;
        }

        .btn-group .btn {
            font-size: 0.8rem;
            padding: 0.25rem 0.5rem;
        }
    }
`;
document.head.appendChild(style);

// Utilidades globales
window.AdminMenu = {
    // Recargar página
    recargar: function() {
        window.location.reload();
    },

    // Ir a crear nuevo producto
    nuevoProducto: function() {
        window.location.href = '/admin-menu/nuevo';
    },

    // Contar productos visibles
    contarProductosVisibles: function() {
        return document.querySelectorAll('.producto-item[style="display: block"]').length;
    },

    // Obtener estadísticas
    obtenerEstadisticas: function() {
        const total = document.querySelectorAll('.producto-item').length;
        const visibles = this.contarProductosVisibles();
        const categorias = new Set();

        document.querySelectorAll('.producto-item').forEach(item => {
            categorias.add(item.getAttribute('data-categoria'));
        });

        return {
            total: total,
            visibles: visibles,
            categorias: categorias.size,
            filtrados: total - visibles
        };
    }
};

console.log('Admin Menu cargado - Utilidades disponibles en window.AdminMenu');