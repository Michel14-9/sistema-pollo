// global-carrito.js - Cargar en todas las vistas
async function actualizarCarritoGlobal() {
    try {
        const response = await fetch('/carrito/total');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Buscar todos los botones de carrito posibles
                const carritoBtns = document.querySelectorAll([
                    '.carrito-btn',
                    'a[th\\:href="@{/carrito}"]',
                    'a[href="/carrito"]'
                ].join(','));

                carritoBtns.forEach(carritoBtn => {
                    if (carritoBtn) {
                        let totalSpan = carritoBtn.querySelector('span');

                        if (totalSpan) {
                            totalSpan.textContent = data.total.toFixed(2);
                        } else {
                            // Si no existe span, crear uno
                            const icono = carritoBtn.querySelector('i');
                            const textoActual = carritoBtn.innerHTML;

                            // Reemplazar el texto estático por uno dinámico
                            if (textoActual.includes('S/.')) {
                                carritoBtn.innerHTML = textoActual.replace(
                                    /S\/\.[\s\d.,]+/,
                                    `S/. <span>${data.total.toFixed(2)}</span>`
                                );
                            } else if (icono) {
                                carritoBtn.innerHTML = `${icono.outerHTML} S/. <span>${data.total.toFixed(2)}</span>`;
                            }
                        }
                    }
                });

                console.log(" Carrito actualizado globalmente:", data.total.toFixed(2));
            }
        }
    } catch (error) {
        console.error(" Error actualizando carrito global:", error);
    }
}

// Llamar cuando se agrega algo al carrito
window.actualizarCarritoGlobal = actualizarCarritoGlobal;

// También actualizar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(actualizarCarritoGlobal, 100); //
});