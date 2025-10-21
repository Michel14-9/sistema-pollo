
// SISTEMA DE LOCALES - LUREN CHICKEN ICA
// COORDENADAS EXACTAS: La Mar 1141, Ica


let mapa;
let marcadorActual;

document.addEventListener('DOMContentLoaded', function() {
    console.log(" Inicializando sistema de local en Ica - La Mar 1141...");

    inicializarLocales();
    configurarEventListeners();
    actualizarEstadoLocal();
});


// INICIALIZACIÓN


function inicializarLocales() {
    console.log(" Preparando sistema de mapa para La Mar 1141, Ica...");
}

function configurarEventListeners() {
    // Botones de acción
    document.getElementById('btnVerDireccion').addEventListener('click', verDireccion);
    document.getElementById('btnLlamar').addEventListener('click', llamarLocal);
    document.getElementById('btnWhatsapp').addEventListener('click', contactarWhatsApp);
}


// DATOS EXACTOS DEL LOCAL


function obtenerDatosLocalIca() {
    return {
        id: 1,
        nombre: "Luren Chicken - La Mar",
        direccion: "La Mar 1141, Ica, Perú",
        telefono: "+51 123-456-789",
        whatsapp: "+51912345678",
        // COORDENADAS EXACTAS DE LA MAR 1141
        latitud: -14.070505106029492,
        longitud: -75.72412960638542,
        horario: "4:00 PM - 10:00 PM",
        servicios: ["delivery", "recojo", "comer_aqui"],
        capacidad: "50 personas",
        estacionamiento: "No disponible",
        zonaDelivery: "Toda la ciudad de Ica",
        serviciosAdicionales: [
            "Ambiente familiar",
            "Atención rápida",
            "Comida para llevar",
            "Promociones especiales"
        ]
    };
}


// ESTADO DEL LOCAL (ABIERTO/CERRADO)


function actualizarEstadoLocal() {
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutosActual = ahora.getMinutes();

    // Convertir hora actual a formato decimal para comparación
    const horaDecimal = horaActual + (minutosActual / 60);

    // El local abre a las 4:00 PM (16:00) y cierra a las 10:00 PM (22:00)
    const estaAbierto = horaDecimal >= 16 && horaDecimal < 22;

    const estadoElement = document.getElementById('estadoLocal');
    if (estaAbierto) {
        estadoElement.textContent = 'Abierto';
        estadoElement.className = 'badge bg-success';
    } else {
        estadoElement.textContent = 'Cerrado';
        estadoElement.className = 'badge bg-danger';

        // Mostrar mensaje informativo si está cerrado
        if (horaDecimal < 16) {
            console.log('️ Local cerrado. Abrimos a las 4:00 PM');
        } else {
            console.log('ℹ Local cerrado. Abrimos mañana a las 4:00 PM');
        }
    }
}


// MAPA CON COORDENADAS EXACTAS


