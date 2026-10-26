/* ==========================================
   DK DESIGN KINGS - EDITOR 3D DE PRENDAS
   Un solo editor para todas las prendas.
   Qué prenda se edita lo dice la dirección:
       editor.html?prenda=manga_larga
   y sus datos están en prendas.js.

   El texto y las imágenes se pintan DENTRO de la
   textura de la prenda (no flotan encima).
========================================== */

const parametros = new URLSearchParams(location.search);
const PRENDA_ID = PRENDAS[parametros.get("prenda")] ? parametros.get("prenda") : "manga_corta";
const PRENDA = PRENDAS[PRENDA_ID];
const FAMILIA = FAMILIAS[PRENDA.familia];
const LADOS = PRENDA.lados;

// prendas que se estampan por proyección (ver proyeccion.js)
const PROYECCION = PRENDA.proyeccion || null;

// model-viewer baja la resolución cuando va justo de fotogramas (al arrastrar)
// y la prenda se ve borrosa: así siempre se dibuja a resolución completa
customElements.whenDefined("model-viewer").then(() => {
    customElements.get("model-viewer").minimumRenderScale = 1;
});

const visor = document.getElementById("camiseta3D");

/* ---------- Elementos ---------- */

const sizeButtons = document.querySelectorAll(".sizes button");
const viewButtons = document.querySelectorAll(".view-button");

const designSelect = document.getElementById("design");
const price = document.querySelector(".price-box strong");
const addCart = document.querySelector(".add-cart");

const selectorColor = document.getElementById("colorPersonalizado");
const codigoColor = document.getElementById("codigoColor");

const entradaTexto = document.getElementById("customText");
const selectorFuente = document.getElementById("fontSelect");
const selectorTextoColor = document.getElementById("textColor");
const selectorTextoTamano = document.getElementById("textSize");
const valorTextoTamano = document.getElementById("textSizeValue");

const textoRotacion = document.getElementById("textRotation");
const textoRotacionValor = document.getElementById("textRotationValue");
const textoOpacidad = document.getElementById("textOpacity");
const textoOpacidadValor = document.getElementById("textOpacityValue");

const btnMover = document.getElementById("btnMover");
const btnCentrar = document.getElementById("btnCentrar");

const selectorImagen = document.getElementById("imageSelect");
const subirImagen = document.getElementById("imageUpload");
const imagenTamano = document.getElementById("imageSize");
const imagenTamanoValor = document.getElementById("imageSizeValue");
const imagenRotacion = document.getElementById("imageRotation");
const imagenRotacionValor = document.getElementById("imageRotationValue");
const imagenOpacidad = document.getElementById("imageOpacity");
const imagenOpacidadValor = document.getElementById("imageOpacityValue");
const imagenUsarColor = document.getElementById("imageUseColor");
const imagenColor = document.getElementById("imageColor");
const btnMoverImagen = document.getElementById("btnMoverImagen");
const btnCentrarImagen = document.getElementById("btnCentrarImagen");
const btnQuitarImagen = document.getElementById("btnQuitarImagen");

const colorModo = document.getElementById("colorModo");
const coloresExtra = document.getElementById("coloresExtra");
const coloresAcciones = document.getElementById("coloresAcciones");
const coloresAyuda = document.getElementById("coloresAyuda");
const btnAddColor = document.getElementById("btnAddColor");

const listaCapas = document.getElementById("layersList");
const capasVacio = document.getElementById("layersEmpty");
const capasLado = document.getElementById("layersSide");
const btnAddTexto = document.getElementById("btnAddTexto");
const btnAddImagen = document.getElementById("btnAddImagen");
const btnDeshacer = document.getElementById("btnDeshacer");
const btnRehacer = document.getElementById("btnRehacer");

const seccionDiseno = document.getElementById("seccionDiseno");
const seccionTexto = document.getElementById("seccionTexto");
const seccionImagen = document.getElementById("seccionImagen");
const sinSeleccion = document.getElementById("sinSeleccion");


/* ==========================================
   CONFIGURACIÓN COMÚN
========================================== */

// tela blanca para las prendas que no tienen imagen de tela
const TELA_BLANCA = (() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const x = c.getContext("2d");
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 4, 4);
    return c.toDataURL("image/png");
})();

const TEXTURA = 1280;       // ancho de la textura que se pinta (el alto sale de "aspecto")
const ESCALA_TEXTO = 4.4;   // el slider de tamaño (px) × este factor = px en la textura

/*
   Si el texto o las imágenes te salen boca abajo en la prenda,
   cambia esto a false.
*/
const INVERTIR_Y = true;

// dónde aparece una capa nueva (0 = abajo, 1 = arriba de la pieza)
const ALTURA_TEXTO = PRENDA.alturaTexto ?? 0.64;
const ALTURA_IMAGEN = PRENDA.alturaImagen ?? 0.46;
// y de izquierda a derecha (0.5 = centro; en los pantalones, sobre una pierna)
const POSICION_X = PRENDA.posicionX ?? 0.5;


/* ==========================================
   PÁGINA SEGÚN LA PRENDA
   (títulos, lista de modelos y modelo 3D)
========================================== */

function prepararPagina() {
    const singular = FAMILIA.singular;

    document.title = "DK Design Kings - Personaliza tu " + singular;
    document.getElementById("tituloCabecera").textContent = "PERSONALIZA TU " + singular.toUpperCase();
    document.getElementById("tituloIntro").textContent = "Diseña tu " + singular;
    document.getElementById("etiquetaColor").textContent = "Color de la prenda";

    // modelos de la misma familia (por ejemplo: manga corta / manga larga)
    const lista = document.getElementById("listaModelos");
    lista.innerHTML = "";

    Object.entries(PRENDAS)
        .filter(([, p]) => p.familia === PRENDA.familia)
        .forEach(([id, p]) => {
            const tarjeta = document.createElement("button");
            tarjeta.type = "button";
            tarjeta.className = "model-card" + (id === PRENDA_ID ? " active" : "");

            const mini = document.createElement("div");
            mini.className = "shirt-mini classic";
            mini.textContent = p.nombre.charAt(0).toUpperCase();

            const titulo = document.createElement("h3");
            titulo.textContent = p.nombre;

            const texto = document.createElement("p");
            texto.textContent = p.descripcion;

            const precio = document.createElement("span");
            precio.textContent = p.modelo ? "Desde " + formatoPrecio(p.precio) : "Próximamente";

            tarjeta.append(mini, titulo, texto, precio);
            tarjeta.addEventListener("click", () => {
                if (id !== PRENDA_ID) location.href = "editor.html?prenda=" + id;
            });

            lista.appendChild(tarjeta);
        });

    // prenda sin modelo 3D todavía: se avisa en lugar de mostrar el editor
    if (!PRENDA.modelo) {
        document.querySelector(".editor").classList.add("oculto");
        const aviso = document.getElementById("avisoProximamente");
        aviso.classList.remove("oculto");
        aviso.querySelector("h2").textContent = "La " + singular + " llega muy pronto";
        return false;
    }

    visor.cameraOrbit = LADOS.frontal.orbita;
    visor.src = PRENDA.modelo;
    return true;
}


