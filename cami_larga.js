/* ==========================================
   DK DESIGN KINGS - EDITOR DE CAMISETAS 3D (MANGA LARGA)
   El texto y las imágenes se pintan DENTRO de la
   textura de la camiseta (ya no flotan encima).
========================================== */

const visor = document.getElementById("camiseta3D");

// model-viewer baja la resolución cuando va justo de fotogramas (al arrastrar)
// y la camiseta se ve borrosa: así siempre se dibuja a resolución completa
customElements.whenDefined("model-viewer").then(() => {
    customElements.get("model-viewer").minimumRenderScale = 1;
});

/* ---------- Elementos ---------- */

const modelCards = document.querySelectorAll(".model-card");
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

const btnMover = document.getElementById("btnMover");
const btnCentrar = document.getElementById("btnCentrar");

const selectorImagen = document.getElementById("imageSelect");
const subirImagen = document.getElementById("imageUpload");
const imagenTamano = document.getElementById("imageSize");
const imagenTamanoValor = document.getElementById("imageSizeValue");
const imagenRotacion = document.getElementById("imageRotation");
const imagenRotacionValor = document.getElementById("imageRotationValue");
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

const seccionDiseno = document.getElementById("seccionDiseno");
const seccionTexto = document.getElementById("seccionTexto");
const seccionImagen = document.getElementById("seccionImagen");
const sinSeleccion = document.getElementById("sinSeleccion");


let currentPrice = 24.99;


/* ==========================================
   CONFIGURACIÓN
========================================== */

/*
   IMÁGENES DE LA MARCA (desplegable).
   Para añadir más: pon el archivo en la carpeta img/
   y añade una línea aquí. Lo ideal es un PNG con fondo
   transparente (si es blanco, se puede recolorear).
*/
const LOGOS_MARCA = [
    { nombre: "Logo DK con corona", src: "img/logo-dk-completo.png" },
    { nombre: "Solo corona",        src: "img/logo-dk-corona.png" },
    { nombre: "Solo monograma DK",  src: "img/logo-dk-monograma.png" }
];

/*
   Las dos piezas del modelo donde se imprime (delantera y trasera).
   Valores sacados del propio tshirt.glb:
   - material: nombre de la pieza en el modelo
   - normalX: hacia qué lado del eje X mira esa pieza
   - u / v: coeficientes para pasar de un punto 3D a coordenadas de textura
   - vmax: proporción alto/ancho de la pieza (la textura se crea con esa forma)

   Si ves que "Frontal" muestra la espalda, intercambia
   "Material1718" y "Material1722" entre frontal y trasera.
*/
// tela blanca (la manga larga no tiene tela de fondo)
const TELA_BLANCA = (() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const x = c.getContext("2d");
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 4, 4);
    return c.toDataURL("image/png");
})();

const EXPONENTES = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, 2], [0, 1, 1], [0, 2, 0], [1, 0, 1], [1, 1, 0], [2, 0, 0], [0, 0, 3], [0, 1, 2], [0, 2, 1], [0, 3, 0], [1, 0, 2], [1, 1, 1], [1, 2, 0], [2, 0, 1], [2, 1, 0], [3, 0, 0]];

const POLI_FRONTAL = {
    c: [-2.651, 1284.332, -38.388], s: 100,
    u: [0.51259879, -0.0221853595, 0.00250985672, 0.265953763, -0.00206621949, 0.000893028295, -0.000723793825, -0.0945953142, -0.0060635801, -0.00775170529, 0.00530378715, -0.000638730831, -0.000225992365, -0.000457276447, 0.026261856, 0.000116937397, -0.00549412177, 0.0066172295, -4.74793771e-05, -0.000318987171],
    v: [0.532900973, -0.0419318678, 0.124191304, 0.000768658375, -0.00226962344, 0.00579523701, 0.0012746538, -0.000165566726, 6.64625414e-05, -0.00668040331, 0.00972620839, -0.0039776331, -0.00182747766, 0.000180573297, -0.0014033447, -6.18252142e-05, 3.41337182e-05, 0.0155132565, 0.00242791374, -0.000402471419]
};

