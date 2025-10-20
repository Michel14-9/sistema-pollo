// admin-producto-nuevo.js - Adaptado para ProductoFinal
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FORMULARIO PRODUCTO - INICIADO ===');

    // Determinar si estamos en modo edición o creación
    const estaEditando = document.getElementById('productFormEdit') !== null;
    const formId = estaEditando ? 'productFormEdit' : 'productForm';
    const suffix = estaEditando ? 'Edit' : '';

    console.log('Modo:', estaEditando ? 'Edición' : 'Creación');

    // Preview de imagen desde URL
    const imagenUrlInput = document.getElementById('imagenUrl' + suffix);
    const imagePreview = document.getElementById('imagePreview' + suffix);

    if (imagenUrlInput && imagePreview) {
        imagenUrlInput.addEventListener('input', function() {
            const imageUrl = this.value.trim();

            if (imageUrl) {
                imagePreview.src = imageUrl;
                imagePreview.style.display = 'block';
                imagePreview.onerror = function() {
                    imagePreview.style.display = 'none';
                    showAlert('No se pudo cargar la imagen desde la URL proporcionada', 'warning');
                };
            } else {
                // Si está vacío y estamos editando, mantener la imagen actual
                if (estaEditando) {
                    const currentImage = imagePreview.getAttribute('data-original-src') || '/imagenes/default-product.jpg';
                    imagePreview.src = currentImage;
                } else {
                    imagePreview.style.display = 'none';
                }
            }
        });

        // Guardar imagen original para edición
        if (estaEditando) {
            imagePreview.setAttribute('data-original-src', imagePreview.src);
        }

        // Cargar preview si hay imagen al cargar la página
        if (imagenUrlInput.value) {
            imagePreview.src = imagenUrlInput.value;
            imagePreview.style.display = 'block';
        }
    }

    // Validación del formulario
    const productForm = document.getElementById(formId);
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            // Validar ANTES de enviar
            if (!validarFormulario()) {
                e.preventDefault();
                return;
            }

            // Si todo es válido, mostrar mensaje y permitir envío normal
            const mensaje = estaEditando ? 'Actualizando producto...' : 'Guardando producto...';
            showAlert(mensaje, 'info');

            // Limpiar borrador al enviar (solo para creación)
            if (!estaEditando) {
                localStorage.removeItem('productoBorrador');
            }
        });
    }

    // Función de validación mejorada
    function validarFormulario() {
        const nombre = document.getElementById('nombre' + suffix).value.trim();
        const precio = document.getElementById('precio' + suffix).value;
        const tipo = document.getElementById('tipo' + suffix).value;

        let isValid = true;
        let errorMessage = '';

        // Validar nombre
        if (!nombre) {
            isValid = false;
            errorMessage = 'El nombre del producto es requerido.';
            highlightField('nombre' + suffix, true);
        } else {
            highlightField('nombre' + suffix, false);
        }

        // Validar precio
        if (!precio) {
            isValid = false;
            errorMessage = 'El precio del producto es requerido.';
            highlightField('precio' + suffix, true);
        } else if (parseFloat(precio) <= 0) {
            isValid = false;
            errorMessage = 'El precio debe ser mayor a 0.';
            highlightField('precio' + suffix, true);
        } else {
            highlightField('precio' + suffix, false);
        }

        // Validar tipo
        if (!tipo) {
            isValid = false;
            errorMessage = 'El tipo/categoría del producto es requerido.';
            highlightField('tipo' + suffix, true);
        } else {
            highlightField('tipo' + suffix, false);
        }

        if (!isValid) {
            showAlert(errorMessage, 'danger');
            return false;
        }

        return true;
    }

    // Contador de caracteres para descripción
    const descripcionTextarea = document.getElementById('descripcion' + suffix);
    if (descripcionTextarea) {
        // Crear contador si no existe
        const counterId = 'descripcionCounter' + suffix;
        let counter = document.getElementById(counterId);
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'form-text';
            counter.id = counterId;
            counter.innerHTML = '<span class="text-muted">0/500 caracteres</span>';
            descripcionTextarea.parentNode.insertBefore(counter, descripcionTextarea.nextSibling);
        }

        descripcionTextarea.addEventListener('input', function() {
            const maxLength = 500;
            const currentLength = this.value.length;
            const counter = document.getElementById(counterId);

            if (currentLength > maxLength) {
                this.value = this.value.substring(0, maxLength);
                if (counter) {
                    counter.innerHTML = `<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> Máximo ${maxLength} caracteres alcanzado</span>`;
                }
                highlightField('descripcion' + suffix, true);
            } else {
                const remaining = maxLength - currentLength;
                const colorClass = remaining < 50 ? 'text-warning' : 'text-muted';
                if (counter) {
                    counter.innerHTML = `<span class="${colorClass}">${currentLength}/${maxLength} caracteres</span>`;
                }
                highlightField('descripcion' + suffix, false);
            }
        });

        // Inicializar contador
        descripcionTextarea.dispatchEvent(new Event('input'));
    }

    // Validación en tiempo real para precio
    const precioInput = document.getElementById('precio' + suffix);
    if (precioInput) {
        precioInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (value < 0) {
                this.value = '';
                showAlert('El precio no puede ser negativo', 'warning');
            } else {
                highlightField('precio' + suffix, false);
            }
        });
    }

    // Validación en tiempo real para los campos
    const camposValidacion = ['nombre', 'tipo', 'precio', 'descripcion'];

    camposValidacion.forEach(campo => {
        const campoId = campo + suffix;
        const campoElement = document.getElementById(campoId);
        if (campoElement) {
            campoElement.addEventListener('blur', function() {
                if (this.value.trim()) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else if (campo !== 'descripcion') { // descripcion es opcional
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            });

            campoElement.addEventListener('input', function() {
                if (this.value.trim()) {
                    this.classList.remove('is-invalid');
                }
            });
        }
    });

    // Auto-guardado temporal (solo para creación)
    if (!estaEditando) {
        let autoSaveTimer;
        const formInputs = productForm ? productForm.querySelectorAll('input, textarea, select') : [];

        formInputs.forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    saveDraft();
                }, 2000);
            });
        });

        // Función para guardar borrador (localStorage)
        function saveDraft() {
            if (!productForm) return;

            const formData = {
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                precio: document.getElementById('precio').value,
                tipo: document.getElementById('tipo').value,
                imagenUrl: document.getElementById('imagenUrl')?.value || ''
            };

            localStorage.setItem('productoBorrador', JSON.stringify(formData));
        }

        // Función para cargar borrador
        function loadDraft() {
            const draft = localStorage.getItem('productoBorrador');
            if (draft) {
                const formData = JSON.parse(draft);

                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && element.value === '') {
                        element.value = formData[key];
                    }
                });

                showAlert('Borrador anterior cargado', 'info');
            }
        }

        // Cargar borrador al iniciar la página
        loadDraft();
    }

    // Función para resaltar campos con error
    function highlightField(fieldId, hasError) {
        const field = document.getElementById(fieldId);
        if (field) {
            if (hasError) {
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
            } else {
                field.classList.add('is-valid');
                field.classList.remove('is-invalid');
            }
        }
    }

    // Función para mostrar alertas
    function showAlert(message, type) {
        // Remover alertas existentes
        const existingAlerts = document.querySelectorAll('.floating-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show floating-alert position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    // Función para obtener icono según tipo de alerta
    function getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Prevenir pérdida de datos al salir de la página (solo para creación)
    if (!estaEditando && productForm) {
        window.addEventListener('beforeunload', function(e) {
            const nombre = document.getElementById('nombre').value;
            const descripcion = document.getElementById('descripcion').value;

            if ((nombre || descripcion) && !productForm.classList.contains('submitted')) {
                e.preventDefault();
                e.returnValue = '';
                return 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
            }
        });

        // Marcar formulario como enviado para evitar el mensaje de beforeunload
        productForm.addEventListener('submit', function() {
            this.classList.add('submitted');
        });
    }

    console.log('Sistema de administración de productos cargado correctamente');
});