/* ==========================================
   ESTADO DEL DISEÑO
   Cada lado (frontal / trasera) tiene su lista de capas.
   El orden del array es de abajo (0) hacia arriba.
========================================== */

const diseno = {
    frontal: { capas: [], seleccion: null },
    trasera: { capas: [], seleccion: null }
};

let ladoActual = "frontal";
let contadorCapas = 0;

// colores de la prenda (el primero es el selector de siempre)
let modoColor = "liso";
let coloresCamiseta = [selectorColor.value];
const MAX_COLORES = 5;

const imagenesSubidas = [];   // { nombre, url }
const cacheImagenes = new Map();


function nuevaCapaTexto(contenido) {
    return {
        id: ++contadorCapas,
        tipo: "texto",
        visible: true,
        opacidad: 100,
        x: POSICION_X,
        y: ALTURA_TEXTO,
        rot: 0,
        contenido: contenido,
        fuente: "Arial, sans-serif",
        color: "#c9a227",
        tam: 28
    };
}

function nuevaCapaImagen() {
    return {
        id: ++contadorCapas,
        tipo: "imagen",
        visible: true,
        opacidad: 100,
        x: POSICION_X,
        y: ALTURA_IMAGEN,
        rot: 0,
        src: "",
        nombre: "Imagen",
        img: null,
        tam: 30,
        usarColor: false,
        color: "#c9a227"
    };
}

function ladoDatos() {
    return diseno[ladoActual];
}

function capaActual() {
    const d = ladoDatos();
    return d.capas.find(c => c.id === d.seleccion) || null;
}

function tallaActual() {
    const b = document.querySelector(".sizes button.active");
    return b ? b.textContent.trim() : "";
}

function ponerTalla(talla) {
    sizeButtons.forEach(b => b.classList.toggle("active", b.textContent.trim() === talla));
    if (!document.querySelector(".sizes button.active") && sizeButtons[1]) {
        sizeButtons[1].classList.add("active");
    }
}


/* ==========================================
   CADA VEZ QUE CAMBIA EL DISEÑO
   Repinta, recalcula el precio, apunta el cambio en el
   historial (deshacer) y avisa al autoguardado.
========================================== */

function cambio() {
    actualizarTodo();
    actualizarPrecio();
    programarHistorial();
    document.dispatchEvent(new Event("dk:cambio"));
}


/* ==========================================
   PRECIO
   Es el precio de la prenda (prendas.js), sin extras:
   da igual las capas, los colores o la talla.
========================================== */

function formatoPrecio(valor) {
    return valor.toFixed(2).replace(".", ",") + " €";
}

function calcularPrecio() {
    return PRENDA.precio;
}

function actualizarPrecio() {
    price.textContent = formatoPrecio(calcularPrecio());
}


/* ==========================================
   UTILIDADES
========================================== */

function cargarImagen(src) {
    if (cacheImagenes.has(src)) return cacheImagenes.get(src);

    const promesa = new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.log("No se pudo cargar la imagen:", src);
            resolve(null);
        };
        img.src = src;
    });

    cacheImagenes.set(src, promesa);
    return promesa;
}

function hexARgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255
    ];
}

function srgbALineal(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function limitar(valor, min, max) {
    return Math.min(max, Math.max(min, valor));
}

// para la consola (F12): nombres de las piezas del modelo, al añadir una prenda nueva
function listarMateriales() {
    if (!visor.model) return console.log("El modelo todavía no ha cargado.");
    console.table(visor.model.materials.map(m => ({ material: m.name })));
}


/* ==========================================
   PINTAR LA TEXTURA
   (tela + colores/degradado + capas de abajo a arriba)
========================================== */

const lienzos = {};     // un canvas por lado
const telas = {};       // imagen de tela de cada lado
const cacheTinte = new Map();

function lienzoDe(nombreLado) {
    if (!lienzos[nombreLado]) {
        const c = document.createElement("canvas");
        c.width = TEXTURA;
        c.height = Math.round(TEXTURA * (LADOS[nombreLado].aspecto || 1));
        lienzos[nombreLado] = c;
    }
    return lienzos[nombreLado];
}

// v (0 = bajo, 1 = alto de la pieza) → coordenada vertical del canvas
function yCanvas(v, alto) {
    return INVERTIR_Y ? v * alto : (1 - v) * alto;
}

function imagenTenida(img, src, color) {
    const clave = src + "|" + color;
    if (cacheTinte.has(clave)) return cacheTinte.get(clave);

    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);

    cacheTinte.set(clave, c);
    return c;
}

function colocar(ctx, x, y, rotacion, dibujar) {
    ctx.save();
    ctx.translate(x * ctx.canvas.width, yCanvas(y, ctx.canvas.height));
    if (INVERTIR_Y) ctx.scale(1, -1);
    ctx.rotate(rotacion * Math.PI / 180);
    dibujar();
    ctx.restore();
}

// Color base de la prenda: liso, degradados o franjas
function pintarColorBase(ctx, nombreLado) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const colores = modoColor === "liso" ? [coloresCamiseta[0]] : coloresCamiseta;

    // en la trasera se invierte la horizontal para que las costuras laterales coincidan
    const espejo = nombreLado === "trasera";
    const P = (u, v) => [(espejo ? 1 - u : u) * W, yCanvas(v, H)];

    ctx.globalCompositeOperation = "multiply";

    if (colores.length === 1) {
        ctx.fillStyle = colores[0];
        ctx.fillRect(0, 0, W, H);
    } else if (modoColor === "franjas") {
        const n = colores.length;
        colores.forEach((color, i) => {
            const y0 = yCanvas(1 - i / n, H);
            const y1 = yCanvas(1 - (i + 1) / n, H);
            ctx.fillStyle = color;
            ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0) + 1);
        });
    } else {
        let g;

        if (modoColor === "vertical") {
            const a = P(0.5, 1), b = P(0.5, 0);
            g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        } else if (modoColor === "horizontal") {
            const a = P(0, 0.5), b = P(1, 0.5);
            g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        } else if (modoColor === "diagonal") {
            const a = P(0, 1), b = P(1, 0);
            g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        } else {
            const c = P(0.5, 0.5);
            g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.hypot(W, H) / 2);
        }

        colores.forEach((color, i) => g.addColorStop(i / (colores.length - 1), color));

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    ctx.globalCompositeOperation = "source-over";
}

function dibujarCapa(ctx, capa) {
    const opacidad = limitar((capa.opacidad ?? 100) / 100, 0, 1);

    if (capa.tipo === "imagen") {
        if (!capa.img) return;

        const fuente = capa.usarColor
            ? imagenTenida(capa.img, capa.src, capa.color)
            : capa.img;

        const ancho = (capa.tam / 100) * ctx.canvas.width;
        const alto = ancho * (capa.img.naturalHeight / capa.img.naturalWidth);

        colocar(ctx, capa.x, capa.y, capa.rot, () => {
            ctx.globalAlpha = opacidad;
            ctx.drawImage(fuente, -ancho / 2, -alto / 2, ancho, alto);
            ctx.globalAlpha = 1;
        });
    } else {
        if (!capa.contenido) return;

        colocar(ctx, capa.x, capa.y, capa.rot, () => {
            ctx.globalAlpha = opacidad;
            ctx.font = (capa.tam * ESCALA_TEXTO) + "px " + capa.fuente;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = capa.color;
            ctx.fillText(capa.contenido, 0, 0);
            ctx.globalAlpha = 1;
        });
    }
}

