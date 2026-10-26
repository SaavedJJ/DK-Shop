/* ==========================================
   DK DESIGN KINGS - CATÁLOGO DE PRENDAS
   Todo lo que cambia de una prenda a otra está aquí.
   El editor (editor.js) es el mismo para todas.

   AÑADIR UNA PRENDA NUEVA (por ejemplo, la sudadera):
   1. Pon su modelo 3D (.glb) en la carpeta del proyecto.
   2. Rellena "modelo" con el nombre del archivo.
   3. Abre editor.html?prenda=sudadera, abre la consola (F12)
      y escribe:  listarMateriales()
      Te dirá los nombres de las piezas del modelo.
   4. Si el modelo tiene una pieza para delante y otra para detrás
      (como las camisetas), pon sus nombres en "lados".
      Si delante y detrás son la misma pieza, o la textura del modelo
      está troceada (modelos hechos con IA), usa "proyeccion"
      como en las sudaderas.
   5. Ajusta "orbita" para que la cámara mire cada lado de frente.
   Las piezas que se pintan necesitan coordenadas de textura (UV) en el modelo.
========================================== */

const PRENDAS = {

    manga_corta: {
        familia: "camisetas",
        nombre: "Manga corta",
        descripcion: "Camiseta de manga corta",
        modelo: "tshirt_dk.glb",
        precio: 24.99,
        lados: {
            frontal: {
                material: "Material1718",
                orbita: "90deg 80deg auto",
                aspecto: 1.337        // alto / ancho de la textura que se pinta
            },
            trasera: {
                material: "Material1722",
                orbita: "-90deg 80deg auto",
                aspecto: 1.344
            }
        }
    },

    manga_larga: {
        familia: "camisetas",
        nombre: "Manga larga",
        descripcion: "Camiseta de manga larga",
        modelo: "manga_larga_pintable.glb",
        precio: 27.99,
        lados: {
            frontal: {
                material: "material_Shader12",
                orbita: "0deg 80deg auto",
                aspecto: 2
            },
            trasera: {
                material: "material_Shader13",
                orbita: "180deg 80deg auto",
                aspecto: 2
            }
        }
    },

    /*
       Las sudaderas se estampan por PROYECCIÓN (proyeccion.js):
       sus modelos tienen delante y detrás en una misma pieza.
       - pieza: material de la prenda donde se estampa
       - frente: hacia dónde mira la parte delantera ("+x", "-x", "+z" o "-z")
       - quitarRelieve: quita el relieve que traiga el modelo (true / false)
    */
    sudadera: {
        familia: "sudaderas",
        nombre: "Con capucha",
        descripcion: "Sudadera con capucha y bolsillo",
        modelo: "Sudadera_1.glb",
        precio: 39.99,
        proyeccion: {
            pieza: "tripo_material_eba96510-efa8-4613-aea9-daba276cae6c",
            frente: "+x",
            quitarRelieve: true    // el modelo trae unas cerezas marcadas en relieve
        },
        alturaTexto: 0.62,
        alturaImagen: 0.55,
        lados: {
            frontal: { orbita: "90deg 80deg auto" },
            trasera: { orbita: "-90deg 80deg auto" }
        }
    },

    sudadera_cremallera: {
        familia: "sudaderas",
        nombre: "Con cremallera",
        descripcion: "Sudadera con capucha y cremallera",
        modelo: "Sudadera_2.glb",
        precio: 39.99,
        proyeccion: {
            pieza: "FABRIC 1_FRONT_1456",
            frente: "+z"
        },
        alturaTexto: 0.62,
        alturaImagen: 0.55,
        lados: {
            frontal: { orbita: "0deg 80deg auto" },
            trasera: { orbita: "180deg 80deg auto" }
        }
    },

    /*
       Los pantalones también se estampan por proyección.
       (Opcional) mallasConDiseno: ["nombre de malla", ...] → solo esas mallas
       llevan estampado y el resto solo el color. Sirve si varias piezas
       comparten la misma zona de la textura y el diseño se duplicaría.
    */
    pantalon: {
        familia: "pantalones",
        nombre: "Cargo",
        descripcion: "Pantalón cargo con bolsillos",
        // copia de Pantalones_1.glb en la que cada bolsillo tiene su propia zona
        // de textura (en el original compartían zona y el diseño se duplicaba)
        modelo: "Pantalones_1_uv.glb",
        precio: 34.99,
        proyeccion: {
            pieza: "Material",
            frente: "+z"
        },
        alturaTexto: 0.72,
        alturaImagen: 0.62,
        posicionX: 0.32,          // sobre el muslo (en el centro está la entrepierna)
        lados: {
            frontal: { orbita: "0deg 80deg auto" },
            trasera: { orbita: "180deg 80deg auto" }
        }
    },

    pantalon_ancho: {
        familia: "pantalones",
        nombre: "Ancho",
        descripcion: "Pantalón ancho de chándal",
        // Pantalones_2.glb no traía coordenadas de textura (UV):
        // esta es una copia con UV generadas para poder estamparlo
        modelo: "Pantalones_2_uv.glb",
        precio: 34.99,
        proyeccion: {
            pieza: "Tela",
            frente: "+z"
        },
        alturaTexto: 0.72,
        alturaImagen: 0.62,
        posicionX: 0.3,
        lados: {
            frontal: { orbita: "0deg 80deg auto" },
            trasera: { orbita: "180deg 80deg auto" }
        }
    }
};

// Cómo se llama cada familia en los textos de la página
const FAMILIAS = {
    camisetas: { singular: "camiseta", plural: "Camisetas" },
    sudaderas: { singular: "sudadera", plural: "Sudaderas" },
    pantalones: { singular: "pantalón", plural: "Pantalones" }
};


/* ==========================================
   IMÁGENES DE LA MARCA (desplegable de imágenes)
   Lo ideal es un PNG con fondo transparente.
========================================== */

const LOGOS_MARCA = [
    { nombre: "Logo DK con corona", src: "DkSinFondo.png" }
];
