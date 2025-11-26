document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ADMIN MENÚ - INICIADO ===');

    // Variables globales
    let currentEditingId = null;
    let products = [];
    let users = [];
    let estadisticas = {};
    let currentSection = 'dashboard';
    let currentReportData = null;
    let reportChartInstance = null;
    let categoryChartInstance = null;

    // Función para mostrar alertas dinámicas
    function mostrarAlerta(mensaje, tipo = 'success') {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
        alerta.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} me-2"></i>
                <span>${mensaje}</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const dynamicAlerts = document.getElementById('dynamicAlerts');
        dynamicAlerts.innerHTML = '';
        dynamicAlerts.appendChild(alerta);

        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 5000);
    }

    // INICIALIZAR SECCIÓN DE REPORTES
    function inicializarReportes() {
        console.log('Inicializando sección de reportes...');

        const generateReportBtn = document.getElementById('generateReportBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const dateRange = document.getElementById('dateRange');
        const reportType = document.getElementById('reportType');

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', generarReporte);
        }

        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', exportarPDF);
        }

        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', exportarExcel);
        }

        if (dateRange) {
            dateRange.addEventListener('change', manejarCambioRangoFechas);
        }

        if (reportType) {
            reportType.addEventListener('change', cambiarTipoReporte);
        }

        inicializarFechas();
    }

    // INICIALIZAR FECHAS
    function inicializarFechas() {
        const hoy = new Date();

        function formatLocalDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        document.getElementById('startDate').value = formatLocalDate(primerDiaMes);
        document.getElementById('endDate').value = formatLocalDate(hoy);
    }

    // MANEJAR CAMBIO DE RANGO DE FECHAS
    function manejarCambioRangoFechas() {
        const dateRange = document.getElementById('dateRange').value;
        const hoy = new Date();
        let startDate, endDate;

        function formatLocalDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        switch(dateRange) {
            case 'hoy':
                startDate = endDate = formatLocalDate(hoy);
                break;
            case 'ayer':
                const ayer = new Date(hoy);
                ayer.setDate(hoy.getDate() - 1);
                startDate = endDate = formatLocalDate(ayer);
                break;
            case 'semana':
                const inicioSemana = new Date(hoy);
                inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                startDate = formatLocalDate(inicioSemana);
                endDate = formatLocalDate(hoy);
                break;
            case 'mes':
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                startDate = formatLocalDate(inicioMes);
                endDate = formatLocalDate(hoy);
                break;
            case 'personalizado':
                return;
        }

        if (startDate && endDate) {
            document.getElementById('startDate').value = startDate;
            document.getElementById('endDate').value = endDate;

            console.log('Rango de fechas seleccionado:', {
                rango: dateRange,
                inicio: startDate,
                fin: endDate
            });
        }
    }

    // CAMBIAR TIPO DE REPORTE
    function cambiarTipoReporte() {
        const reportType = document.getElementById('reportType').value;
        const mainChartTitle = document.getElementById('mainChartTitle');
        const detailTableTitle = document.getElementById('detailTableTitle');

        if (mainChartTitle) {
            switch(reportType) {
                case 'ventas':
                    mainChartTitle.textContent = 'Ventas por Día';
                    break;
                case 'productos':
                    mainChartTitle.textContent = 'Productos Más Vendidos';
                    break;
                case 'usuarios':
                    mainChartTitle.textContent = 'Actividad de Usuarios';
                    break;
                case 'pedidos':
                    mainChartTitle.textContent = 'Estadísticas de Pedidos';
                    break;
            }
        }

        if (detailTableTitle) {
            switch(reportType) {
                case 'ventas':
                    detailTableTitle.textContent = 'Detalle de Ventas';
                    break;
                case 'productos':
                    detailTableTitle.textContent = 'Productos Más Vendidos';
                    break;
                case 'usuarios':
                    detailTableTitle.textContent = 'Actividad de Usuarios';
                    break;
                case 'pedidos':
                    detailTableTitle.textContent = 'Estadísticas de Pedidos';
                    break;
            }
        }
    }

    // GENERAR REPORTE
    async function generarReporte() {
        try {
            console.log('Generando reporte...');

            const reportType = document.getElementById('reportType').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (!startDate || !endDate) {
                mostrarAlerta('Por favor seleccione un rango de fechas válido', 'warning');
                return;
            }

            if (new Date(startDate) > new Date(endDate)) {
                mostrarAlerta('La fecha de inicio no puede ser mayor a la fecha fin', 'warning');
                return;
            }

            mostrarAlerta('Generando reporte...', 'info');

            let url = '';
            switch(reportType) {
                case 'ventas':
                    url = `/admin-menu/reportes/ventas?fechaInicio=${startDate}&fechaFin=${endDate}`;
                    break;
                case 'productos':
                    url = `/admin-menu/reportes/productos?fechaInicio=${startDate}&fendaFin=${endDate}`;
                    break;
                case 'usuarios':
                    url = `/admin-menu/reportes/usuarios?fechaInicio=${startDate}&fechaFin=${endDate}`;
                    break;
                case 'pedidos':
                    url = `/admin-menu/reportes/ventas?fechaInicio=${startDate}&fechaFin=${endDate}`;
                    break;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                currentReportData = result;
                mostrarReporte(result, reportType);
                mostrarAlerta('Reporte generado exitosamente', 'success');
            } else {
                throw new Error(result.error || 'Error al generar reporte');
            }

        } catch (error) {
            console.error('Error generando reporte:', error);
            mostrarAlerta('Error al generar reporte: ' + error.message, 'danger');
        }
    }

    // MOSTRAR REPORTE
    function mostrarReporte(data, reportType) {
        actualizarMetricasReporte(data.metricas);
        actualizarGraficosReporte(data, reportType);
        actualizarTablaReporte(data.tablaDatos, reportType);
    }

    // ACTUALIZAR MÉTRICAS DEL REPORTE
    function actualizarMetricasReporte(metricas) {
        const reportTotalVentas = document.getElementById('reportTotalVentas');
        const reportTotalPedidos = document.getElementById('reportTotalPedidos');
        const reportProductosVendidos = document.getElementById('reportProductosVendidos');
        const reportCrecimiento = document.getElementById('reportCrecimiento');

        if (reportTotalVentas) {
            reportTotalVentas.textContent = metricas.totalVentas ? `S/ ${metricas.totalVentas.toFixed(2)}` : '0';
        }

        if (reportTotalPedidos) {
            reportTotalPedidos.textContent = metricas.totalPedidos || '0';
        }

        if (reportProductosVendidos) {
            reportProductosVendidos.textContent = metricas.productosVendidos || metricas.usuariosActivos || '0';
        }

        if (reportCrecimiento) {
            const crecimiento = metricas.crecimiento || 0;
            reportCrecimiento.textContent = `${crecimiento > 0 ? '+' : ''}${crecimiento.toFixed(1)}%`;

            // Usar clases CSS en lugar de estilos inline
            reportCrecimiento.classList.remove('text-success', 'text-danger', 'text-secondary');
            if (crecimiento > 0) {
                reportCrecimiento.classList.add('text-success');
            } else if (crecimiento < 0) {
                reportCrecimiento.classList.add('text-danger');
            } else {
                reportCrecimiento.classList.add('text-secondary');
            }
        }
    }

    // ACTUALIZAR GRÁFICOS DEL REPORTE
    function actualizarGraficosReporte(data, reportType) {
        if (reportChartInstance) {
            reportChartInstance.destroy();
        }
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        const reportCtx = document.getElementById('reportChart');
        const categoryCtx = document.getElementById('categoryChart');

        if (!reportCtx || !categoryCtx) return;

        const mainChartData = data.datosGrafico;
        if (mainChartData && mainChartData.labels && mainChartData.datos) {
            reportChartInstance = new Chart(reportCtx, {
                type: reportType === 'productos' ? 'bar' : 'line',
                data: {
                    labels: mainChartData.labels,
                    datasets: [{
                        label: getChartLabel(reportType),
                        data: mainChartData.datos,
                        backgroundColor: reportType === 'productos' ?
                            'rgba(54, 162, 235, 0.5)' : 'rgba(75, 192, 192, 0.2)',
                        borderColor: reportType === 'productos' ?
                            'rgba(54, 162, 235, 1)' : 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: reportType !== 'productos'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (reportType === 'ventas' || label.includes('Ventas')) {
                                        return `${label}: S/ ${value.toFixed(2)}`;
                                    }
                                    return `${label}: ${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    if (reportType === 'ventas' || reportType === 'productos') {
                                        return 'S/ ' + value.toFixed(2);
                                    }
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
        }

        if ((reportType === 'ventas' || reportType === 'productos') && data.datosCategoria) {
            const categoryData = data.datosCategoria;
            if (categoryData.labels && categoryData.datos) {
                categoryChartInstance = new Chart(categoryCtx, {
                    type: 'doughnut',
                    data: {
                        labels: categoryData.labels,
                        datasets: [{
                            data: categoryData.datos,
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        }
    }

    // OBTENER ETIQUETA DEL GRÁFICO
    function getChartLabel(reportType) {
        switch(reportType) {
            case 'ventas': return 'Ventas (S/)';
            case 'productos': return 'Ingresos por Producto (S/)';
            case 'usuarios': return 'Pedidos por Usuario';
            case 'pedidos': return 'Estadísticas de Pedidos';
            default: return 'Datos';
        }
    }

    // ACTUALIZAR TABLA DEL REPORTE - SIN ESTILOS INLINE
    function actualizarTablaReporte(tablaDatos, reportType) {
        const tbody = document.getElementById('reportTableBody');
        const thead = document.getElementById('reportTableHeader');
        const noDataMessage = document.getElementById('noReportData');
        const tableContainer = document.querySelector('.table-responsive');

        if (!tbody || !thead) return;

        tbody.innerHTML = '';
        thead.innerHTML = '';

        if (!tablaDatos || tablaDatos.length === 0) {
            if (noDataMessage) noDataMessage.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');
            return;
        }

        if (noDataMessage) noDataMessage.classList.add('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

        let headers = [];
        switch(reportType) {
            case 'ventas':
                headers = ['Pedido ID', 'Fecha', 'Cliente', 'Productos', 'Total', 'Estado'];
                break;
            case 'productos':
                headers = ['Producto', 'Categoría', 'Vendidos', 'Ingresos (S/)'];
                break;
            case 'usuarios':
                headers = ['Usuario', 'Rol', 'Pedidos', 'Total Gastado (S/)'];
                break;
            case 'pedidos':
                headers = ['Pedido ID', 'Fecha', 'Cliente', 'Productos', 'Total', 'Estado'];
                break;
        }

        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        tablaDatos.forEach(fila => {
            const tr = document.createElement('tr');

            switch(reportType) {
                case 'ventas':
                case 'pedidos':
                    const idTd = document.createElement('td');
                    idTd.textContent = fila.id || 'N/A';

                    const fechaTd = document.createElement('td');
                    fechaTd.textContent = fila.fecha || 'N/A';

                    const clienteTd = document.createElement('td');
                    clienteTd.textContent = fila.cliente || 'Cliente general';

                    const productosTd = document.createElement('td');
                    productosTd.textContent = fila.productos || 'Sin productos';

                    const totalTd = document.createElement('td');
                    const totalStrong = document.createElement('strong');
                    totalStrong.textContent = `S/ ${(fila.total || 0).toFixed(2)}`;
                    totalTd.appendChild(totalStrong);

                    const estadoTd = document.createElement('td');
                    const estadoBadge = document.createElement('span');
                    estadoBadge.className = `badge ${getBadgeClassForEstado(fila.estado)}`;
                    estadoBadge.textContent = fila.estado || 'PENDIENTE';
                    estadoTd.appendChild(estadoBadge);

                    tr.appendChild(idTd);
                    tr.appendChild(fechaTd);
                    tr.appendChild(clienteTd);
                    tr.appendChild(productosTd);
                    tr.appendChild(totalTd);
                    tr.appendChild(estadoTd);
                    break;

                case 'productos':
                    const productoTd = document.createElement('td');
                    productoTd.textContent = fila.producto || 'N/A';

                    const categoriaTd = document.createElement('td');
                    categoriaTd.textContent = fila.categoria || 'General';

                    const vendidosTd = document.createElement('td');
                    vendidosTd.textContent = fila.vendidos || 0;

                    const ingresosTd = document.createElement('td');
                    const ingresosStrong = document.createElement('strong');
                    ingresosStrong.textContent = `S/ ${(fila.ingresos || 0).toFixed(2)}`;
                    ingresosTd.appendChild(ingresosStrong);

                    tr.appendChild(productoTd);
                    tr.appendChild(categoriaTd);
                    tr.appendChild(vendidosTd);
                    tr.appendChild(ingresosTd);
                    break;

                case 'usuarios':
                    const usuarioTd = document.createElement('td');
                    usuarioTd.textContent = fila.usuario || 'N/A';

                    const rolTd = document.createElement('td');
                    rolTd.textContent = fila.rol || 'N/A';

                    const pedidosTd = document.createElement('td');
                    pedidosTd.textContent = fila.pedidos || 0;

                    const gastadoTd = document.createElement('td');
                    const gastadoStrong = document.createElement('strong');
                    gastadoStrong.textContent = `S/ ${(fila.totalGastado || 0).toFixed(2)}`;
                    gastadoTd.appendChild(gastadoStrong);

                    tr.appendChild(usuarioTd);
                    tr.appendChild(rolTd);
                    tr.appendChild(pedidosTd);
                    tr.appendChild(gastadoTd);
                    break;
            }

            tbody.appendChild(tr);
        });
    }

    // EXPORTAR PDF
    async function exportarPDF() {
        try {
            if (!currentReportData) {
                mostrarAlerta('Primero debe generar un reporte', 'warning');
                return;
            }

            mostrarAlerta('Generando PDF profesional...', 'info');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const reportType = document.getElementById('reportType').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const metricas = currentReportData.metricas;

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPos = margin;

            // Encabezado
            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LUREN CHICKEN', pageWidth / 2, 15, { align: 'center' });

            doc.setFontSize(12);
            doc.text('SISTEMA DE GESTIÓN - REPORTES AUTOMATIZADOS', pageWidth / 2, 25, { align: 'center' });

            yPos = 50;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Información del reporte
            doc.setDrawColor(41, 128, 185);
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'F');
            doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'S');

            doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, margin + 5, yPos);
            doc.text(`Tipo de reporte: ${reportType.toUpperCase()}`, margin + 5, yPos + 8);
            doc.text(`Período analizado: ${formatFecha(startDate)} a ${formatFecha(endDate)}`, margin + 5, yPos + 16);

            yPos += 35;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 185);
            doc.text('MÉTRICAS PRINCIPALES', margin, yPos);

            yPos += 10;
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(255, 255, 255);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
            doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'S');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            const col1X = margin + 10;
            const col2X = pageWidth / 2 + 10;
            let metricY = yPos + 12;

            doc.setFont('helvetica', 'bold');
            doc.text('VENTAS TOTALES:', col1X, metricY);
            doc.setFont('helvetica', 'normal');
            doc.text(metricas.totalVentas ? `S/ ${metricas.totalVentas.toFixed(2)}` : 'S/ 0.00', col1X + 40, metricY);

            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL PEDIDOS:', col1X, metricY + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(metricas.totalPedidos?.toString() || '0', col1X + 40, metricY + 8);

            doc.setFont('helvetica', 'bold');
            doc.text('PRODUCTOS VENDIDOS:', col2X, metricY);
            doc.setFont('helvetica', 'normal');
            doc.text((metricas.productosVendidos || metricas.usuariosActivos || '0').toString(), col2X + 50, metricY);

            doc.setFont('helvetica', 'bold');
            doc.text('TASA DE CRECIMIENTO:', col2X, metricY + 8);
            doc.setFont('helvetica', 'normal');
            const crecimiento = metricas.crecimiento || 0;
            doc.text(`${crecimiento > 0 ? '+' : ''}${crecimiento.toFixed(1)}%`, col2X + 50, metricY + 8);

            if (currentReportData.tablaDatos && currentReportData.tablaDatos.length > 0) {
                yPos += 60;

                if (yPos > 200) {
                    doc.addPage();
                    yPos = margin;
                }

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(41, 128, 185);
                doc.text('DETALLE DEL REPORTE', margin, yPos);
                yPos += 10;

                const headers = Object.keys(currentReportData.tablaDatos[0]);
                const body = currentReportData.tablaDatos.map(fila =>
                    headers.map(header => {
                        const valor = fila[header];
                        if (typeof valor === 'number') {
                            if (header.toLowerCase().includes('total') ||
                                header.toLowerCase().includes('ingreso') ||
                                header.toLowerCase().includes('precio')) {
                                return `S/ ${valor.toFixed(2)}`;
                            }
                            return valor.toString();
                        }
                        return valor?.toString() || '';
                    })
                );

                doc.autoTable({
                    startY: yPos,
                    head: [headers.map(h => h.toUpperCase())],
                    body: body,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9,
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 8,
                        cellPadding: 2,
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 250]
                    },
                    styles: {
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1
                    },
                    margin: { left: margin, right: margin }
                });
            }

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);

                doc.setDrawColor(200, 200, 200);
                doc.line(margin, doc.internal.pageSize.getHeight() - 20, pageWidth - margin, doc.internal.pageSize.getHeight() - 20);

                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
                doc.text('© Luren Chicken - Sistema de Gestión Interno', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
                doc.text('Reporte generado automáticamente - Confidencial', pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
            }

            function formatLocalDate(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            const timestamp = formatLocalDate(new Date());
            doc.save(`Reporte_Luren_${reportType}_${timestamp}.pdf`);

            mostrarAlerta('PDF profesional exportado exitosamente', 'success');

        } catch (error) {
            console.error('Error exportando PDF:', error);
            mostrarAlerta('Error al exportar PDF: ' + error.message, 'danger');
        }
    }

    // EXPORTAR EXCEL
    async function exportarExcel() {
        try {
            if (!currentReportData) {
                mostrarAlerta('Primero debe generar un reporte', 'warning');
                return;
            }

            mostrarAlerta('Generando Excel con estilos profesionales...', 'info');

            const reportType = document.getElementById('reportType').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const metricas = currentReportData.metricas;
            const crecimiento = metricas.crecimiento || 0;

            const workbook = new ExcelJS.Workbook();

            const worksheet = workbook.addWorksheet('Resumen Ejecutivo');

            worksheet.columns = [
                { width: 25 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 25 }
            ];

            const titleRow = worksheet.getRow(1);
            titleRow.height = 30;
            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'LUREN CHICKEN';
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E86AB' }
            };
            titleCell.font = {
                name: 'Arial',
                size: 16,
                bold: true,
                color: { argb: 'FFFFFFFF' }
            };
            titleCell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            titleCell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };

            worksheet.mergeCells('A2:E2');
            const subtitleCell = worksheet.getCell('A2');
            subtitleCell.value = 'Sistema de Gestión - Reportes Automatizados';
            subtitleCell.font = {
                name: 'Arial',
                size: 12,
                bold: true,
                color: { argb: 'FF2E86AB' }
            };
            subtitleCell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };

            let currentRow = 4;

            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            const infoTitleCell = worksheet.getCell(`A${currentRow}`);
            infoTitleCell.value = 'INFORMACIÓN DEL REPORTE';
            infoTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E86AB' }
            };
            infoTitleCell.font = {
                name: 'Arial',
                size: 14,
                bold: true,
                color: { argb: 'FFFFFFFF' }
            };
            infoTitleCell.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
            infoTitleCell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value = 'Fecha de Generación';
            worksheet.getCell(`B${currentRow}`).value = new Date().toLocaleString('es-ES');

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value = 'Tipo de Reporte';
            worksheet.getCell(`B${currentRow}`).value = reportType.toUpperCase();

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value = 'Período Analizado';
            worksheet.getCell(`B${currentRow}`).value = `${formatFecha(startDate)} a ${formatFecha(endDate)}`;

            for (let i = 5; i <= 7; i++) {
                for (let j = 1; j <= 2; j++) {
                    const cell = worksheet.getCell(i, j);
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }
            }

            currentRow += 2;

            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            const metricsTitleCell = worksheet.getCell(`A${currentRow}`);
            metricsTitleCell.value = 'MÉTRICAS PRINCIPALES';
            metricsTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E86AB' }
            };
            metricsTitleCell.font = {
                name: 'Arial',
                size: 14,
                bold: true,
                color: { argb: 'FFFFFFFF' }
            };
            metricsTitleCell.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
            metricsTitleCell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };

            currentRow++;
            const headerRow = worksheet.getRow(currentRow);
            headerRow.values = ['INDICADOR', 'VALOR', 'TENDENCIA', 'META', 'OBSERVACIONES'];
            headerRow.height = 20;

            for (let i = 1; i <= 5; i++) {
                const cell = worksheet.getCell(currentRow, i);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF5D8AA8' }
                };
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    bold: true,
                    color: { argb: 'FFFFFFFF' }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'center'
                };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            }

            const metricsData = [
                ['Ventas Totales', metricas.totalVentas ? `S/ ${metricas.totalVentas.toFixed(2)}` : 'S/ 0.00', '', 'Por definir', ''],
                ['Total de Pedidos', metricas.totalPedidos || '0', '', 'Por definir', ''],
                ['Productos Vendidos', metricas.productosVendidos || metricas.usuariosActivos || '0', '', 'Por definir', ''],
                ['Tasa de Crecimiento', `${crecimiento > 0 ? '+' : ''}${crecimiento.toFixed(1)}%`, '', 'Por definir', '']
            ];

            metricsData.forEach((metric, index) => {
                currentRow++;
                const dataRow = worksheet.getRow(currentRow);
                dataRow.values = metric;
                dataRow.height = 18;

                for (let i = 1; i <= 5; i++) {
                    const cell = worksheet.getCell(currentRow, i);
                    const isFirstCol = i === 1;

                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF' }
                    };
                    cell.font = {
                        name: 'Arial',
                        size: 10,
                        bold: isFirstCol,
                        color: { argb: isFirstCol ? 'FF2E86AB' : 'FF000000' }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: isFirstCol ? 'left' : 'center'
                    };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }
            });

            currentRow += 2;

            worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
            const analysisTitleCell = worksheet.getCell(`A${currentRow}`);
            analysisTitleCell.value = 'ANÁLISIS EJECUTIVO';
            analysisTitleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E86AB' }
            };
            analysisTitleCell.font = {
                name: 'Arial',
                size: 14,
                bold: true,
                color: { argb: 'FFFFFFFF' }
            };
            analysisTitleCell.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
            analysisTitleCell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };

            const analysisText = [
                'Este reporte fue generado automáticamente por el sistema de gestión Luren Chicken.',
                'Los datos reflejan el desempeño comercial del período seleccionado.',
                'Para más información detallada, contacte al administrador del sistema.'
            ];

            analysisText.forEach((text, index) => {
                currentRow++;
                worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
                const analysisCell = worksheet.getCell(`A${currentRow}`);
                analysisCell.value = text;
                analysisCell.font = {
                    name: 'Arial',
                    size: 10,
                    italic: true
                };
                analysisCell.alignment = {
                    vertical: 'middle',
                    horizontal: 'left'
                };
            });

            if (currentReportData.tablaDatos && currentReportData.tablaDatos.length > 0) {
                const datosWorksheet = workbook.addWorksheet('Datos Detallados');

                const headers = Object.keys(currentReportData.tablaDatos[0]);

                const headerRowDatos = datosWorksheet.getRow(1);
                headerRowDatos.values = headers.map(h => h.toUpperCase());
                headerRowDatos.height = 22;

                for (let i = 1; i <= headers.length; i++) {
                    const cell = datosWorksheet.getCell(1, i);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF2E86AB' }
                    };
                    cell.font = {
                        name: 'Arial',
                        size: 11,
                        bold: true,
                        color: { argb: 'FFFFFFFF' }
                    };
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }

                currentReportData.tablaDatos.forEach((fila, rowIndex) => {
                    const dataRow = datosWorksheet.getRow(rowIndex + 2);
                    dataRow.values = headers.map(header => {
                        const valor = fila[header];
                        if (typeof valor === 'number') {
                            if (header.toLowerCase().includes('precio') ||
                                header.toLowerCase().includes('total') ||
                                header.toLowerCase().includes('ingreso') ||
                                header.toLowerCase().includes('gastado')) {
                                return `S/ ${valor.toFixed(2)}`;
                            }
                            return valor;
                        }
                        return valor || '';
                    });
                    dataRow.height = 18;

                    for (let i = 1; i <= headers.length; i++) {
                        const cell = datosWorksheet.getCell(rowIndex + 2, i);
                        const cellValue = dataRow.values[i - 1];
                        const isNumeric = typeof cellValue === 'string' && cellValue.includes('S/');

                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: rowIndex % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF' }
                        };
                        cell.font = {
                            name: 'Arial',
                            size: 10,
                            bold: isNumeric,
                            color: { argb: 'FF000000' }
                        };
                        cell.alignment = {
                            vertical: 'middle',
                            horizontal: isNumeric ? 'right' : 'left'
                        };
                        cell.border = {
                            top: { style: 'thin' }, left: { style: 'thin' },
                            bottom: { style: 'thin' }, right: { style: 'thin' }
                        };
                    }
                });

                datosWorksheet.columns = headers.map(() => ({ width: 18 }));
            }

            function formatLocalDate(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            const timestamp = formatLocalDate(new Date());
            const buffer = await workbook.xlsx.writeBuffer();

            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Luren_${reportType}_${timestamp}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);

            mostrarAlerta('Excel profesional exportado exitosamente', 'success');

        } catch (error) {
            console.error('Error exportando Excel:', error);
            mostrarAlerta('Error al exportar Excel: ' + error.message, 'danger');
        }
    }

    // FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS
    function formatFecha(fechaStr) {
        if (!fechaStr) return 'N/A';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // CARGAR ESTADÍSTICAS COMPLETAS DEL DASHBOARD
    async function cargarEstadisticasDashboard() {
        try {
            console.log('Cargando estadísticas completas del dashboard...');

            const [estadisticasResponse, ventasRecientesResponse, estadisticasVentasResponse] = await Promise.all([
                fetch('/admin-menu/estadisticas-dashboard'),
                fetch('/admin-menu/ventas-recientes'),
                fetch('/admin-menu/estadisticas-ventas')
            ]);

            if (!estadisticasResponse.ok || !ventasRecientesResponse.ok) {
                throw new Error('Error al cargar datos del dashboard');
            }

            const estadisticasData = await estadisticasResponse.json();
            const ventasRecientes = await ventasRecientesResponse.json();
            const estadisticasVentas = await estadisticasVentasResponse.json();

            console.log('Datos del dashboard cargados:', {
                estadisticas: estadisticasData,
                ventasRecientes: ventasRecientes.length,
                estadisticasVentas: estadisticasVentas
            });

            if (estadisticasData.success !== false) {
                actualizarTarjetasDashboard(estadisticasData);
                actualizarVentasRecientes(ventasRecientes);

                if (estadisticasVentas.success) {
                    actualizarGraficoVentas(estadisticasVentas.ventasPorDia);
                }

                actualizarResumenVentas(estadisticasData);
            } else {
                throw new Error(estadisticasData.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            mostrarAlerta('Error al cargar datos del dashboard', 'warning');
        }
    }

    // ACTUALIZAR TARJETAS DEL DASHBOARD
    function actualizarTarjetasDashboard(data) {
        if (document.getElementById('totalProductos')) {
            document.getElementById('totalProductos').textContent = data.totalProductos || 0;
        }
        if (document.getElementById('totalUsuarios')) {
            document.getElementById('totalUsuarios').textContent = data.totalUsuarios || 0;
        }
        if (document.getElementById('pedidosHoy')) {
            document.getElementById('pedidosHoy').textContent = data.pedidosHoy || 0;
        }
        if (document.getElementById('ingresosHoy')) {
            document.getElementById('ingresosHoy').textContent = `S/ ${(data.ingresosHoy || 0).toFixed(2)}`;
        }
    }

    // ACTUALIZAR RESUMEN DE VENTAS
    function actualizarResumenVentas(data) {
        if (document.getElementById('ventasMesTotal')) {
            document.getElementById('ventasMesTotal').textContent = `S/ ${(data.ventasMesTotal || 0).toFixed(2)}`;
        }
        if (document.getElementById('promedioDiario')) {
            document.getElementById('promedioDiario').textContent = `S/ ${(data.promedioDiario || 0).toFixed(2)}`;
        }
        if (document.getElementById('ventaMaxima')) {
            document.getElementById('ventaMaxima').textContent = `S/ ${(data.ventaMaxima || 0).toFixed(2)}`;
        }
        if (document.getElementById('totalPedidos')) {
            document.getElementById('totalPedidos').textContent = data.totalPedidos || 0;
        }
    }

    // ACTUALIZAR TABLA DE VENTAS RECIENTES - SIN ESTILOS INLINE
    function actualizarVentasRecientes(ventas) {
        const tbody = document.getElementById('salesTableBody');
        const noSalesMessage = document.getElementById('noSalesMessage');
        const tableContainer = document.querySelector('.table-responsive');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (!ventas || ventas.length === 0) {
            if (noSalesMessage) noSalesMessage.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');
            return;
        }

        if (noSalesMessage) noSalesMessage.classList.add('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

        ventas.forEach(pedido => {
            const tr = document.createElement('tr');

            const fecha = pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';

            let productosHtml = '';
            if (pedido.items && pedido.items.length > 0) {
                pedido.items.forEach(item => {
                    const nombreProducto = item.nombreProductoSeguro || item.nombreProducto || 'Producto no disponible';
                    productosHtml += `${nombreProducto} (x${item.cantidad})<br>`;
                });
            } else {
                productosHtml = 'Sin productos';
            }

            const cliente = pedido.usuario ?
                `${pedido.usuario.nombres} ${pedido.usuario.apellidos}` :
                (pedido.cliente || 'Cliente general');

            // Crear elementos individualmente sin estilos inline
            const pedidoTd = document.createElement('td');
            pedidoTd.textContent = pedido.numeroPedido || pedido.id;

            const clienteTd = document.createElement('td');
            clienteTd.textContent = cliente;

            const productosTd = document.createElement('td');
            productosTd.innerHTML = productosHtml;

            const totalTd = document.createElement('td');
            const totalStrong = document.createElement('strong');
            totalStrong.textContent = `S/ ${(pedido.total || 0).toFixed(2)}`;
            totalTd.appendChild(totalStrong);

            const fechaTd = document.createElement('td');
            fechaTd.textContent = fecha;

            const estadoTd = document.createElement('td');
            const estadoBadge = document.createElement('span');
            estadoBadge.className = `badge ${getBadgeClassForEstado(pedido.estado)}`;
            estadoBadge.textContent = pedido.estado || 'PENDIENTE';
            estadoTd.appendChild(estadoBadge);

            tr.appendChild(pedidoTd);
            tr.appendChild(clienteTd);
            tr.appendChild(productosTd);
            tr.appendChild(totalTd);
            tr.appendChild(fechaTd);
            tr.appendChild(estadoTd);

            tbody.appendChild(tr);
        });
    }

    // OBTENER CLASE BADGE PARA ESTADO DEL PEDIDO
    function getBadgeClassForEstado(estado) {
        if (!estado) return 'bg-secondary';

        switch(estado.toUpperCase()) {
            case 'ENTREGADO': return 'bg-success';
            case 'PREPARACION': return 'bg-warning';
            case 'LISTO': return 'bg-info';
            case 'CANCELADO': return 'bg-danger';
            case 'PENDIENTE': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    // ACTUALIZAR GRÁFICO DE VENTAS - SIN ESTILOS INLINE
    function actualizarGraficoVentas(ventasPorDia) {
        const ctx = document.getElementById('salesChart');
        const emptyChartMessage = document.getElementById('emptyChartMessage');

        if (!ctx) return;

        const hasData = ventasPorDia && Object.values(ventasPorDia).some(valor => valor > 0);

        if (!hasData) {
            ctx.classList.add('d-none');
            if (emptyChartMessage) emptyChartMessage.classList.remove('d-none');
            return;
        }

        ctx.classList.remove('d-none');
        if (emptyChartMessage) emptyChartMessage.classList.add('d-none');

        if (window.salesChartInstance) {
            window.salesChartInstance.destroy();
        }

        const labels = Object.keys(ventasPorDia);
        const data = Object.values(ventasPorDia);

        window.salesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas (S/)',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Ventas: S/ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'S/ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    // CARGAR PRODUCTOS DESDE EL BACKEND
    async function cargarProductos() {
        try {
            console.log('Cargando productos desde el backend...');
            const response = await fetch('/admin-menu/productos');

            if (!response.ok) {
                throw new Error('Error al cargar productos: ' + response.status);
            }

            products = await response.json();
            console.log('Productos cargados:', products.length, 'productos');

            mostrarProductos();

        } catch (error) {
            console.error('Error cargando productos:', error);
            mostrarAlerta('Error al cargar productos', 'warning');
        }
    }

    // MOSTRAR PRODUCTOS EN LA TABLA - SIN ESTILOS INLINE
    function mostrarProductos() {
        const tbody = document.getElementById('productsTableBody');
        const noProductsMessage = document.getElementById('noProductsMessage');
        const tableContainer = document.querySelector('.table-responsive');

        if (!tbody) {
            console.error('No se encontró el tbody de productos');
            return;
        }

        tbody.innerHTML = '';

        if (products.length === 0) {
            if (noProductsMessage) noProductsMessage.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');
            return;
        }

        if (noProductsMessage) noProductsMessage.classList.add('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

        const searchTerm = document.getElementById('searchProducts')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';

        const filteredProducts = products.filter(product => {
            const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm));
            const matchesCategory = !categoryFilter || product.tipo.toLowerCase() === categoryFilter.toLowerCase();
            return matchesSearch && matchesCategory;
        });

        filteredProducts.forEach(product => {
            const tr = document.createElement('tr');

            // ID
            const idTd = document.createElement('td');
            idTd.textContent = product.id;

            // Imagen
            const imgTd = document.createElement('td');
            const img = document.createElement('img');
            img.src = product.imagenUrl || '/imagenes/default-product.jpg';
            img.alt = product.nombre;
            img.className = 'product-image';
            img.addEventListener('error', function() {
                this.src = '/imagenes/default-product.jpg';
            });
            imgTd.appendChild(img);

            // Nombre y descripción
            const nameTd = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = product.nombre;
            nameTd.appendChild(strong);

            if (product.descripcion) {
                const br = document.createElement('br');
                const small = document.createElement('small');
                small.className = 'text-muted';
                small.textContent = product.descripcion;
                nameTd.appendChild(br);
                nameTd.appendChild(small);
            }

            // Categoría
            const categoryTd = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary';
            badge.textContent = product.tipo;
            categoryTd.appendChild(badge);

            // Precio
            const priceTd = document.createElement('td');
            const priceStrong = document.createElement('strong');
            priceStrong.textContent = `S/ ${product.precio.toFixed(2)}`;
            priceTd.appendChild(priceStrong);

            // Acciones
            const actionsTd = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'action-buttons';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary edit-product';
            editBtn.setAttribute('data-id', product.id);
            editBtn.setAttribute('title', 'Editar producto');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger delete-product';
            deleteBtn.setAttribute('data-id', product.id);
            deleteBtn.setAttribute('title', 'Eliminar producto');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            actionsTd.appendChild(actionsDiv);

            // Agregar todas las celdas
            tr.appendChild(idTd);
            tr.appendChild(imgTd);
            tr.appendChild(nameTd);
            tr.appendChild(categoryTd);
            tr.appendChild(priceTd);
            tr.appendChild(actionsTd);

            tbody.appendChild(tr);
        });
    }

    // CARGAR USUARIOS DESDE EL BACKEND
    async function cargarUsuarios() {
        try {
            console.log('Cargando usuarios desde el backend...');
            const response = await fetch('/admin-menu/usuarios');

            if (!response.ok) {
                throw new Error('Error al cargar usuarios: ' + response.status);
            }

            users = await response.json();
            console.log('Usuarios cargados:', users.length, 'usuarios');

            mostrarUsuarios();

        } catch (error) {
            console.error('Error cargando usuarios:', error);
            mostrarAlerta('Error al cargar usuarios', 'warning');
        }
    }

    // MOSTRAR USUARIOS EN LA TABLA - SIN ESTILOS INLINE
    function mostrarUsuarios() {
        const tbody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');
        const tableContainer = document.querySelector('.table-responsive');

        if (!tbody) {
            console.error('No se encontró el tbody de usuarios');
            return;
        }

        tbody.innerHTML = '';

        if (users.length === 0) {
            if (noUsersMessage) noUsersMessage.classList.remove('d-none');
            if (tableContainer) tableContainer.classList.add('d-none');
            return;
        }

        if (noUsersMessage) noUsersMessage.classList.add('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

        const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';

        const filteredUsers = users.filter(user => {
            const matchesSearch = user.nombres.toLowerCase().includes(searchTerm) ||
                user.apellidos.toLowerCase().includes(searchTerm) ||
                user.username.toLowerCase().includes(searchTerm);

            const matchesRole = !roleFilter || user.rol.toLowerCase() === roleFilter.toLowerCase();

            return matchesSearch && matchesRole;
        });

        filteredUsers.forEach(user => {
            const tr = document.createElement('tr');

            // ID
            const idTd = document.createElement('td');
            idTd.textContent = user.id;

            // Avatar
            const avatarTd = document.createElement('td');
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'user-avatar-small';
            avatarDiv.textContent = user.nombres.charAt(0) + user.apellidos.charAt(0);
            avatarTd.appendChild(avatarDiv);

            // Información
            const infoTd = document.createElement('td');
            const nameStrong = document.createElement('strong');
            nameStrong.textContent = `${user.nombres} ${user.apellidos}`;
            infoTd.appendChild(nameStrong);

            const br = document.createElement('br');
            const docSmall = document.createElement('small');
            docSmall.className = 'text-muted';
            docSmall.textContent = `${user.tipoDocumento}: ${user.numeroDocumento}`;
            infoTd.appendChild(br);
            infoTd.appendChild(docSmall);

            // Username
            const usernameTd = document.createElement('td');
            usernameTd.textContent = user.username;

            // Rol
            const roleTd = document.createElement('td');
            const roleBadge = document.createElement('span');
            roleBadge.className = `badge ${getBadgeClassForRole(user.rol)}`;
            roleBadge.textContent = user.rol;
            roleTd.appendChild(roleBadge);

            // Estado
            const statusTd = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Activo';
            statusTd.appendChild(statusBadge);

            // Acciones
            const actionsTd = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'action-buttons';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger delete-user';
            deleteBtn.setAttribute('data-id', user.id);
            deleteBtn.setAttribute('title', 'Eliminar usuario');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            actionsDiv.appendChild(deleteBtn);
            actionsTd.appendChild(actionsDiv);

            // Agregar todas las celdas
            tr.appendChild(idTd);
            tr.appendChild(avatarTd);
            tr.appendChild(infoTd);
            tr.appendChild(usernameTd);
            tr.appendChild(roleTd);
            tr.appendChild(statusTd);
            tr.appendChild(actionsTd);

            tbody.appendChild(tr);
        });
    }

    // OBTENER CLASE BADGE PARA ROL
    function getBadgeClassForRole(rol) {
        switch(rol.toLowerCase()) {
            case 'admin': return 'bg-danger';
            case 'cajero': return 'bg-warning';
            case 'cocinero': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    // ABRIR MODAL DE USUARIO
    function abrirModalUsuario() {
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        const form = document.getElementById('userForm');
        const modalTitle = document.getElementById('userModalLabel');

        if (!form || !modalTitle) {
            console.error('No se encontraron elementos del modal de usuario');
            return;
        }

        form.reset();
        modalTitle.textContent = 'Agregar Usuario';
        modal.show();
    }

    // GUARDAR USUARIO
    async function guardarUsuario(formData) {
        try {
            console.log('Guardando usuario...');

            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch('/admin-menu/usuarios/guardar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
                if (modal) {
                    modal.hide();
                }

                await cargarUsuarios();

                mostrarAlerta(result.message, 'success');

                if (currentSection === 'users') {
                    cambiarSeccion('users');
                }

            } else {
                throw new Error(result.error || 'Error del servidor');
            }

        } catch (error) {
            console.error('Error guardando usuario:', error);
            mostrarAlerta('Error al guardar el usuario: ' + error.message, 'danger');
        }
    }

    // ELIMINAR USUARIO
    async function eliminarUsuario(id) {
        try {
            console.log('Eliminando usuario ID:', id);

            const user = users.find(u => u.id == id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const formData = new FormData();
            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch(`/admin-menu/usuarios/eliminar/${id}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                await cargarUsuarios();
                mostrarAlerta(result.message, 'success');

                if (currentSection === 'users') {
                    cambiarSeccion('users');
                }
            } else {
                throw new Error(result.error || 'Error del servidor al eliminar');
            }

        } catch (error) {
            console.error('Error eliminando usuario:', error);
            mostrarAlerta('Error al eliminar el usuario: ' + error.message, 'danger');
        }
    }

    // ABRIR MODAL DE PRODUCTO
    function abrirModalProducto(producto = null) {
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        const form = document.getElementById('productForm');
        const modalTitle = document.getElementById('productModalLabel');
        const imagePreview = document.getElementById('imagePreview');

        if (!form || !modalTitle || !imagePreview) {
            console.error('No se encontraron elementos del modal');
            return;
        }

        form.reset();
        imagePreview.classList.add('d-none');

        if (producto) {
            modalTitle.textContent = 'Editar Producto';
            document.getElementById('productId').value = producto.id;
            document.getElementById('productName').value = producto.nombre;
            document.getElementById('productCategory').value = producto.tipo;
            document.getElementById('productPrice').value = producto.precio;
            document.getElementById('productDescription').value = producto.descripcion || '';
            document.getElementById('productImage').value = producto.imagenUrl || '';

            if (producto.imagenUrl && producto.imagenUrl !== '/imagenes/default-product.jpg') {
                imagePreview.src = producto.imagenUrl;
                imagePreview.classList.remove('d-none');
            }

            currentEditingId = producto.id;
        } else {
            modalTitle.textContent = 'Agregar Producto';
            document.getElementById('productId').value = '';
            currentEditingId = null;
        }

        modal.show();
    }

    // GUARDAR PRODUCTO
    async function guardarProducto(formData) {
        try {
            console.log('Guardando producto...', formData);

            const url = currentEditingId
                ? `/admin-menu/actualizar/${currentEditingId}`
                : '/admin-menu/guardar';

            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                if (modal) {
                    modal.hide();
                }

                await cargarProductos();

                mostrarAlerta(
                    currentEditingId
                        ? 'Producto actualizado exitosamente!'
                        : 'Producto guardado exitosamente!',
                    'success'
                );

                if (currentSection === 'menu') {
                    cambiarSeccion('menu');
                }

            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Error del servidor');
            }

        } catch (error) {
            console.error('Error guardando producto:', error);
            mostrarAlerta('Error al guardar el producto: ' + error.message, 'danger');
        }
    }

    // ELIMINAR PRODUCTO
    async function eliminarProducto(id) {
        try {
            console.log('Eliminando producto ID:', id);

            const formData = new FormData();
            const csrfToken = document.querySelector('input[name="_csrf"]').value;
            formData.append('_csrf', csrfToken);
            formData.append('redirectSection', currentSection);

            const response = await fetch(`/admin-menu/eliminar/${id}`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                await cargarProductos();
                mostrarAlerta('Producto eliminado exitosamente!', 'success');

                if (currentSection === 'menu') {
                    cambiarSeccion('menu');
                }
            } else {
                throw new Error('Error del servidor al eliminar');
            }

        } catch (error) {
            console.error('Error eliminando producto:', error);
            mostrarAlerta('Error al eliminar el producto: ' + error.message, 'danger');
        }
    }

    // FUNCIÓN DE CONFIRMACIÓN
    function mostrarConfirmacion(mensaje, accionConfirmar) {
        const modalBody = document.getElementById('confirmModalBody');
        const confirmBtn = document.getElementById('confirmActionBtn');

        if (!modalBody || !confirmBtn) return;

        modalBody.textContent = mensaje;

        const nuevoConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(nuevoConfirmBtn, confirmBtn);

        document.getElementById('confirmActionBtn').addEventListener('click', function () {
            accionConfirmar();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    }

    // CAMBIAR SECCIÓN (ACTUALIZADA)
    function cambiarSeccion(seccion) {
        console.log('Cambiando a sección:', seccion);
        currentSection = seccion;

        const sectionContents = document.querySelectorAll('.section-content');
        const sectionTitle = document.getElementById('sectionTitle');
        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        sectionContents.forEach(section => section.classList.add('d-none'));

        navLinks.forEach(navLink => navLink.classList.remove('active'));

        const selectedSection = document.getElementById(seccion + '-section');
        if (selectedSection) {
            selectedSection.classList.remove('d-none');
        }

        if (sectionTitle) {
            const activeLink = document.querySelector(`[data-section="${seccion}"]`);
            if (activeLink) {
                const linkText = activeLink.querySelector('span').textContent;
                sectionTitle.textContent = linkText;
            }
        }

        const activeLink = document.querySelector(`[data-section="${seccion}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (seccion === 'dashboard') {
            cargarEstadisticasDashboard();
        } else if (seccion === 'menu') {
            cargarProductos();
        } else if (seccion === 'users') {
            cargarUsuarios();
        } else if (seccion === 'reports') {
            inicializarReportes();
        }
    }

    // INICIALIZACIÓN MEJORADA
    function inicializarAdminMenu() {
        console.log('Inicializando Admin Menu...');

        cargarEstadisticasDashboard();
        cargarProductos();

        const navLinks = document.querySelectorAll('.sidebar .nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                if (this.getAttribute('href') === '#' || this.getAttribute('data-section')) {
                    e.preventDefault();

                    const section = this.getAttribute('data-section');
                    if (section) {
                        cambiarSeccion(section);
                    }
                }
            });
        });

        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                console.log('Botón agregar producto clickeado');
                abrirModalProducto();
            });
        }

        const addFirstProductBtn = document.getElementById('addFirstProductBtn');
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => {
                console.log('Botón agregar primer producto clickeado');
                abrirModalProducto();
            });
        }

        const searchProducts = document.getElementById('searchProducts');
        if (searchProducts) {
            searchProducts.addEventListener('input', function() {
                console.log('Buscando productos:', this.value);
                mostrarProductos();
            });
        }

        const searchProductsBtn = document.getElementById('searchProductsBtn');
        if (searchProductsBtn) {
            searchProductsBtn.addEventListener('click', function() {
                console.log('Botón buscar productos clickeado');
                mostrarProductos();
            });
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                console.log('Filtro de categoría cambiado:', this.value);
                mostrarProductos();
            });
        }

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                console.log('Botón agregar usuario clickeado');
                abrirModalUsuario();
            });
        }

        const addFirstUserBtn = document.getElementById('addFirstUserBtn');
        if (addFirstUserBtn) {
            addFirstUserBtn.addEventListener('click', () => {
                console.log('Botón agregar primer usuario clickeado');
                abrirModalUsuario();
            });
        }

        const searchUsers = document.getElementById('searchUsers');
        if (searchUsers) {
            searchUsers.addEventListener('input', function() {
                console.log('Buscando usuarios:', this.value);
                mostrarUsuarios();
            });
        }

        const searchUsersBtn = document.getElementById('searchUsersBtn');
        if (searchUsersBtn) {
            searchUsersBtn.addEventListener('click', function() {
                console.log('Botón buscar usuarios clickeado');
                mostrarUsuarios();
            });
        }

        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', function() {
                console.log('Filtro de rol cambiado:', this.value);
                mostrarUsuarios();
            });
        }

        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const nombre = document.getElementById('productName').value.trim();
                const tipo = document.getElementById('productCategory').value;
                const precio = parseFloat(document.getElementById('productPrice').value);
                const descripcion = document.getElementById('productDescription').value.trim();
                const imagenUrl = document.getElementById('productImage').value.trim();

                if (!nombre) {
                    mostrarAlerta('El nombre del producto es requerido', 'warning');
                    return;
                }

                if (!tipo) {
                    mostrarAlerta('Debe seleccionar una categoría', 'warning');
                    return;
                }

                if (isNaN(precio) || precio <= 0) {
                    mostrarAlerta('El precio debe ser un número mayor a 0', 'warning');
                    return;
                }

                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('tipo', tipo);
                formData.append('precio', precio);
                formData.append('descripcion', descripcion);
                formData.append('imagenUrl', imagenUrl);

                mostrarAlerta('Guardando producto...', 'info');

                await guardarProducto(formData);
            });
        }

        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', async function() {
                const nombres = document.getElementById('userName').value.trim();
                const apellidos = document.getElementById('userLastName').value.trim();
                const tipoDocumento = document.getElementById('userDocumentType').value;
                const numeroDocumento = document.getElementById('userDocumentNumber').value.trim();
                const telefono = document.getElementById('userPhone').value.trim();
                const fechaNacimiento = document.getElementById('userBirthDate').value;
                const email = document.getElementById('userEmail').value.trim();
                const rol = document.getElementById('userRole').value;
                const password = document.getElementById('userPassword').value;

                if (!nombres || !apellidos) {
                    mostrarAlerta('Los nombres y apellidos son requeridos', 'warning');
                    return;
                }

                if (!tipoDocumento) {
                    mostrarAlerta('Debe seleccionar un tipo de documento', 'warning');
                    return;
                }

                if (!numeroDocumento) {
                    mostrarAlerta('El número de documento es requerido', 'warning');
                    return;
                }

                if (!telefono) {
                    mostrarAlerta('El teléfono es requerido', 'warning');
                    return;
                }

                if (!fechaNacimiento) {
                    mostrarAlerta('La fecha de nacimiento es requerida', 'warning');
                    return;
                }

                if (!email) {
                    mostrarAlerta('El email es requerido', 'warning');
                    return;
                }

                if (!rol) {
                    mostrarAlerta('Debe seleccionar un rol', 'warning');
                    return;
                }

                if (!password || password.length < 6) {
                    mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'warning');
                    return;
                }

                const formData = new FormData();
                formData.append('nombres', nombres);
                formData.append('apellidos', apellidos);
                formData.append('tipoDocumento', tipoDocumento);
                formData.append('numeroDocumento', numeroDocumento);
                formData.append('telefono', telefono);
                formData.append('fechaNacimiento', fechaNacimiento);
                formData.append('email', email);
                formData.append('rol', rol);
                formData.append('password', password);

                mostrarAlerta('Guardando usuario...', 'info');

                await guardarUsuario(formData);
            });
        }

        document.addEventListener('click', function (e) {
            if (e.target.closest('.edit-product')) {
                const btn = e.target.closest('.edit-product');
                const id = btn.getAttribute('data-id');
                console.log('Editando producto ID:', id);

                const producto = products.find(p => p.id == id);
                if (producto) {
                    abrirModalProducto(producto);
                } else {
                    console.error('Producto no encontrado para editar:', id);
                    mostrarAlerta('Error: Producto no encontrado', 'danger');
                }
            }

            if (e.target.closest('.delete-product')) {
                const btn = e.target.closest('.delete-product');
                const id = btn.getAttribute('data-id');
                console.log('Eliminando producto ID:', id);

                const producto = products.find(p => p.id == id);
                if (producto) {
                    mostrarConfirmacion(
                        `¿Está seguro de que desea eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
                        () => eliminarProducto(id)
                    );
                } else {
                    console.error('Producto no encontrado para eliminar:', id);
                    mostrarAlerta('Error: Producto no encontrado', 'danger');
                }
            }

            if (e.target.closest('.delete-user')) {
                const btn = e.target.closest('.delete-user');
                const id = btn.getAttribute('data-id');
                console.log('Eliminando usuario ID:', id);

                const user = users.find(u => u.id == id);
                if (user) {
                    mostrarConfirmacion(
                        `¿Está seguro de que desea eliminar al usuario "${user.nombres} ${user.apellidos}"? Esta acción no se puede deshacer.`,
                        () => eliminarUsuario(id)
                    );
                } else {
                    console.error('Usuario no encontrado para eliminar:', id);
                    mostrarAlerta('Error: Usuario no encontrado', 'danger');
                }
            }
        });

        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.addEventListener('input', function (e) {
                const url = e.target.value.trim();
                const preview = document.getElementById('imagePreview');

                if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
                    preview.src = url;
                    preview.classList.remove('d-none');
                } else {
                    preview.classList.add('d-none');
                }
            });
        }

        const refreshSales = document.getElementById('refreshSales');
        if (refreshSales) {
            refreshSales.addEventListener('click', function() {
                console.log('Actualizando ventas...');
                cargarEstadisticasDashboard();
                mostrarAlerta('Ventas actualizadas', 'info');
            });
        }
    }

    inicializarAdminMenu();

    console.log('Admin Menu inicializado correctamente');
});

// FUNCIÓN PARA EXPORTAR REPORTES
async function exportarReporteDashboard() {
    try {
        const response = await fetch('/admin-menu/exportar-dashboard-excel');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_apollo_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            const event = new CustomEvent('showAlert', {
                detail: { message: 'Reporte exportado exitosamente', type: 'success' }
            });
            document.dispatchEvent(event);
        } else {
            throw new Error('Error al exportar reporte');
        }
    } catch (error) {
        console.error('Error exportando reporte:', error);
        const event = new CustomEvent('showAlert', {
            detail: { message: 'Error al exportar reporte', type: 'danger' }
        });
        document.dispatchEvent(event);
    }
}

// OBJETO GLOBAL
window.AdminMenu = {
    recargar: function() {
        window.location.reload();
    },

    limpiarFiltros: function() {
        const searchInput = document.getElementById('searchProducts');
        const categoryFilter = document.getElementById('categoryFilter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';

        if (categoryFilter) {
            categoryFilter.dispatchEvent(new Event('change'));
        }
    },

    exportarReporte: exportarReporteDashboard,

    actualizarDashboard: function() {
        if (typeof cargarEstadisticasDashboard === 'function') {
            cargarEstadisticasDashboard();
        }
    }
};