function dibujarLado(nombreLado) {
    const canvas = lienzoDe(nombreLado);
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // 1) tela (o blanco si la prenda no tiene imagen de tela)
    ctx.globalCompositeOperation = "source-over";
    if (telas[nombreLado]) {
        ctx.drawImage(telas[nombreLado], 0, 0, W, H);
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
    }

    // 2) color / degradado
    pintarColorBase(ctx, nombreLado);

    // 3) capas, de la de abajo a la de arriba
    diseno[nombreLado].capas.forEach(capa => {
        if (capa.visible) dibujarCapa(ctx, capa);
    });
}


/* ==========================================
   ENVIAR LA TEXTURA AL MODELO 3D
   Cada lado tiene UNA textura de tipo canvas que se crea una sola vez.
   Para actualizarla basta con copiar el lienzo y avisar al visor
   (sin JPEG, sin decodificar y sin crear texturas nuevas).
========================================== */

const texturasLienzo = {};   // nombreLado -> { textura, lienzo }

function texturaDe(nombreLado, material) {
    let t = texturasLienzo[nombreLado];

    if (!t) {
        const textura = visor.createCanvasTexture();
        const lienzo = textura.source.element;
        if (PROYECCION) {
            lienzo.width = lienzo.height = Proyeccion.TAM;
        } else {
            const origen = lienzoDe(nombreLado);
            lienzo.width = origen.width;
            lienzo.height = origen.height;
        }
        t = texturasLienzo[nombreLado] = { textura, lienzo };
    }

    // se asigna al material solo la primera vez (o si el modelo se ha recargado)
    const info = material.pbrMetallicRoughness.baseColorTexture;
    if (info.texture !== t.textura) {
        info.setTexture(t.textura);
        // el color ya va dentro de la textura
        material.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
    }

    return t;
}

function enviarTextura(nombreLado) {
    if (!visor || !visor.model) return;

    const L = LADOS[nombreLado];
    const material = visor.model.materials.find(m => m.name === L.material);
    if (!material) {
        console.log("No encuentro el material", L.material, "- usa listarMateriales() para ver los nombres.");
        return;
    }

    const { textura, lienzo } = texturaDe(nombreLado, material);
    const ctx = lienzo.getContext("2d");

    // las texturas de canvas van con la Y al revés que las del .glb:
    // se copia invertida para que todo siga saliendo en su sitio
    ctx.setTransform(1, 0, 0, -1, 0, lienzo.height);
    ctx.drawImage(lienzoDe(nombreLado), 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    textura.source.update();
}

// color, degradado o franjas en una tira de 256×1 (para la proyección)
function tiraColores() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 1;
    const ctx = c.getContext("2d");
    const colores = modoColor === "liso" ? [coloresCamiseta[0]] : coloresCamiseta;

    if (colores.length === 1) {
        ctx.fillStyle = colores[0];
        ctx.fillRect(0, 0, 256, 1);
    } else if (modoColor === "franjas") {
        colores.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(i * 256 / colores.length), 0, Math.ceil(256 / colores.length), 1);
        });
    } else {
        const g = ctx.createLinearGradient(0, 0, 256, 0);
        colores.forEach((color, i) => g.addColorStop(i / (colores.length - 1), color));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 1);
    }
    return c;
}

// aspecto de tela de algodón: sin brillo y, si se pide, sin el relieve que traiga el modelo
// (por ejemplo, un estampado que el modelo lleva marcado en relieve)
function prepararTela(material) {
    try {
        const pbr = material.pbrMetallicRoughness;
        pbr.setMetallicFactor(0);
        pbr.setRoughnessFactor(1);
        if (pbr.metallicRoughnessTexture.texture) pbr.metallicRoughnessTexture.setTexture(null);
        if (PROYECCION.quitarRelieve && material.normalTexture.texture) material.normalTexture.setTexture(null);
    } catch (e) {
        console.log("No se pudo ajustar la tela:", e);
    }
}

/*
   Por proyección cada capa es una calcomanía (ver proyeccion.js).
   Su dibujo va en un lienzo propio, con su tamaño respecto al ancho de la prenda.
*/
const cacheCalcos = new Map();

function lienzoCapa(capa) {
    if (capa.tipo === "imagen") {
        if (!capa.img) return null;
        const lienzo = capa.usarColor ? imagenTenida(capa.img, capa.src, capa.color) : capa.img;
        return { lienzo, ancho: capa.tam / 100 };
    }

    if (!capa.contenido) return null;

    const clave = [capa.contenido, capa.fuente, capa.color, capa.tam].join("|");
    if (cacheCalcos.has(clave)) return cacheCalcos.get(clave);

    const px = capa.tam * ESCALA_TEXTO;
    const fuente = px + "px " + capa.fuente;

    // si la fuente de Google todavía no ha llegado, se dibuja con la de sustitución
    // pero no se guarda: cuando llegue, se vuelve a pintar con la buena
    let fuenteLista = true;
    try { fuenteLista = document.fonts.check(fuente, capa.contenido); } catch (e) { /* seguimos */ }
    if (!fuenteLista) document.fonts.load(fuente, capa.contenido).then(() => actualizarTodo()).catch(() => {});

    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.font = fuente;
    c.width = Math.ceil(ctx.measureText(capa.contenido).width + px * 0.4);
    c.height = Math.ceil(px * 1.4);

    ctx.font = fuente;   // al cambiar el tamaño del lienzo se reinicia
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = capa.color;
    ctx.fillText(capa.contenido, c.width / 2, c.height / 2);

    const resultado = { lienzo: c, ancho: c.width / TEXTURA };
    if (fuenteLista) {
        if (cacheCalcos.size > 60) cacheCalcos.clear();
        cacheCalcos.set(clave, resultado);
    }
    return resultado;
}

// dónde va una capa que todavía no se ha arrastrado: en su posición (x, y) vista de frente o de espaldas
const cacheAnclas = new Map();

function anclaDeCapa(capa, lado) {
    if (capa.ancla) return { ancla: capa.ancla, normal: capa.normal };

    const clave = lado + "|" + capa.x + "|" + capa.y;
    if (!cacheAnclas.has(clave)) cacheAnclas.set(clave, Proyeccion.anclaDesdePlano(capa.x, capa.y, lado));
    return cacheAnclas.get(clave);
}