const POLI_TRASERA = {
    c: [-2.651, 1284.332, -38.388], s: 100,
    u: [0.475089706, -0.00354477989, 0.00143628356, -0.252365775, -0.0173378781, -0.00535143244, -6.85415352e-05, -0.0849159628, -0.00117895758, -0.00309602289, -0.00793417452, -0.00301779216, 0.000242552318, -0.000285029954, -0.0181762666, -0.00365431676, 0.00169638723, -0.00250744639, 1.80356323e-05, -0.000234687694],
    v: [0.511730694, 0.000564005791, 0.119179002, 0.000590628671, -0.000839219395, -0.0107656329, 0.00296550802, -0.000195327917, -0.000167261151, -0.0125119953, -0.00217966978, -0.00715581856, 0.00386284186, 6.86617541e-06, -0.000336561537, -0.000968243375, -8.98786754e-05, -0.00924318514, 0.000761585866, -9.73923183e-05]
};

/*
   Las dos piezas del modelo donde se imprime (delantera y trasera).
   - material: nombre de la pieza en manga_larga_pintable.glb
   - eje / signo: hacia dónde mira esa pieza
   - poli: polinomio que pasa de un punto 3D a coordenadas de textura
   - aspecto: alto/ancho de la textura que se pinta

   Si ves que "Frontal" muestra la espalda, intercambia
   "material_Shader12" y "material_Shader13".
*/
const LADOS = {
    frontal: {
        material: "material_Shader12",
        eje: "z", signo: 1,
        orbita: "0deg 80deg auto",
        tela: TELA_BLANCA,
        aspecto: 2,
        vmax: 1,
        poli: POLI_FRONTAL
    },
    trasera: {
        material: "material_Shader13",
        eje: "z", signo: -1,
        orbita: "180deg 80deg auto",
        tela: TELA_BLANCA,
        aspecto: 2,
        vmax: 1,
        poli: POLI_TRASERA
    }
};

// Tamaño real del modelo (para convertir posiciones 3D)
const CENTRO_MODELO = { x: -2.651, y: 1284.332, z: -38.388 };
const ALTO_MODELO = 686.281;

const TEXTURA = 1280;       // ancho de la textura que se pinta (el alto se calcula solo)
const ESCALA_TEXTO = 4.4;   // el slider de tamaño (px) × este factor = px en la textura

/*
   Si el texto o las imágenes te salen boca abajo en la camiseta,
   cambia esto a false.
*/
const INVERTIR_Y = true;


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

// colores de la camiseta (el primero es el selector de siempre)
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
        x: 0.5,
        y: 0.64,
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
        x: 0.5,
        y: 0.46,
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


/* ==========================================
   PRECIO
========================================== */


function updatePrice() {
    price.textContent = currentPrice.toFixed(2).replace(".", ",") + " €";
}

modelCards.forEach(card => {
    card.addEventListener("click", () => {
        // cada modelo tiene su propia página y su propio editor
        const pagina = card.dataset.page;
        if (pagina && !card.classList.contains("active")) {
            window.location.href = pagina;
        }
    });
});



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
        c.height = Math.round(TEXTURA * LADOS[nombreLado].aspecto);
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

