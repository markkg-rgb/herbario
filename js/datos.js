/*
 * BASE DE DATOS BOTÁNICA — datos iniciales
 * ------------------------------------------------------------
 * Cada especie es un objeto. Los cambios que hagas desde la app
 * (añadir, editar, borrar, fotos subidas) se guardan en el
 * navegador (IndexedDB) y se superponen a estos datos.
 * Puedes exportarlos a JSON desde la app.
 *
 * fuente:  "curso"   -> especie del recull del curso
 *          "usuario" -> especie creada desde la app
 * fotos:   planta / hoja -> ruta local (img/...), URL o dataURL
 * creditos: autoría de las fotos que no son del recull
 */
window.ESPECIES_BASE = [
  /* =================== 1 / PALMERAS =================== */
  {
    id: "phoenix-canariensis",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Palmera de Canàries", es: "Palmera de Canarias", lat: "Phoenix canariensis" },
    otrosNombres: "Palmera canaria",
    tipoHoja: "pinnada",
    follaje: "perenne",
    tronco: "único",
    origen: "Endémica de las Islas Canarias",
    autoctona: false,
    altura: "15–20 m",
    rusticidad: "Hasta −8 / −10 °C",
    descripcion:
      "La palmera más plantada en parques, paseos y jardines del Mediterráneo. Es robusta y majestuosa, con un tronco muy grueso y una copa enorme, densa y redondeada formada por un centenar de hojas pinnadas de color verde intenso. Es una especie dioica (hay pies macho y pies hembra).",
    identificacion: [
      "Tronco único muy grueso (60–100 cm de diámetro), recto y columnar.",
      "Cicatrices de las hojas en forma de rombo (\"diamantes\"), muy marcadas bajo la copa, formando una especie de \"piña\".",
      "Copa muy densa y esférica, con más de 100 hojas.",
      "Hojas pinnadas de 5–7 m, arqueadas, de color verde intenso y brillante.",
      "Los foliolos de la base de la hoja se transforman en espinas largas y punzantes (acantófilos).",
      "Racimos de dátiles pequeños (1,5–2 cm) de color naranja, no aptos para el consumo.",
    ],
    ficha: {
      tronco: "Único, grueso, marrón grisáceo, con cicatrices romboidales. Nunca produce hijuelos.",
      hojas: "Pinnadas, 5–7 m, verde brillante, foliolos flexibles; espinas en la base del pecíolo.",
      flores: "Inflorescencias ramificadas de color crema-anaranjado entre las hojas (primavera).",
      fruto: "Dátil ovoide, pequeño (≈2 cm), naranja, con poca pulpa.",
    },
    confusion: [
      { id: "phoenix-dactylifera", diferencia: "La datilera tiene el tronco mucho más delgado, a menudo con hijuelos en la base, hojas gris-azuladas y más rígidas y una copa menos densa." },
    ],
    curiosidades: [
      "En La Gomera se extrae su savia para elaborar la \"miel de palma\".",
      "Es muy sensible al picudo rojo (Rhynchophorus ferrugineus), plaga que ha matado miles de ejemplares en el litoral mediterráneo.",
    ],
    usos: "Ejemplar aislado, alineaciones en paseos y avenidas, grandes parques.",
    fuente: "curso",
    fotos: { planta: "img/phoenix-canariensis-planta.jpg", hoja: "img/phoenix-canariensis-hoja.jpg" },
  },
  {
    id: "phoenix-dactylifera",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Palmera datilera", es: "Palmera datilera", lat: "Phoenix dactylifera" },
    otrosNombres: "Palmera común, palmera de Elche",
    tipoHoja: "pinnada",
    follaje: "perenne",
    tronco: "múltiple",
    origen: "Norte de África y Oriente Medio (Golfo Pérsico)",
    autoctona: false,
    altura: "20–30 m",
    rusticidad: "Hasta −8 °C",
    descripcion:
      "Palmera de porte esbelto, cultivada desde hace más de 5.000 años por sus dátiles. Tiene un tronco alto y delgado, que a menudo emite hijuelos en la base, y una copa relativamente abierta de hojas grisáceas y rígidas. El Palmeral de Elche es el mayor palmeral de Europa y es Patrimonio de la Humanidad.",
    identificacion: [
      "Tronco delgado (30–50 cm) y muy alto, a veces ligeramente inclinado.",
      "Suele formar hijuelos (brotes) en la base: ejemplares con varios troncos.",
      "Hojas pinnadas de color gris-verdoso o glauco (azulado), no verde brillante.",
      "Foliolos rígidos y punzantes, dispuestos en distintos planos (en forma de V).",
      "Copa más pequeña y abierta que la de la palmera canaria (20–40 hojas).",
      "Dátiles grandes (3–7 cm), comestibles, de color amarillo-anaranjado a marrón.",
    ],
    ficha: {
      tronco: "Delgado, alto, con restos de las bases de las hojas; frecuentes hijuelos basales.",
      hojas: "Pinnadas, 3–6 m, glaucas, rígidas, foliolos en V; espinas en la base.",
      flores: "Inflorescencias crema entre las hojas. Especie dioica.",
      fruto: "Dátil comestible, 3–7 cm, carnoso y dulce.",
    },
    confusion: [
      { id: "phoenix-canariensis", diferencia: "La canaria tiene el tronco muy grueso, la copa mucho más densa y las hojas verde brillante, y nunca hace hijuelos." },
    ],
    curiosidades: [
      "El Palmeral de Elche fue declarado Patrimonio de la Humanidad por la UNESCO en el año 2000.",
      "Las \"palmas blancas\" del Domingo de Ramos se obtienen atando las hojas para que crezcan sin luz.",
      "El nombre correcto es dactylifera (\"que lleva dátiles\"), con y griega.",
    ],
    usos: "Alineaciones, jardines de clima seco y cálido, producción de dátiles, palma blanca.",
    fuente: "curso",
    fotos: { planta: "img/phoenix-dactylifera-planta.jpg", hoja: "img/phoenix-dactylifera-hoja.jpg" },
  },
  {
    id: "washingtonia-robusta",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Palmera de Mèxic", es: "Palmera de abanico", lat: "Washingtonia robusta" },
    otrosNombres: "Washingtonia mexicana, palmera mexicana",
    tipoHoja: "costapalmeada",
    follaje: "perenne",
    tronco: "único",
    origen: "Noroeste de México (Baja California y Sonora)",
    autoctona: false,
    altura: "20–30 m",
    rusticidad: "Hasta −5 / −7 °C",
    descripcion:
      "Palmera de hoja en abanico muy alta y esbelta, de crecimiento muy rápido. Su tronco delgado, que se ensancha en la base, sostiene una copa pequeña y compacta en lo alto. Si no se poda, las hojas secas quedan colgando formando una \"falda\" o \"enagua\" bajo la copa.",
    identificacion: [
      "Tronco muy delgado (25–40 cm) y muy alto, con la base ensanchada.",
      "Copa pequeña y compacta en proporción a la altura del ejemplar.",
      "Hojas en abanico de color verde brillante.",
      "Pocos o ningún filamento blanco en los márgenes de las hojas adultas.",
      "Pecíolo marrón-rojizo con espinas curvadas a lo largo de todo el pecíolo.",
      "\"Falda\" de hojas secas colgando si no se poda.",
    ],
    ficha: {
      tronco: "Único, delgado, marrón grisáceo, con anillos; base ensanchada.",
      hojas: "Costapalmeadas, 1–1,5 m, verde brillante, segmentos con puntas colgantes.",
      flores: "Inflorescencias largas y colgantes, de color crema-rosado, que sobresalen de la copa.",
      fruto: "Pequeño (≈1 cm), negro, esférico.",
    },
    confusion: [
      { id: "washingtonia-filifera", diferencia: "La filifera tiene el tronco mucho más grueso y más bajo, las hojas verde grisáceo con muchos hilos blancos y el pecíolo verde." },
    ],
    curiosidades: [
      "Es una de las palmeras de crecimiento más rápido: puede crecer más de 1 m al año.",
      "Existe un híbrido muy cultivado entre las dos Washingtonia: W. × filibusta.",
    ],
    usos: "Alineaciones urbanas y de paseos marítimos, grupos en parques.",
    fuente: "curso",
    fotos: { planta: "img/washingtonia-robusta-planta.jpg", hoja: "img/washingtonia-robusta-hoja.jpg" },
  },
  {
    id: "washingtonia-filifera",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Palmera de Califòrnia", es: "Palmera de California", lat: "Washingtonia filifera" },
    otrosNombres: "Palmera de abanico de California, washingtonia",
    tipoHoja: "costapalmeada",
    follaje: "perenne",
    tronco: "único",
    origen: "Suroeste de EE. UU. (California, Arizona) y Baja California",
    autoctona: false,
    altura: "15–18 m",
    rusticidad: "Hasta −10 °C",
    descripcion:
      "Palmera de abanico robusta, de tronco grueso y columnar. Sus hojas grandes, de color verde grisáceo, tienen numerosos filamentos blancos que cuelgan de los segmentos (de ahí el nombre filifera, \"que lleva hilos\"). Es más resistente al frío que la Washingtonia robusta.",
    identificacion: [
      "Tronco grueso (hasta 1 m), columnar, de la misma anchura en toda su longitud.",
      "Hojas en abanico grandes, de color verde grisáceo (menos brillantes que en W. robusta).",
      "Muchos filamentos blancos que cuelgan de los márgenes de las hojas.",
      "Pecíolo verde, con espinas solo en la mitad inferior.",
      "Copa más ancha y abierta.",
      "\"Falda\" densa de hojas secas si no se poda.",
    ],
    ficha: {
      tronco: "Único, grueso y columnar, gris, con cicatrices horizontales.",
      hojas: "Costapalmeadas, 1,5–2 m, verde grisáceo, con abundantes filamentos blancos.",
      flores: "Inflorescencias largas y arqueadas, color crema.",
      fruto: "Pequeño (≈1 cm), negro-marrón, ovoide.",
    },
    confusion: [
      { id: "washingtonia-robusta", diferencia: "La robusta es más alta y delgada, con hojas verde brillante casi sin hilos y pecíolos rojizos con espinas en todo su largo." },
    ],
    curiosidades: [
      "Es la única palmera nativa del oeste de Estados Unidos; crece en oasis del desierto.",
      "El nombre del género homenajea a George Washington.",
    ],
    usos: "Ejemplar aislado o en grupos, alineaciones, jardines de clima seco.",
    fuente: "curso",
    fotos: { planta: "img/washingtonia-filifera-planta.jpg", hoja: "img/washingtonia-filifera-hoja.jpg" },
  },
  {
    id: "bismarckia-nobilis",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Palmera blava de Madagascar", es: "Palmera azul de Madagascar", lat: "Bismarckia nobilis" },
    otrosNombres: "Palmera de Bismarck",
    tipoHoja: "costapalmeada",
    follaje: "perenne",
    tronco: "único",
    origen: "Endémica del oeste y norte de Madagascar",
    autoctona: false,
    altura: "12–25 m (en cultivo, menos)",
    rusticidad: "Sensible: hasta −2 / −3 °C",
    descripcion:
      "Palmera espectacular por el color azul plateado de sus enormes hojas en abanico, cubiertas de una cera blanquecina. Es de crecimiento lento en climas templados y muy apreciada como ejemplar ornamental. Es una especie dioica.",
    identificacion: [
      "Hojas en abanico enormes (hasta 3 m de diámetro), rígidas.",
      "Color azul plateado o gris-azulado muy llamativo, por la cera de la superficie.",
      "Pecíolos gruesos, también cerosos y blanquecinos, con pequeñas espinas en los márgenes.",
      "La base del pecíolo se abre en dos y abraza el tronco.",
      "Tronco único, robusto, gris claro.",
    ],
    ficha: {
      tronco: "Único, grueso, gris, con anillos; en ejemplares jóvenes las bases de las hojas lo cubren.",
      hojas: "Costapalmeadas, hasta 3 m, azul plateado, cerosas, rígidas.",
      flores: "Inflorescencias colgantes entre las hojas; pies macho y hembra.",
      fruto: "Ovoide, marrón, de unos 4 cm.",
    },
    confusion: [
      { id: "washingtonia-filifera", diferencia: "La palmera de California también tiene hoja en abanico grisácea, pero verde, no azul plateada, y con muchos hilos blancos." },
    ],
    curiosidades: [
      "El género está dedicado a Otto von Bismarck, canciller alemán.",
      "En Madagascar se usan sus hojas para techar casas.",
    ],
    usos: "Ejemplar aislado de gran impacto visual en jardines de clima cálido.",
    fuente: "curso",
    fotos: { planta: "img/bismarckia-nobilis-planta.jpg", hoja: "img/bismarckia-nobilis-hoja.jpg" },
  },
  {
    id: "chamaerops-humilis",
    grupo: "Palmeras",
    familia: "Arecaceae",
    nombres: { ca: "Margalló", es: "Palmito", lat: "Chamaerops humilis" },
    otrosNombres: "Palmito europeo, garballó",
    tipoHoja: "palmeada",
    follaje: "perenne",
    tronco: "múltiple",
    origen: "Mediterráneo occidental (península Ibérica, Baleares, norte de África, Italia)",
    autoctona: true,
    altura: "1–4 m (hasta 6 m en cultivo)",
    rusticidad: "Muy rústica: hasta −10 / −12 °C",
    descripcion:
      "La única palmera autóctona de la península Ibérica y de Cataluña. De porte arbustivo, forma matas de varios troncos cortos. Vive en zonas secas y soleadas de la costa, sobre suelos pobres. Es extremadamente resistente a la sequía, al viento y al frío.",
    identificacion: [
      "Porte arbustivo, en mata, con varios troncos (multicaule).",
      "Hojas en abanico pequeñas (50–80 cm), rígidas, divididas hasta más de la mitad en segmentos estrechos.",
      "Color verde a verde grisáceo (la variedad cerifera es azulada).",
      "Pecíolos largos con espinas fuertes y punzantes.",
      "Troncos cubiertos por fibras y por las bases de las hojas viejas.",
      "Frutos (margallons) en racimos cortos, de amarillos a marrón rojizo.",
    ],
    ficha: {
      tronco: "Varios troncos cortos, cubiertos de fibras y bases foliares.",
      hojas: "Palmeadas, 50–80 cm, rígidas, segmentos profundos; pecíolo espinoso.",
      flores: "Inflorescencias cortas y amarillas entre las hojas (primavera).",
      fruto: "Drupa de 1–4 cm, amarilla a marrón rojiza (margalló).",
    },
    confusion: [
      { id: "washingtonia-robusta", diferencia: "Las Washingtonia también tienen hoja en abanico, pero son árboles altísimos de un solo tronco, no matas bajas." },
    ],
    curiosidades: [
      "Es una de las dos únicas palmeras autóctonas de Europa (la otra es Phoenix theophrasti, de Creta).",
      "El cogollo tierno (el \"palmito\") es comestible, y con las hojas se hacían escobas, cestos y cuerdas.",
      "Es muy abundante en el Garraf, el Montgrí y la costa de Tarragona.",
    ],
    usos: "Jardines de bajo consumo de agua (xerojardinería), rocallas, macetas, taludes.",
    fuente: "curso",
    fotos: { planta: "img/chamaerops-humilis-planta.jpg", hoja: "img/chamaerops-humilis-hoja.jpg" },
  },

  /* =================== 2 / TREPADORAS =================== */
  {
    id: "hedera-helix",
    grupo: "Trepadoras",
    familia: "Araliaceae",
    nombres: { ca: "Heura", es: "Hiedra", lat: "Hedera helix" },
    otrosNombres: "Hiedra común, yedra",
    tipoHoja: "simple",
    follaje: "perenne",
    trepa: "Raíces adventicias adherentes",
    origen: "Europa, incluida Cataluña, y oeste de Asia",
    autoctona: true,
    altura: "Hasta 20–30 m trepando",
    rusticidad: "Muy rústica: hasta −20 °C",
    descripcion:
      "Trepadora leñosa de hoja perenne, autóctona de nuestros bosques. Se agarra a muros y troncos gracias a pequeñas raíces adventicias que salen de los tallos, y también puede cubrir el suelo como tapizante. Tolera muy bien la sombra.",
    identificacion: [
      "Hojas perennes, coriáceas, verde oscuro brillante, con los nervios más claros.",
      "Dos tipos de hoja (heterofilia): en los tallos que trepan, hojas palmeadas con 3–5 lóbulos; en las ramas con flor, hojas enteras en forma de rombo o corazón.",
      "Tallos con numerosas raicillas cortas que se pegan a la pared.",
      "Flores pequeñas amarillo-verdosas en umbelas redondas, en otoño.",
      "Frutos: bayas negras en racimos redondos durante el invierno (tóxicas).",
    ],
    ficha: {
      tronco: "Tallos leñosos que con los años se hacen gruesos, cubiertos de raíces adventicias.",
      hojas: "Simples, alternas, 4–10 cm, lobuladas (3–5 lóbulos) en ramas jóvenes y enteras en las adultas.",
      flores: "Umbelas globosas amarillo-verdosas (septiembre–noviembre), muy visitadas por insectos.",
      fruto: "Baya negra de 6–8 mm, madura a finales de invierno. Tóxica para las personas.",
    },
    confusion: [
      { id: "ficus-pumila", diferencia: "La higuera trepadora tiene hojas mucho más pequeñas, acorazonadas y nunca lobuladas, y forma un tapiz muy plano." },
      { id: "parthenocissus-tricuspidata", diferencia: "La viña virgen pierde la hoja en invierno, sus hojas son dentadas y se vuelven rojas en otoño." },
    ],
    curiosidades: [
      "Florece en otoño, cuando casi nada florece: es una fuente de alimento clave para abejas y otros insectos.",
      "No es parásita: solo usa el árbol como soporte.",
    ],
    usos: "Cubrir muros y vallas, tapizante en sombra, jardineras colgantes.",
    fuente: "curso",
    fotos: { planta: "img/hedera-helix-planta.jpg", hoja: "img/hedera-helix-hoja.jpg" },
  },
  {
    id: "parthenocissus-tricuspidata",
    grupo: "Trepadoras",
    familia: "Vitaceae",
    nombres: { ca: "Vinya verge", es: "Viña virgen", lat: "Parthenocissus tricuspidata" },
    otrosNombres: "Parra virgen, hiedra japonesa",
    sinonimos: ["Ampelopsis tricuspidata", "Ampelopsis veitchii"],
    tipoHoja: "simple",
    follaje: "caduco",
    trepa: "Zarcillos con ventosas adhesivas",
    origen: "Este de Asia (China, Japón, Corea)",
    autoctona: false,
    altura: "Hasta 15–20 m trepando",
    rusticidad: "Muy rústica: hasta −20 °C",
    descripcion:
      "Trepadora vigorosa de hoja caduca que cubre fachadas enteras. Se sujeta a la pared con zarcillos acabados en pequeñas ventosas, sin necesidad de soporte. Su gran atractivo es el cambio de color en otoño, cuando las hojas se vuelven rojas y púrpuras antes de caer.",
    identificacion: [
      "Hojas caducas, brillantes, con 3 lóbulos puntiagudos (tricuspidata = \"tres puntas\") y margen dentado.",
      "En las plantas jóvenes algunas hojas pueden estar divididas en 3 foliolos.",
      "Zarcillos ramificados acabados en discos adhesivos (ventosas).",
      "En otoño las hojas se vuelven rojo intenso, naranja y púrpura.",
      "Frutos pequeños, azul oscuro, en racimos.",
    ],
    ficha: {
      tronco: "Tallos leñosos, pardos, muy ramificados.",
      hojas: "Simples, alternas, trilobadas, dentadas, 10–20 cm, largo pecíolo.",
      flores: "Pequeñas, verdosas, poco vistosas (verano).",
      fruto: "Baya azul oscura de ≈8 mm, con pruina.",
    },
    confusion: [
      { id: "hedera-helix", diferencia: "La hiedra es perenne, de hojas coriáceas sin dientes, y se agarra con raíces, no con ventosas." },
    ],
    curiosidades: [
      "Su pariente Parthenocissus quinquefolia (viña virgen de Virginia) se distingue por tener hojas compuestas de 5 foliolos.",
      "Es de la misma familia que la vid (Vitaceae), por eso se llama \"viña\".",
    ],
    usos: "Revestir fachadas y muros; muy usada en arquitectura por su efecto estacional.",
    fuente: "curso",
    fotos: { planta: "img/parthenocissus-tricuspidata-planta.jpg", hoja: "img/parthenocissus-tricuspidata-hoja.jpg" },
  },
  {
    id: "ficus-pumila",
    grupo: "Trepadoras",
    familia: "Moraceae",
    nombres: { ca: "Figuera trepadora", es: "Higuera trepadora", lat: "Ficus pumila" },
    otrosNombres: "Ficus trepador, ficus rastrero",
    tipoHoja: "simple",
    follaje: "perenne",
    trepa: "Raíces adventicias adherentes",
    origen: "Este de Asia (China, Japón, Vietnam)",
    autoctona: false,
    altura: "Hasta 10–15 m trepando",
    rusticidad: "Hasta −5 / −7 °C",
    descripcion:
      "Trepadora de hoja perenne que forma un tapiz muy denso y plano, completamente pegado a la pared. Se adhiere con raíces adventicias. Con los años desarrolla ramas adultas que se separan del muro, con hojas mucho más grandes y frutos parecidos a pequeños higos.",
    identificacion: [
      "Hojas juveniles muy pequeñas (2–4 cm), acorazonadas y asimétricas, dispuestas planas contra el muro.",
      "Forma un tapiz muy apretado y liso, como un \"papel pintado\" verde.",
      "Las ramas adultas se separan de la pared y llevan hojas mayores (5–10 cm), coriáceas y ovaladas.",
      "Frutos en forma de higo (siconos) de 4–6 cm, verdes a púrpuras, en las ramas adultas.",
      "Al cortar un tallo sale látex blanco.",
    ],
    ficha: {
      tronco: "Tallos finos, ramificados, cubiertos de raíces adventicias.",
      hojas: "Simples, alternas, acorazonadas y rugosas (juveniles) u ovadas y coriáceas (adultas).",
      flores: "Ocultas dentro del sicono, como en la higuera.",
      fruto: "Sicono piriforme de 4–6 cm.",
    },
    confusion: [
      { id: "hedera-helix", diferencia: "La hiedra tiene hojas mayores, lobuladas y con los nervios claros, y no forma un tapiz tan plano." },
    ],
    curiosidades: [
      "Es de la misma familia y género que la higuera común (Ficus carica).",
      "Si no se controla puede cubrir ventanas y tejados: requiere recortes periódicos.",
    ],
    usos: "Cubrir muros, patios y fachadas en zonas templadas, en sol o sombra.",
    fuente: "curso",
    fotos: { planta: "img/ficus-pumila-planta.jpg", hoja: "img/ficus-pumila-hoja.jpg" },
  },
  {
    id: "bougainvillea-spectabilis",
    grupo: "Trepadoras",
    familia: "Nyctaginaceae",
    nombres: { ca: "Buguenvíl·lia", es: "Buganvilla", lat: "Bougainvillea spectabilis" },
    otrosNombres: "Santa Rita. También se cultivan B. glabra y el híbrido B. × buttiana",
    sinonimos: ["Bougainvillea glabra", "Bougainvillea × buttiana", "Bougainvillea buttiana"],
    tipoHoja: "simple",
    follaje: "perenne",
    trepa: "Sarmentosa (se apoya con espinas; hay que guiarla)",
    origen: "Brasil",
    autoctona: false,
    altura: "Hasta 8–12 m apoyada",
    rusticidad: "Sensible: hasta −3 °C",
    descripcion:
      "Trepadora de clima cálido famosa por su explosión de color. Lo que parecen pétalos son en realidad brácteas (hojas modificadas) de colores intensos que rodean las flores verdaderas, pequeñas y blancas. No se agarra sola: tiene tallos largos con espinas que se apoyan en los soportes.",
    identificacion: [
      "Grupos de 3 brácteas muy vistosas (magenta, púrpura, rojo, naranja o blanco) con aspecto de papel.",
      "Dentro de cada bráctea, una flor tubular pequeña, blanca o crema.",
      "Tallos largos y arqueados con espinas curvas en las axilas de las hojas.",
      "Hojas simples, alternas, ovadas, verde medio, algo vellosas en B. spectabilis.",
      "Floración muy larga: de primavera a otoño.",
    ],
    ficha: {
      tronco: "Leñoso, retorcido, con espinas.",
      hojas: "Simples, alternas, ovadas, 5–10 cm.",
      flores: "Flores tubulares pequeñas rodeadas de 3 brácteas de colores.",
      fruto: "Aquenio pequeño, poco visible.",
    },
    confusion: [
      { id: "plumbago-auriculata", diferencia: "El jazmín azul no tiene brácteas: sus flores son de verdad, azul celeste y en forma de tubo largo con 5 pétalos." },
    ],
    curiosidades: [
      "Lleva el nombre del navegante francés Louis-Antoine de Bougainville, en cuya expedición se describió.",
      "La foto del margalló del recull tiene una buganvilla magenta detrás, junto a la casa.",
    ],
    usos: "Pérgolas, muros soleados, vallas y fachadas en zonas sin heladas fuertes.",
    fuente: "curso",
    fotos: { planta: "img/bougainvillea-spectabilis-planta.jpg", hoja: "img/bougainvillea-spectabilis-hoja.jpg" },
  },
  {
    id: "wisteria-sinensis",
    grupo: "Trepadoras",
    familia: "Fabaceae",
    nombres: { ca: "Glicina", es: "Glicinia", lat: "Wisteria sinensis" },
    otrosNombres: "Glicina china, wisteria",
    tipoHoja: "compuesta",
    follaje: "caduco",
    trepa: "Voluble (el tallo se enrosca alrededor del soporte)",
    origen: "China",
    autoctona: false,
    altura: "Hasta 20–30 m",
    rusticidad: "Muy rústica: hasta −20 °C",
    descripcion:
      "Trepadora leñosa muy vigorosa y longeva, de hoja caduca. En primavera se cubre de largos racimos colgantes de flores lila muy perfumadas, a menudo antes de que salgan las hojas. Con los años su tronco se vuelve grueso y retorcido, y puede llegar a romper soportes débiles.",
    identificacion: [
      "Racimos colgantes de 15–30 cm con flores lila-azuladas, perfumadas, que se abren todas a la vez (primavera).",
      "Hojas compuestas imparipinnadas, con 7–13 foliolos ovalados.",
      "Tallos volubles que se enroscan alrededor del soporte.",
      "Tronco viejo muy grueso, gris y retorcido.",
      "Frutos: legumbres aterciopeladas de color verde grisáceo que cuelgan en verano.",
    ],
    ficha: {
      tronco: "Leñoso, gris, retorcido; muy grueso en ejemplares viejos.",
      hojas: "Compuestas imparipinnadas, 20–30 cm, 7–13 foliolos.",
      flores: "Amariposadas (tipo leguminosa), lila, en racimos colgantes.",
      fruto: "Legumbre aterciopelada de 10–15 cm. Semillas tóxicas.",
    },
    confusion: [
      { id: "jasminum-officinale", diferencia: "El jazmín también tiene hojas compuestas, pero opuestas, con menos foliolos (5–9) y flores blancas en forma de estrella." },
    ],
    curiosidades: [
      "La glicina japonesa (Wisteria floribunda) tiene racimos mucho más largos y se enrosca en sentido contrario.",
      "Es una leguminosa, pariente de las judías y los guisantes.",
    ],
    usos: "Pérgolas robustas, fachadas con soportes fuertes, arcos.",
    fuente: "curso",
    fotos: { planta: "img/wisteria-sinensis-planta.jpg", hoja: "img/wisteria-sinensis-hoja.jpg" },
  },
  {
    id: "jasminum-officinale",
    grupo: "Trepadoras",
    familia: "Oleaceae",
    nombres: { ca: "Gessamí", es: "Jazmín", lat: "Jasminum officinale" },
    otrosNombres: "Jazmín común, jazmín blanco",
    tipoHoja: "compuesta",
    follaje: "caduco",
    trepa: "Voluble / sarmentosa",
    origen: "Asia (del Cáucaso al Himalaya y China)",
    autoctona: false,
    altura: "Hasta 6–10 m",
    rusticidad: "Hasta −10 °C",
    descripcion:
      "Trepadora clásica de los patios mediterráneos, cultivada por el intenso perfume de sus flores blancas en verano. Sus tallos verdes y finos se enroscan y se apoyan en los soportes. Es caducifolio o semiperenne según el frío del invierno.",
    identificacion: [
      "Hojas opuestas, compuestas, con 5–9 foliolos; el foliolo terminal es el más grande y puntiagudo.",
      "Tallos finos, verdes y angulosos incluso en invierno.",
      "Flores blancas en forma de estrella de 5 pétalos, con un tubo largo, en grupos.",
      "Perfume muy intenso, sobre todo al atardecer.",
      "Floración de junio a septiembre.",
    ],
    ficha: {
      tronco: "Tallos verdes, finos y flexibles, leñosos en la base.",
      hojas: "Opuestas, compuestas imparipinnadas, 5–9 foliolos.",
      flores: "Blancas, tubulares, 5 lóbulos, muy fragantes.",
      fruto: "Baya negra, rara en cultivo.",
    },
    confusion: [
      { id: "plumbago-auriculata", diferencia: "El \"jazmín azul\" no es un jazmín: tiene flores azul celeste, hojas simples y cálices pegajosos." },
      { id: "wisteria-sinensis", diferencia: "La glicina tiene hojas alternas con más foliolos y flores lila en racimos colgantes." },
    ],
    curiosidades: [
      "Se suele confundir con el falso jazmín (Trachelospermum jasminoides), que tiene hojas simples, perennes y coriáceas.",
      "Su aceite esencial se usa en perfumería desde la Antigüedad.",
    ],
    usos: "Pérgolas, celosías, rejas y muros cerca de zonas de estancia por su perfume.",
    fuente: "curso",
    fotos: { planta: "img/jasminum-officinale-planta.jpg", hoja: "img/jasminum-officinale-hoja.jpg" },
  },
  {
    id: "plumbago-auriculata",
    grupo: "Trepadoras",
    familia: "Plumbaginaceae",
    nombres: { ca: "Gessamí blau", es: "Jazmín azul", lat: "Plumbago auriculata" },
    otrosNombres: "Celestina, plumbago. Sinónimo: Plumbago capensis",
    sinonimos: ["Plumbago capensis"],
    tipoHoja: "simple",
    follaje: "perenne",
    trepa: "Sarmentosa / apoyante (hay que guiarla)",
    origen: "Sudáfrica",
    autoctona: false,
    altura: "2–3 m (hasta 6 m apoyada)",
    rusticidad: "Hasta −5 °C",
    descripcion:
      "Arbusto sarmentoso de hoja perenne que se comporta como trepadora si se le da apoyo. Produce durante meses ramilletes de flores azul celeste muy luminosas. A pesar de su nombre popular, no es un jazmín: pertenece a otra familia.",
    identificacion: [
      "Ramilletes de flores azul celeste (a veces blancas), con un tubo largo y 5 pétalos abiertos en estrella.",
      "El cáliz tiene pelos glandulares pegajosos: las flores secas se pegan a la ropa.",
      "Hojas simples, alternas, verde claro, oblongas o espatuladas (3–7 cm).",
      "Tallos largos y flexibles que se arquean y se apoyan en otras plantas o soportes.",
      "Floración muy larga, de primavera a otoño.",
    ],
    ficha: {
      tronco: "Tallos semileñosos, largos y arqueados.",
      hojas: "Simples, alternas, oblongo-espatuladas, verde claro.",
      flores: "Azul celeste, tubulares, en inflorescencias terminales.",
      fruto: "Cápsula pequeña con cáliz pegajoso.",
    },
    confusion: [
      { id: "jasminum-officinale", diferencia: "El jazmín verdadero tiene flores blancas perfumadas y hojas compuestas opuestas." },
    ],
    curiosidades: [
      "Es muy resistente a la sequía y al calor, ideal para jardines mediterráneos.",
      "Existe una variedad de flor blanca: Plumbago auriculata 'Alba'.",
    ],
    usos: "Setos informales, cubrir vallas y taludes, macetas, muros soleados.",
    fuente: "curso",
    fotos: { planta: "img/plumbago-auriculata-planta.jpg", hoja: "img/plumbago-auriculata-hoja.jpg" },
  },
];