// por proyección las dos caras van en la misma textura: se pinta entera
function enviarProyeccion() {
    if (!visor.model || !Proyeccion.listo) return;

    const material = visor.model.materials.find(m => m.name === PROYECCION.pieza);
    if (!material) {
        console.log("No encuentro la pieza", PROYECCION.pieza, "- usa listarMateriales() para ver los nombres.");
        return;
    }

    const calcos = [];
    Object.keys(diseno).forEach(lado => {
        diseno[lado].capas.forEach(capa => {
            if (!capa.visible) return;
            const dibujo = lienzoCapa(capa);
            const sitio = dibujo && anclaDeCapa(capa, lado);
            if (!sitio) return;
            calcos.push({
                lienzo: dibujo.lienzo,
                ancho: dibujo.ancho,
                ancla: sitio.ancla,
                normal: sitio.normal,
                rot: capa.rot,
                opacidad: limitar((capa.opacidad ?? 100) / 100, 0, 1)
            });
        });
    });

    if (!texturasLienzo.proyeccion) prepararTela(material);
    const { textura, lienzo } = texturaDe("proyeccion", material);
    const resultado = Proyeccion.componer(calcos, tiraColores(), modoColor, hexARgb(coloresCamiseta[0]));

    lienzo.getContext("2d").drawImage(resultado, 0, 0);
    textura.source.update();
}

function repintar(nombreLado) {
    try {
        if (PROYECCION) {
            enviarProyeccion();
            return;
        }
        dibujarLado(nombreLado);
        enviarTextura(nombreLado);
    } catch (e) {
        // Suele pasar si abres el archivo con doble clic (file://).
        // Usa un servidor local (por ejemplo Live Server de VS Code).
        console.log("Error pintando la textura:", e);
    }
}

/*
   Delantera y trasera se pintan SIEMPRE juntas, para que el color,
   el degradado y las capas estén sincronizados en las dos caras.
   Como mucho una vez por fotograma, aunque lleguen muchos cambios.
*/
let rafTodo = 0;

function actualizarTodo() {
    if (rafTodo) return;
    rafTodo = requestAnimationFrame(() => {
        rafTodo = 0;

        if (PROYECCION) {
            try {
                enviarProyeccion();   // una sola vez para las dos caras
            } catch (e) {
                console.log("Error pintando la textura:", e);
            }
            return;
        }

        Object.keys(LADOS).forEach(repintar);
    });
}


/* ==========================================
   COLOR DE LA PRENDA (uno o varios colores)
========================================== */

function colorearMaterial(material, factor) {
    try {
        material.pbrMetallicRoughness.setBaseColorFactor([...factor, 1]);
    } catch (e) {
        console.log("No se pudo colorear el material", material.name, e);
    }
}

function aplicarColor3D() {
    if (!visor || !visor.model) return;

    // delantera y trasera llevan el color dentro de la textura
    actualizarTodo();

    // el resto de piezas (mangas, cuello...) usan el primer color
    const factor = hexARgb(coloresCamiseta[0]).map(srgbALineal);
    const piezasConTextura = PROYECCION
        ? [PROYECCION.pieza]
        : Object.values(LADOS).map(L => L.material);

    visor.model.materials.forEach(material => {
        if (piezasConTextura.includes(material.name)) return;

        // algunas piezas se cargan bajo demanda: hay que esperar a que estén
        if (material.isLoaded) {
            colorearMaterial(material, factor);
        } else {
            material.ensureLoaded().then(() => colorearMaterial(material, factor));
        }
    });
}

function pintarColoresExtra() {
    coloresExtra.innerHTML = "";

    const varios = modoColor !== "liso";

    coloresAcciones.classList.toggle("oculto", !varios);
    coloresAyuda.classList.toggle("oculto", !varios);
    btnAddColor.disabled = coloresCamiseta.length >= MAX_COLORES;

    if (!varios) return;

    coloresCamiseta.forEach((color, i) => {
        if (i === 0) return;   // el primero es el selector de siempre

        const fila = document.createElement("div");
        fila.className = "color-row";

        const entrada = document.createElement("input");
        entrada.type = "color";
        entrada.value = color;

        const codigo = document.createElement("span");
        codigo.textContent = color.toUpperCase();

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.textContent = "✕";
        quitar.title = "Quitar este color";

        entrada.addEventListener("input", () => {
            coloresCamiseta[i] = entrada.value;
            codigo.textContent = entrada.value.toUpperCase();
            aplicarColor3D();
            cambio();
        });

        quitar.addEventListener("click", () => {
            coloresCamiseta.splice(i, 1);
            pintarColoresExtra();
            aplicarColor3D();
            cambio();
        });

        fila.append(entrada, codigo, quitar);
        coloresExtra.appendChild(fila);
    });
}

function mostrarColores() {
    colorModo.value = modoColor;
    selectorColor.value = coloresCamiseta[0];
    codigoColor.textContent = coloresCamiseta[0].toUpperCase();
    pintarColoresExtra();
}

selectorColor.addEventListener("input", () => {
    coloresCamiseta[0] = selectorColor.value;
    codigoColor.textContent = selectorColor.value.toUpperCase();
    aplicarColor3D();
    cambio();
});

colorModo.addEventListener("change", () => {
    modoColor = colorModo.value;

    // un degradado necesita al menos dos colores
    if (modoColor !== "liso" && coloresCamiseta.length < 2) {
        coloresCamiseta.push("#c9a227");
    }

    pintarColoresExtra();
    aplicarColor3D();
    cambio();
});

btnAddColor.addEventListener("click", () => {
    if (coloresCamiseta.length >= MAX_COLORES) return;
    coloresCamiseta.push("#ffffff");
    pintarColoresExtra();
    aplicarColor3D();
    cambio();
});


/* ==========================================
   LISTA DE CAPAS
========================================== */

function nombreDeCapa(capa) {
    if (capa.alias) return capa.alias;   // nombre que le ha puesto el usuario
    if (capa.tipo === "texto") return capa.contenido || "(texto vacío)";
    return capa.img ? capa.nombre : "(sin imagen)";
}

function pintarListaCapas() {
    const datos = ladoDatos();

    capasLado.textContent = "Lado: " + (ladoActual === "frontal" ? "Frontal" : "Trasera");
    listaCapas.innerHTML = "";
    capasVacio.classList.toggle("oculto", datos.capas.length > 0);

    // la capa de más arriba se muestra la primera
    for (let i = datos.capas.length - 1; i >= 0; i--) {
        const capa = datos.capas[i];

        const fila = document.createElement("li");
        fila.className = "layer-item" +
            (capa.id === datos.seleccion ? " selected" : "") +
            (capa.visible ? "" : " layer-hidden");
        fila.dataset.id = capa.id;

        const icono = document.createElement("span");
        icono.className = "layer-icon";
        icono.textContent = capa.tipo === "texto" ? "T" : "▣";

        const nombre = document.createElement("span");
        nombre.className = "layer-name";
        nombre.textContent = nombreDeCapa(capa);

        const crearBoton = (accion, texto, titulo, desactivado) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "layer-btn";
            b.dataset.act = accion;
            b.textContent = texto;
            b.title = titulo;
            b.disabled = !!desactivado;
            return b;
        };

        fila.append(
            icono,
            nombre,
            crearBoton("renombrar", "✎", "Renombrar capa"),
            crearBoton("ver", capa.visible ? "👁" : "–", capa.visible ? "Ocultar" : "Mostrar"),
            crearBoton("subir", "▲", "Poner por encima", i === datos.capas.length - 1),
            crearBoton("bajar", "▼", "Poner por debajo", i === 0),
            crearBoton("borrar", "✕", "Eliminar capa")
        );

        listaCapas.appendChild(fila);
    }
}

