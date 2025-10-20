document.addEventListener("DOMContentLoaded", () => {
    let carrito = [];
    let subtotal = 0;
    let envio = 0;

    const resumenLista = document.getElementById("resumen-lista");
    const subtotalElem = document.getElementById("subtotal");
    const envioElem = document.getElementById("envio");
    const totalFinalElem = document.getElementById("total-final");
    const contadorItems = document.getElementById("contador-items");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnConfirmar = document.getElementById("btnConfirmar");

    // Precios de referencia (puedes conectarlo a tu BD después)
    const precios = {
        papas: 5,
        ensalada: 4,
        aji: 1,
        tomate: 1,
        mostaza: 1,
        mayonesa: 1,
        pierna: 8,
        alita: 7,
        pechuga: 9,
        chicharron: 10,
        encuentro: 9,
        entero: 30,
        parrilla: 25,
        "coca-cola": 6,
        pepsi: 6,
        guarana: 6,
        "inka-cola": 6,
        "arroz-blanco": 4,
        "arroz-chaufa": 7,
        huevo: 3,
        carne: 8,
        salchicha: 5,
        chorizo: 6,
        pollo: 7,
        papas: 5,
        ensalada_h: 4, // para diferenciar si quieres
        milanesa: 9,
        "lomo-saltado": 18,
        "tallarin-saltado": 15,
        "arroz-chaufa-pollo": 14
    };

    // Función para renderizar el carrito
    function renderCarrito() {
        resumenLista.innerHTML = "";

        if (carrito.length === 0) {
            resumenLista.innerHTML = `
                <div class="resumen-vacio text-center py-4">
                    <i class="fas fa-shopping-cart" style="font-size: 2rem; color: #ddd;"></i>
                    <p class="text-muted mt-2">No hay productos en tu pedido</p>
                </div>
            `;
        } else {
            carrito.forEach((item, index) => {
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("resumen-item", "d-flex", "justify-content-between", "align-items-center", "mb-2");
                itemDiv.innerHTML = `
                    <span>${item.nombre}</span>
                    <div>
                        <span>S/. ${item.precio.toFixed(2)}</span>
                        <button class="btn btn-sm btn-danger ms-2 btnEliminar" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                resumenLista.appendChild(itemDiv);
            });

            // Eliminar item
            document.querySelectorAll(".btnEliminar").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const idx = e.currentTarget.dataset.index;
                    subtotal -= carrito[idx].precio;
                    carrito.splice(idx, 1);
                    actualizarTotales();
                    renderCarrito();
                });
            });
        }

        contadorItems.textContent = `${carrito.length} items`;
    }

    // Actualizar totales
    function actualizarTotales() {
        subtotalElem.textContent = `S/. ${subtotal.toFixed(2)}`;
        envioElem.textContent = `S/. ${envio.toFixed(2)}`;
        totalFinalElem.textContent = `S/. ${(subtotal + envio).toFixed(2)}`;
    }

    // Eventos para agregar productos
    document.querySelectorAll(".btn-opcion, .btn-agregar").forEach(btn => {
        btn.addEventListener("click", () => {
            const opcion = btn.dataset.opcion || btn.dataset.categoria;
            const nombre = opcion.replace(/-/g, " ").toUpperCase();
            const precio = precios[opcion] || 0;

            carrito.push({ nombre, precio });
            subtotal += precio;

            actualizarTotales();
            renderCarrito();
        });
    });

    // Limpiar carrito
    btnLimpiar.addEventListener("click", () => {
        carrito = [];
        subtotal = 0;
        actualizarTotales();
        renderCarrito();
    });

    // Confirmar pedido
    btnConfirmar.addEventListener("click", () => {
        if (carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        let resumenTexto = carrito.map(item => `- ${item.nombre} (S/. ${item.precio.toFixed(2)})`).join("\n");
        alert(`Confirmaste tu pedido:\n\n${resumenTexto}\n\nTotal: S/. ${(subtotal + envio).toFixed(2)}`);
    });

    // Inicializar
    renderCarrito();
    actualizarTotales();
});
