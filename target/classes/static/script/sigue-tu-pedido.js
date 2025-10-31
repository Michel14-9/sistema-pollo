// sigue-tu-pedido.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== SIGUE TU PEDIDO - INICIADO ===');
    inicializarSeguimiento();
});


function inicializarSeguimiento() {
    configurarEventos();
    cargarPedidoDesdeURL();
    console.log('Página de seguimiento inicializada');
}


function configurarEventos() {
    const form = document.getElementById('formSeguimientoPedido');
    if (form) {
        form.addEventListener('submit', function(e) {
            const numeroPedido = document.getElementById('numeroPedido').value;
            if (!numeroPedido.trim()) {
                e.preventDefault();
                mostrarError('Por favor ingresa un número de pedido');
                return;
            }
            console.log(' Buscando pedido:', numeroPedido);

            // Mostrar loading state
            const btnBuscar = document.getElementById('btnBuscar');
            if (btnBuscar) {
                btnBuscar.disabled = true;
                btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Buscando...';

                // Restaurar después de 2 segundos (por si hay error)
                setTimeout(() => {
                    btnBuscar.disabled = false;
                    btnBuscar.innerHTML = '<i class="fas fa-search me-2"></i>Buscar Pedido';
                }, 2000);
            }
        });
    }

    // Permitir pegar número de pedido copiado
    const inputNumero = document.getElementById('numeroPedido');
    if (inputNumero) {
        inputNumero.addEventListener('paste', function(e) {
            setTimeout(() => {
                const valor = this.value.trim().toUpperCase();
                if (valor.startsWith('LR')) {
                    console.log(' Número de pedido pegado:', valor);
                    // Auto-enfocar el botón de búsqueda
                    document.getElementById('btnBuscar')?.focus();
                }
            }, 100);
        });

        // Auto-buscar al presionar Enter
        inputNumero.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnBuscar')?.click();
            }
        });
    }

    // Configurar eventos de botones de acción (si existen)
    configurarEventosResultados();
}


function cargarPedidoDesdeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const numeroPedido = urlParams.get('numero');

    if (numeroPedido) {
        console.log(' Cargando pedido desde URL:', numeroPedido);
        document.getElementById('numeroPedido').value = numeroPedido;

        // Mostrar loading state
        const btnBuscar = document.getElementById('btnBuscar');
        if (btnBuscar) {
            btnBuscar.disabled = true;
            btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Buscando...';
        }

        // Auto-enviar el formulario después de un breve delay
        setTimeout(() => {
            document.getElementById('formSeguimientoPedido').submit();
        }, 1000);
    }
}


function configurarEventosResultados() {
    // Configurar botón de copiar número
    const btnCopiar = document.querySelector('[onclick*="copiarNumeroPedido"]');
    if (btnCopiar) {
        btnCopiar.addEventListener('click', copiarNumeroPedido);
    }

    // Configurar botón de repetir pedido
    const btnRepetir = document.querySelector('[onclick*="repetirPedido"]');
    if (btnRepetir) {
        btnRepetir.addEventListener('click', repetirPedido);
    }

    // Configurar botón de descargar
    const btnDescargar = document.querySelector('[onclick*="descargarComprobante"]');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', descargarComprobante);
    }
}


function copiarNumeroPedido() {
    const numeroPedidoElement = document.querySelector('.info-pedido p:first-child span');
    if (numeroPedidoElement) {
        const texto = numeroPedidoElement.textContent;
        navigator.clipboard.writeText(texto).then(() => {
            mostrarNotificacion('Número de pedido copiado: ' + texto, 'success');
        }).catch(() => {
            mostrarNotificacion(' Error al copiar el número', 'error');
        });
    } else {
        mostrarNotificacion(' No se encontró el número de pedido', 'error');
    }
}


function repetirPedido() {
    mostrarNotificacion(' Preparando para repetir pedido...', 'info');

}


function descargarComprobante() {
    mostrarNotificacion(' Generando comprobante...', 'info');


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
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notificacion.remove(), 300);
    };

    document.body.appendChild(notificacion);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 5000);
}


function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}


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

    /* Efectos para mejor UX */
    .btn-buscar:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }

    .btn-buscar:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .notificacion-flotante {
            left: 10px;
            right: 10px;
            max-width: none;
        }

        .timeline-pedido .d-flex {
            flex-wrap: wrap;
            justify-content: center !important;
            gap: 10px;
        }

        .timeline-pedido span {
            font-size: 0.8rem;
        }
    }

    /* Mejoras visuales para el formulario */
    .form-control:focus {
        border-color: #ff6b00;
        box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
    }

    .form-select:focus {
        border-color: #ff6b00;
        box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
    }
`;
document.head.appendChild(style);

console.log('Sigue tu pedido.js cargado - Listo para buscar pedidos');