listaCapas.addEventListener("click", (e) => {
    const fila = e.target.closest(".layer-item");
    if (!fila) return;

    const datos = ladoDatos();
    const id = parseInt(fila.dataset.id, 10);
    const indice = datos.capas.findIndex(c => c.id === id);
    if (indice < 0) return;

    const boton = e.target.closest("button[data-act]");
    const accion = boton ? boton.dataset.act : "seleccionar";

    if (accion === "renombrar") {
        renombrarCapa(fila, datos.capas[indice]);
        return;
    } else if (accion === "ver") {
        datos.capas[indice].visible = !datos.capas[indice].visible;
    } else if (accion === "subir" && indice < datos.capas.length - 1) {
        [datos.capas[indice], datos.capas[indice + 1]] = [datos.capas[indice + 1], datos.capas[indice]];
    } else if (accion === "bajar" && indice > 0) {
        [datos.capas[indice], datos.capas[indice - 1]] = [datos.capas[indice - 1], datos.capas[indice]];
    } else if (accion === "borrar") {
        borrarCapa(id);
        return;
    } else if (accion === "seleccionar") {
        seleccionar(id);
        return;
    }

    pintarListaCapas();
    cambio();
});

// Cambia el nombre de la capa por un campo de texto (Enter guarda, Esc cancela).
// Si se deja vacío, vuelve al nombre automático.
function renombrarCapa(fila, capa) {
    const nombre = fila.querySelector(".layer-name");
    const entrada = document.createElement("input");
    entrada.type = "text";
    entrada.className = "layer-rename";
    entrada.maxLength = 40;
    entrada.value = nombreDeCapa(capa);
    nombre.replaceWith(entrada);
    entrada.focus();
    entrada.select();

    let hecho = false;
    const terminar = (guardar) => {
        if (hecho) return;
        hecho = true;
        if (guardar) {
            capa.alias = entrada.value.trim();
            cambio();
        }
        pintarListaCapas();
    };

    entrada.addEventListener("keydown", (e) => {
        if (e.key === "Enter") terminar(true);
        if (e.key === "Escape") terminar(false);
    });
    entrada.addEventListener("blur", () => terminar(true));
    // que el clic dentro del campo no seleccione la capa ni repinte la lista
    entrada.addEventListener("click", (e) => e.stopPropagation());
}

function seleccionar(id) {
    ladoDatos().seleccion = id;
    pintarListaCapas();
    cargarControles();
}

function borrarCapa(id) {
    const datos = ladoDatos();
    const indice = datos.capas.findIndex(c => c.id === id);
    if (indice < 0) return;

    datos.capas.splice(indice, 1);

    if (datos.seleccion === id) {
        const vecina = datos.capas[Math.min(indice, datos.capas.length - 1)];
        datos.seleccion = vecina ? vecina.id : null;
    }

    pintarListaCapas();
    cargarControles();
    cambio();
}

function añadirCapa(capa) {
    const datos = ladoDatos();

    // pequeño desplazamiento para que no se tapen exactamente
    const n = datos.capas.length % 5;
    capa.y = limitar(capa.y - n * 0.05, 0.08, 0.92);

    datos.capas.push(capa);
    datos.seleccion = capa.id;

    pintarListaCapas();
    cargarControles();
    cambio();
}

btnAddTexto.addEventListener("click", () => {
    añadirCapa(nuevaCapaTexto("TEXTO"));
    entradaTexto.focus();
    entradaTexto.select();
});

btnAddImagen.addEventListener("click", async () => {
    const capa = nuevaCapaImagen();
    const logo = LOGOS_MARCA[0];

    if (logo) {
        const img = await cargarImagen(logo.src);
        if (img) {
            capa.src = logo.src;
            capa.nombre = logo.nombre;
            capa.img = img;
        }
    }

    añadirCapa(capa);
});


/* ==========================================
   TEXTO: CONTENIDO, FUENTE, COLOR, TAMAÑO, GIRO Y OPACIDAD
========================================== */

async function actualizarTexto3D() {
    const capa = capaActual();
    if (!capa || capa.tipo !== "texto") return;

    capa.contenido = entradaTexto.value;
    capa.fuente = selectorFuente.value;
    capa.color = selectorTextoColor.value;
    capa.tam = parseInt(selectorTextoTamano.value, 10);
    capa.rot = parseInt(textoRotacion.value, 10);

    valorTextoTamano.textContent = capa.tam + " px";
    textoRotacionValor.textContent = capa.rot + "°";

    pintarListaCapas();

    // las fuentes de Google hay que cargarlas antes de pintarlas
    try {
        await document.fonts.load("40px " + capa.fuente, capa.contenido || "A");
    } catch (e) { /* seguimos igualmente */ }

    cambio();
}

[entradaTexto, selectorFuente, selectorTextoColor, selectorTextoTamano, textoRotacion]
    .forEach(el => el.addEventListener("input", actualizarTexto3D));

selectorFuente.addEventListener("change", actualizarTexto3D);

designSelect.addEventListener("change", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "texto") return;

    if (designSelect.value === "dk") entradaTexto.value = "DK";
    if (designSelect.value === "kings") entradaTexto.value = "KINGS";
    if (designSelect.value === "custom") {
        entradaTexto.value = "";
        entradaTexto.focus();
    }
    actualizarTexto3D();
});

textoOpacidad.addEventListener("input", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "texto") return;

    capa.opacidad = parseInt(textoOpacidad.value, 10);
    textoOpacidadValor.textContent = capa.opacidad + " %";
    cambio();
});


/* ==========================================
   IMÁGENES: DESPLEGABLE, SUBIDA Y AJUSTES
========================================== */

// rellenar el desplegable con las imágenes de la marca
LOGOS_MARCA.forEach((logo, i) => {
    const opcion = document.createElement("option");
    opcion.value = "m" + i;
    opcion.textContent = logo.nombre;
    selectorImagen.appendChild(opcion);
});

// añade una imagen al desplegable como «Mi imagen» (si no estaba ya)
function registrarSubida(nombre, url) {
    let indice = imagenesSubidas.findIndex(u => u.url === url);
    if (indice >= 0) return indice;

    imagenesSubidas.push({ nombre: nombre, url: url });
    indice = imagenesSubidas.length - 1;

    const opcion = document.createElement("option");
    opcion.value = "u" + indice;
    opcion.textContent = "Mi imagen: " + nombre;
    selectorImagen.appendChild(opcion);
    return indice;
}

async function elegirImagen(src, nombre) {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;

    if (!src) {
        capa.src = "";
        capa.img = null;
        capa.nombre = "Imagen";
    } else {
        const img = await cargarImagen(src);
        if (!img) return;
        capa.src = src;
        capa.img = img;
        capa.nombre = nombre;
    }

    pintarListaCapas();
    cambio();
}