/* Autoría de las fotos que no son del recull (Wikimedia Commons) */
(() => {
  const s = "Forest and Kim Starr", by3 = "CC BY 3.0 US", bysa3 = "CC BY-SA 3.0", bysa4 = "CC BY-SA 4.0";
  const c = "https://commons.wikimedia.org/wiki/File:";
  const creditos = {
    "phoenix-dactylifera": { hoja: ["Ahmed1251985", bysa4, "Date_palm_leaf.jpg"] },
    "washingtonia-robusta": { hoja: ["Filo gèn'", bysa4, "Washingtonia_robusta_(Arecaceae)_04.jpg"] },
    "washingtonia-filifera": { hoja: ["Xemenendura", bysa4, "Palmera_de_California_hilos.jpg"] },
    "bismarckia-nobilis": { hoja: [s, by3, "Starr-070906-8334-Bismarckia_nobilis-leaf-Kula_Ace_Hardware_and_Nursery-Maui_(24523484309).jpg"] },
    "chamaerops-humilis": { hoja: [s, by3, "Starr-120319-3955-Chamaerops_humilis-fronds-Enchanting_Floral_Gardens_of_Kula-Maui_(24770361429).jpg"] },
    "hedera-helix": {
      planta: ["Enric", bysa3, "044_Sant_Miquel_de_Marmellar,_vista_posterior_i_cementiri_adossat.JPG"],
      hoja: ["AnRo0002", "CC0", "20230302Hedera_helix3.jpg"],
    },
    "parthenocissus-tricuspidata": {
      planta: ["Acabashi", bysa4, "Ball_finial_and_Boston_Ivy_in_Cliftonville_Margate_Kent_England.jpg"],
      hoja: ["Hedwig Storch", bysa3, "1024_Wilder_Wein-3932.jpg"],
    },
    "ficus-pumila": {
      planta: ["Vinayaraj", bysa3, "Ficus_pumila_plant_on_a_wall.jpg"],
      hoja: ["Monofruit", bysa4, "Feuilles_de_Ficus_pumila.jpg"],
    },
    "bougainvillea-spectabilis": {
      planta: ["পাপৰি বৰা", bysa4, "Bougainvillea_19.jpg"],
      hoja: [s, by3, "Starr-080609-7925-Bougainvillea_spectabilis-flowers_and_leaves-Ave_Maria_Sand_Island-Midway_Atoll_(24917932835).jpg"],
    },
    "wisteria-sinensis": {
      planta: ["Krzysztof Golik", bysa4, "18_Route_d%27Entraygues_in_Estaing.jpg"],
      hoja: ["Jean-Baptiste Raffin", bysa4, "Wisteria_Sinensis_prolific_recto_feuille.jpg"],
    },
    "jasminum-officinale": {
      planta: ["পাপৰি বৰা", bysa4, "Common_jasmine_2.jpg"],
      hoja: ["AJC1", "CC BY-SA 2.0", "Jasmine_(50083540321).jpg"],
    },
    "plumbago-auriculata": {
      planta: ["Sergei Gussev", "CC BY 2.0", "Mallorca_(21724927013).jpg"],
      hoja: [s, by3, "Starr-110215-1097-Plumbago_auriculata-leaves-KiHana_Nursery_Kihei-Maui_(24957463532).jpg"],
    },
  };
  for (const e of window.ESPECIES_BASE) {
    const cr = creditos[e.id];
    if (!cr) continue;
    e.creditos = {};
    for (const [tipo, [autor, licencia, archivo]] of Object.entries(cr)) e.creditos[tipo] = { autor, licencia, url: c + archivo };
  }
})();

/* Glosario rápido */
window.GLOSARIO = {
  pinnada: "Hoja en forma de pluma: un eje central (raquis) con foliolos a cada lado.",
  palmeada: "Hoja en forma de abanico: los segmentos salen todos de un mismo punto.",
  costapalmeada: "Hoja en abanico en la que el pecíolo se prolonga un poco dentro de la lámina (costa), haciendo que la hoja se curve.",
  simple: "Hoja con una sola lámina, aunque pueda estar lobulada.",
  compuesta: "Hoja dividida en varias hojitas independientes (foliolos) sobre un mismo eje.",
};
