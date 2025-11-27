// confirmacion-pedido.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CONFIRMACIÓN PEDIDO - INICIADO ===');
    inicializarConfirmacion();
});

// Inicializar página de confirmación
function inicializarConfirmacion() {
    console.log('Página de confirmación inicializada');

    // Verificar si hay un pedido cargado
    const tienePedido = document.querySelector('[th\\:if="${pedido}"]') !== null;

    if (tienePedido) {
        console.log(' Pedido detectado en la página');
        configurarEventosConfirmacion();
        actualizarTiempoReal();
        configurarNumeroPedidoClickeable();
    } else {
        console.log('ℹ No hay pedido específico en la página');
    }
}

// Configurar eventos
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

// Actualizar información en tiempo real
function actualizarTiempoReal() {
    console.log(' Iniciando actualizaciones en tiempo real');

    setInterval(() => {
        actualizarTiempoTranscurrido();
    }, 60000);
}

// Actualizar tiempo transcurrido desde la confirmación
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
                tiempoEstimadoElement.classList.add('text-warning', 'fw-bold');
            }
        }
    }
}

// Función para parsear fecha desde el formato Thymeleaf
function parsearFecha(fechaTexto) {
    // Formato esperado: "dd/MM/yyyy HH:mm"
    const partes = fechaTexto.split(' ');
    if (partes.length !== 2) return null;

    const [fecha, hora] = partes;
    const [dia, mes, anio] = fecha.split('/');
    const [horas, minutos] = hora.split(':');

    return new Date(
        parseInt(anio),
        parseInt(mes) - 1,
        parseInt(dia),
        parseInt(horas),
        parseInt(minutos)
    );
}

// Mostrar notificaciones (VERSIÓN CSP COMPLIANT)
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

    // Configurar el evento de cierre
    notificacion.querySelector('.notificacion-cerrar').onclick = () => {
        notificacion.classList.add('notificacion-salida');
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    };

    document.body.appendChild(notificacion);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.classList.add('notificacion-salida');
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Copiar número de pedido al portapapeles
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

// Configurar número de pedido clickeable
function configurarNumeroPedidoClickeable() {
    const numeroPedidoElement = document.querySelector('.numero-pedido');
    if (numeroPedidoElement) {
        // Agregar clases para hacerlo clickeable
        numeroPedidoElement.classList.add('numero-pedido-clickeable');

        // Agregar tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'numero-pedido-tooltip text-muted small mt-1';
        tooltip.textContent = 'Click para copiar';
        numeroPedidoElement.appendChild(tooltip);

        // Agregar evento de click
        numeroPedidoElement.addEventListener('click', copiarNumeroPedido);
    }
}

console.log('Confirmación pedido.js cargado - CSP Compliant');