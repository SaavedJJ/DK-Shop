/* ==========================================
   DK DESIGN KINGS - ESTAMPADO POR PROYECCIÓN
   Para prendas cuyo modelo 3D:
     - no tiene una pieza para delante y otra para detrás, o
     - tiene la textura troceada (modelos hechos con IA, escaneos...).

   Cada capa (texto o imagen) es una "calcomanía": se coloca en un
   punto de la prenda y se proyecta según hacia dónde mira la tela
   en ese punto. Así se puede estampar en cualquier sitio (delante,
   detrás, bolsillos laterales, mangas...) sin que se difumine.

   Se calcula con la tarjeta gráfica (WebGL2): se dibuja la malla
   en el espacio de su textura y cada punto mira qué calcomanía
   le cae encima.

   Se activa poniendo "proyeccion" en la prenda (prendas.js).
========================================== */

const Proyeccion = (() => {
    const TAM = 2048;            // tamaño de la textura final
    const DILATAR = [1, 2, 4, 8, 16];   // rellena los bordes de las piezas (evita rayas en las costuras)

    let gl = null;
    let lienzoGL = null;
    let listo = false;

    let programaBase, programaCalco, programaDilatar, programaFinal;
    let vao, numIndices;
    let fbo = [], texFbo = [];
    let texTira;
    const texCapas = [];         // una textura por calcomanía (se reutilizan)
    let quad;

    // malla en memoria (para colocar calcomanías)
    let P = null, N = null, D = null;

    const ejes = { f: [0, 0, 1], r: [1, 0, 0], up: [0, 1, 0] };
    const caja = { centro: [0, 0, 0], smin: 0, smax: 1, tmin: 0, tmax: 1 };


    /* ==========================================
       LEER EL .GLB
    ========================================== */

    function leerGLB(buffer) {
        const dv = new DataView(buffer);
        const largoJson = dv.getUint32(12, true);
        const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, largoJson)));
        const inicioBin = 20 + largoJson + 8;
        return { g: json, bin: buffer.slice(inicioBin) };
    }

    const COMPONENTES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    const TIPOS = {
        5120: [Int8Array, 127], 5121: [Uint8Array, 255],
        5122: [Int16Array, 32767], 5123: [Uint16Array, 65535],
        5125: [Uint32Array, 0], 5126: [Float32Array, 0]
    };

    // devuelve los datos de un accesor como Float32Array (o enteros para los índices)
    function accesor(g, bin, indice, comoEnteros = false) {
        const a = g.accessors[indice];
        const vista = g.bufferViews[a.bufferView];
        const comps = COMPONENTES[a.type];
        const [Tipo, maximo] = TIPOS[a.componentType];
        const inicio = (vista.byteOffset || 0) + (a.byteOffset || 0);
        const paso = vista.byteStride || comps * Tipo.BYTES_PER_ELEMENT;

        const datos = comoEnteros ? new Uint32Array(a.count * comps) : new Float32Array(a.count * comps);
        const dv = new DataView(bin);
        const leer = {
            5120: o => dv.getInt8(o), 5121: o => dv.getUint8(o),
            5122: o => dv.getInt16(o, true), 5123: o => dv.getUint16(o, true),
            5125: o => dv.getUint32(o, true), 5126: o => dv.getFloat32(o, true)
        }[a.componentType];

        for (let i = 0; i < a.count; i++) {
            for (let c = 0; c < comps; c++) {
                let v = leer(inicio + i * paso + c * Tipo.BYTES_PER_ELEMENT);
                if (!comoEnteros && a.normalized && maximo) v = Math.max(v / maximo, -1);
                datos[i * comps + c] = v;
            }
        }
        return datos;
    }

    /* ---------- matrices 4x4 (por columnas, como glTF) ---------- */

    function multiplicar(a, b) {
        const r = new Array(16).fill(0);
        for (let c = 0; c < 4; c++)
            for (let f = 0; f < 4; f++)
                for (let k = 0; k < 4; k++)
                    r[c * 4 + f] += a[k * 4 + f] * b[c * 4 + k];
        return r;
    }

    function matrizNodo(nodo) {
        if (nodo.matrix) return nodo.matrix.slice();

        const [x, y, z, w] = nodo.rotation || [0, 0, 0, 1];
        const [sx, sy, sz] = nodo.scale || [1, 1, 1];
        const [tx, ty, tz] = nodo.translation || [0, 0, 0];

        return [
            (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
            (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
            (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
            tx, ty, tz, 1
        ];
    }

    // junta todas las mallas que usan el material de la pieza, ya colocadas en su sitio.
    // Si se indica "mallasConDiseno", el resto de mallas solo llevan color (sin estampado).
    function extraerPieza(g, bin, nombrePieza, mallasConDiseno) {
        const posiciones = [], normales = [], uvs = [], indices = [], conDiseno = [];
        let base = 0;
        let faltanNormales = false;

        const visitar = (indiceNodo, padre) => {
            const nodo = g.nodes[indiceNodo];
            const m = multiplicar(padre, matrizNodo(nodo));

            if (nodo.mesh != null) {
                const malla = g.meshes[nodo.mesh];
                const diseno = !mallasConDiseno || mallasConDiseno.includes(malla.name) ? 1 : 0;

                malla.primitives.forEach(p => {
                    const material = g.materials[p.material];
                    if (!material || material.name !== nombrePieza) return;
                    if (p.attributes.TEXCOORD_0 == null) return;

                    const pos = accesor(g, bin, p.attributes.POSITION);
                    const uv = accesor(g, bin, p.attributes.TEXCOORD_0);
                    const nor = p.attributes.NORMAL != null ? accesor(g, bin, p.attributes.NORMAL) : null;
                    if (!nor) faltanNormales = true;
                    const idx = p.indices != null
                        ? accesor(g, bin, p.indices, true)
                        : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);

                    const n = pos.length / 3;
                    for (let i = 0; i < n; i++) {
                        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
                        posiciones.push(
                            m[0] * x + m[4] * y + m[8] * z + m[12],
                            m[1] * x + m[5] * y + m[9] * z + m[13],
                            m[2] * x + m[6] * y + m[10] * z + m[14]
                        );
                        if (nor) {
                            const a = nor[i * 3], b = nor[i * 3 + 1], c = nor[i * 3 + 2];
                            const nx = m[0] * a + m[4] * b + m[8] * c;
                            const ny = m[1] * a + m[5] * b + m[9] * c;
                            const nz = m[2] * a + m[6] * b + m[10] * c;
                            const l = Math.hypot(nx, ny, nz) || 1;
                            normales.push(nx / l, ny / l, nz / l);
                        }
                        uvs.push(uv[i * 2], uv[i * 2 + 1]);
                        conDiseno.push(diseno);
                    }
                    for (let i = 0; i < idx.length; i++) indices.push(idx[i] + base);
                    base += n;
                });
            }

            (nodo.children || []).forEach(h => visitar(h, m));
        };

        const identidad = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        const escena = g.scenes[g.scene || 0];
        escena.nodes.forEach(n => visitar(n, identidad));

        const Pp = new Float32Array(posiciones);
        const I = new Uint32Array(indices);
        const Nn = faltanNormales ? calcularNormales(Pp, I) : new Float32Array(normales);

        return { P: Pp, N: Nn, UV: new Float32Array(uvs), D: new Float32Array(conDiseno), I };
    }

    function calcularNormales(Pp, I) {
        const Nn = new Float32Array(Pp.length);
        for (let t = 0; t < I.length; t += 3) {
            const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
            const e1 = [Pp[b] - Pp[a], Pp[b + 1] - Pp[a + 1], Pp[b + 2] - Pp[a + 2]];
            const e2 = [Pp[c] - Pp[a], Pp[c + 1] - Pp[a + 1], Pp[c + 2] - Pp[a + 2]];
            const nx = e1[1] * e2[2] - e1[2] * e2[1];
            const ny = e1[2] * e2[0] - e1[0] * e2[2];
            const nz = e1[0] * e2[1] - e1[1] * e2[0];
            [a, b, c].forEach(v => { Nn[v] += nx; Nn[v + 1] += ny; Nn[v + 2] += nz; });
        }
        for (let i = 0; i < Nn.length; i += 3) {
            const l = Math.hypot(Nn[i], Nn[i + 1], Nn[i + 2]) || 1;
            Nn[i] /= l; Nn[i + 1] /= l; Nn[i + 2] /= l;
        }
        return Nn;
    }


    /* ==========================================
       EJES Y CAJA (la prenda vista de frente)
    ========================================== */

    const VECTORES = {
        "+x": [1, 0, 0], "-x": [-1, 0, 0],
        "+z": [0, 0, 1], "-z": [0, 0, -1]
    };

    const punto3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const normalizar = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

    function prepararEjes(frente) {
        ejes.f = VECTORES[frente] || VECTORES["+z"];
        ejes.up = [0, 1, 0];
        ejes.r = cruz(ejes.up, ejes.f);   // derecha vista desde delante

        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < P.length; i += 3) {
            for (let k = 0; k < 3; k++) {
                min[k] = Math.min(min[k], P[i + k]);
                max[k] = Math.max(max[k], P[i + k]);
            }
        }
        caja.centro = [0, 1, 2].map(k => (min[k] + max[k]) / 2);

        let smin = Infinity, smax = -Infinity, tmin = Infinity, tmax = -Infinity;
        for (let i = 0; i < P.length; i += 3) {
            const d = [P[i] - caja.centro[0], P[i + 1] - caja.centro[1], P[i + 2] - caja.centro[2]];
            const s = punto3(d, ejes.r), t = punto3(d, ejes.up);
            smin = Math.min(smin, s); smax = Math.max(smax, s);
            tmin = Math.min(tmin, t); tmax = Math.max(tmax, t);
        }
        Object.assign(caja, { smin, smax, tmin, tmax });
    }

    // ancho de la prenda vista de frente (las medidas de las capas van respecto a esto)
    const anchoPrenda = () => caja.smax - caja.smin;


    /* ==========================================
       COLOCAR CALCOMANÍAS
    ========================================== */

    /*
       Normal media de la tela alrededor de un punto (así las arrugas no la tuercen).
       "referencia" es hacia dónde mira la tela tocada: solo cuenta la tela que mira
       hacia ese lado (muchas prendas tienen tela por fuera y por dentro muy juntas).
    */
    function normalSuave(p, radio, referencia) {
        const r2 = radio * radio;
        let nx = 0, ny = 0, nz = 0;
        for (let i = 0; i < P.length; i += 3) {
            const dx = P[i] - p[0], dy = P[i + 1] - p[1], dz = P[i + 2] - p[2];
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > r2) continue;
            if (N[i] * referencia[0] + N[i + 1] * referencia[1] + N[i + 2] * referencia[2] < 0.2) continue;
            const w = 1 - d2 / r2;
            nx += N[i] * w; ny += N[i + 1] * w; nz += N[i + 2] * w;
        }
        if (Math.hypot(nx, ny, nz) < 1e-6) return normalizar(referencia);
        return normalizar([nx, ny, nz]);
    }

    /*
       Punto de la prenda que se ve en la posición (x, y) de la vista
       de frente o de espaldas (0..1). Sirve para colocar una capa nueva
       y para los diseños guardados antes de existir las calcomanías.
    */
    function anclaDesdePlano(x, y, lado) {
        const signo = lado === "trasera" ? -1 : 1;
        const X = lado === "trasera" ? 1 - x : x;
        const sObj = caja.smin + X * (caja.smax - caja.smin);
        const tObj = caja.tmin + y * (caja.tmax - caja.tmin);

        // los puntos de la cara que mira a ese lado más cercanos a (x, y); de ellos, el más exterior
        let mejor = -1, mejorD = Infinity, mejorProf = -Infinity;
        const tolerancia = Math.pow(0.01 * anchoPrenda(), 2);
        for (let i = 0; i < P.length; i += 3) {
            if (D[i / 3] === 0) continue;
            const n = [N[i], N[i + 1], N[i + 2]];
            if (punto3(n, ejes.f) * signo < 0.3) continue;
            const d = [P[i] - caja.centro[0], P[i + 1] - caja.centro[1], P[i + 2] - caja.centro[2]];
            const prof = punto3(d, ejes.f) * signo;
            if (prof < 0) continue;
            const ds = punto3(d, ejes.r) - sObj, dt = punto3(d, ejes.up) - tObj;
            const d2 = ds * ds + dt * dt;
            if (d2 < mejorD - tolerancia || (d2 < mejorD + tolerancia && prof > mejorProf)) {
                mejor = i; mejorD = Math.min(d2, mejorD); mejorProf = prof;
            }
        }
        if (mejor < 0) return null;

        const p = [P[mejor], P[mejor + 1], P[mejor + 2]];
        const n = [N[mejor], N[mejor + 1], N[mejor + 2]];
        return { ancla: p, normal: normalSuave(p, 0.06 * anchoPrenda(), n) };
    }

    // punto tocado en el visor → calcomanía en ese sitio
    function anclaDesdeHit(posicion, normal) {
        const p = [posicion.x, posicion.y, posicion.z];
        const n = normalizar([normal.x, normal.y, normal.z]);
        return { ancla: p, normal: normalSuave(p, 0.06 * anchoPrenda(), n) };
    }


    /* ==========================================
       WEBGL
    ========================================== */

    const VS_MALLA = `#version 300 es
        in vec3 aPos;
        in vec3 aNor;
        in vec2 aUV;
        in float aDiseno;
        out vec3 vPos;
        out vec3 vNor;
        out float vDiseno;
        void main() {
            vPos = aPos;
            vNor = aNor;
            vDiseno = aDiseno;
            // se dibuja en el espacio de la textura (las UV son la posición en pantalla)
            gl_Position = vec4(aUV * 2.0 - 1.0, 0.0, 1.0);
        }`;

    // color de la prenda (liso, degradado o franjas) según la posición en la prenda
    const FS_BASE = `#version 300 es
        precision highp float;
        in vec3 vPos;
        in vec3 vNor;
        in float vDiseno;
        uniform vec3 uR, uUp, uCentro;
        uniform vec4 uCaja;          // smin, smax, tmin, tmax
        uniform int uModo;           // 0 vertical, 1 horizontal, 2 diagonal, 3 radial
        uniform sampler2D uTira;
        out vec4 color;
        void main() {
            vec3 d = vPos - uCentro;
            float X = (dot(d, uR) - uCaja.x) / (uCaja.y - uCaja.x);
            float Y = (dot(d, uUp) - uCaja.z) / (uCaja.w - uCaja.z);
            float t = 1.0 - Y;
            if (uModo == 1) t = X;
            else if (uModo == 2) t = (X + 1.0 - Y) * 0.5;
            else if (uModo == 3) t = length(vec2(X - 0.5, Y - 0.5)) * 1.414;
            color = vec4(texture(uTira, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb, 1.0);
        }`;

    // una calcomanía: se proyecta según la normal de la tela en su punto de anclaje
    const FS_CALCO = `#version 300 es
        precision highp float;
        in vec3 vPos;
        in vec3 vNor;
        in float vDiseno;
        uniform vec3 uAncla, uDerecha, uArriba, uNormal;
        uniform vec2 uTam;           // ancho y alto de la calcomanía (en unidades del modelo)
        uniform float uOpacidad;
        uniform sampler2D uImagen;
        out vec4 color;
        void main() {
            vec3 q = vPos - uAncla;
            float u = dot(q, uDerecha) / uTam.x + 0.5;
            float v = 0.5 - dot(q, uArriba) / uTam.y;
            float prof = dot(q, uNormal);
            float limite = max(uTam.x, uTam.y) * 0.6;
            if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0 || abs(prof) > limite) discard;

            // solo en la tela que mira hacia el mismo lado (no atraviesa a la otra cara)
            float mira = dot(normalize(vNor), uNormal);
            float w = smoothstep(-0.05, 0.1, mira) * vDiseno;
            vec4 c = texture(uImagen, vec2(u, v));
            float a = c.a * w * uOpacidad;
            if (a <= 0.0) discard;
            color = vec4(c.rgb, a);
        }`;

    const VS_QUAD = `#version 300 es
        in vec2 aPos;
        out vec2 vUV;
        void main() {
            vUV = aPos * 0.5 + 0.5;
            gl_Position = vec4(aPos, 0.0, 1.0);
        }`;

    // rellena los huecos de alrededor de cada pieza con el color del borde
    const FS_DILATAR = `#version 300 es
        precision highp float;
        in vec2 vUV;
        uniform sampler2D uTex;
        uniform float uPaso;
        out vec4 color;
        void main() {
            vec4 c = texture(uTex, vUV);
            if (c.a > 0.0) { color = c; return; }
            vec2 px = uPaso / vec2(textureSize(uTex, 0));
            vec4 suma = vec4(0.0);
            for (int i = -1; i <= 1; i++)
                for (int j = -1; j <= 1; j++) {
                    vec4 v = texture(uTex, vUV + vec2(float(i), float(j)) * px);
                    if (v.a > 0.0) suma += vec4(v.rgb, 1.0);
                }
            color = suma.a > 0.0 ? vec4(suma.rgb / suma.a, 1.0) : c;
        }`;

    const FS_FINAL = `#version 300 es
        precision highp float;
        in vec2 vUV;
        uniform sampler2D uTex;
        uniform vec3 uFondo;
        out vec4 color;
        void main() {
            vec4 c = texture(uTex, vUV);
            color = vec4(c.a > 0.0 ? c.rgb : uFondo, 1.0);
        }`;

    function compilar(vs, fs) {
        const crear = (tipo, fuente) => {
            const s = gl.createShader(tipo);
            gl.shaderSource(s, fuente);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
        };
        const p = gl.createProgram();
        gl.attachShader(p, crear(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, crear(gl.FRAGMENT_SHADER, fs));
        gl.bindAttribLocation(p, 0, "aPos");
        gl.bindAttribLocation(p, 1, "aNor");
        gl.bindAttribLocation(p, 2, "aUV");
        gl.bindAttribLocation(p, 3, "aDiseno");
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    }

    function texturaVacia(lineal = true) {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, lineal ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lineal ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
    }

    function subir(textura, lienzo) {
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzo);
    }

    function atributo(posicion, datos, tamano) {
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(posicion);
        gl.vertexAttribPointer(posicion, tamano, gl.FLOAT, false, 0, 0);
    }

    function iniciarGL(pieza) {
        lienzoGL = document.createElement("canvas");
        lienzoGL.width = TAM;
        lienzoGL.height = TAM;
        gl = lienzoGL.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, alpha: false });
        if (!gl) throw new Error("Este navegador no tiene WebGL2.");

        programaBase = compilar(VS_MALLA, FS_BASE);
        programaCalco = compilar(VS_MALLA, FS_CALCO);
        programaDilatar = compilar(VS_QUAD, FS_DILATAR);
        programaFinal = compilar(VS_QUAD, FS_FINAL);

        // malla (mismas posiciones de atributo en los dos programas)
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        atributo(0, pieza.P, 3);
        atributo(1, pieza.N, 3);
        atributo(2, pieza.UV, 2);
        atributo(3, pieza.D, 1);
        const bi = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pieza.I, gl.STATIC_DRAW);
        numIndices = pieza.I.length;
        gl.bindVertexArray(null);

        // rectángulo que ocupa toda la pantalla (para dilatar y para el paso final)
        quad = gl.createVertexArray();
        gl.bindVertexArray(quad);
        const bq = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bq);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        // dos texturas para ir y volver al dilatar
        for (let i = 0; i < 2; i++) {
            texFbo[i] = texturaVacia(false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TAM, TAM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            fbo[i] = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[i]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texFbo[i], 0);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        texTira = texturaVacia();
    }

    const uni = (programa, nombre) => gl.getUniformLocation(programa, nombre);


    /* ==========================================
       LO QUE USA EL EDITOR
    ========================================== */

    // lee el modelo y prepara todo (una vez)
    async function preparar(urlModelo, config) {
        const { g, bin } = leerGLB(await (await fetch(urlModelo)).arrayBuffer());
        const pieza = extraerPieza(g, bin, config.pieza, config.mallasConDiseno);
        if (!pieza.I.length) throw new Error("No encuentro la pieza «" + config.pieza + "» en " + urlModelo);

        P = pieza.P;
        N = pieza.N;
        D = pieza.D;
        prepararEjes(config.frente);
        iniciarGL(pieza);
        listo = true;
    }

    /*
       Pinta la textura completa de la prenda.
       - calcos: lista de calcomanías, de abajo a arriba:
           { lienzo, ancla:[x,y,z], normal:[x,y,z], rot (grados), ancho (fracción del ancho de la prenda), opacidad (0..1) }
       - tira: lienzo de 256×1 con el color, degradado o franjas
       - modo: tipo de degradado
       - fondo: color [r,g,b] para lo que queda fuera de las piezas
       Devuelve el lienzo WebGL con el resultado.
    */
    function componer(calcos, tira, modo, fondo) {
        subir(texTira, tira);
        gl.viewport(0, 0, TAM, TAM);
        gl.bindVertexArray(vao);

        // 1) color de la prenda, en el espacio de su textura
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programaBase);
        gl.uniform3fv(uni(programaBase, "uR"), ejes.r);
        gl.uniform3fv(uni(programaBase, "uUp"), ejes.up);
        gl.uniform3fv(uni(programaBase, "uCentro"), caja.centro);
        gl.uniform4f(uni(programaBase, "uCaja"), caja.smin, caja.smax, caja.tmin, caja.tmax);
        gl.uniform1i(uni(programaBase, "uModo"), { horizontal: 1, diagonal: 2, radial: 3 }[modo] || 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texTira);
        gl.uniform1i(uni(programaBase, "uTira"), 0);
        gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_INT, 0);

        // 2) cada calcomanía encima (se mezcla el color; la marca de "pieza" no cambia)
        gl.useProgram(programaCalco);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);

        calcos.forEach((c, i) => {
            if (!texCapas[i]) texCapas[i] = texturaVacia();
            subir(texCapas[i], c.lienzo);

            // ejes de la calcomanía: "arriba" es lo más vertical posible sobre la tela
            const n = normalizar(c.normal);
            let arriba = normalizar([
                ejes.up[0] - n[0] * punto3(ejes.up, n),
                ejes.up[1] - n[1] * punto3(ejes.up, n),
                ejes.up[2] - n[2] * punto3(ejes.up, n)
            ]);
            if (!isFinite(arriba[0]) || Math.hypot(...arriba) < 0.5) arriba = normalizar(cruz(n, ejes.r));
            let derecha = normalizar(cruz(arriba, n));

            // giro de la capa
            const a = -(c.rot || 0) * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
            const d2 = derecha.map((v, k) => v * co + arriba[k] * si);
            const a2 = arriba.map((v, k) => v * co - derecha[k] * si);
            derecha = d2;
            arriba = a2;

            const ancho = c.ancho * anchoPrenda();
            const alto = ancho * c.lienzo.height / c.lienzo.width;

            gl.uniform3fv(uni(programaCalco, "uAncla"), c.ancla);
            gl.uniform3fv(uni(programaCalco, "uDerecha"), derecha);
            gl.uniform3fv(uni(programaCalco, "uArriba"), arriba);
            gl.uniform3fv(uni(programaCalco, "uNormal"), n);
            gl.uniform2f(uni(programaCalco, "uTam"), ancho, alto);
            gl.uniform1f(uni(programaCalco, "uOpacidad"), c.opacidad ?? 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texCapas[i]);
            gl.uniform1i(uni(programaCalco, "uImagen"), 0);
            gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_INT, 0);
        });

        gl.disable(gl.BLEND);

        // 3) rellenar alrededor de las piezas
        gl.useProgram(programaDilatar);
        gl.bindVertexArray(quad);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uni(programaDilatar, "uTex"), 0);
        let actual = 0;
        DILATAR.forEach(paso => {
            const siguiente = 1 - actual;
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[siguiente]);
            gl.bindTexture(gl.TEXTURE_2D, texFbo[actual]);
            gl.uniform1f(uni(programaDilatar, "uPaso"), paso);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            actual = siguiente;
        });

        // 4) al lienzo final
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(programaFinal);
        gl.bindTexture(gl.TEXTURE_2D, texFbo[actual]);
        gl.uniform1i(uni(programaFinal, "uTex"), 0);
        gl.uniform3fv(uni(programaFinal, "uFondo"), fondo);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        return lienzoGL;
    }

    return {
        preparar,
        componer,
        anclaDesdePlano,
        anclaDesdeHit,
        TAM,
        get listo() { return listo; }
    };
})();
