/* ==========================================
   DK DESIGN KINGS - CARRITO
   Lo usan el index y el editor. Se guarda en el navegador
   (localStorage), así que se mantiene al cambiar de página.

   Para mostrar el botón del carrito en una página basta con:
     <button type="button" class="cart-button" data-carrito>
         Carrito <span class="cart-count">0</span>
     </button>
   y cargar carrito.css y carrito.js.
========================================== */

const Carrito = (() => {
    const CLAVE = "dk-carrito";

    /* ---------- datos ---------- */

    function leer() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE)) || [];
        } catch (e) {
            return [];
        }
    }

    function escribir(items) {
        localStorage.setItem(CLAVE, JSON.stringify(items));
        pintar();
    }

    const formato = (valor) => valor.toFixed(2).replace(".", ",") + " €";
    const total = (items) => items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const unidades = (items) => items.reduce((s, i) => s + i.cantidad, 0);

    // item: { prenda, nombre, talla, detalles[], precio, foto, diseno }
    function añadir(item) {
        const items = leer();
        items.push({ ...item, id: Date.now(), cantidad: 1 });

        try {
            escribir(items);
            return true;
        } catch (e) {
            // sin espacio: se intenta otra vez sin la miniatura ni las imágenes del diseño
            try {
                items[items.length - 1].foto = "";
                escribir(items);
                return true;
            } catch (e2) {
                alert("No queda espacio en el carrito de este navegador.\n" +
                      "Quita algún producto o termina el pedido.");
                return false;
            }
        }
    }

    function cambiarCantidad(id, delta) {
        const items = leer();
        const item = items.find(i => i.id === id);
        if (!item) return;

        item.cantidad = Math.max(1, Math.min(99, item.cantidad + delta));
        escribir(items);
    }

    function quitar(id) {
        escribir(leer().filter(i => i.id !== id));
    }


    /* ---------- panel lateral ---------- */

    const fondo = document.createElement("div");
    fondo.className = "cart-overlay";

    const panel = document.createElement("aside");
    panel.className = "cart-drawer";
    panel.setAttribute("aria-label", "Carrito");
    panel.innerHTML = `
        <div class="cart-head">
            <h2>Tu carrito</h2>
            <button type="button" class="cart-close" title="Cerrar">✕</button>
        </div>
        <ul class="cart-items"></ul>
        <p class="cart-empty">Tu carrito está vacío.<br>¡Diseña tu primera prenda!</p>
        <div class="cart-foot">
            <div class="cart-total"><span>Total</span><strong></strong></div>
            <button type="button" class="cart-checkout">Finalizar pedido</button>
            <button type="button" class="cart-clear">Vaciar carrito</button>
        </div>`;

    document.body.append(fondo, panel);

    const listaItems = panel.querySelector(".cart-items");
    const vacio = panel.querySelector(".cart-empty");
    const pie = panel.querySelector(".cart-foot");
    const textoTotal = panel.querySelector(".cart-total strong");

    function abrir() {
        pintar();
        document.body.classList.add("cart-abierto");
    }

    function cerrar() {
        document.body.classList.remove("cart-abierto");
    }

    function pintar() {
        const items = leer();

        // contador de los botones del carrito
        document.querySelectorAll("[data-carrito] .cart-count").forEach(c => {
            c.textContent = unidades(items);
            c.classList.toggle("oculto", items.length === 0);
        });

        listaItems.innerHTML = "";
        vacio.classList.toggle("oculto", items.length > 0);
        pie.classList.toggle("oculto", items.length === 0);
        textoTotal.textContent = formato(total(items));

        items.forEach(item => {
            const fila = document.createElement("li");
            fila.className = "cart-item";
            fila.dataset.id = item.id;

            const foto = document.createElement("span");
            foto.className = "cart-thumb";
            if (item.foto) foto.style.backgroundImage = "url(" + item.foto + ")";

            const info = document.createElement("div");
            info.className = "cart-info";

            const nombre = document.createElement("strong");
            nombre.textContent = item.nombre;

            const talla = document.createElement("span");
            talla.className = "cart-detail";
            talla.textContent = "Talla " + item.talla + " · " + formato(item.precio) + " / ud.";

            info.append(nombre, talla);
            (item.detalles || []).forEach(d => {
                const linea = document.createElement("span");
                linea.className = "cart-detail";
                linea.textContent = d;
                info.appendChild(linea);
            });

            const cantidad = document.createElement("div");
            cantidad.className = "cart-qty";
            cantidad.innerHTML = `
                <button type="button" data-act="menos" title="Quitar una">−</button>
                <span></span>
                <button type="button" data-act="mas" title="Añadir una">+</button>`;
            cantidad.querySelector("span").textContent = item.cantidad;

            const subtotal = document.createElement("strong");
            subtotal.className = "cart-subtotal";
            subtotal.textContent = formato(item.precio * item.cantidad);

            const quitarBtn = document.createElement("button");
            quitarBtn.type = "button";
            quitarBtn.className = "cart-remove";
            quitarBtn.dataset.act = "quitar";
            quitarBtn.title = "Quitar del carrito";
            quitarBtn.textContent = "✕";

            const lateral = document.createElement("div");
            lateral.className = "cart-side";
            lateral.append(subtotal, cantidad);

            fila.append(foto, info, lateral, quitarBtn);
            listaItems.appendChild(fila);
        });
    }

    listaItems.addEventListener("click", (e) => {
        const boton = e.target.closest("button[data-act]");
        if (!boton) return;

        const id = Number(boton.closest(".cart-item").dataset.id);
        if (boton.dataset.act === "mas") cambiarCantidad(id, 1);
        if (boton.dataset.act === "menos") cambiarCantidad(id, -1);
        if (boton.dataset.act === "quitar") quitar(id);
    });

    panel.querySelector(".cart-close").addEventListener("click", cerrar);
    fondo.addEventListener("click", cerrar);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrar();
    });

    panel.querySelector(".cart-clear").addEventListener("click", () => {
        if (confirm("¿Vaciar el carrito?")) escribir([]);
    });

    panel.querySelector(".cart-checkout").addEventListener("click", () => {
        const items = leer();
        if (!items.length) return;

        const pedido = "DK-" + Date.now().toString().slice(-6);
        const lineas = items.map(i => "• " + i.cantidad + " × " + i.nombre +
            " (talla " + i.talla + ") — " + formato(i.precio * i.cantidad));

        alert(
            "¡Pedido " + pedido + " realizado!\n\n" +
            lineas.join("\n") + "\n\n" +
            "Total: " + formato(total(items)) + "\n\n" +
            "Gracias por confiar en DK Design Kings."
        );

        escribir([]);
        cerrar();
    });

    // botones del carrito de la página
    document.querySelectorAll("[data-carrito]").forEach(b => b.addEventListener("click", abrir));

    // si cambias el carrito en otra pestaña, se actualiza aquí también
    window.addEventListener("storage", (e) => {
        if (e.key === CLAVE) pintar();
    });

    pintar();

    return { leer, añadir, abrir, cerrar };
})();
