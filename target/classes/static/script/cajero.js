// Datos de ejemplo para la simulación
const datosCaja = {
    efectivoInicial: 200.00,
    ventasEfectivo: 845.00,
    ventasTarjeta: 320.50,
    ventasDigital: 156.00,
    totalTransacciones: 28
};

// Variables globales
const igvRate = 0.18;
const currency = 'S/';
let isPaymentProcessed = false;
let isOrderCancelled = false;
const orderNumber = document.getElementById('order-number').textContent;
let orderData = {
    items: [
        { description: 'Hamburguesa Clásica', qty: 1, unitPrice: 12.50, total: 12.50, unit: 'UNIDAD' },
        { description: 'Bebida Cola', qty: 3, unitPrice: 2.50, total: 7.50, unit: 'UNIDAD' }
    ],
    subtotal: 0,
    tax: 0,
    total: 20.00,
    currency: currency,
    totalInWords: '',
    descriptionSoles: ''
};

// Funciones para actualizar hora y fecha
function actualizarHora() {
    const ahora = new Date();
    const opcionesHora = { hour: '2-digit', minute: '2-digit' };
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

// Funciones para manejar modales
function abrirModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Funciones para el pedido
function renderOrderSummary() {
    let currentTotal = 0;
    let currentDescription = 'Pedido de Comida. Detalle: ';
    const details = [];

    orderData.items.forEach(item => {
        currentTotal += item.total;
        details.push(`${item.description} x ${item.qty} (S/ ${item.total.toFixed(2)})`);
    });

    orderData.total = currentTotal;
    orderData.subtotal = currentTotal / (1 + igvRate);
    orderData.tax = currentTotal - orderData.subtotal;

    const totalFormatted = orderData.total.toFixed(2);
    document.getElementById('order-total-display').textContent = `${currency} ${totalFormatted}`;

    const modalTotalElement = document.getElementById('modal-payment-total');
    if (modalTotalElement) modalTotalElement.textContent = `${currency} ${totalFormatted}`;

    orderData.descriptionSoles = currentDescription + details.join(', ') + `. Total: S/ ${totalFormatted}.`;
    orderData.totalInWords = convertNumberToWords(orderData.total);

    const orderItemsContainer = document.getElementById('order-items-list');
    if (orderItemsContainer) {
        orderItemsContainer.innerHTML = '';
        orderData.items.forEach((item, index) => {
            const isLastItem = index === orderData.items.length - 1;
            const itemHtml = `
                        <div class="d-flex justify-content-between${isLastItem ? ' border-bottom pb-2 mb-3' : ''}">
                            <span>${item.description} x ${item.qty}</span>
                            <span>${currency} ${item.total.toFixed(2)}</span>
                        </div>
                    `;
            orderItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
        });
    }
}

function updateInterface(type) {
    const deliveryContent = document.getElementById('content-delivery');
    const pickupContent = document.getElementById('content-pickup');
    const pickupInfoContent = document.getElementById('content-pickup-info');
    const receiptDelivery = document.getElementById('receipt-delivery');
    const receiptPickup = document.getElementById('receipt-pickup');
    const step4Text = document.querySelector('#step-4 div');

    if (type === 'delivery') {
        document.getElementById('delivery-option').classList.add('active');
        document.getElementById('pickup-option').classList.remove('active');
        deliveryContent.style.display = 'block';
        pickupContent.style.display = 'none';
        pickupInfoContent.style.display = 'none';
        receiptDelivery.style.display = 'block';
        receiptPickup.style.display = 'none';
        if (step4Text) step4Text.textContent = 'Listo para Entrega';
    } else if (type === 'pickup') {
        document.getElementById('delivery-option').classList.remove('active');
        document.getElementById('pickup-option').classList.add('active');
        deliveryContent.style.display = 'none';
        pickupContent.style.display = 'block';
        pickupInfoContent.style.display = 'block';
        receiptDelivery.style.display = 'none';
        receiptPickup.style.display = 'block';
        if (step4Text) step4Text.textContent = 'Listo para Recojo';

        // Limpiar el campo de teléfono cuando se selecciona recoger en tienda
        document.getElementById('phoneNumberInput').value = '';
    }
}

function handleAddItem() {
    const newItem = { description: 'Nueva Promo del Día', qty: 1, unitPrice: 15.00, total: 15.00, unit: 'UNIDAD' };
    orderData.items.push(newItem);
    renderOrderSummary();
    alert(`¡Item "${newItem.description}" añadido! Nuevo total: S/ ${orderData.total.toFixed(2)}`);
}

function updateOrderStatus(targetStep) {
    if (isOrderCancelled) return;
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach((item, index) => {
        if (index < targetStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function handleUpdateStatus() {
    const statusItems = document.querySelectorAll('.status-item');
    let currentActiveIndex = Array.from(statusItems).findIndex(item => item.classList.contains('active') && Array.from(statusItems).indexOf(item) > 0);

    if (!isPaymentProcessed && currentActiveIndex < 1) {
        alert('¡El pedido debe estar confirmado (Paso 2) para avanzar el estado!');
        return;
    }

    let nextStep = currentActiveIndex + 1;
    if (currentActiveIndex === -1) nextStep = 1;

    if (nextStep < statusItems.length) {
        updateOrderStatus(nextStep + 1);
        alert(`Estado del pedido actualizado a: ${statusItems[nextStep].querySelector('div').textContent}`);
    } else {
        alert('El pedido ya está en el último paso.');
    }
}

function lockInterfaceAfterCancellation() {
    isOrderCancelled = true;
    document.getElementById('btn-open-payment-modal').disabled = true;
    document.getElementById('btn-update-status').disabled = true;
    document.getElementById('btn-add-item').disabled = true;

    const receiptButtons = document.querySelectorAll('#receipt-buttons button');
    receiptButtons.forEach(btn => btn.disabled = true);

    document.getElementById('btn-cancel-order').disabled = true;
    document.getElementById('btn-cancel-order').textContent = "❌ Pedido Cancelado";

    const statusBarContainer = document.querySelector('.card .order-status-bar');
    if (statusBarContainer) {
        statusBarContainer.innerHTML = `<div class="alert alert-danger mb-0 text-center"><strong>Estado Final:</strong> PEDIDO CANCELADO.</div>`;
    }
}

function handleOrderCancellation() {
    const reason = document.getElementById('cancelReason').value.trim();
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    const cancelSpinner = document.getElementById('cancel-spinner');

    btnConfirmCancel.disabled = true;
    cancelSpinner.classList.remove('d-none');

    setTimeout(() => {
        lockInterfaceAfterCancellation();
        alert(`Pedido ${orderNumber} CANCELADO. Razón: ${reason || 'No especificada'}. El sistema ha revertido la orden.`);
        const cancelOrderModal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
        cancelOrderModal.hide();
        btnConfirmCancel.disabled = false;
        cancelSpinner.classList.add('d-none');
    }, 1500);
}

// Funciones de pago
async function processPaymentAPI(total) {
    if (isOrderCancelled) return { success: false, error: 'El pedido fue cancelado antes de procesar el pago.' };
    return new Promise((resolve) => {
        setTimeout(() => {
            if (Math.random() < 0.90) {
                resolve({ success: true, transactionId: 'TX-' + Date.now() });
            } else {
                resolve({ success: false, error: 'Tarjeta rechazada por el banco.' });
            }
        }, 2000);
    });
}

async function handlePaymentSubmission(event) {
    event.preventDefault();
    if (isOrderCancelled) {
        alert('No se puede procesar el pago. El pedido ha sido cancelado.');
        return;
    }

    const btnFinalizePayment = document.getElementById('btn-finalize-payment');
    const spinner = document.getElementById('spinner');
    const paymentStatusMessage = document.getElementById('payment-status-message');

    btnFinalizePayment.disabled = true;
    spinner.classList.remove('d-none');
    paymentStatusMessage.classList.add('d-none');

    const result = await processPaymentAPI(orderData.total);

    btnFinalizePayment.disabled = false;
    spinner.classList.add('d-none');
    paymentStatusMessage.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');

    if (result.success) {
        isPaymentProcessed = true;
        paymentStatusMessage.classList.add('alert-success');
        paymentStatusMessage.textContent = `✅ ¡Pago Aceptado! ID Transacción: ${result.transactionId}`;
        updateOrderStatus(2);
        document.querySelectorAll('#payment-form input, #payment-form button').forEach(el => el.disabled = true);
        setTimeout(() => {
            const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            paymentModal.hide();
        }, 3000);
    } else {
        isPaymentProcessed = false;
        paymentStatusMessage.classList.add('alert-danger');
        paymentStatusMessage.textContent = `❌ Error de Pago: ${result.error}.`;
    }
}

// Funciones para comprobantes
function printReceipt() {
    if (!isPaymentProcessed) {
        alert('El pago debe estar confirmado para imprimir el recibo.');
        return;
    }
    window.print();
}

function downloadBoletaPDF() {
    if (!isPaymentProcessed) {
        alert('El pago debe estar confirmado para descargar la boleta.');
        return;
    }

    // Validar datos de boleta
    const customerName = document.getElementById('customerName').value.trim();

    if (!customerName) {
        alert('Por favor, complete el nombre para generar la boleta.');
        return;
    }

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

function downloadBoletaExcel() {
    if (!isPaymentProcessed) {
        alert('El pago debe estar confirmado para descargar la boleta.');
        return;
    }

    // Validar datos de boleta
    const customerName = document.getElementById('customerName').value.trim();

    if (!customerName) {
        alert('Por favor, complete el nombre para generar la boleta.');
        return;
    }

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
        ['CLIENTE:', customerName],
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
    boletaData.push(['TOTAL EN LETRAS:', orderData.totalInWords]);

    const ws = XLSX.utils.aoa_to_sheet(boletaData);
    XLSX.utils.book_append_sheet(wb, ws, "Boleta");

    // Descargar archivo
    XLSX.writeFile(wb, `BOLETA_${orderNumber}.xlsx`);
}

function convertNumberToWords(number) {
    const totalFixed = number.toFixed(2);
    let [integerPart, decimalPart] = totalFixed.split('.').map(Number);
    let words = integerPart > 0 ? integerPart.toLocaleString('es-ES') + ' SOLES' : '';
    if (decimalPart > 0) {
        words += (words ? ' CON ' : '') + decimalPart.toLocaleString('es-ES', { minimumIntegerDigits: 2, useGrouping: false }) + ' CÉNTIMOS';
    }
    return words.toUpperCase() || 'CERO SOLES';
}

function handleSendWhatsappReceipt() {
    if (!isPaymentProcessed) {
        alert('El pago debe estar confirmado para enviar el comprobante.');
        return;
    }

    const phoneNumber = document.getElementById('phoneNumberInput').value.trim();

    // Validar formato de teléfono: +51 seguido de 9 dígitos
    const phoneRegex = /^\+51\s?\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert('❌ Error: Por favor ingrese un número de teléfono válido en formato +51 seguido de 9 dígitos (Ej: +51 987654321).');
        document.getElementById('phoneNumberInput').classList.add('is-invalid');
        return;
    }
    document.getElementById('phoneNumberInput').classList.remove('is-invalid');

    alert(`Comprobante de la Orden ${orderNumber} enviado exitosamente por WhatsApp al número: ${phoneNumber}`);
}

// Wrapper para verificar si el pedido está cancelado
const checkCancelledWrapper = (handler) => function () {
    if (isOrderCancelled) {
        alert('❌ Esta acción no está disponible. El pedido ha sido cancelado.');
        return;
    }
    handler.apply(this, arguments);
};

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
    // Configurar eventos para los botones de caja
    document.getElementById('btn-suspender').addEventListener('click', () => {
        abrirModal('modalSuspender');
    });

    document.getElementById('btn-corte').addEventListener('click', () => {
        document.querySelector('.reporte-item:nth-child(1) span:last-child').textContent =
            `S/ ${datosCaja.ventasEfectivo.toFixed(2)}`;
        document.querySelector('.reporte-item:nth-child(2) span:last-child').textContent =
            `S/ ${datosCaja.ventasTarjeta.toFixed(2)}`;
        document.querySelector('.reporte-item:nth-child(3) span:last-child').textContent =
            `S/ ${datosCaja.ventasDigital.toFixed(2)}`;
        document.querySelector('.reporte-item:nth-child(4) span:last-child').textContent =
            datosCaja.totalTransacciones;
        document.querySelector('.reporte-total span:last-child').textContent =
            `S/ ${(datosCaja.ventasEfectivo + datosCaja.ventasTarjeta + datosCaja.ventasDigital).toFixed(2)}`;
        abrirModal('modalCorte');
    });

    document.getElementById('btn-cierre').addEventListener('click', () => {
        document.getElementById('efectivoInicial').value = datosCaja.efectivoInicial.toFixed(2);
        abrirModal('modalCierre');
    });

    document.getElementById('btn-devolucion').addEventListener('click', () => {
        abrirModal('modalDevolucion');
    });

    document.getElementById('btn-ayuda').addEventListener('click', () => {
        abrirModal('modalAyuda');
    });

    // Configurar eventos para cerrar modales
    document.querySelectorAll('.close-modal, .btn-cancel').forEach(element => {
        element.addEventListener('click', function () {
            const modal = this.closest('.modal-custom');
            cerrarModal(modal.id);
        });
    });

    // Calcular diferencia en cierre de caja
    document.getElementById('efectivoFinal').addEventListener('input', function () {
        const efectivoInicial = parseFloat(document.getElementById('efectivoInicial').value);
        const efectivoFinal = parseFloat(this.value) || 0;
        const diferencia = efectivoFinal - (efectivoInicial + datosCaja.ventasEfectivo);
        document.getElementById('diferencia').value = diferencia.toFixed(2);

        if (diferencia === 0) {
            document.getElementById('diferencia').style.color = '#4caf50';
        } else if (diferencia > 0) {
            document.getElementById('diferencia').style.color = '#ff9800';
        } else {
            document.getElementById('diferencia').style.color = '#f44336';
        }
    });

    // Confirmar acciones de caja
    document.getElementById('confirmarSuspension').addEventListener('click', function () {
        const motivo = document.getElementById('motivoSuspension').value;
        const tiempo = document.getElementById('tiempoEstimado').value;

        if (!motivo) {
            alert('Por favor, seleccione un motivo de suspensión.');
            return;
        }

        alert(`Caja suspendida por ${tiempo} minutos.\nMotivo: ${motivo}`);
        document.querySelector('.estado').textContent = 'Caja #4 - Suspendida';
        cerrarModal('modalSuspender');
    });

    document.getElementById('confirmarCorte').addEventListener('click', function () {
        alert('Corte parcial impreso correctamente.\nEl reporte ha sido guardado en el sistema.');
        cerrarModal('modalCorte');
    });

    document.getElementById('confirmarCierre').addEventListener('click', function () {
        const efectivoFinal = document.getElementById('efectivoFinal').value;
        const observaciones = document.getElementById('observacionesCierre').value;

        if (!efectivoFinal) {
            alert('Por favor, ingrese el monto de efectivo contado.');
            return;
        }

        alert('Caja cerrada correctamente.\nEl reporte de cierre ha sido generado.');
        document.querySelector('.estado').textContent = 'Caja #4 - Cerrada';
        cerrarModal('modalCierre');
    });

    document.getElementById('confirmarDevolucion').addEventListener('click', function () {
        const numeroTicket = document.getElementById('numeroTicket').value;
        const motivo = document.getElementById('motivoDevolucion').value;

        if (!numeroTicket || !motivo) {
            alert('Por favor, complete todos los campos obligatorios.');
            return;
        }

        alert('Devolución procesada correctamente.\nEl reembolso ha sido aplicado.');
        cerrarModal('modalDevolucion');
    });

    document.getElementById('confirmarAyuda').addEventListener('click', function () {
        const tipoAyuda = document.getElementById('tipoAyuda').value;
        const descripcion = document.getElementById('descripcionProblema').value;

        if (!tipoAyuda || !descripcion) {
            alert('Por favor, complete todos los campos obligatorios.');
            return;
        }

        alert('Solicitud de ayuda enviada.\nEl personal de soporte se contactará pronto.');
        cerrarModal('modalAyuda');
    });

    // Configurar eventos para el pedido
    document.getElementById('delivery-option').addEventListener('click', () => updateInterface('delivery'));
    document.getElementById('pickup-option').addEventListener('click', () => updateInterface('pickup'));

    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmission);
    document.getElementById('btn-confirm-cancel').addEventListener('click', handleOrderCancellation);
    document.getElementById('btn-send-whatsapp-receipt').addEventListener('click', checkCancelledWrapper(handleSendWhatsappReceipt));
    document.getElementById('btn-add-item').addEventListener('click', checkCancelledWrapper(handleAddItem));
    document.getElementById('btn-update-status').addEventListener('click', checkCancelledWrapper(handleUpdateStatus));
    document.getElementById('btn-download-boleta-pdf').addEventListener('click', checkCancelledWrapper(downloadBoletaPDF));
    document.getElementById('btn-download-boleta-excel').addEventListener('click', checkCancelledWrapper(downloadBoletaExcel));
    document.getElementById('btn-download-boleta-pdf-modal').addEventListener('click', checkCancelledWrapper(downloadBoletaPDF));
    document.getElementById('btn-download-boleta-excel-modal').addEventListener('click', checkCancelledWrapper(downloadBoletaExcel));
    document.getElementById('btn-print-receipt').addEventListener('click', checkCancelledWrapper(printReceipt));

    // Configurar eventos para generar comprobantes
    const receiptHandlers = [
        document.getElementById('btn-generate-payment-receipt'),
        document.getElementById('btn-generate-payment-receipt-pickup')
    ];

    receiptHandlers.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', checkCancelledWrapper(function () {
                if (!isPaymentProcessed) {
                    alert('El pago debe ser confirmado.');
                    return;
                }
                const now = new Date();
                document.getElementById('receipt-date-time').textContent = now.toLocaleString();
                document.getElementById('receipt-subtotal-display').textContent = `${currency} ${orderData.subtotal.toFixed(2)}`;
                document.getElementById('receipt-total-display').textContent = `${currency} ${orderData.total.toFixed(2)}`;

                const paymentReceiptModal = new bootstrap.Modal(document.getElementById('paymentReceiptModal'));
                paymentReceiptModal.show();
            }));
        }
    });

    document.getElementById('btn-generate-pickup-invoice').addEventListener('click', checkCancelledWrapper(function () {
        if (!isPaymentProcessed) {
            alert('El pago debe ser confirmado.');
            return;
        }

        // Validar datos de boleta
        const customerName = document.getElementById('customerName').value.trim();

        if (!customerName) {
            alert('Por favor, complete el nombre para generar la boleta.');
            return;
        }

        const now = new Date();
        document.getElementById('invoice-fecha-emision').textContent = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        document.getElementById('invoice-hora-emision').textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        document.getElementById('invoice-observation').textContent = orderData.descriptionSoles;
        document.getElementById('invoice-customer-name').textContent = customerName;

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

        document.getElementById('invoice-total').textContent = `${currency} ${orderData.total.toFixed(2)}`;
        document.getElementById('invoice-total-letras').textContent = `SON: ${orderData.totalInWords.toUpperCase()}`;

        const pickupInvoiceModal = new bootstrap.Modal(document.getElementById('pickupInvoiceModal'));
        pickupInvoiceModal.show();
    }));

    // Configurar validaciones de entrada
    document.getElementById('phoneNumberInput').addEventListener('keydown', validateNumericInput);
    document.getElementById('phoneNumberInput').addEventListener('input', formatPhoneInput);

    // Inicializar
    actualizarHora();
    setInterval(actualizarHora, 1000);

    updateTime();
    setInterval(updateTime, 1000);

    updateInterface('delivery');
    renderOrderSummary();

    // Configurar número de orden en modal de cancelación
    document.getElementById('cancel-order-number').textContent = orderNumber;
});