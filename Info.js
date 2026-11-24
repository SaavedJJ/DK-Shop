/* Todas las secciones: al pulsar un cuadrado se ocultan los demás y se abre la explicación completa */
document.addEventListener("DOMContentLoaded", function () {
    var listas = document.querySelectorAll(".info-steps");

    listas.forEach(function (lista) {
        var seccion = lista.closest("section");
        var pasos = lista.querySelectorAll(":scope > li");

        function abrir(paso) {
            pasos.forEach(function (p) {
                var abierto = p === paso;
                p.hidden = !abierto;
                p.classList.toggle("is-active", abierto);
                p.querySelector(".info-detail").hidden = !abierto;
                p.querySelector(".info-step-head").setAttribute("aria-expanded", abierto);
            });
            lista.classList.add("has-open");
            seccion.classList.add("is-detail");
            seccion.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function cerrar() {
            pasos.forEach(function (p) {
                p.hidden = false;
                p.classList.remove("is-active");
                p.querySelector(".info-detail").hidden = true;
                p.querySelector(".info-step-head").setAttribute("aria-expanded", "false");
            });
            lista.classList.remove("has-open");
            seccion.classList.remove("is-detail");
            seccion.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        lista._cerrar = cerrar;

        pasos.forEach(function (paso) {
            paso.querySelector(".info-step-head").addEventListener("click", function () {
                if (!paso.classList.contains("is-active")) abrir(paso);
            });
            paso.querySelector(".info-close").addEventListener("click", cerrar);
        });
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        listas.forEach(function (lista) {
            if (lista.classList.contains("has-open")) lista._cerrar();
        });
    });
});