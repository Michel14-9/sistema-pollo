// SISTEMA DE GESTIÓN DE DIRECCIONES
console.log(" INICIANDO SISTEMA DE DIRECCIONES");

// Variables globales
let direcciones = [];
let modalDireccion = null;
let editandoIndex = null;

// CONFIGURACIÓN INICIAL
document.addEventListener('DOMContentLoaded', function() {
    console.log("Página cargada - Configurando sistema...");

    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('modalDireccion');
    if (modalElement) {
        modalDireccion = new bootstrap.Modal(modalElement);
        console.log(" Modal inicializado correctamente");
    } else {
        console.error("No se encontró el modal con id 'modalDireccion'");
    }

    // Configurar event listeners
    configurarEventListeners();

    // Cargar direcciones al iniciar
    cargarDirecciones();
});

// CONFIGURAR EVENT LISTENERS
function configurarEventListeners() {
    console.log(" Configurando event listeners...");

    // Botón "Agregar Dirección"
    const btnAgregar = document.getElementById('btnAgregarDireccion');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', abrirModalNuevaDireccion);
        console.log(" Listener agregado para botón 'Agregar Dirección'");
    }

    // Botón "Agregar Primera Dirección"
    const btnAgregarPrimera = document.getElementById('btnAgregarPrimeraDireccion');
    if (btnAgregarPrimera) {
        btnAgregarPrimera.addEventListener('click', abrirModalNuevaDireccion);
        console.log(" Listener agregado para botón 'Agregar Primera Dirección'");
    }

    // Botón "Guardar Dirección"
    const btnGuardar = document.getElementById('btnGuardarDireccion');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarDireccion);
        console.log(" Listener agregado para botón 'Guardar Dirección'");
    }

    // Formulario
    const formDireccion = document.getElementById('formDireccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarDireccion();
        });
        console.log(" Listener agregado para formulario");
    }
}

// FUNCIÓN PARA OBTENER CSRF TOKEN
function obtenerCsrfToken() {
    const csrfInput = document.getElementById('csrfToken');
    if (csrfInput) {
        return csrfInput.value;
    }

    // Alternativa: buscar en meta tags
    const metaToken = document.querySelector('meta[name="_csrf"]');
    const metaHeader = document.querySelector('meta[name="_csrf_header"]');

    if (metaToken && metaHeader) {
        return metaToken.content;
    }

    console.warn(" CSRF Token no encontrado");
    return '';
}

// FUNCIÓN PARA ABRIR MODAL DE NUEVA DIRECCIÓN
function abrirModalNuevaDireccion() {
    console.log(" Abriendo modal para NUEVA dirección");

    editandoIndex = null;
    limpiarFormulario();

    // Cambiar título del modal
    const modalTitle = document.getElementById('modalDireccionLabel');
    if (modalTitle) {
        modalTitle.textContent = 'Agregar Nueva Dirección';
    }

    // Mostrar modal
    if (modalDireccion) {
        modalDireccion.show();
        console.log(" Modal de nueva dirección abierto");
    }
}

// FUNCIÓN PARA CARGAR DIRECCIONES DESDE LA API
async function cargarDirecciones() {
    try {
        console.log(" Cargando direcciones desde la API...");
        mostrarEstadoCarga();

        const csrfToken = obtenerCsrfToken();

        const response = await fetch('/api/direcciones', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken
            },
            credentials: 'include'
        });

        console.log(" Respuesta del servidor:", response.status, response.statusText);

        if (response.status === 403) {
            throw new Error("Acceso denegado - Verifica que estés logueado");
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log(" Direcciones cargadas correctamente:", data);

        // Asegurarnos de que data es un array
        direcciones = Array.isArray(data) ? data : [];
        console.log(` ${direcciones.length} direcciones encontradas`);

        mostrarDirecciones();

    } catch (error) {
        console.error(" Error cargando direcciones:", error);
        mostrarEstadoVacio();
        mostrarError("Error al cargar las direcciones: " + error.message);
    }
}