// Color base de la camiseta: liso, degradados o franjas
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
    if (capa.tipo === "imagen") {
        if (!capa.img) return;

        const fuente = capa.usarColor
            ? imagenTenida(capa.img, capa.src, capa.color)
            : capa.img;

        const ancho = (capa.tam / 100) * ctx.canvas.width;
        const alto = ancho *
            (capa.img.naturalHeight / capa.img.naturalWidth);

        colocar(ctx, capa.x, capa.y, capa.rot, () => {
            ctx.globalAlpha = limitar(
                (capa.opacidad ?? 100) / 100, 0, 1
            );
            ctx.drawImage(fuente, -ancho / 2, -alto / 2, ancho, alto);
            ctx.globalAlpha = 1;
        });
    } else {
        if (!capa.contenido) return;

        colocar(ctx, capa.x, capa.y, capa.rot, () => {
            ctx.globalAlpha = limitar(
                (capa.opacidad ?? 100) / 100, 0, 1
            );
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

    // 1) tela
    ctx.globalCompositeOperation = "source-over";
    if (telas[nombreLado]) {
        ctx.drawImage(telas[nombreLado], 0, 0, W, H);
    } else {
        ctx.fillStyle = "#cdcdcd";
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
========================================== */

/*
   Cada lado tiene UNA textura de tipo canvas que se crea una sola vez.
   Para actualizarla basta con copiar el lienzo y avisar al visor:
   sin pasar por JPEG, sin decodificar y sin crear texturas nuevas
   (eso era lo que provocaba el lag y los saltos de calidad).
*/
const texturasLienzo = {};   // nombreLado -> { textura, lienzo }

function texturaDe(nombreLado, material) {
    let t = texturasLienzo[nombreLado];

    if (!t) {
        const textura = visor.createCanvasTexture();
        const lienzo = textura.source.element;
        const origen = lienzoDe(nombreLado);
        lienzo.width = origen.width;
        lienzo.height = origen.height;
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
        console.log("No encuentro el material", L.material);
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

function repintar(nombreLado) {
    try {
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
        Object.keys(LADOS).forEach(repintar);
    });
}

// se mantienen estos nombres por compatibilidad: todos repintan las dos caras
function actualizarLado() { actualizarTodo(); }
function actualizarActual() { actualizarTodo(); }


/* ==========================================
   COLOR DE LA CAMISETA (uno o varios colores)
========================================== */

function aplicarColor3D() {
    if (!visor || !visor.model) return;

    // delantera y trasera llevan el color dentro de la textura
    actualizarTodo();

    // mangas y cuello usan el primer color
    const factor = hexARgb(coloresCamiseta[0]).map(srgbALineal);
    const piezasConTextura = Object.values(LADOS).map(L => L.material);

    visor.model.materials.forEach(material => {
        if (piezasConTextura.includes(material.name)) return;

        try {
            material.pbrMetallicRoughness.setBaseColorFactor([...factor, 1]);
        } catch (e) {
            console.log("No se pudo colorear el material", material.name, e);
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
        });

        quitar.addEventListener("click", () => {
            coloresCamiseta.splice(i, 1);
            pintarColoresExtra();
            aplicarColor3D();
        });

        fila.append(entrada, codigo, quitar);
        coloresExtra.appendChild(fila);
    });
}

selectorColor.addEventListener("input", () => {
    coloresCamiseta[0] = selectorColor.value;
    codigoColor.textContent = selectorColor.value.toUpperCase();
    aplicarColor3D();
});

colorModo.addEventListener("change", () => {
    modoColor = colorModo.value;

    // un degradado necesita al menos dos colores
    if (modoColor !== "liso" && coloresCamiseta.length < 2) {
        coloresCamiseta.push("#c9a227");
    }

    pintarColoresExtra();
    aplicarColor3D();
});

btnAddColor.addEventListener("click", () => {
    if (coloresCamiseta.length >= MAX_COLORES) return;
    coloresCamiseta.push("#ffffff");
    pintarColoresExtra();
    aplicarColor3D();
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
    actualizarActual();
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
        if (guardar) capa.alias = entrada.value.trim();
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
    actualizarActual();
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
    actualizarActual();
}

btnAddTexto.addEventListener("click", async () => {
    const capa = nuevaCapaTexto("TEXTO");
    añadirCapa(capa);
    entradaTexto.focus();
    entradaTexto.select();
});

btnAddImagen.addEventListener("click", async () => {
    const capa = nuevaCapaImagen();
    const logo = LOGOS_MARCA[0];

    if (logo) {
        capa.src = logo.src;
        capa.nombre = logo.nombre;
        capa.img = await cargarImagen(logo.src);
    }

    añadirCapa(capa);
});


/* ==========================================
   TEXTO: CONTENIDO, FUENTE, COLOR, TAMAÑO Y GIRO
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

    actualizarActual();
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
    actualizarActual();
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
    imagenesSubidas.push({ nombre: archivo.name, url: url });

    const indice = imagenesSubidas.length - 1;
    const opcion = document.createElement("option");
    opcion.value = "u" + indice;
    opcion.textContent = "Mi imagen: " + archivo.name;
    selectorImagen.appendChild(opcion);
    selectorImagen.value = opcion.value;

    elegirImagen(url, archivo.name);
    subirImagen.value = "";
});

imagenTamano.addEventListener("input", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;
    capa.tam = parseInt(imagenTamano.value, 10);
    imagenTamanoValor.textContent = imagenTamano.value + " %";
    actualizarActual();
});

imagenRotacion.addEventListener("input", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;
    capa.rot = parseInt(imagenRotacion.value, 10);
    imagenRotacionValor.textContent = imagenRotacion.value + "°";
    actualizarActual();
});

imagenUsarColor.addEventListener("change", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;
    capa.usarColor = imagenUsarColor.checked;
    actualizarActual();
});

imagenColor.addEventListener("input", () => {
    const capa = capaActual();
    if (!capa || capa.tipo !== "imagen") return;
    capa.color = imagenColor.value;
    capa.usarColor = true;
    imagenUsarColor.checked = true;
    actualizarActual();
});

btnCentrarImagen.addEventListener("click", centrarCapa);
btnQuitarImagen.addEventListener("click", () => {
    const capa = capaActual();
    if (capa) borrarCapa(capa.id);
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
      
    }

    if (esImagen) {
        imagenTamano.value = capa.tam;
        imagenTamanoValor.textContent = capa.tam + " %";
        imagenRotacion.value = capa.rot;
        imagenRotacionValor.textContent = capa.rot + "°";
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
    actualizarTodo();   // repinta las dos caras al cambiar de lado
}


/* ==========================================
   MOVER LA CAPA SOBRE LA CAMISETA
========================================== */

let modoMover = false;
let arrastrando = false;

// Convierte un punto de la pantalla en coordenadas de la textura (u, v)
function puntoATextura(clientX, clientY) {
    // model-viewer 4 espera coordenadas de la ventana (ya resta él la posición del visor)
    const hit = visor.positionAndNormalFromPoint(clientX, clientY);
    if (!hit) return null;

    const L = LADOS[ladoActual];

    // solo vale si pulsas sobre la cara del lado que estás editando
    if (hit.normal[L.eje] * L.signo < 0.3) return null;

    const centro = visor.getBoundingBoxCenter();
    const dim = visor.getDimensions();
    const escala = dim.y / ALTO_MODELO;

    const q = [
        (CENTRO_MODELO.x + (hit.position.x - centro.x) / escala - L.poli.c[0]) / L.poli.s,
        (CENTRO_MODELO.y + (hit.position.y - centro.y) / escala - L.poli.c[1]) / L.poli.s,
        (CENTRO_MODELO.z + (hit.position.z - centro.z) / escala - L.poli.c[2]) / L.poli.s
    ];

    return {
        u: limitar(evaluarPoli(L.poli.u, q), 0.02, 0.98),
        v: limitar(evaluarPoli(L.poli.v, q), 0.02, 0.98)
    };
}

function evaluarPoli(coefs, q) {
    let suma = 0;
    for (let i = 0; i < EXPONENTES.length; i++) {
        const e = EXPONENTES[i];
        suma += coefs[i] * Math.pow(q[0], e[0]) * Math.pow(q[1], e[1]) * Math.pow(q[2], e[2]);
    }
    return suma;
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

        capa.x = punto.u;
        capa.y = punto.v;

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
        // al mover, la camiseta debe quedarse quieta
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
        arrastrando = false;
    });
});

// Centrar: pone la capa en el centro del pecho y vuelve a la vista de ese lado
function centrarCapa() {
    const capa = capaActual();
    if (!capa) return;

    capa.x = 0.5;
    capa.y = capa.tipo === "texto" ? 0.64 : 0.46;

    visor.cameraOrbit = LADOS[ladoActual].orbita;
    visor.jumpCameraToGoal();

    actualizarActual();
}

btnCentrar.addEventListener("click", centrarCapa);


/* ==========================================
   FRONTAL / TRASERA
========================================== */

viewButtons.forEach(button => {
    button.addEventListener("click", () => {
        cambiarLado(button.dataset.view === "back" ? "trasera" : "frontal");
    });
});


/* ==========================================
   TALLAS
========================================== */

sizeButtons.forEach(button => {
    button.addEventListener("click", () => {
        sizeButtons.forEach(item => item.classList.remove("active"));
        button.classList.add("active");
    });
});


/* ==========================================
   CARGA DEL MODELO
========================================== */

async function iniciarModelo() {
    // cargar la tela original de cada pieza
    for (const nombre of Object.keys(LADOS)) {
        telas[nombre] = await cargarImagen(LADOS[nombre].tela);
    }

    aplicarColor3D();   // también pinta las texturas
    cambiarLado(ladoActual);
    visor.jumpCameraToGoal();

    // varias pasadas extra: en este modelo la primera textura sobre un
    // material sin textura a veces no se ve hasta que se vuelve a enviar
    [300, 900, 2000].forEach(ms => setTimeout(actualizarTodo, ms));
}

// cuando el modelo ya es visible, volvemos a pintar
visor.addEventListener("model-visibility", (e) => {
    if (e.detail && e.detail.visible) actualizarTodo();
});

visor.addEventListener("load", iniciarModelo);

// por si el modelo ya estaba cargado cuando se ejecuta este script
if (visor.loaded) iniciarModelo();

visor.addEventListener("error", (evento) => {
    console.log("Error cargando el modelo 3D:", evento);
});


/* ==========================================
   AÑADIR AL CARRITO
========================================== */

addCart.addEventListener("click", () => {
    const modelo = document.querySelector(".model-card.active h3").textContent;
    const talla = document.querySelector(".sizes button.active").textContent;

    const resumen = (nombreLado) => {
        const capas = diseno[nombreLado].capas.filter(c => c.visible);
        if (!capas.length) return "(sin capas)";
        return capas.map(c => c.tipo === "texto"
            ? "texto «" + c.contenido + "»"
            : "imagen " + c.nombre
        ).join(", ");
    };

    const colores = modoColor === "liso"
        ? coloresCamiseta[0]
        : modoColor + ": " + coloresCamiseta.join(" → ");

    alert(
        "¡Camiseta añadida al carrito!\n\n" +
        "Modelo: " + modelo + "\n" +
        "Talla: " + talla + "\n" +
        "Color: " + colores + "\n" +
        "Delante: " + resumen("frontal") + "\n" +
        "Detrás: " + resumen("trasera") + "\n" +
        "Precio: " + price.textContent
    );
});


/* ==========================================
   INICIO
========================================== */

updatePrice();
pintarColoresExtra();
pintarListaCapas();
cargarControles();


document.addEventListener("DOMContentLoaded", function () {
    const boton = document.getElementById("btnMostrarDisenos");
    const lista = document.getElementById("listaDisenos");

    if (!boton || !lista) {
        console.warn("No se encuentra el botón o la lista de diseños.");
        return;
    }

    boton.addEventListener("click", function () {
        lista.hidden = !lista.hidden;

        boton.textContent = lista.hidden
            ? "Diseños predeterminados ▼"
            : "Diseños predeterminados ▲";
    });
});


/* ==========================================
   DISEÑOS PREDETERMINADOS DK
========================================== */

document.querySelectorAll(".dk-diseno").forEach((boton) => {
    boton.addEventListener("click", async () => {
        const src = boton.dataset.imagen;
        const nombre = "Diseño DK: " + src;

        // Si ya hay una capa de imagen seleccionada, la reutilizamos.
        let capa = capaActual();

        if (!capa || capa.tipo !== "imagen") {
            capa = nuevaCapaImagen();
            capa.x = 0.5;
            capa.y = 0.46;
            añadirCapa(capa);
        }

        // Cargar la imagen seleccionada.
        const img = await cargarImagen(src);

        if (!img) {
            alert("No se ha podido cargar " + src +
                  ". Comprueba que el archivo está en la carpeta correcta.");
            return;
        }

        capa.src = src;
        capa.img = img;
        capa.nombre = nombre;
        capa.visible = true;

        // Actualizar la capa y pintar la imagen dentro de la textura.
        ladoDatos().seleccion = capa.id;
        pintarListaCapas();
        cargarControles();
        actualizarActual();

        // Marcar el diseño seleccionado.
        document.querySelectorAll(".dk-diseno").forEach((b) => {
            b.classList.toggle("seleccionado", b === boton);
        });
    });
});


/* ==========================================
   OPACIDAD DE TEXTO E IMAGEN
========================================== */

const textoOpacidad = document.getElementById("textOpacity");
const textoOpacidadValor = document.getElementById("textOpacityValue");
const imagenOpacidad = document.getElementById("imageOpacity");
const imagenOpacidadValor = document.getElementById("imageOpacityValue");

if (textoOpacidad) {
    textoOpacidad.addEventListener("input", () => {
        const capa = capaActual();
        if (!capa || capa.tipo !== "texto") return;

        capa.opacidad = parseInt(textoOpacidad.value, 10);
        if (textoOpacidadValor) textoOpacidadValor.textContent = capa.opacidad + " %";
        actualizarActual();
    });
}

if (imagenOpacidad) {
    imagenOpacidad.addEventListener("input", () => {
        const capa = capaActual();
        if (!capa || capa.tipo !== "imagen") return;

        capa.opacidad = parseInt(imagenOpacidad.value, 10);
        if (imagenOpacidadValor) imagenOpacidadValor.textContent = capa.opacidad + " %";
        actualizarActual();
    });
}