function initMap() {
    console.log(" Inicializando mapa con coordenadas exactas...");

    // COORDENADAS EXACTAS DE LA MAR 1141
    const localLuren = {
        lat: -14.070505106029492,
        lng: -75.72412960638542
    };

    mapa = new google.maps.Map(document.getElementById("mapa"), {
        zoom: 18,
        center: localLuren,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            }
        ]
    });

    marcadorActual = new google.maps.Marker({
        position: localLuren,
        map: mapa,
        title: "Luren Chicken - La Mar 1141",
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#ff6b00" stroke="#ffffff" stroke-width="2"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">L</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    // Info Window con información actualizada
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 1rem; max-width: 250px;">
                <h5 style="margin: 0 0 0.5rem 0; color: #ff6b00; font-weight: bold;">Luren Chicken</h5>
                <p style="margin: 0 0 0.5rem 0; color: #333; font-weight: 500;">La Mar 1141</p>
                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">Ica, Perú</p>
                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>4:00 PM - 10:00 PM
                </p>
                <hr style="margin: 0.5rem 0;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${localLuren.lat},${localLuren.lng}"
                   target="_blank"
                   style="color: #ff6b00; text-decoration: none; font-size: 0.9rem; font-weight: 500;">
                   <i class="fas fa-directions" style="margin-right: 0.5rem;"></i>Cómo llegar
                </a>
            </div>
        `
    });

    marcadorActual.addListener("click", () => {
        infoWindow.open(mapa, marcadorActual);
    });

    // Abrir info window automáticamente después de 1 segundo
    setTimeout(() => {
        infoWindow.open(mapa, marcadorActual);
    }, 1000);

    console.log(" Mapa de La Mar 1141 inicializado correctamente");
}

// ==========================
// ACCIONES DEL USUARIO
// ==========================

function verDireccion() {
    const localIca = obtenerDatosLocalIca();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${localIca.latitud},${localIca.longitud}&destination_place_id=${encodeURIComponent(localIca.direccion)}`;
    window.open(url, '_blank');
}

function llamarLocal() {
    const localIca = obtenerDatosLocalIca();

    // Verificar si el local está abierto antes de llamar
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const estaAbierto = horaActual >= 16 && horaActual < 22;

    if (!estaAbierto) {
        if (confirm('El local está cerrado en este momento (horario: 4:00 PM - 10:00 PM). ¿Deseas llamar de todos modos?')) {
            window.location.href = `tel:${localIca.telefono}`;
        }
    } else {
        window.location.href = `tel:${localIca.telefono}`;
    }
}

function contactarWhatsApp() {
    const localIca = obtenerDatosLocalIca();

    const mensaje = `Hola, me interesa obtener información sobre Luren Chicken - La Mar 1141, Ica.`;
    const url = `https://wa.me/${localIca.whatsapp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}


// MANEJO DE ERRORES DEL MAPA


window.gm_authFailure = function() {
    const mapaElement = document.getElementById('mapa');
    if (mapaElement) {
        mapaElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                <h4>Error al cargar el mapa</h4>
                <p>No se pudo cargar Google Maps. Por favor, verifica tu conexión a internet.</p>
                <button class="btn btn-orange mt-2" onclick="location.reload()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
};


// INICIALIZACIÓN DE COMPONENTES


function inicializarPreguntasFrecuentes() {
    document.querySelectorAll('.pregunta-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-bs-target');
            const collapseElement = document.querySelector(target);

            document.querySelectorAll('.collapse').forEach(collapse => {
                if (collapse.id !== target.replace('#', '') && collapse.classList.contains('show')) {
                    collapse.classList.remove('show');
                }
            });
        });
    });
}

function inicializarNewsletter() {
    const newsletterBtn = document.querySelector('.newsletter-locales .btn-orange');
    const newsletterInput = document.querySelector('.newsletter-locales input[type="email"]');

    if (newsletterBtn && newsletterInput) {
        newsletterBtn.addEventListener('click', function() {
            const email = newsletterInput.value.trim();

            if (!email) {
                mostrarAlerta('Por favor ingresa tu correo electrónico', 'warning');
                newsletterInput.focus();
                return;
            }

            if (!validarEmail(email)) {
                mostrarAlerta('Por favor ingresa un correo electrónico válido', 'warning');
                newsletterInput.focus();
                return;
            }

            // Simular registro
            newsletterBtn.disabled = true;
            newsletterBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>REGISTRANDO...';

            setTimeout(() => {
                mostrarAlerta('¡Te has registrado exitosamente! Te mantendremos informado de nuestras promociones.', 'success');
                newsletterInput.value = '';
                newsletterBtn.disabled = false;
                newsletterBtn.textContent = 'REGISTRATE';
            }, 1500);
        });

        newsletterInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                newsletterBtn.click();
            }
        });
    }
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alerta.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
    `;
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alerta);

    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}


// ACTUALIZACIÓN EN TIEMPO REAL


// Actualizar el estado cada minuto
setInterval(actualizarEstadoLocal, 60000);

console.log(" Sistema de local en La Mar 1141, Ica cargado correctamente");