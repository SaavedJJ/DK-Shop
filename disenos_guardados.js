/* ==========================================
   DK DESIGN KINGS - MIS DISEÑOS Y BORRADOR AUTOMÁTICO
   Se carga DESPUÉS de editor.js y usa sus funciones
   (serializarDiseno, abrirDatos, vaciarDiseno...).

   Todo se guarda en el navegador (localStorage), separado
   por prenda: la posición de una capa en una prenda no
   vale para otra.
========================================== */

(() => {
    const CLAVE = "dk-disenos-" + PRENDA_ID;
    const CLAVE_BORRADOR = "dk-borrador-" + PRENDA_ID;

    const entradaNombre = document.getElementById("nombreDiseno");
    const btnGuardar = document.getElementById("btnGuardarDiseno");
    const lista = document.getElementById("listaGuardados");
    const vacio = document.getElementById("guardadosVacio");
    const avisoBorrador = document.getElementById("avisoBorrador");
    const btnEmpezarDeCero = document.getElementById("btnEmpezarDeCero");

    if (!PRENDA.modelo) return;   // prenda todavía sin editor


    /* ---------- leer / escribir en el navegador ---------- */

    function leer(clave, porDefecto) {
        try {
            return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
        } catch (e) {
            return porDefecto;
        }
    }

    const leerGuardados = () => leer(CLAVE, []);

    function escribirGuardados(disenos) {
        localStorage.setItem(CLAVE, JSON.stringify(disenos));
    }

    const nombreCapas = (n) => n + (n === 1 ? " capa" : " capas");
    const contarCapas = (d) => Object.values(d.lados).reduce((n, capas) => n + capas.length, 0);


    /* ==========================================
       BORRADOR AUTOMÁTICO
       Cada vez que cambias algo se guarda (un momento
       después), y al volver a la página se recupera.
    ========================================== */

    let temporizadorBorrador = 0;
    let recuperando = false;

    function guardarBorrador() {
        if (recuperando) return;

        const datos = serializarDiseno();
        try {
            if (disenoVacio(datos)) {
                localStorage.removeItem(CLAVE_BORRADOR);
            } else {
                localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
            }
        } catch (e) {
            console.log("No se pudo guardar el borrador (¿sin espacio?):", e);
        }
    }

    document.addEventListener("dk:cambio", () => {
        clearTimeout(temporizadorBorrador);
        temporizadorBorrador = setTimeout(guardarBorrador, 800);
    });

    // al cerrar o recargar la página, se guarda lo último sin esperar
    window.addEventListener("pagehide", () => {
        if (temporizadorBorrador) guardarBorrador();
    });

    async function recuperarBorrador() {
        const borrador = leer(CLAVE_BORRADOR, null);
        if (!borrador || !borrador.lados || disenoVacio(borrador)) return;

        recuperando = true;
        await abrirDatos(borrador);
        reiniciarHistorial();
        recuperando = false;

        avisoBorrador.classList.remove("oculto");
    }

    btnEmpezarDeCero.addEventListener("click", () => {
        if (!confirm("Se borrará el diseño actual. ¿Empezar de cero?")) return;
        vaciarDiseno();   // se puede deshacer con Ctrl+Z
        avisoBorrador.classList.add("oculto");
    });


    /* ==========================================
       GUARDAR UN DISEÑO CON NOMBRE
    ========================================== */

    async function guardar() {
        const nombre = entradaNombre.value.trim();
        if (!nombre) {
            alert("Ponle un nombre al diseño para poder guardarlo.");
            entradaNombre.focus();
            return;
        }

        const disenos = leerGuardados();
        const existente = disenos.findIndex(d => d.nombre.toLowerCase() === nombre.toLowerCase());

        if (existente >= 0 && !confirm("Ya tienes un diseño llamado «" + nombre + "». ¿Quieres sobrescribirlo?")) {
            return;
        }

        const nuevo = {
            ...serializarDiseno(),
            nombre: nombre,
            fecha: Date.now(),
            foto: await miniaturaVisor()
        };

        if (existente >= 0) disenos.splice(existente, 1);
        disenos.unshift(nuevo);   // el más reciente, el primero

        try {
            escribirGuardados(disenos);
        } catch (e) {
            alert("No queda espacio para guardar más diseños en este navegador.\n" +
                  "Borra alguno de «Mis diseños» o usa imágenes más pequeñas.");
            return;
        }

        entradaNombre.value = "";
        pintarGuardados();
    }

    btnGuardar.addEventListener("click", guardar);
    entradaNombre.addEventListener("keydown", (e) => {
        if (e.key === "Enter") guardar();
    });


    /* ---------- abrir y borrar ---------- */

    async function abrir(guardado) {
        const hayCapas = Object.values(diseno).some(d => d.capas.length > 0);
        if (hayCapas && !confirm("Se sustituirá el diseño que tienes ahora por «" + guardado.nombre + "». ¿Continuar?")) {
            return;
        }

        await abrirDatos(guardado);   // se puede deshacer con Ctrl+Z
        entradaNombre.value = guardado.nombre;
        avisoBorrador.classList.add("oculto");
    }

    function borrar(nombre) {
        if (!confirm("¿Borrar el diseño «" + nombre + "»?")) return;

        try {
            escribirGuardados(leerGuardados().filter(d => d.nombre !== nombre));
        } catch (e) {
            console.log("No se pudo borrar el diseño:", e);
        }
        pintarGuardados();
    }


    /* ---------- lista ---------- */

    function pintarGuardados() {
        const disenos = leerGuardados();

        lista.innerHTML = "";
        vacio.classList.toggle("oculto", disenos.length > 0);

        disenos.forEach(d => {
            const fila = document.createElement("li");
            fila.className = "layer-item saved-item";
            fila.dataset.nombre = d.nombre;
            fila.title = "Abrir este diseño";

            const foto = document.createElement("span");
            foto.className = "saved-thumb";
            if (d.foto) foto.style.backgroundImage = "url(" + d.foto + ")";

            const info = document.createElement("span");
            info.className = "saved-info";

            const nombre = document.createElement("span");
            nombre.className = "layer-name";
            nombre.textContent = d.nombre;

            const detalle = document.createElement("span");
            detalle.className = "saved-date";
            detalle.textContent = new Date(d.fecha).toLocaleDateString("es-ES") +
                " · " + nombreCapas(contarCapas(d));

            info.append(nombre, detalle);

            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "layer-btn";
            quitar.dataset.act = "borrar";
            quitar.textContent = "✕";
            quitar.title = "Borrar diseño";

            fila.append(foto, info, quitar);
            lista.appendChild(fila);
        });
    }

    lista.addEventListener("click", (e) => {
        const fila = e.target.closest(".saved-item");
        if (!fila) return;

        const nombre = fila.dataset.nombre;

        if (e.target.closest("button[data-act='borrar']")) {
            borrar(nombre);
            return;
        }

        const guardado = leerGuardados().find(d => d.nombre === nombre);
        if (guardado) abrir(guardado);
    });

    pintarGuardados();
    recuperarBorrador();
})();
