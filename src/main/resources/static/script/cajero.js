// Variables globales con datos de Thymeleaf
const orderNumber = document.getElementById('order-number').textContent;
const orderTotal = parseFloat(document.getElementById('order-total-display').textContent.replace('S/ ', ''));
const igvRate = 0.18;
const currency = 'S/';

// Estado actual del pedido (comienza en 1 - Procesando)
let currentStatus = 1;
const maxStatus = 4;

// Datos del pedido para usar en JavaScript
let orderData = {
    items: [],
    subtotal: orderTotal / (1 + igvRate),
    tax: orderTotal - (orderTotal / (1 + igvRate)),
    total: orderTotal,
    currency: currency,
    totalInWords: '',
    descriptionSoles: ''
};

// Obtener items del pedido desde el HTML generado por Thymeleaf
document.querySelectorAll('#order-items-list > div').forEach(itemElement => {
    const text = itemElement.textContent;
    const parts = text.split(' x ');
    const description = parts[0];
    const qtyAndPrice = parts[1].split('S/ ');
    const qty = parseInt(qtyAndPrice[0]);
    const total = parseFloat(qtyAndPrice[1]);
    const unitPrice = total / qty;

    orderData.items.push({
        description: description,
        qty: qty,
        unitPrice: unitPrice,
        total: total,
        unit: 'UNIDAD'
    });
});

// Funciones para actualizar hora y fecha en tiempo real
function actualizarHora() {
    const ahora = new Date();
    const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const opcionesFecha = { day: '2-digit', month: 'short', year: 'numeric' };

    document.getElementById('header-hora-actual').textContent =
        ahora.toLocaleTimeString('es-ES', opcionesHora);
    document.getElementById('header-fecha-actual').textContent =
        ahora.toLocaleDateString('es-ES', opcionesFecha);
}

function updateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };

    const dateString = now.toLocaleDateString('es-ES', dateOptions);
    const timeString = now.toLocaleTimeString('es-ES', timeOptions);

    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    if (dateElement) dateElement.textContent = dateString;
    if (timeElement) timeElement.textContent = timeString;
}

// Funciones para cambiar entre Delivery y Recojo en Tienda
function updateInterface(type) {
    const deliveryContent = document.getElementById('content-delivery');
    const pickupContent = document.getElementById('content-pickup');
    const pickupInfoContent = document.getElementById('content-pickup-info');
    const step4Text = document.getElementById('step-4-text');

    if (type === 'delivery') {
        document.getElementById('delivery-option').classList.add('active');
        document.getElementById('pickup-option').classList.remove('active');
        deliveryContent.style.display = 'block';
        pickupContent.style.display = 'none';
        pickupInfoContent.style.display = 'none';
        if (step4Text) step4Text.textContent = 'Listo para Entrega';
    } else if (type === 'pickup') {
        document.getElementById('delivery-option').classList.remove('active');
        document.getElementById('pickup-option').classList.add('active');
        deliveryContent.style.display = 'none';
        pickupContent.style.display = 'block';
        pickupInfoContent.style.display = 'block';
        if (step4Text) step4Text.textContent = 'Listo para Recojo';

        // Limpiar el campo de teléfono cuando se selecciona recoger en tienda
        document.getElementById('phoneNumberInput').value = '';
    }
}

// Función para actualizar estado del pedido
function handleUpdateStatus() {
    // Verificar si ya estamos en el último estado
    if (currentStatus >= maxStatus) {
        alert('✅ El pedido ya está completado y listo para entrega/recojo.');
        return;
    }

    // Avanzar al siguiente estado
    currentStatus++;

    // Actualizar la interfaz visual
    updateStatusDisplay();

    // Mostrar mensaje de confirmación
    const statusNames = ['', 'Procesando', 'Confirmado', 'Preparando', 'Listo para Entrega/Recojo'];
    alert(`✅ Estado del pedido actualizado a: ${statusNames[currentStatus]}`);

    // Enviar actualización al servidor (simulado)
    updateStatusOnServer();
}

// Función para actualizar la visualización del estado
function updateStatusDisplay() {
    const statusItems = document.querySelectorAll('.status-item');

    // Resetear todos los estados
    statusItems.forEach(item => {
        item.classList.remove('active');
        const circle = item.querySelector('.step-circle');
        circle.classList.remove('bg-primary', 'text-white');
    });

    // Activar hasta el estado actual
    for (let i = 0; i < currentStatus; i++) {
        if (statusItems[i]) {
            statusItems[i].classList.add('active');
            const circle = statusItems[i].querySelector('.step-circle');
            circle.classList.add('bg-primary', 'text-white');
        }
    }
}

