/* ==========================================
   DK DESIGN KINGS
   JAVASCRIPT
   ========================================== */


/* ==========================================
   ANIMACIÓN AL HACER SCROLL
   ========================================== */

const animatedElements =
    document.querySelectorAll(
        ".design-step, .vip-level, .product-card, .about"
    );


const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    },
    {
        threshold: 0.15
    }
);


animatedElements.forEach((element) => {

    element.classList.add("hidden");

    observer.observe(element);

});


/* ==========================================
   CERRAR EL MENÚ AL HACER CLICK
   ========================================== */

const menuLinks =
    document.querySelectorAll(".menu a");


menuLinks.forEach((link) => {

    link.addEventListener("click", () => {

        window.scrollTo({
            behavior: "smooth"
        });

    });

});


/* ==========================================
   BOTONES DE DISEÑO
   ========================================== */

const designButton =
    document.querySelector(".design-button");


if (designButton) {

    designButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            const products =
                document.querySelector("#productos");

            if (products) {

                products.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


/* ==========================================
   BOTÓN VIP
   ========================================== */

const vipButton =
    document.querySelector(".vip-button");


if (vipButton) {

    vipButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            alert(
                "El sistema de suscripción VIP estará disponible próximamente."
            );

        }
    );

}


/* ==========================================
   EFECTO EN LOS NIVELES VIP
   ========================================== */

const vipLevels =
    document.querySelectorAll(".vip-level");


vipLevels.forEach((level) => {

    level.addEventListener(
        "mouseenter",
        () => {

            vipLevels.forEach((otherLevel) => {

                if (otherLevel !== level) {

                    otherLevel.style.opacity = "0.45";

                }

            });

        }
    );


    level.addEventListener(
        "mouseleave",
        () => {

            vipLevels.forEach((otherLevel) => {

                otherLevel.style.opacity = "1";

            });

        }
    );

});


/* ==========================================
   AÑO AUTOMÁTICO DEL FOOTER
   ========================================== */

const footerYear =
    document.querySelector(".footer-year");


if (footerYear) {

    footerYear.textContent =
        new Date().getFullYear();

}


/* ==========================================
   INICIAR SESIÓN
   ========================================== */

/* INICIAR SESIÓN - DK Design Kings
 *
 * IMPORTANTE: esto es solo la parte visual (front-end).
 * No comprueba contraseñas de verdad: cualquiera podría "entrar".
 * Para que sea real hay que conectar un servidor (Firebase, Supabase,
 * un backend propio...). Solo hay que rellenar la función autenticar().
 * Aquí NUNCA se guardan contraseñas, solo nombre y correo de la sesión.
 */