selectorImagen.addEventListener("change", () => {
    const valor = selectorImagen.value;

    if (valor === "") {
        elegirImagen("", "");
    } else if (valor.startsWith("u")) {
        const subida = imagenesSubidas[parseInt(valor.slice(1), 10)];
        elegirImagen(subida.url, subida.nombre);
    } else {
        const logo = LOGOS_MARCA[parseInt(valor.slice(1), 10)];
        elegirImagen(logo.src, logo.nombre);
    }
});

subirImagen.addEventListener("change", () => {
    const archivo = subirImagen.files[0];
    if (!archivo) return;

    const url = URL.createObjectURL(archivo);
    selectorImagen.value = "u" + registrarSubida(archivo.name, url);

    elegirImagen(url, archivo.name);
    subirImagen.value = "";
});

function ajusteImagen(control, aplicar) {
    control.addEventListener("input", () => {
        const capa = capaActual();
        if (!capa || capa.tipo !== "imagen") return;
        aplicar(capa);
        cambio();
    });
}

ajusteImagen(imagenTamano, capa => {
    capa.tam = parseInt(imagenTamano.value, 10);
    imagenTamanoValor.textContent = capa.tam + " %";
});

ajusteImagen(imagenRotacion, capa => {
    capa.rot = parseInt(imagenRotacion.value, 10);
    imagenRotacionValor.textContent = capa.rot + "°";
});

ajusteImagen(imagenOpacidad, capa => {
    capa.opacidad = parseInt(imagenOpacidad.value, 10);
    imagenOpacidadValor.textContent = capa.opacidad + " %";
});

ajusteImagen(imagenColor, capa => {
    capa.color = imagenColor.value;
    capa.usarColor = true;
    imagenUsarColor.checked = true;
});

imagenUsarColor.addEventListener("change", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;
    capa.usarColor = imagenUsarColor.checked;
    cambio();
});

btnCentrarImagen.addEventListener("click", centrarCapa);
btnQuitarImagen.addEventListener("click", () => {
    const capa = capaActual();
    if (capa) borrarCapa(capa.id);
});


/* ==========================================
   DISEÑOS PREDETERMINADOS DK
========================================== */

const btnMostrarDisenos = document.getElementById("btnMostrarDisenos");
const listaDisenos = document.getElementById("listaDisenos");

btnMostrarDisenos.addEventListener("click", () => {
    listaDisenos.hidden = !listaDisenos.hidden;
    btnMostrarDisenos.textContent = listaDisenos.hidden
        ? "Diseños predeterminados ▼"
        : "Diseños predeterminados ▲";
});

document.querySelectorAll(".dk-diseno").forEach((boton) => {
    boton.addEventListener("click", async () => {
        const src = boton.dataset.imagen;

        const img = await cargarImagen(src);
        if (!img) {
            alert("No se ha podido cargar " + src +
                  ". Comprueba que el archivo está en la carpeta correcta.");
            return;
        }

        // si hay una capa de imagen seleccionada se reutiliza; si no, se crea
        let capa = capaActual();
        const nueva = !capa || capa.tipo !== "imagen";
        if (nueva) capa = nuevaCapaImagen();

        capa.src = src;
        capa.img = img;
        capa.nombre = "Diseño DK: " + src;
        capa.visible = true;

        if (nueva) {
            añadirCapa(capa);
        } else {
            pintarListaCapas();
            cargarControles();
            cambio();
        }

        document.querySelectorAll(".dk-diseno").forEach((b) => {
            b.classList.toggle("seleccionado", b === boton);
        });
    });
});


/* ==========================================
   CARGAR LOS CONTROLES SEGÚN LA CAPA ELEGIDA
========================================== */

function cargarControles() {
    const capa = capaActual();
    const esTexto = !!capa && capa.tipo === "texto";
    const esImagen = !!capa && capa.tipo === "imagen";

    seccionDiseno.classList.toggle("oculto", !esTexto);
    seccionTexto.classList.toggle("oculto", !esTexto);
    seccionImagen.classList.toggle("oculto", !esImagen);
    sinSeleccion.classList.toggle("oculto", !!capa);

    if (esTexto) {
        entradaTexto.value = capa.contenido;
        selectorFuente.value = capa.fuente;
        selectorTextoColor.value = capa.color;
        selectorTextoTamano.value = capa.tam;
        valorTextoTamano.textContent = capa.tam + " px";
        textoRotacion.value = capa.rot;
        textoRotacionValor.textContent = capa.rot + "°";
        textoOpacidad.value = capa.opacidad ?? 100;
        textoOpacidadValor.textContent = (capa.opacidad ?? 100) + " %";
    }

    if (esImagen) {
        imagenTamano.value = capa.tam;
        imagenTamanoValor.textContent = capa.tam + " %";
        imagenRotacion.value = capa.rot;
        imagenRotacionValor.textContent = capa.rot + "°";
        imagenOpacidad.value = capa.opacidad ?? 100;
        imagenOpacidadValor.textContent = (capa.opacidad ?? 100) + " %";
        imagenUsarColor.checked = capa.usarColor;
        imagenColor.value = capa.color;

        const iLogo = LOGOS_MARCA.findIndex(l => l.src === capa.src);
        const iSubida = imagenesSubidas.findIndex(u => u.url === capa.src);

        if (!capa.img) selectorImagen.value = "";
        else if (iLogo >= 0) selectorImagen.value = "m" + iLogo;
        else if (iSubida >= 0) selectorImagen.value = "u" + iSubida;
    }
}

function cambiarLado(nombreLado) {
    ladoActual = nombreLado;
    visor.cameraOrbit = LADOS[nombreLado].orbita;

    viewButtons.forEach(b =>
        b.classList.toggle("active", b.dataset.view === (nombreLado === "frontal" ? "front" : "back"))
    );

    pintarListaCapas();
    cargarControles();
}


/* ==========================================
   MOVER LA CAPA SOBRE LA PRENDA
========================================== */

let modoMover = false;
let arrastrando = false;

/*
   Convierte un punto de la pantalla en coordenadas de la textura (u, v).
   El visor ya nos da la coordenada de textura (UV) del punto tocado,
   así que no hace falta calibrar nada para cada prenda.
   (model-viewer 4 espera coordenadas de la ventana: clientX / clientY.)
*/
function puntoATextura(clientX, clientY) {
    // por proyección: la calcomanía se ancla en el punto 3D tocado
    // (vale cualquier sitio de la prenda: delante, detrás, bolsillos, mangas...)
    if (PROYECCION) {
        const material = visor.materialFromPoint(clientX, clientY);
        if (!material || material.name !== PROYECCION.pieza || !Proyeccion.listo) return null;

        const hit = visor.positionAndNormalFromPoint(clientX, clientY);
        return hit ? Proyeccion.anclaDesdeHit(hit.position, hit.normal) : null;
    }

    // solo vale si pulsas sobre la pieza del lado que estás editando
    const material = visor.materialFromPoint(clientX, clientY);
    if (!material || material.name !== LADOS[ladoActual].material) return null;

    const hit = visor.positionAndNormalFromPoint(clientX, clientY);
    if (!hit || !hit.uv) return null;

    return {
        u: limitar(hit.uv.u, 0.02, 0.98),
        v: limitar(hit.uv.v, 0.02, 0.98)
    };
}

