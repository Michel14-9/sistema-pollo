// Funcionalidades para la página de inicio
document.addEventListener('DOMContentLoaded', function() {
    // Animación de las cards de ofertas
    const offerCards = document.querySelectorAll('.offer-card');

    offerCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Función para agregar productos al carrito desde las ofertas
    document.querySelectorAll('.offer-card .btn-success').forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('.offer-content').querySelector('h3').textContent;
            const price = this.closest('.offer-content').querySelector('.current-price').textContent;

            agregarAlCarrito(productName, price);
        });
    });
});

async function agregarAlCarrito(productoNombre, precio) {
    try {
        const response = await fetch("/api/carrito/agregar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productoNombre: productoNombre,
                precio: precio,
                cantidad: 1
            })
        });

        if (response.ok) {
            mostrarNotificacion(`${productoNombre} agregado al carrito`);
        } else {
            mostrarNotificacion(" Error al agregar al carrito");
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarNotificacion("Error de conexión con el servidor");
    }
}


function mostrarNotificacion(mensaje) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = mensaje;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}