document.addEventListener('DOMContentLoaded', function () {

    var CLAVE = 'dk_sesion';

    var modal      = document.getElementById('login-modal');
    var btnAbrir   = document.getElementById('btn-login');
    var btnCerrar  = document.getElementById('login-close');
    var tabs       = document.getElementById('login-tabs');
    var msg        = document.getElementById('login-msg');
    var formLogin  = document.getElementById('form-login');
    var formReg    = document.getElementById('form-registro');
    var vistaSes   = document.getElementById('vista-sesion');
    var btnLogout  = document.getElementById('btn-logout');

    if (!modal || !btnAbrir) return;

    /* ---------- Sesión guardada ---------- */

    function leerSesion() {
        try { return JSON.parse(localStorage.getItem(CLAVE)); }
        catch (e) { return null; }
    }

    function guardarSesion(usuario) {
        try { localStorage.setItem(CLAVE, JSON.stringify(usuario)); } catch (e) {}
    }

    function borrarSesion() {
        try { localStorage.removeItem(CLAVE); } catch (e) {}
    }

    /* ---------- AQUÍ SE CONECTA EL SERVIDOR ----------
     * modo: 'login' o 'registro'
     * datos: { nombre, email, password }
     * Debe devolver una promesa con { nombre, email }
     * o lanzar un error con el mensaje para el usuario.
     */
    function autenticar(modo, datos) {
        return new Promise(function (resolve) {
            var nombre = datos.nombre || datos.email.split('@')[0];
            resolve({ nombre: nombre, email: datos.email });
        });
    }

    /* ---------- Vistas ---------- */

    function mostrarMensaje(texto, ok) {
        msg.textContent = texto || '';
        msg.className = 'login-msg' + (ok ? ' ok' : '');
    }

    function cambiarVista(vista) {
        var sesion = leerSesion();
        mostrarMensaje('');

        if (sesion) {
            tabs.hidden = true;
            formLogin.hidden = true;
            formReg.hidden = true;
            vistaSes.hidden = false;
            document.getElementById('sesion-nombre').textContent = sesion.nombre;
            document.getElementById('sesion-email').textContent = sesion.email;
            pintarDisenos(sesion.email);
            return;
        }

        tabs.hidden = false;
        vistaSes.hidden = true;
        formLogin.hidden = (vista !== 'login');
        formReg.hidden = (vista !== 'registro');

        tabs.querySelectorAll('.login-tab').forEach(function (t) {
            t.classList.toggle('activa', t.dataset.vista === vista);
        });
    }

    /* ---------- Mis diseños (guardados por cuenta en este navegador) ---------- */

    function claveDisenos(email) { return 'dk_disenos_' + email; }

    function leerDisenos(email) {
        try { return JSON.parse(localStorage.getItem(claveDisenos(email))) || []; }
        catch (e) { return []; }
    }

    function pintarDisenos(email) {
        var lista = document.getElementById('lista-disenos');
        var vacio = document.getElementById('sin-disenos');
        var disenos = leerDisenos(email);
        lista.innerHTML = '';
        vacio.hidden = disenos.length > 0;
        disenos.forEach(function (d) {
            var li = document.createElement('li');
            li.textContent = d.nombre + (d.fecha ? ' · ' + d.fecha : '');
            lista.appendChild(li);
        });
    }

    /* Para guardar un diseño desde el editor:
     *   window.DK_guardarDiseno({ nombre: 'Mi camiseta', datos: {...} });
     * Devuelve false si no hay sesión iniciada. */
    window.DK_guardarDiseno = function (diseno) {
        var sesion = leerSesion();
        if (!sesion || !diseno) return false;
        var lista = leerDisenos(sesion.email);
        diseno.fecha = diseno.fecha || new Date().toLocaleDateString('es-ES');
        lista.push(diseno);
        try { localStorage.setItem(claveDisenos(sesion.email), JSON.stringify(lista)); }
        catch (e) { return false; }
        return true;
    };

    function actualizarBoton() {
        var sesion = leerSesion();
        btnAbrir.textContent = sesion ? sesion.nombre : 'Iniciar sesión';
    }

    function abrir() {
        cambiarVista('login');
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function cerrar() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    /* ---------- Eventos ---------- */

    btnAbrir.addEventListener('click', abrir);
    btnCerrar.addEventListener('click', cerrar);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) cerrar();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) cerrar();
    });

    tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.login-tab');
        if (tab) cambiarVista(tab.dataset.vista);
    });

    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = formLogin.email.value.trim();
        var password = formLogin.password.value;

        if (!emailValido(email)) return mostrarMensaje('Escribe un correo válido.');
        if (!password) return mostrarMensaje('Escribe tu contraseña.');

        autenticar('login', { email: email, password: password })
            .then(function (usuario) {
                guardarSesion(usuario);
                formLogin.reset();
                actualizarBoton();
                cambiarVista('login');
            })
            .catch(function (err) {
                mostrarMensaje(err && err.message ? err.message : 'No se pudo iniciar sesión.');
            });
    });

    formReg.addEventListener('submit', function (e) {
        e.preventDefault();
        var nombre = formReg.nombre.value.trim();
        var email = formReg.email.value.trim();
        var password = formReg.password.value;
        var password2 = formReg.password2.value;

        if (!nombre) return mostrarMensaje('Escribe tu nombre.');
        if (!emailValido(email)) return mostrarMensaje('Escribe un correo válido.');
        if (password.length < 6) return mostrarMensaje('La contraseña debe tener al menos 6 caracteres.');
        if (password !== password2) return mostrarMensaje('Las contraseñas no coinciden.');

        autenticar('registro', { nombre: nombre, email: email, password: password })
            .then(function (usuario) {
                guardarSesion(usuario);
                formReg.reset();
                actualizarBoton();
                cambiarVista('login');
            })
            .catch(function (err) {
                mostrarMensaje(err && err.message ? err.message : 'No se pudo crear la cuenta.');
            });
    });

    btnLogout.addEventListener('click', function () {
        borrarSesion();
        actualizarBoton();
        cambiarVista('login');
    });

    actualizarBoton();
});