/* ===== MOVER SIN TIRONES ===== */

let puntoPendiente = null;
let rafMover = 0;

function moverA(clientX, clientY) {
    // guardamos solo el último punto y trabajamos una vez por fotograma
    puntoPendiente = [clientX, clientY];
    if (rafMover) return;

    rafMover = requestAnimationFrame(() => {
        rafMover = 0;

        const p = puntoPendiente;
        puntoPendiente = null;
        if (!p) return;

        const capa = capaActual();
        if (!capa) return;

        const punto = puntoATextura(p[0], p[1]);
        if (!punto) return;

        if (punto.ancla) {
            capa.ancla = punto.ancla;
            capa.normal = punto.normal;
        } else {
            capa.x = punto.u;
            capa.y = punto.v;
        }

        // al arrastrar solo cambia el lado que editas, y siempre a calidad completa
        repintar(ladoActual);
    });
}

function activarModoMover(activo) {
    modoMover = activo;

    btnMover.classList.toggle("active", activo);
    btnMover.textContent = activo ? "✥ Moviendo… (pulsa para parar)" : "✥ Mover texto";

    btnMoverImagen.classList.toggle("active", activo);
    btnMoverImagen.textContent = activo ? "✥ Moviendo…" : "✥ Mover imagen";

    visor.classList.toggle("modo-mover", activo);

    if (activo) {
        // al mover, la prenda debe quedarse quieta
        visor.removeAttribute("camera-controls");
        visor.removeAttribute("auto-rotate");
    } else {
        visor.setAttribute("camera-controls", "");
        visor.setAttribute("auto-rotate", "");
    }
}

btnMover.addEventListener("click", () => activarModoMover(!modoMover));
btnMoverImagen.addEventListener("click", () => activarModoMover(!modoMover));

visor.addEventListener("pointerdown", (e) => {
    if (!modoMover) return;
    arrastrando = true;
    try { visor.setPointerCapture(e.pointerId); } catch (err) { /* no es imprescindible */ }
    moverA(e.clientX, e.clientY);
});

visor.addEventListener("pointermove", (e) => {
    if (!modoMover || !arrastrando) return;
    moverA(e.clientX, e.clientY);
});

["pointerup", "pointercancel"].forEach(evento => {
    visor.addEventListener(evento, () => {
        if (!arrastrando) return;
        arrastrando = false;
        cambio();   // apunta la nueva posición (deshacer, precio, autoguardado)
    });
});

// Centrar: pone la capa en el centro y vuelve a la vista de ese lado
function centrarCapa() {
    const capa = capaActual();
    if (!capa) return;

    capa.x = POSICION_X;
    capa.y = capa.tipo === "texto" ? ALTURA_TEXTO : ALTURA_IMAGEN;
    delete capa.ancla;    // por proyección, vuelve a colocarse según (x, y)
    delete capa.normal;

    visor.cameraOrbit = LADOS[ladoActual].orbita;
    visor.jumpCameraToGoal();

    cambio();
}

btnCentrar.addEventListener("click", centrarCapa);


/* ==========================================
   FRONTAL / TRASERA Y TALLAS
========================================== */

viewButtons.forEach(button => {
    button.addEventListener("click", () => {
        cambiarLado(button.dataset.view === "back" ? "trasera" : "frontal");
    });
});

sizeButtons.forEach(button => {
    button.addEventListener("click", () => {
        ponerTalla(button.textContent.trim());
        actualizarPrecio();
        document.dispatchEvent(new Event("dk:cambio"));   // autoguardado
    });
});


/* ==========================================
   DESHACER / REHACER
   Se guarda una "foto" del diseño cuando deja de cambiar
   durante un momento (así escribir una palabra o arrastrar
   una capa cuenta como un solo paso).
========================================== */

const MAX_HISTORIAL = 60;
const historial = { pasado: [], futuro: [], actual: null, clave: "" };
let temporizadorHistorial = 0;

function fotoEstado() {
    const lados = {};
    Object.keys(diseno).forEach(lado => {
        lados[lado] = {
            capas: diseno[lado].capas.map(c => ({ ...c })),
            seleccion: diseno[lado].seleccion
        };
    });
    return { modoColor, colores: [...coloresCamiseta], lados };
}

// lo que se compara para saber si algo ha cambiado (sin imágenes ni selección)
function claveEstado(estado) {
    return JSON.stringify(estado, (k, v) => (k === "img" || k === "seleccion") ? undefined : v);
}

function registrarHistorial() {
    clearTimeout(temporizadorHistorial);
    temporizadorHistorial = 0;

    const estado = fotoEstado();
    const clave = claveEstado(estado);
    if (clave === historial.clave) return;

    if (historial.actual) {
        historial.pasado.push(historial.actual);
        if (historial.pasado.length > MAX_HISTORIAL) historial.pasado.shift();
    }
    historial.futuro = [];
    historial.actual = estado;
    historial.clave = clave;
    actualizarBotonesHistorial();
}

function programarHistorial() {
    clearTimeout(temporizadorHistorial);
    temporizadorHistorial = setTimeout(registrarHistorial, 400);
}

// empieza el historial desde el diseño actual (al abrir uno guardado o el borrador)
function reiniciarHistorial() {
    clearTimeout(temporizadorHistorial);
    temporizadorHistorial = 0;
    historial.pasado = [];
    historial.futuro = [];
    historial.actual = fotoEstado();
    historial.clave = claveEstado(historial.actual);
    actualizarBotonesHistorial();
}

function aplicarEstado(estado) {
    modoColor = estado.modoColor;
    coloresCamiseta = [...estado.colores];

    Object.keys(diseno).forEach(lado => {
        diseno[lado].capas = estado.lados[lado].capas.map(c => ({ ...c }));
        const sel = estado.lados[lado].seleccion;
        diseno[lado].seleccion = diseno[lado].capas.some(c => c.id === sel) ? sel : null;
    });

    historial.clave = claveEstado(estado);

    mostrarColores();
    pintarListaCapas();
    cargarControles();
    aplicarColor3D();
    actualizarPrecio();
    actualizarBotonesHistorial();
    document.dispatchEvent(new Event("dk:cambio"));   // autoguardado
}

function deshacer() {
    if (temporizadorHistorial) registrarHistorial();   // apunta el último cambio pendiente
    if (!historial.pasado.length) return;

    historial.futuro.push(historial.actual);
    historial.actual = historial.pasado.pop();
    aplicarEstado(historial.actual);
}

function rehacer() {
    if (temporizadorHistorial) registrarHistorial();
    if (!historial.futuro.length) return;

    historial.pasado.push(historial.actual);
    historial.actual = historial.futuro.pop();
    aplicarEstado(historial.actual);
}

function actualizarBotonesHistorial() {
    btnDeshacer.disabled = historial.pasado.length === 0 && !temporizadorHistorial;
    btnRehacer.disabled = historial.futuro.length === 0;
}

btnDeshacer.addEventListener("click", deshacer);
btnRehacer.addEventListener("click", rehacer);

