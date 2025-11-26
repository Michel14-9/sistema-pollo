
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


                setTimeout(() => {
                    btnBuscar.disabled = false;
                    btnBuscar.innerHTML = '<i class="fas fa-search me-2"></i>Buscar Pedido';
                }, 2000);
            }
        });
    }


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


        inputNumero.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('btnBuscar')?.click();
            }
        });
    }


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

function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}

console.log('Sigue tu pedido.js cargado - CSP Compliant');