// confirmacion-pedido.js - Funcionalidades para la página de confirmación
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CONFIRMACIÓN PEDIDO - INICIADO ===');
    inicializarConfirmacion();
});

//  Inicializar página de confirmación
function inicializarConfirmacion() {
    console.log('Página de confirmación inicializada');

    // Verificar si hay un pedido cargado
    const tienePedido = document.querySelector('[th\\:if="${pedido}"]') !== null;

    if (tienePedido) {
        console.log(' Pedido detectado en la página');
        configurarEventosConfirmacion();
        actualizarTiempoReal();
    } else {
        console.log('ℹ No hay pedido específico en la página');
    }
}

//  Configurar eventos
function configurarEventosConfirmacion() {
    // Botón para seguir pedido
    const btnSeguirPedido = document.querySelector('.btn-seguimiento');
    if (btnSeguirPedido) {
        btnSeguirPedido.addEventListener('click', function(e) {
            console.log(' Navegando a seguimiento de pedido');
            // La navegación se maneja automáticamente por el href
        });
    }

    // Botón para nuevo pedido
    const btnNuevoPedido = document.querySelector('.btn-seguir-comprando');
    if (btnNuevoPedido) {
        btnNuevoPedido.addEventListener('click', function(e) {
            console.log('🛒 Iniciando nuevo pedido');
            // La navegación se maneja automáticamente por el href
        });
    }

    // Configurar auto-redirección si el pedido está entregado
    const estadoPedido = document.querySelector('.estado-pedido .fw-bold');
    if (estadoPedido && estadoPedido.textContent.includes('ENTREGADO')) {
        console.log(' Pedido entregado - configurando redirección automática');
        setTimeout(() => {
            mostrarNotificacion(' Pedido entregado exitosamente. Redirigiendo al menú...', 'success');
            setTimeout(() => {
                window.location.href = '/menu';
            }, 3000);
        }, 5000);
    }
}

//  Actualizar información en tiempo real (opcional)
function actualizarTiempoReal() {
    // Esta función puede usarse para actualizar el estado del pedido
    // sin recargar la página (si implementas WebSockets o polling)

    console.log(' Iniciando actualizaciones en tiempo real');

    // Ejemplo: Actualizar el tiempo transcurrido cada minuto
    setInterval(() => {
        actualizarTiempoTranscurrido();
    }, 60000);
}

//  Actualizar tiempo transcurrido desde la confirmación
function actualizarTiempoTranscurrido() {
    const fechaPedidoElement = document.querySelector('[th\\:text*="format(pedido.fecha"]');
    if (!fechaPedidoElement) return;

    const fechaTexto = fechaPedidoElement.textContent;
    const fechaPedido = parsearFecha(fechaTexto);

    if (fechaPedido) {
        const ahora = new Date();
        const diferencia = ahora - fechaPedido;
        const minutosTranscurridos = Math.floor(diferencia / (1000 * 60));

        console.log(` Tiempo transcurrido: ${minutosTranscurridos} minutos`);

        // Actualizar el tiempo estimado si ha pasado mucho tiempo
        const tiempoEstimadoElement = document.querySelector('.tiempo-entrega .text-muted');
        if (tiempoEstimadoElement && minutosTranscurridos > 30) {
            const tiempoRestante = Math.max(0, 45 - minutosTranscurridos);
            if (tiempoRestante > 0) {
                tiempoEstimadoElement.textContent = `Aprox. ${tiempoRestante} min`;
            } else {
                tiempoEstimadoElement.textContent = 'Llegando pronto';
                tiempoEstimadoElement.className = 'text-warning fw-bold';
            }
        }
    }
}

//  Función para parsear fecha desde el formato Thymeleaf
function parsearFecha(fechaTexto) {
    // Formato esperado: "dd/MM/yyyy HH:mm"
    const partes = fechaTexto.split(' ');
    if (partes.length !== 2) return null;

    const [fecha, hora] = partes;
    const [dia, mes, anio] = fecha.split('/');
    const [horas, minutos] = hora.split(':');

    return new Date(
        parseInt(anio),
        parseInt(mes) - 1, // Meses en JavaScript son 0-based
        parseInt(dia),
        parseInt(horas),
        parseInt(minutos)
    );
}

//  Mostrar notificaciones
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

//  Copiar número de pedido al portapapeles
function copiarNumeroPedido() {
    const numeroPedidoElement = document.querySelector('.numero-pedido .fw-bold');
    if (numeroPedidoElement) {
        const numeroPedido = numeroPedidoElement.textContent;
        navigator.clipboard.writeText(numeroPedido).then(() => {
            mostrarNotificacion(' Número de pedido copiado al portapapeles', 'success');
        }).catch(() => {
            mostrarNotificacion(' Error al copiar el número', 'error');
        });
    }
}

// Compartir pedido
function compartirPedido() {
    const numeroPedidoElement = document.querySelector('.numero-pedido .fw-bold');
    if (numeroPedidoElement && navigator.share) {
        const numeroPedido = numeroPedidoElement.textContent;
        navigator.share({
            title: 'Mi Pedido Luren Chicken',
            text: `Mi pedido #${numeroPedido} está en proceso. ¡Pronto llegará!`,
            url: window.location.href
        }).then(() => {
            console.log('Pedido compartido exitosamente');
        }).catch(() => {
            mostrarNotificacion(' Error al compartir el pedido', 'error');
        });
    } else {
        copiarNumeroPedido();
    }
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

    /* Efectos hover para botones */
    .btn-seguimiento:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
        transition: all 0.3s ease;
    }

    .btn-seguir-comprando:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        transition: all 0.3s ease;
    }

    /* Animación para el icono de confirmación */
    .confirmacion-icono i {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    /* Efecto para el número de pedido */
    .numero-pedido {
        position: relative;
        overflow: hidden;
    }

    .numero-pedido::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
        transform: rotate(45deg);
        animation: shine 3s infinite;
    }

    @keyframes shine {
        0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
        }
        100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .notificacion-flotante {
            left: 10px;
            right: 10px;
            max-width: none;
        }

        .progreso-estado .d-flex {
            flex-wrap: wrap;
            justify-content: center !important;
        }

        .progreso-estado .text-center {
            flex: 0 0 25%;
            margin-bottom: 1rem;
        }

        .progreso-linea {
            display: none;
        }
    }
`;
document.head.appendChild(style);

//  Agregar funcionalidad de copiar número de pedido
document.addEventListener('DOMContentLoaded', function() {
    const numeroPedidoElement = document.querySelector('.numero-pedido');
    if (numeroPedidoElement) {
        // Hacer el número de pedido clickeable para copiar
        numeroPedidoElement.style.cursor = 'pointer';
        numeroPedidoElement.title = 'Click para copiar número de pedido';
        numeroPedidoElement.addEventListener('click', copiarNumeroPedido);

        // Agregar tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'text-muted small mt-1';
        tooltip.textContent = 'Click para copiar';
        tooltip.style.fontSize = '0.75rem';
        numeroPedidoElement.appendChild(tooltip);
    }
});

console.log('Confirmación pedido.js cargado - Listo');