// FUNCIÓN PARA MOSTRAR DIRECCIONES EN LA PÁGINA
function mostrarDirecciones() {
    const contenedor = document.getElementById('direccionesLista');
    const estadoVacio = document.getElementById('direccionesVacias');

    if (!contenedor) {
        console.error(" No se encontró el contenedor 'direccionesLista'");
        return;
    }

    // Limpiar contenedor
    contenedor.innerHTML = '';

    if (direcciones.length === 0) {
        console.log(" No hay direcciones para mostrar");
        mostrarEstadoVacio();
        return;
    }

    console.log(` Mostrando ${direcciones.length} direcciones en la página`);

    // Mostrar cada dirección
    direcciones.forEach((direccion, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';

        col.innerHTML = `
            <div class="card h-100 ${direccion.predeterminada ? 'border-primary' : ''}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${escapeHtml(direccion.nombre || 'Sin nombre')}</h5>
                        <div>
                            ${direccion.predeterminada ? '<span class="badge bg-primary">Principal</span>' : ''}
                            ${direccion.facturacion ? '<span class="badge bg-success ms-1">Facturación</span>' : ''}
                        </div>
                    </div>
                    <div class="direccion-info">
                        <p class="mb-1"><strong>Tipo:</strong> ${escapeHtml(direccion.tipo || 'No especificado')}</p>
                        <p class="mb-1"><strong>Dirección:</strong> ${escapeHtml(direccion.direccion || 'No especificada')}</p>
                        ${direccion.referencia ? `<p class="mb-1"><strong>Referencia:</strong> ${escapeHtml(direccion.referencia)}</p>` : ''}
                        <p class="mb-1"><strong>Ciudad:</strong> ${escapeHtml(direccion.ciudad || 'No especificada')}</p>
                        <p class="mb-3"><strong>Teléfono:</strong> ${escapeHtml(direccion.telefono || 'No especificado')}</p>
                    </div>
                    <div class="btn-group w-100">
                        ${!direccion.predeterminada ?
                            `<button class="btn btn-outline-primary btn-sm" onclick="marcarPredeterminada(${index})">
                                <i class="fas fa-star"></i> Principal
                            </button>` : ''
                        }
                        <button class="btn btn-outline-warning btn-sm" onclick="editarDireccion(${index})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarDireccion(${index})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;

        contenedor.appendChild(col);
    });

    // Ocultar estado vacío si hay direcciones
    if (estadoVacio) {
        estadoVacio.style.display = 'none';
    }

    console.log(" Direcciones mostradas correctamente en la página");
}

// FUNCIÓN PARA EDITAR DIRECCIÓN (GLOBAL)
window.editarDireccion = function(index) {
    console.log("✏ CLICK EDITAR - Índice:", index);

    const direccion = direcciones[index];
    if (!direccion) {
        console.error(" No se encontró la dirección en el índice:", index);
        mostrarError("No se pudo encontrar la dirección para editar");
        return;
    }

    console.log(" Editando dirección:", direccion);

    // Llenar formulario con los datos de la dirección
    document.getElementById('nombre').value = direccion.nombre || '';
    document.getElementById('tipo').value = direccion.tipo || 'casa';
    document.getElementById('direccion').value = direccion.direccion || '';
    document.getElementById('referencia').value = direccion.referencia || '';
    document.getElementById('ciudad').value = direccion.ciudad || 'Ica';
    document.getElementById('telefono').value = direccion.telefono || '';
    document.getElementById('predeterminada').checked = direccion.predeterminada || false;
    document.getElementById('facturacion').checked = direccion.facturacion || false;

    // Guardar el índice que estamos editando
    editandoIndex = index;

    // Cambiar título del modal
    const modalTitle = document.getElementById('modalDireccionLabel');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Dirección';
    }

    // Mostrar el modal
    if (modalDireccion) {
        modalDireccion.show();
        console.log(" Modal de edición abierto correctamente");
    } else {
        console.error(" Modal no inicializado");
    }
};

// FUNCIÓN PARA ELIMINAR DIRECCIÓN (GLOBAL)
window.eliminarDireccion = function(index) {
    console.log(" CLICK ELIMINAR - Índice:", index);

    const direccion = direcciones[index];
    if (!direccion) {
        console.error(" No se encontró la dirección para eliminar");
        return;
    }

    if (!confirm(`¿Estás seguro de ELIMINAR la dirección "${direccion.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        console.log(" Eliminación cancelada por el usuario");
        return;
    }

    console.log(" Eliminando dirección:", direccion);

    const csrfToken = obtenerCsrfToken();

    // Realizar petición DELETE a la API
    fetch(`/api/direcciones/${direccion.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken
        },
        credentials: 'include'
    })
    .then(response => {
        console.log(" Respuesta de eliminación:", response.status);

        if (response.ok) {
            console.log(" Dirección eliminada correctamente");
            mostrarExito(' Dirección eliminada correctamente');
            cargarDirecciones(); // Recargar la lista
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    })
    .catch(error => {
        console.error(' Error eliminando dirección:', error);
        mostrarError(' Error al eliminar la dirección: ' + error.message);
    });
};

// FUNCIÓN PARA MARCAR COMO PREDETERMINADA (GLOBAL)
window.marcarPredeterminada = function(index) {
    console.log(" CLICK PRINCIPAL - Índice:", index);

    const direccion = direcciones[index];
    if (!direccion) {
        console.error(" No se encontró la dirección para marcar como principal");
        return;
    }

    console.log(" Marcando como principal:", direccion);

    const csrfToken = obtenerCsrfToken();

    // Realizar petición PUT a la API
    fetch(`/api/direcciones/${direccion.id}/predeterminada`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken
        },
        credentials: 'include'
    })
    .then(response => {
        console.log(" Respuesta de marcado como principal:", response.status);

        if (response.ok) {
            console.log(" Dirección marcada como principal correctamente");
            mostrarExito(' Dirección marcada como principal');
            cargarDirecciones(); // Recargar la lista
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    })
    .catch(error => {
        console.error(' Error marcando como principal:', error);
        mostrarError(' Error al marcar como principal: ' + error.message);
    });
};

// FUNCIÓN PARA GUARDAR DIRECCIÓN (NUEVA O EDITADA)
async function guardarDireccion() {
    console.log(" Iniciando guardado de dirección...");

    // Obtener datos del formulario
    const datosDireccion = {
        nombre: document.getElementById('nombre').value.trim(),
        tipo: document.getElementById('tipo').value,
        direccion: document.getElementById('direccion').value.trim(),
        referencia: document.getElementById('referencia').value.trim(),
        ciudad: document.getElementById('ciudad').value,
        telefono: document.getElementById('telefono').value.trim(),
        predeterminada: document.getElementById('predeterminada').checked,
        facturacion: document.getElementById('facturacion').checked
    };

    console.log(" Datos a guardar:", datosDireccion);

    // Validación de campos obligatorios
    if (!datosDireccion.nombre) {
        mostrarError(" El campo 'Nombre de la dirección' es obligatorio");
        document.getElementById('nombre').focus();
        return;
    }

    if (!datosDireccion.tipo) {
        mostrarError(" El campo 'Tipo de dirección' es obligatorio");
        document.getElementById('tipo').focus();
        return;
    }

    if (!datosDireccion.direccion) {
        mostrarError(" El campo 'Dirección completa' es obligatorio");
        document.getElementById('direccion').focus();
        return;
    }

    if (!datosDireccion.ciudad) {
        mostrarError(" El campo 'Ciudad' es obligatorio");
        document.getElementById('ciudad').focus();
        return;
    }

    if (!datosDireccion.telefono) {
        mostrarError(" El campo 'Teléfono de contacto' es obligatorio");
        document.getElementById('telefono').focus();
        return;
    }

    // Validación de teléfono (9 dígitos)
    const telefonoRegex = /^[0-9]{9}$/;
    if (!telefonoRegex.test(datosDireccion.telefono)) {
        mostrarError(" El teléfono debe tener exactamente 9 dígitos numéricos");
        document.getElementById('telefono').focus();
        return;
    }

    try {
        const botonGuardar = document.getElementById('btnGuardarDireccion');
        const textoOriginal = botonGuardar.innerHTML;

        // Mostrar estado de carga en el botón
        botonGuardar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        botonGuardar.disabled = true;

        const csrfToken = obtenerCsrfToken();
        let url, method;

        if (editandoIndex !== null && direcciones[editandoIndex]) {
            // MODO EDICIÓN - Actualizar dirección existente
            url = `/api/direcciones/${direcciones[editandoIndex].id}`;
            method = 'PUT';
            console.log(" Editando dirección existente:", url);
        } else {
            // MODO NUEVO - Crear nueva dirección
            url = '/api/direcciones';
            method = 'POST';
            console.log(" Creando nueva dirección:", url);
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(datosDireccion)
        });

        console.log("📡 Respuesta del servidor:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
        }

        // Éxito - Recargar direcciones y cerrar modal
        console.log(" Dirección guardada correctamente");
        mostrarExito(' Dirección guardada correctamente');
        modalDireccion.hide();
        await cargarDirecciones();

    } catch (error) {
        console.error(' Error guardando dirección:', error);
        mostrarError(' Error al guardar la dirección: ' + error.message);
    } finally {
        // Restaurar estado normal del botón
        const botonGuardar = document.getElementById('btnGuardarDireccion');
        if (botonGuardar) {
            botonGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Dirección';
            botonGuardar.disabled = false;
        }
    }
}

// FUNCIONES AUXILIARES
function limpiarFormulario() {
    const form = document.getElementById('formDireccion');
    if (form) {
        form.reset();
        document.getElementById('tipo').value = '';
        document.getElementById('ciudad').value = 'Ica';
    }
}

function mostrarEstadoCarga() {
    const contenedor = document.getElementById('direccionesLista');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando direcciones...</p>
            </div>
        `;
    }
}

function mostrarEstadoVacio() {
    const contenedor = document.getElementById('direccionesLista');
    const estadoVacio = document.getElementById('direccionesVacias');

    if (contenedor) {
        contenedor.innerHTML = '';
    }

    if (estadoVacio) {
        estadoVacio.style.display = 'block';
    }
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert(mensaje);
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

console.log(" SISTEMA DE DIRECCIONES CARGADO - Listo para usar");