// Ctrl+Z deshace, Ctrl+Y o Ctrl+Mayús+Z rehace
// (dentro de un campo de texto se deja el deshacer normal del navegador)
document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;

    const t = e.target;
    const escribiendo = t.tagName === "TEXTAREA" ||
        (t.tagName === "INPUT" && ["text", "search", "number"].includes(t.type));
    if (escribiendo) return;

    const tecla = e.key.toLowerCase();
    if (tecla === "z" && !e.shiftKey) {
        e.preventDefault();
        deshacer();
    } else if (tecla === "y" || (tecla === "z" && e.shiftKey)) {
        e.preventDefault();
        rehacer();
    }
});


/* ==========================================
   CONVERTIR EL DISEÑO A DATOS (Y AL REVÉS)
   Lo usan «Mis diseños», el borrador automático y el carrito.
========================================== */

const MAX_IMAGEN_GUARDADA = 1024;   // las imágenes subidas se reducen a este tamaño al guardar
const cacheDatosImagen = new Map();

// Las imágenes subidas son enlaces temporales (blob:) que se pierden al
// cerrar la página, así que se guardan dentro del diseño como data URL.
function imagenADatos(img, src) {
    if (cacheDatosImagen.has(src)) return cacheDatosImagen.get(src);

    const escala = Math.min(1, MAX_IMAGEN_GUARDADA / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * escala);
    c.height = Math.round(img.naturalHeight * escala);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);

    const datos = c.toDataURL("image/png");
    cacheDatosImagen.set(src, datos);
    return datos;
}

function capaADatos(capa) {
    const datos = { ...capa };
    delete datos.id;
    delete datos.img;

    if (capa.tipo === "imagen" && capa.img && capa.src.startsWith("blob:")) {
        datos.src = imagenADatos(capa.img, capa.src);
    }
    return datos;
}

// miniatura pequeña de cómo se ve la prenda ahora mismo
async function miniaturaVisor(ancho = 160) {
    try {
        const img = new Image();
        img.src = visor.toDataURL("image/png");
        await img.decode();

        const c = document.createElement("canvas");
        c.width = ancho;
        c.height = Math.round(ancho * img.naturalHeight / img.naturalWidth);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", 0.75);
    } catch (e) {
        return "";
    }
}

function serializarDiseno() {
    const lados = {};
    Object.keys(diseno).forEach(lado => {
        lados[lado] = diseno[lado].capas.map(capaADatos);
    });

    return {
        prenda: PRENDA_ID,
        modoColor: modoColor,
        colores: [...coloresCamiseta],
        talla: tallaActual(),
        lados: lados
    };
}

function disenoVacio(datos) {
    return Object.keys(diseno).every(lado => !(datos.lados[lado] || []).length) &&
        (datos.modoColor || "liso") === "liso";
}

// abre un diseño guardado (de «Mis diseños», del borrador...)
async function abrirDatos(datos) {
    for (const lado of Object.keys(diseno)) {
        const capas = [];

        for (const guardada of datos.lados[lado] || []) {
            const capa = { ...guardada, id: ++contadorCapas, img: null };

            if (capa.tipo === "imagen" && capa.src) {
                capa.img = await cargarImagen(capa.src);
                if (capa.img && capa.src.startsWith("data:")) registrarSubida(capa.nombre, capa.src);
            }

            if (capa.tipo === "texto") {
                // las fuentes de Google hay que cargarlas antes de pintarlas
                try {
                    await document.fonts.load("40px " + capa.fuente, capa.contenido || "A");
                } catch (e) { /* seguimos igualmente */ }
            }

            capas.push(capa);
        }

        diseno[lado].capas = capas;
        diseno[lado].seleccion = capas.length ? capas[capas.length - 1].id : null;
    }

    modoColor = datos.modoColor || "liso";
    coloresCamiseta = datos.colores && datos.colores.length ? [...datos.colores] : ["#171717"];
    if (datos.talla) ponerTalla(datos.talla);

    mostrarColores();
    pintarListaCapas();
    cargarControles();
    aplicarColor3D();
    cambio();
}

// deja la prenda en blanco
function vaciarDiseno() {
    Object.keys(diseno).forEach(lado => {
        diseno[lado].capas = [];
        diseno[lado].seleccion = null;
    });
    modoColor = "liso";
    coloresCamiseta = ["#171717"];

    mostrarColores();
    pintarListaCapas();
    cargarControles();
    aplicarColor3D();
    cambio();
}


/* ==========================================
   AÑADIR AL CARRITO
========================================== */

function resumenLado(nombreLado) {
    const capas = diseno[nombreLado].capas.filter(c => c.visible);
    if (!capas.length) return "";
    return capas.map(c => c.tipo === "texto"
        ? "«" + c.contenido + "»"
        : (c.alias || c.nombre)
    ).join(", ");
}

addCart.addEventListener("click", async () => {
    addCart.disabled = true;

    const colores = modoColor === "liso"
        ? coloresCamiseta[0].toUpperCase()
        : colorModo.options[colorModo.selectedIndex].text + " (" + coloresCamiseta.length + " colores)";

    const detalles = ["Color: " + colores];
    if (resumenLado("frontal")) detalles.push("Delante: " + resumenLado("frontal"));
    if (resumenLado("trasera")) detalles.push("Detrás: " + resumenLado("trasera"));

    const ok = Carrito.añadir({
        prenda: PRENDA_ID,
        nombre: FAMILIA.singular.charAt(0).toUpperCase() + FAMILIA.singular.slice(1) + " · " + PRENDA.nombre,
        talla: tallaActual(),
        detalles: detalles,
        precio: calcularPrecio(),
        foto: await miniaturaVisor(200),
        diseno: serializarDiseno()
    });

    addCart.disabled = false;
    if (ok) Carrito.abrir();
});


/* ==========================================
   CARGA DEL MODELO
========================================== */

async function iniciarModelo() {
    if (PROYECCION) {
        // se lee la malla de la prenda y el diseño toma su forma (vista de frente)
        try {
            await Proyeccion.preparar(PRENDA.modelo, PROYECCION);
        } catch (e) {
            console.log("No se pudo preparar la proyección:", e);
        }
    } else {
        // cargar la tela de cada pieza (si no tiene, se usa blanco)
        for (const nombre of Object.keys(LADOS)) {
            telas[nombre] = await cargarImagen(LADOS[nombre].tela || TELA_BLANCA);
        }
    }

    aplicarColor3D();   // también pinta las texturas
    cambiarLado(ladoActual);
    visor.jumpCameraToGoal();
}

// cuando el modelo ya es visible, volvemos a pintar
visor.addEventListener("model-visibility", (e) => {
    if (e.detail && e.detail.visible) actualizarTodo();
});

visor.addEventListener("load", iniciarModelo);

visor.addEventListener("error", (evento) => {
    console.log("Error cargando el modelo 3D:", evento);
});


/* ==========================================
   INICIO
========================================== */

prepararPagina();
actualizarPrecio();
pintarColoresExtra();
pintarListaCapas();
cargarControles();
reiniciarHistorial();