// Función para simular actualización en el servidor
function updateStatusOnServer() {
    const statusNames = ['', 'PROCESANDO', 'CONFIRMADO', 'PREPARANDO', 'LISTO'];

    // Simular llamada al servidor
    fetch('/api/pedido/actualizar-estado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pedidoId: orderNumber,
            nuevoEstado: statusNames[currentStatus]
        })
    }).then(response => {
        if (response.ok) {
            console.log('Estado actualizado en el servidor:', statusNames[currentStatus]);
        } else {
            console.error('Error al actualizar estado en el servidor');
        }
    }).catch(error => {
        console.error('Error de conexión:', error);
    });
}

// Función para enviar comprobante por WhatsApp
function handleSendWhatsappReceipt() {
    const phoneNumber = document.getElementById('phoneNumberInput').value.trim();

    // Validar formato de teléfono: +51 seguido de 9 dígitos
    const phoneRegex = /^\+51\s?\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert('❌ Error: Por favor ingrese un número de teléfono válido en formato +51 seguido de 9 dígitos (Ej: +51 987654321).');
        document.getElementById('phoneNumberInput').classList.add('is-invalid');
        return;
    }
    document.getElementById('phoneNumberInput').classList.remove('is-invalid');

    // Simular envío al servidor
    fetch('/api/whatsapp/enviar-comprobante', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pedidoId: orderNumber,
            telefono: phoneNumber,
            mensaje: `Su comprobante de pago para el pedido ${orderNumber} está listo. Total: S/ ${orderTotal.toFixed(2)}`
        })
    }).then(response => {
        if (response.ok) {
            alert(`✅ Comprobante de la Orden ${orderNumber} enviado exitosamente por WhatsApp al número: ${phoneNumber}`);
        } else {
            alert('❌ Error al enviar el comprobante. Por favor, intente nuevamente.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('❌ Error de conexión. Por favor, intente nuevamente.');
    });
}

// Función para convertir número a palabras
function convertNumberToWords(number) {
    const totalFixed = number.toFixed(2);
    let [integerPart, decimalPart] = totalFixed.split('.').map(Number);
    let words = integerPart > 0 ? integerPart.toLocaleString('es-ES') + ' SOLES' : '';
    if (decimalPart > 0) {
        words += (words ? ' CON ' : '') + decimalPart.toLocaleString('es-ES', { minimumIntegerDigits: 2, useGrouping: false }) + ' CÉNTIMOS';
    }
    return words.toUpperCase() || 'CERO SOLES';
}

// Función para generar boleta
function handleGenerateInvoice() {
    // Validar datos de boleta
    const customerName = document.getElementById('customerName').value.trim();

    if (!customerName) {
        alert('Por favor, complete el nombre para generar la boleta.');
        return;
    }

    // Actualizar datos de la boleta
    const now = new Date();
    document.getElementById('invoice-fecha-emision').textContent = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    document.getElementById('invoice-hora-emision').textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    // Generar descripción del pedido
    let description = 'Pedido de Comida. Detalle: ';
    const details = [];
    orderData.items.forEach(item => {
        details.push(`${item.description} x ${item.qty} (S/ ${item.total.toFixed(2)})`);
    });
    description += details.join(', ') + `. Total: S/ ${orderData.total.toFixed(2)}.`;

    document.getElementById('invoice-observation').textContent = description;
    document.getElementById('invoice-customer-name').textContent = customerName;

    // Llenar tabla de items
    const tbody = document.getElementById('invoice-items-body');
    tbody.innerHTML = '';
    orderData.items.forEach(item => {
        const row = tbody.insertRow();
        const itemBasePrice = item.total / (1 + igvRate);
        const itemUnitBasePrice = itemBasePrice / item.qty;
        row.innerHTML = `
                    <td>${item.qty.toFixed(2)}</td>
                    <td>${item.unit}</td>
                    <td>${item.description}</td>
                    <td class="text-end">${currency} ${itemUnitBasePrice.toFixed(2)}</td>
                    <td class="text-end">${currency} ${itemBasePrice.toFixed(2)}</td>
                `;
    });

    // Actualizar totales
    document.getElementById('invoice-total').textContent = `${currency} ${orderData.total.toFixed(2)}`;
    document.getElementById('invoice-total-letras').textContent = `SON: ${convertNumberToWords(orderData.total).toUpperCase()}`;

    // Mostrar modal
    const pickupInvoiceModal = new bootstrap.Modal(document.getElementById('pickupInvoiceModal'));
    pickupInvoiceModal.show();
}

// Función para descargar boleta en PDF
function downloadBoletaPDF() {
    const element = document.getElementById('invoice-to-download');
    const filename = `BOLETA_${orderNumber}.pdf`;

    const options = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
}

// Función para descargar boleta en Excel
function downloadBoletaExcel() {
    // Crear datos para Excel
    const wb = XLSX.utils.book_new();

    // Hoja de datos de la boleta
    const boletaData = [
        ['BOLETA ELECTRÓNICA'],
        [''],
        ['EMISOR: VELARDE CIPRIAN TEODORO'],
        ['DIRECCIÓN: CAL. JUNIN 617 ALTURA DEL PARQUE LUREN'],
        ['RUC: 10214242236'],
        [''],
        ['CLIENTE:', document.getElementById('customerName').value],
        ['ORDEN:', orderNumber],
        ['FECHA:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['DETALLE DE PRODUCTOS'],
        ['Cantidad', 'Descripción', 'Precio Unit.', 'Total']
    ];

    // Agregar items
    orderData.items.forEach(item => {
        boletaData.push([
            item.qty,
            item.description,
            item.unitPrice.toFixed(2),
            item.total.toFixed(2)
        ]);
    });

    // Agregar totales
    boletaData.push(['']);
    boletaData.push(['SUBTOTAL:', '', '', orderData.subtotal.toFixed(2)]);
    boletaData.push(['IGV (18%):', '', '', orderData.tax.toFixed(2)]);
    boletaData.push(['TOTAL:', '', '', orderData.total.toFixed(2)]);
    boletaData.push(['']);
    boletaData.push(['TOTAL EN LETRAS:', convertNumberToWords(orderData.total)]);

    const ws = XLSX.utils.aoa_to_sheet(boletaData);
    XLSX.utils.book_append_sheet(wb, ws, "Boleta");

    // Descargar archivo
    XLSX.writeFile(wb, `BOLETA_${orderNumber}.xlsx`);
}

// Validación de entrada para solo números
function validateNumericInput(event) {
    const key = event.key;
    // Permitir solo números, backspace, delete, tab y flechas
    if (!/[\d\b\t\r]|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Delete|Backspace/.test(key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
    }
}

// Validación de teléfono con formato +51
function formatPhoneInput(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remover todo excepto números

    // Si empieza con 51, agregar el +
    if (value.startsWith('51') && value.length <= 11) {
        value = '+' + value;
    }

    // Limitar a +51 seguido de máximo 9 dígitos
    if (value.startsWith('+51') && value.length > 12) {
        value = value.substring(0, 12);
    }

    input.value = value;
}

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function () {
    // Configurar eventos para el pedido
    document.getElementById('delivery-option').addEventListener('click', () => updateInterface('delivery'));
    document.getElementById('pickup-option').addEventListener('click', () => updateInterface('pickup'));

    document.getElementById('btn-update-status').addEventListener('click', handleUpdateStatus);
    document.getElementById('btn-send-whatsapp-receipt').addEventListener('click', handleSendWhatsappReceipt);
    document.getElementById('btn-generate-pickup-invoice').addEventListener('click', handleGenerateInvoice);
    document.getElementById('btn-download-boleta-pdf-modal').addEventListener('click', downloadBoletaPDF);
    document.getElementById('btn-download-boleta-excel-modal').addEventListener('click', downloadBoletaExcel);

    // Configurar validaciones de entrada
    document.getElementById('phoneNumberInput').addEventListener('keydown', validateNumericInput);
    document.getElementById('phoneNumberInput').addEventListener('input', formatPhoneInput);

    // Inicializar
    actualizarHora();
    setInterval(actualizarHora, 1000);

    updateTime();
    setInterval(updateTime, 1000);

    updateInterface('delivery');

    // Inicializar estado del pedido
    updateStatusDisplay();
});