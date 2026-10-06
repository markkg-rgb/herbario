/*
 * 3 / ÁRBOLES DE ALINEACIÓN Y ORNAMENTALES
 * ------------------------------------------------------------
 * Especies del recull del curso (PDF 3). Mismo formato que datos.js.
 * Foto de la planta entera: del recull. Foto de la hoja: Wikimedia
 * Commons (autoría en CREDITOS_HOJAS, al final).
 */
(() => {
  const ARBOLES = [
    {
      id: "platanus-hispanica",
      nombres: { ca: "Plàtan", es: "Plátano de sombra", lat: "Platanus × hispanica" },
      otrosNombres: "Plátano, plátano de paseo. Sinónimos: Platanus × acerifolia, Platanus hybrida",
      sinonimos: ["Platanus acerifolia", "Platanus hybrida", "Platanus x hispanica"],
      familia: "Platanaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "Híbrido de jardín entre P. orientalis y P. occidentalis (s. XVII)", autoctona: false,
      altura: "25–35 m", rusticidad: "Muy rústico: hasta −20 °C",
      descripcion: "El árbol de alineación por excelencia de las ciudades europeas: es el más plantado en las calles de Barcelona. Crece rápido, da una sombra densa en verano y aguanta muy bien la poda, la contaminación y la compactación del suelo. Es un híbrido, por eso se escribe con «×».",
      identificacion: [
        "Corteza que se desprende en placas y deja manchas verdes, crema y grises (aspecto de camuflaje).",
        "Hojas grandes, palmeadas, con 3–5 lóbulos y margen dentado, parecidas a las del arce.",
        "Hojas alternas; la base del pecíolo forma un capuchón que tapa la yema.",
        "Frutos en bolas colgantes de 2–3 cm, solas o de dos en dos, que permanecen en invierno.",
        "Tronco alto, recto y claro; copa amplia y muy frondosa.",
      ],
      ficha: {
        tronco: "Recto, liso, con corteza que se desprende en placas.",
        hojas: "Simples, alternas, palmatilobuladas (3–5 lóbulos), 12–25 cm, pecíolo largo.",
        flores: "Pequeñas, en cabezuelas esféricas poco vistosas (primavera).",
        fruto: "Infrutescencia esférica formada por aquenios con pelos; se deshace en invierno.",
      },
      confusion: [
        { id: "Acer platanoides", diferencia: "El arce real tiene las hojas opuestas (no alternas), con látex en el pecíolo, y frutos alados (sámaras dobles) en lugar de bolas." },
      ],
      curiosidades: [
        "Los pelillos de las hojas jóvenes y de los frutos se desprenden en primavera y provocan picor de ojos y alergias.",
        "El Passeig de la Devesa de Girona tiene más de 2.500 plátanos de casi 200 años.",
      ],
      usos: "Alineación de calles y avenidas, paseos, plazas y parques grandes.",
      calendario: { flor: [4, 5], fruto: [9, 10, 11, 12, 1, 2], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Moderado; tolera bien las condiciones urbanas.", suelo: "Cualquiera, mejor profundo y fresco.",
        poda: "En invierno. Admite podas fuertes (terciado), aunque hoy se recomienda una poda de formación más respetuosa.",
        plagas: "Tigre del plátano (Corythucha ciliata), antracnosis y chancro coloreado (Ceratocystis platani).",
      },
    },
    {
      id: "celtis-australis",
      nombres: { ca: "Lledoner", es: "Almez", lat: "Celtis australis" },
      otrosNombres: "Latonero, almecino",
      familia: "Cannabaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "Región mediterránea, incluida Cataluña", autoctona: true,
      altura: "15–25 m", rusticidad: "Muy rústico: hasta −15 °C",
      descripcion: "Árbol autóctono muy resistente, longevo y de raíces potentes, por lo que se planta mucho en calles y plazas mediterráneas. Tiene una corteza gris y lisa muy característica y da unos frutos pequeños y comestibles, los lledons.",
      identificacion: [
        "Corteza gris, lisa, que recuerda a la piel de un elefante, incluso en ejemplares viejos.",
        "Hojas lanceoladas con la punta muy larga y estrecha (acuminada) y el margen dentado.",
        "Base de la hoja asimétrica y superficie áspera al tacto.",
        "Frutos pequeños (≈1 cm), redondos, de verdes a negros al madurar, con un rabillo largo.",
        "Copa redondeada y densa, con ramas algo colgantes.",
      ],
      ficha: {
        tronco: "Gris, liso, a veces con contrafuertes en la base.",
        hojas: "Simples, alternas, lanceoladas, 5–15 cm, aserradas, asimétricas en la base, ásperas.",
        flores: "Pequeñas, verdosas, poco vistosas (primavera).",
        fruto: "Drupa negra de ≈1 cm (lledó), dulce y comestible.",
      },
      confusion: [
        { id: "tilia-cordata", diferencia: "El tilo tiene las hojas acorazonadas y anchas, no lanceoladas, y flores colgando de una bráctea." },
      ],
      curiosidades: [
        "Sus raíces son tan fuertes que pueden romper rocas: en catalán también se le llama «trencaroques».",
        "Su madera flexible se usaba para fabricar horcas, látigos y mangos de herramientas.",
      ],
      usos: "Alineación, plazas, patios escolares, jardines de bajo mantenimiento.",
      calendario: { flor: [3, 4], fruto: [9, 10, 11], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Sol o semisombra.", riego: "Bajo: muy resistente a la sequía.", suelo: "Cualquiera, incluso pobre, calizo o pedregoso.",
        poda: "En invierno, solo de formación y limpieza.", plagas: "Muy pocas: ocasionalmente psílidos y pulgones que ensucian con melaza.",
      },
    },
    {
      id: "tilia-cordata",
      nombres: { ca: "Til·ler", es: "Tilo", lat: "Tilia cordata" },
      otrosNombres: "Tilo de hoja pequeña, tilera",
      familia: "Malvaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "Europa, incluidas las montañas de Cataluña", autoctona: true,
      altura: "20–30 m", rusticidad: "Muy rústico: hasta −25 °C",
      descripcion: "Árbol elegante de copa densa y ovalada, muy usado en calles y paseos de clima templado. En verano sus flores llenan el aire de un perfume dulce y con ellas se hace la conocida infusión de tila.",
      identificacion: [
        "Hojas en forma de corazón (cordata), con la punta corta, margen aserrado y base algo asimétrica.",
        "Envés con mechones de pelos rojizos en las axilas de los nervios.",
        "Flores amarillentas muy perfumadas, colgando de una hoja alargada especial (bráctea) en forma de ala.",
        "Frutos pequeños y redondos que caen unidos a la bráctea, que les hace de hélice.",
        "Ramillas en zigzag y yemas rojizas.",
      ],
      ficha: {
        tronco: "Corteza gris, lisa de joven y con fisuras longitudinales de vieja.",
        hojas: "Simples, alternas, acorazonadas, 4–8 cm, aserradas.",
        flores: "Amarillo pálido, en grupos de 5–10 sobre una bráctea alargada (junio–julio).",
        fruto: "Nuececilla globosa de ≈6 mm, unida a la bráctea.",
      },
      confusion: [
        { id: "celtis-australis", diferencia: "El almez tiene hojas lanceoladas con la punta muy larga y frutos negros sin bráctea." },
        { id: "cercis-siliquastrum", diferencia: "El árbol del amor también tiene hojas en forma de corazón, pero con el margen liso (entero) y redondeadas." },
      ],
      curiosidades: [
        "La tila de herbolario se hace con las flores y brácteas secas; es relajante.",
        "Los pulgones que viven en sus hojas sueltan melaza que deja pegajosos los coches aparcados debajo.",
      ],
      usos: "Alineación, paseos, plazas y parques en zonas frescas.",
      calendario: { flor: [6, 7], fruto: [8, 9, 10], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Sol o semisombra; prefiere ambientes frescos.", riego: "Moderado-alto: sufre con la sequía y el calor mediterráneo.",
        suelo: "Fresco, profundo y fértil.", poda: "En invierno. Tolera bien la poda.", plagas: "Pulgón (melaza y negrilla), araña roja y quemaduras de hoja por calor.",
      },
    },
    {
      id: "aesculus-hippocastanum",
      nombres: { ca: "Castanyer bord", es: "Castaño de Indias", lat: "Aesculus hippocastanum" },
      otrosNombres: "Castaño loco",
      familia: "Sapindaceae", tipoHoja: "compuesta", follaje: "caduco",
      origen: "Balcanes (Grecia, Albania, Macedonia del Norte)", autoctona: false,
      altura: "20–30 m", rusticidad: "Muy rústico: hasta −25 °C",
      descripcion: "Árbol majestuoso de copa amplia y redondeada. En primavera se cubre de grandes ramilletes de flores blancas erguidos como velas. En otoño suelta unas semillas brillantes parecidas a las castañas, pero tóxicas.",
      identificacion: [
        "Hojas compuestas palmeadas: 5–7 folíolos grandes que salen de un mismo punto, como una mano.",
        "Hojas opuestas en las ramas.",
        "Flores blancas con manchas amarillas o rojas, en grandes panículas erguidas («velas») en primavera.",
        "Fruto: cápsula verde con pinchos cortos que contiene 1–3 semillas marrones muy brillantes.",
        "Yemas de invierno grandes y pegajosas.",
      ],
      ficha: {
        tronco: "Robusto, corteza marrón grisácea que se agrieta en placas con la edad.",
        hojas: "Compuestas, palmeadas (digitadas), opuestas, 5–7 folíolos de 10–25 cm.",
        flores: "Blancas, en panículas erguidas de 20–30 cm (abril–mayo).",
        fruto: "Cápsula espinosa con semillas brillantes no comestibles (tóxicas).",
      },
      confusion: [
        { id: "Castanea sativa", diferencia: "El castaño verdadero tiene hojas simples alargadas y dentadas, y un erizo con muchísimas púas finas con castañas comestibles." },
      ],
      curiosidades: [
        "Su nombre «hippocastanum» viene de que en Turquía se daban sus semillas a los caballos con tos.",
        "En climas secos y calurosos sufre mucho: las hojas se queman en verano.",
      ],
      usos: "Parques, paseos y alineaciones amplias en zonas frescas.",
      calendario: { flor: [4, 5], fruto: [9, 10], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Sol o semisombra.", riego: "Moderado-alto; no tolera bien la sequía estival.", suelo: "Profundo, fresco y fértil.",
        poda: "En invierno, poda de formación y limpieza.", plagas: "Minador del castaño de Indias (Cameraria ohridella) y quemaduras foliares por calor.",
      },
    },
    {
      id: "tipuana-tipu",
      nombres: { ca: "Tipuana", es: "Tipuana", lat: "Tipuana tipu" },
      otrosNombres: "Tipa, palo rosa. En el recull: «acacia rosa»",
      familia: "Fabaceae", tipoHoja: "compuesta", follaje: "semicaduco",
      origen: "Sur de Bolivia y norte de Argentina", autoctona: false,
      altura: "15–25 m", rusticidad: "Hasta −5 / −7 °C",
      descripcion: "Árbol de crecimiento rápido y copa muy ancha y aparasolada que da una sombra ligera. Muy plantado en las calles de Barcelona y Valencia. A principios de verano se cubre de flores amarillas que forman una alfombra en las aceras.",
      identificacion: [
        "Copa muy amplia, en forma de sombrilla, con ramas largas y algo tortuosas.",
        "Hojas compuestas imparipinnadas con 11–25 folíolos oblongos y con la punta redondeada o con una pequeña muesca.",
        "Flores amarillo-anaranjadas, como pequeñas mariposas, a principios de verano.",
        "Fruto: sámara alada de 4–6 cm, parecida a la del arce, que gira al caer.",
        "Corteza oscura y muy agrietada en los ejemplares adultos.",
      ],
      ficha: {
        tronco: "Grueso, tortuoso, corteza pardo oscura agrietada.",
        hojas: "Compuestas, imparipinnadas, alternas, 20–30 cm; folíolos oblongos.",
        flores: "Amarillo-anaranjadas, amariposadas, en racimos (junio–julio).",
        fruto: "Sámara alada con 1–3 semillas.",
      },
      confusion: [
        { id: "sophora-japonica", diferencia: "La sófora tiene los folíolos más pequeños y puntiagudos, flores blancas en pleno verano y legumbres en forma de rosario." },
        { id: "jacaranda-mimosifolia", diferencia: "La jacaranda tiene las hojas mucho más finas (bipinnadas, como un helecho) y flores azul violeta." },
      ],
      curiosidades: [
        "Las «gotas» que caen de algunas tipuanas en verano son la espuma de un insecto, el salivazo (Cephisus siccifolius).",
        "Es semicaducifolia: pierde la hoja durante poco tiempo a finales de invierno.",
      ],
      usos: "Alineación de calles anchas, avenidas y parques; sombra.",
      calendario: { flor: [6, 7], fruto: [9, 10, 11, 12], poda: [1, 2, 3] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Moderado; resiste bien la sequía una vez establecida.", suelo: "Cualquiera bien drenado.",
        poda: "A finales de invierno; conviene vigilar las ramas largas, que pueden ser frágiles.", plagas: "Salivazo (Cephisus siccifolius), cochinillas.",
      },
    },
    {
      id: "jacaranda-mimosifolia",
      nombres: { ca: "Xicranda", es: "Jacaranda", lat: "Jacaranda mimosifolia" },
      otrosNombres: "Jacarandá",
      familia: "Bignoniaceae", tipoHoja: "compuesta", follaje: "semicaduco",
      origen: "Noroeste de Argentina y sur de Bolivia", autoctona: false,
      altura: "10–15 m", rusticidad: "Hasta −5 °C (sensible de joven)",
      descripcion: "Uno de los árboles más espectaculares de las ciudades mediterráneas: a finales de primavera se cubre de flores azul violeta antes o mientras le salen las hojas nuevas. Su follaje es muy fino y ligero, como el de un helecho.",
      identificacion: [
        "Hojas compuestas bipinnadas, muy finas y divididas, con aspecto de helecho.",
        "Flores tubulares de color azul violeta en grandes ramilletes (mayo–junio).",
        "Fruto: cápsula leñosa redonda y plana (5–7 cm), como una castañuela, que se abre en dos.",
        "Copa abierta e irregular, ramas algo tortuosas.",
        "Hojas opuestas.",
      ],
      ficha: {
        tronco: "Corteza gris parduzca, finamente fisurada.",
        hojas: "Compuestas, bipinnadas, opuestas, 20–45 cm; folíolos diminutos.",
        flores: "Tubulares, azul violeta, 4–5 cm, en panículas.",
        fruto: "Cápsula leñosa, plana y redondeada, persistente.",
      },
      confusion: [
        { id: "melia-azedarach", diferencia: "El metziner tiene los folíolos más grandes y dentados, flores lilas pequeñas en forma de estrella y frutos en bolitas amarillas." },
        { id: "tipuana-tipu", diferencia: "La tipuana tiene folíolos mucho más grandes (hoja pinnada simple), flores amarillas y frutos alados." },
      ],
      curiosidades: [
        "A veces vuelve a florecer, de forma más discreta, a finales de verano u otoño.",
        "Su nombre «mimosifolia» significa «con hojas como la mimosa».",
      ],
      usos: "Alineación, ejemplar aislado en plazas y jardines de clima suave.",
      calendario: { flor: [5, 6], fruto: [9, 10, 11, 12], poda: [2, 3] },
      jardineria: {
        exposicion: "Pleno sol y lugar protegido del frío.", riego: "Moderado.", suelo: "Bien drenado, arenoso.",
        poda: "Mínima, a finales de invierno; no le gustan las podas fuertes.", plagas: "Pocas: pulgón y cochinilla algodonosa.",
      },
    },
    {
      id: "melia-azedarach",
      nombres: { ca: "Metziner", es: "Cinamomo", lat: "Melia azedarach" },
      otrosNombres: "Árbol del paraíso, piocha, árbol de los rosarios",
      familia: "Meliaceae", tipoHoja: "compuesta", follaje: "caduco",
      origen: "Asia (del Himalaya al sur de China) y norte de Australia", autoctona: false,
      altura: "8–15 m", rusticidad: "Hasta −10 / −15 °C",
      descripcion: "Árbol de crecimiento rápido y copa redondeada, muy resistente al calor y la sequía. En primavera da flores lilas muy perfumadas y en invierno, ya sin hojas, quedan colgando racimos de bolitas amarillas, que son tóxicas.",
      identificacion: [
        "Hojas compuestas bipinnadas grandes, con folíolos ovados de margen dentado.",
        "Flores pequeñas en forma de estrella, lila pálido con un tubo central violeta oscuro, muy perfumadas.",
        "Frutos: bolitas amarillas de ≈1,5 cm en racimos colgantes que permanecen todo el invierno.",
        "Copa redondeada y ramas gruesas.",
      ],
      ficha: {
        tronco: "Corteza pardo rojiza con fisuras longitudinales.",
        hojas: "Compuestas, bipinnadas, alternas, 20–50 cm; folíolos dentados.",
        flores: "Lilas, estrelladas, en panículas axilares (abril–mayo).",
        fruto: "Drupa globosa amarilla, tóxica.",
      },
      confusion: [
        { id: "jacaranda-mimosifolia", diferencia: "La jacaranda tiene folíolos diminutos (aspecto de helecho), flores tubulares azul violeta y frutos planos y leñosos." },
      ],
      curiosidades: [
        "«Metziner» viene de «metzina» (veneno): los frutos son tóxicos para las personas y los mamíferos.",
        "Con sus huesos duros se hacían cuentas de rosario.",
      ],
      usos: "Alineación y parques en zonas cálidas y secas.",
      calendario: { flor: [4, 5], fruto: [10, 11, 12, 1, 2], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Bajo: muy resistente a la sequía.", suelo: "Cualquiera, incluso pobre o salino.",
        poda: "En invierno; tiene ramas frágiles que conviene revisar.", plagas: "Pocas. Puede volverse invasor por las semillas.",
      },
    },
    {
      id: "sophora-japonica",
      nombres: { ca: "Sòfora", es: "Acacia del Japón", lat: "Sophora japonica" },
      otrosNombres: "Sófora. Nombre científico actual: Styphnolobium japonicum",
      sinonimos: ["Styphnolobium japonicum"],
      familia: "Fabaceae", tipoHoja: "compuesta", follaje: "caduco",
      origen: "China y Corea (no de Japón, a pesar del nombre)", autoctona: false,
      altura: "15–20 m", rusticidad: "Muy rústico: hasta −20 °C",
      descripcion: "Árbol de copa redondeada y follaje ligero, muy usado en calles por su resistencia a la contaminación. Florece en pleno verano, cuando casi ningún otro árbol lo hace, y sus frutos parecen collares de cuentas.",
      identificacion: [
        "Hojas compuestas imparipinnadas con 9–15 folíolos ovados y puntiagudos, de envés más pálido.",
        "Ramillas jóvenes de color verde, sin espinas.",
        "Flores blanco-amarillentas en panículas terminales en pleno verano (julio–agosto).",
        "Frutos: legumbres carnosas estranguladas entre las semillas, como un rosario, que cuelgan en invierno.",
      ],
      ficha: {
        tronco: "Corteza gris oscura con fisuras.",
        hojas: "Compuestas, imparipinnadas, alternas, 15–25 cm.",
        flores: "Blanco crema, amariposadas, en grandes panículas (julio–agosto).",
        fruto: "Legumbre carnosa en forma de rosario, verde amarillenta.",
      },
      confusion: [
        { id: "Robinia pseudoacacia", diferencia: "La falsa acacia tiene espinas en las ramas, flores blancas en racimos colgantes en primavera y legumbres planas." },
        { id: "tipuana-tipu", diferencia: "La tipuana tiene folíolos más grandes y redondeados, flores amarillas y frutos alados." },
      ],
      curiosidades: [
        "Las flores caídas manchan de amarillo las aceras y los coches en agosto.",
        "Se plantaba alrededor de los templos budistas en China.",
      ],
      usos: "Alineación de calles medianas, plazas y parques.",
      calendario: { flor: [7, 8], fruto: [10, 11, 12, 1, 2], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Bajo-moderado; resiste la sequía.", suelo: "Cualquiera bien drenado.",
        poda: "En invierno, de formación.", plagas: "Pocas: pulgón y algún chancro.",
      },
    },
    {
      id: "erythrina-crista-galli",
      nombres: { ca: "Arbre del coral", es: "Ceibo", lat: "Erythrina crista-galli" },
      otrosNombres: "Árbol del coral, seibo, pico de gallo",
      familia: "Fabaceae", tipoHoja: "compuesta", follaje: "caduco",
      origen: "Sudamérica (Argentina, Uruguay, Brasil, Paraguay)", autoctona: false,
      altura: "5–8 m", rusticidad: "Hasta −5 °C (rebrota si se hiela la parte aérea)",
      descripcion: "Árbol pequeño de tronco tortuoso famoso por sus flores carnosas de color rojo coral, que aparecen en verano. Es la flor nacional de Argentina y Uruguay. Se usa como ejemplar aislado en jardines y plazas.",
      identificacion: [
        "Flores grandes, carnosas, rojo coral, en forma de pico o cresta de gallo, en racimos.",
        "Hojas compuestas trifoliadas (3 folíolos) con folíolos ovados y brillantes.",
        "Pequeños aguijones en las ramas, el pecíolo y el nervio central de las hojas.",
        "Tronco tortuoso y corteza gruesa y agrietada.",
      ],
      ficha: {
        tronco: "Corto, retorcido, con corteza corchosa.",
        hojas: "Compuestas, trifoliadas, alternas; pecíolo con aguijones.",
        flores: "Rojo coral, carnosas, 4–5 cm, en racimos terminales (mayo–septiembre).",
        fruto: "Legumbre alargada de color oscuro con semillas.",
      },
      confusion: [
        { id: "cercis-siliquastrum", diferencia: "El árbol del amor tiene hojas simples en forma de corazón y flores pequeñas rosadas que salen del tronco en primavera." },
      ],
      curiosidades: [
        "Su nombre «crista-galli» significa «cresta de gallo», por la forma de la flor.",
        "Las flores producen mucho néctar y atraen colibríes en su zona de origen.",
      ],
      usos: "Ejemplar aislado, plazas, jardines, cerca del agua.",
      calendario: { flor: [5, 6, 7, 8, 9], fruto: [9, 10], poda: [11, 12, 1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Moderado; tolera suelos húmedos.", suelo: "Cualquiera, mejor fresco.",
        poda: "Fuerte en invierno, quitando las ramas que han florecido.", plagas: "Pocas: cochinilla y pulgón.",
      },
    },
    {
      id: "magnolia-grandiflora",
      nombres: { ca: "Magnòlia", es: "Magnolio", lat: "Magnolia grandiflora" },
      otrosNombres: "Magnolia",
      familia: "Magnoliaceae", tipoHoja: "simple", follaje: "perenne",
      origen: "Sureste de Estados Unidos", autoctona: false,
      altura: "15–25 m", rusticidad: "Hasta −15 °C",
      descripcion: "Árbol de hoja perenne con hojas grandes, duras y brillantes, y enormes flores blancas muy perfumadas. Es uno de los árboles ornamentales más clásicos de jardines y plazas señoriales.",
      identificacion: [
        "Hojas grandes (15–25 cm), coriáceas, verde oscuro y brillantes por el haz.",
        "Envés de las hojas cubierto de un fieltro marrón rojizo (ferrugíneo).",
        "Flores enormes (20–30 cm), blancas, en forma de copa, muy perfumadas.",
        "Fruto en forma de piña ovalada que se abre y muestra semillas de color rojo vivo.",
        "Copa piramidal y densa.",
      ],
      ficha: {
        tronco: "Corteza gris, lisa, algo escamosa con la edad.",
        hojas: "Simples, alternas, elípticas, coriáceas, margen entero.",
        flores: "Blancas, solitarias, 20–30 cm (mayo–julio).",
        fruto: "Agregado de folículos en forma de cono con semillas rojas.",
      },
      confusion: [
        { id: "ligustrum-lucidum", diferencia: "El aligustre también es perenne y brillante, pero sus hojas son mucho más pequeñas, opuestas y sin fieltro marrón." },
      ],
      curiosidades: [
        "Las magnolias son de las plantas con flor más antiguas: ya existían en tiempos de los dinosaurios.",
        "Sus flores son polinizadas por escarabajos, no por abejas.",
      ],
      usos: "Ejemplar aislado, plazas, jardines históricos.",
      calendario: { flor: [5, 6, 7], fruto: [9, 10], poda: [3] },
      jardineria: {
        exposicion: "Sol o semisombra.", riego: "Moderado y regular.", suelo: "Fértil, profundo y algo ácido (en suelo calizo sufre clorosis).",
        poda: "Mínima, a finales de invierno.", plagas: "Cochinillas y clorosis férrica.",
      },
    },
    {
      id: "cercis-siliquastrum",
      nombres: { ca: "Arbre de l'amor o de Judea", es: "Árbol del amor o de Judea", lat: "Cercis siliquastrum" },
      otrosNombres: "Árbol de Judas, ciclamor",
      familia: "Fabaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "Mediterráneo oriental y suroeste de Asia", autoctona: false,
      altura: "6–10 m", rusticidad: "Hasta −15 °C",
      descripcion: "Árbol pequeño que a principios de primavera, antes de echar las hojas, se cubre de flores rosa púrpura que brotan incluso directamente del tronco y las ramas gruesas. Sus hojas redondas tienen forma de corazón.",
      identificacion: [
        "Hojas simples, redondeadas, en forma de corazón, con el margen liso y color verde azulado.",
        "Flores rosa púrpura que salen en grupos directamente del tronco y las ramas viejas (cauliflora).",
        "Florece antes de que salgan las hojas (marzo–abril).",
        "Fruto: legumbres planas, marrón rojizas, que cuelgan mucho tiempo del árbol.",
        "A menudo con varios troncos y forma irregular.",
      ],
      ficha: {
        tronco: "Corteza oscura, casi negra, con finas grietas.",
        hojas: "Simples, alternas, reniformes o acorazonadas, 7–12 cm, margen entero.",
        flores: "Rosa púrpura, amariposadas, en grupos sobre la madera vieja.",
        fruto: "Legumbre plana de 6–10 cm, persistente.",
      },
      confusion: [
        { id: "prunus-cerasifera", diferencia: "El ciruelo rojo también florece antes de echar las hojas, pero sus flores son blanco-rosadas, no salen del tronco y sus hojas son púrpuras y dentadas." },
        { id: "tilia-cordata", diferencia: "El tilo tiene hojas acorazonadas pero con el margen dentado y la punta marcada." },
      ],
      curiosidades: [
        "Una leyenda dice que Judas Iscariote se ahorcó en este árbol y que las flores se volvieron rosas de vergüenza.",
        "Las flores son comestibles y tienen un gusto ligeramente ácido.",
      ],
      usos: "Ejemplar aislado, alineación en calles estrechas, jardines pequeños.",
      calendario: { flor: [3, 4], fruto: [7, 8, 9, 10, 11, 12], poda: [5, 6] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Bajo: resiste muy bien la sequía.", suelo: "Cualquiera bien drenado, incluso calizo.",
        poda: "Mínima, después de la floración; no tolera bien las podas fuertes.", plagas: "Pocas: algún chancro y verticilosis.",
      },
    },
    {
      id: "ligustrum-lucidum",
      nombres: { ca: "Troana", es: "Aligustre", lat: "Ligustrum lucidum" },
      otrosNombres: "Aligustre del Japón, alheña",
      familia: "Oleaceae", tipoHoja: "simple", follaje: "perenne",
      origen: "China y Corea", autoctona: false,
      altura: "8–12 m", rusticidad: "Hasta −15 °C",
      descripcion: "Árbol perenne de copa densa y redondeada, muy usado en calles por su resistencia y porque admite bien la poda. A principios de verano se llena de flores blancas de olor intenso y en invierno de bayas negras.",
      identificacion: [
        "Hojas simples, opuestas, ovadas y acabadas en punta, coriáceas y muy brillantes.",
        "Margen de la hoja liso (entero).",
        "Flores blancas pequeñas en grandes panículas terminales, de olor intenso (junio).",
        "Frutos: bayas pequeñas negro azuladas en racimos que maduran en invierno.",
      ],
      ficha: {
        tronco: "Corteza gris, lisa, con pequeñas lenticelas.",
        hojas: "Simples, opuestas, ovado-lanceoladas, 8–15 cm, brillantes.",
        flores: "Blancas, pequeñas, en panículas de 15–20 cm (junio–julio).",
        fruto: "Baya negro azulada de ≈1 cm.",
      },
      confusion: [
        { id: "citrus-aurantium", diferencia: "El naranjo amargo tiene las hojas alternas, con el pecíolo alado y olor a cítrico al estrujarlas." },
        { id: "magnolia-grandiflora", diferencia: "El magnolio tiene hojas mucho más grandes, alternas y con el envés marrón." },
      ],
      curiosidades: [
        "Su polen es muy alergénico, y los frutos manchan las aceras de morado.",
        "Fuera de su zona de origen se comporta a veces como especie invasora.",
      ],
      usos: "Alineación, setos altos y pantallas verdes.",
      calendario: { flor: [6, 7], fruto: [11, 12, 1, 2], poda: [2, 3] },
      jardineria: {
        exposicion: "Sol o semisombra.", riego: "Moderado; tolera la sequía.", suelo: "Cualquiera.",
        poda: "A finales de invierno; admite podas fuertes.", plagas: "Pocas: cochinilla y mosca blanca.",
      },
    },
    {
      id: "schinus-molle",
      nombres: { ca: "Pebrer bord", es: "Falso pimentero", lat: "Schinus molle" },
      otrosNombres: "Pimentero falso, aguaribay, molle",
      familia: "Anacardiaceae", tipoHoja: "compuesta", follaje: "perenne",
      origen: "Andes de Perú, Bolivia y norte de Argentina", autoctona: false,
      altura: "8–15 m", rusticidad: "Hasta −7 °C",
      descripcion: "Árbol perenne de porte llorón, con ramas finas que cuelgan como las de un sauce. Huele a resina y a pimienta, y las plantas femeninas se llenan de racimos de frutos rosados: la llamada «pimienta rosa».",
      identificacion: [
        "Porte llorón: ramillas largas y colgantes.",
        "Hojas compuestas imparipinnadas con muchos folíolos estrechos y lanceolados.",
        "Olor resinoso, como de pimienta, al estrujar las hojas.",
        "Frutos: bolitas rosadas en racimos colgantes (pies femeninos).",
        "Tronco tortuoso con corteza rugosa que suelta resina.",
      ],
      ficha: {
        tronco: "Retorcido, corteza parda y rugosa, con resina.",
        hojas: "Compuestas, imparipinnadas, alternas, 15–30 cm; 15–40 folíolos estrechos.",
        flores: "Pequeñas, blanco-amarillentas, en panículas colgantes. Especie dioica.",
        fruto: "Drupa rosada de ≈5 mm.",
      },
      confusion: [
        { id: "Schinus terebinthifolius", diferencia: "El pimentero brasileño tiene menos folíolos, más anchos, y porte erguido, no llorón." },
      ],
      curiosidades: [
        "La «pimienta rosa» de las especias proviene de estos frutos (o de su pariente brasileño), aunque no es pimienta de verdad.",
        "Es muy resistente a la sequía y al viento.",
      ],
      usos: "Ejemplar aislado, alineación en zonas secas, jardines mediterráneos.",
      calendario: { flor: [5, 6, 7], fruto: [9, 10, 11, 12], poda: [2, 3] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Bajo: muy resistente a la sequía.", suelo: "Cualquiera, incluso pobre.",
        poda: "A finales de invierno, ligera, para aclarar.", plagas: "Pocas: cochinilla y psila.",
      },
    },
    {
      id: "koelreuteria-paniculata",
      nombres: { ca: "Arbre dels fanalets", es: "Jabonero de la China", lat: "Koelreuteria paniculata" },
      otrosNombres: "Árbol de los farolillos, sapindo",
      familia: "Sapindaceae", tipoHoja: "compuesta", follaje: "caduco",
      origen: "China y Corea", autoctona: false,
      altura: "8–12 m", rusticidad: "Muy rústico: hasta −20 °C",
      descripcion: "Árbol de tamaño medio muy ornamental durante todo el año: flores amarillas en verano, frutos hinchados como farolillos de verde a rosado y marrón, y hojas que se vuelven amarillas en otoño.",
      identificacion: [
        "Hojas compuestas imparipinnadas con folíolos de margen irregularmente lobulado y dentado.",
        "Flores amarillas pequeñas en grandes panículas erguidas por encima de la copa (verano).",
        "Frutos: cápsulas hinchadas como farolillos de papel, verdes, rosadas y luego marrones.",
        "Dentro del farolillo, semillas negras redondas.",
      ],
      ficha: {
        tronco: "Corteza gris parda, con fisuras.",
        hojas: "Compuestas, imparipinnadas (a veces bipinnadas), alternas, 15–40 cm.",
        flores: "Amarillas, pequeñas, en panículas de hasta 40 cm (junio–julio).",
        fruto: "Cápsula vesicular de 4–5 cm con 3 semillas negras.",
      },
      confusion: [
        { id: "sophora-japonica", diferencia: "La sófora tiene los folíolos enteros (sin lóbulos), flores blancas y legumbres en rosario." },
      ],
      curiosidades: [
        "Sus semillas se usaban en China para hacer collares y su corteza como jabón.",
        "Lleva el nombre del botánico alemán Joseph Gottlieb Kölreuter.",
      ],
      usos: "Alineación de calles medianas, ejemplar aislado, jardines pequeños.",
      calendario: { flor: [6, 7], fruto: [8, 9, 10, 11], poda: [12, 1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Bajo-moderado; resiste la sequía.", suelo: "Cualquiera, incluso calizo.",
        poda: "En invierno, de formación.", plagas: "Muy pocas.",
      },
    },
    {
      id: "citrus-aurantium",
      nombres: { ca: "Taronger bord", es: "Naranjo amargo", lat: "Citrus aurantium" },
      otrosNombres: "Naranjo agrio. También se escribe Citrus × aurantium",
      sinonimos: ["Citrus x aurantium"],
      familia: "Rutaceae", tipoHoja: "simple", follaje: "perenne",
      origen: "Sureste de Asia; llegó al Mediterráneo con los árabes", autoctona: false,
      altura: "5–8 m", rusticidad: "Hasta −6 / −8 °C (más rústico que el naranjo dulce)",
      descripcion: "Árbol pequeño, perenne y de copa redondeada, muy plantado en calles, plazas y patios del Mediterráneo. En primavera su flor, el azahar, perfuma las calles, y en invierno se llena de naranjas amargas que no se comen crudas.",
      identificacion: [
        "Hojas simples, coriáceas, verde oscuro brillante, con olor a cítrico al estrujarlas.",
        "Pecíolo con alas anchas (como una hojita pequeña debajo de la hoja).",
        "Ramas con espinas.",
        "Flores blancas muy perfumadas (azahar) en primavera.",
        "Naranjas de piel rugosa y sabor amargo que permanecen mucho tiempo en el árbol.",
      ],
      ficha: {
        tronco: "Corto, corteza gris verdosa lisa.",
        hojas: "Simples (unifolioladas), alternas, ovadas, con pecíolo alado y glándulas aromáticas.",
        flores: "Blancas, 5 pétalos, muy perfumadas (marzo–abril).",
        fruto: "Hesperidio naranja de piel rugosa, amargo.",
      },
      confusion: [
        { id: "ligustrum-lucidum", diferencia: "El aligustre tiene las hojas opuestas, sin pecíolo alado y sin olor a cítrico." },
      ],
      curiosidades: [
        "Con sus naranjas se hace la mermelada de naranja amarga (la «marmalade» inglesa) y con las flores, el agua de azahar.",
        "El Pati dels Tarongers del Palau de la Generalitat de Barcelona está plantado con naranjos amargos.",
      ],
      usos: "Alineación de calles estrechas, plazas, patios y jardines.",
      calendario: { flor: [3, 4], fruto: [11, 12, 1, 2, 3], poda: [3, 4] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Moderado y regular.", suelo: "Bien drenado, mejor algo ácido.",
        poda: "Después de la cosecha, a finales de invierno o principios de primavera.", plagas: "Pulgón, cochinilla, mosca blanca y minador de los cítricos.",
      },
    },
    {
      id: "prunus-cerasifera",
      nombres: { ca: "Prunera vermella", es: "Ciruelo rojo", lat: "Prunus cerasifera" },
      otrosNombres: "Ciruelo de jardín. En el recull: «ciruelo pruno». Variedad más plantada: 'Pissardii' (o 'Atropurpurea')",
      familia: "Rosaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "Sureste de Europa y oeste de Asia (la variedad roja, de Irán)", autoctona: false,
      altura: "6–8 m", rusticidad: "Muy rústico: hasta −20 °C",
      descripcion: "Árbol pequeño muy usado en calles y jardines por el color rojo púrpura de sus hojas, que contrasta con el verde del resto de árboles. Es de los primeros en florecer: a finales de invierno se cubre de pequeñas flores blanco-rosadas.",
      identificacion: [
        "Hojas de color rojo púrpura oscuro durante toda la temporada (en la variedad 'Pissardii').",
        "Hojas simples, alternas, ovadas y con el margen finamente dentado.",
        "Flores pequeñas blanco-rosadas, muy tempranas (febrero–marzo), antes o con las primeras hojas.",
        "Frutos: ciruelas pequeñas rojo oscuro, comestibles.",
        "Copa redondeada y densa.",
      ],
      ficha: {
        tronco: "Corteza oscura, lisa, con lenticelas horizontales.",
        hojas: "Simples, alternas, ovadas, 4–7 cm, aserradas, púrpuras.",
        flores: "Blanco-rosadas, 5 pétalos, ≈2 cm (febrero–marzo).",
        fruto: "Drupa (ciruela) de 2–3 cm, rojo oscura.",
      },
      confusion: [
        { id: "cercis-siliquastrum", diferencia: "El árbol del amor tiene hojas verdes en forma de corazón y flores rosa intenso que salen del propio tronco." },
      ],
      curiosidades: [
        "Es una de las primeras floraciones del año en las ciudades: anuncia el final del invierno.",
        "Sus ciruelas se pueden comer o usar para mermelada, aunque son pequeñas.",
      ],
      usos: "Alineación de calles estrechas, contraste de color en jardines.",
      calendario: { flor: [2, 3], fruto: [7, 8], poda: [4, 5] },
      jardineria: {
        exposicion: "Pleno sol (con sombra pierde el color rojo).", riego: "Moderado.", suelo: "Cualquiera bien drenado.",
        poda: "Después de la floración; ligera.", plagas: "Pulgón, cochinillas y gomosis.",
      },
    },
    {
      id: "ginkgo-biloba",
      nombres: { ca: "Ginkgo", es: "Ginkgo", lat: "Ginkgo biloba" },
      otrosNombres: "Árbol de los cuarenta escudos, árbol de los abanicos",
      familia: "Ginkgoaceae", tipoHoja: "simple", follaje: "caduco",
      origen: "China", autoctona: false,
      altura: "20–30 m", rusticidad: "Muy rústico: hasta −25 °C",
      descripcion: "Un auténtico fósil viviente: es la única especie que sobrevive de un grupo de plantas que existía hace más de 200 millones de años. Sus hojas en forma de abanico se vuelven amarillo dorado en otoño y caen casi todas a la vez.",
      identificacion: [
        "Hojas en forma de abanico, con nervios paralelos que se dividen en dos, a menudo con una hendidura central (dos lóbulos: biloba).",
        "Hojas agrupadas en ramitas cortas (braquiblastos) a lo largo de las ramas.",
        "Color amarillo dorado intenso en otoño.",
        "Copa piramidal y estrecha de joven, más amplia de adulto.",
        "No tiene flores vistosas: es una gimnosperma, como los pinos.",
      ],
      ficha: {
        tronco: "Corteza gris, con fisuras profundas con la edad.",
        hojas: "Simples, en abanico, 5–8 cm, nervios dicotómicos, pecíolo largo.",
        flores: "No tiene flores verdaderas; pies masculinos con amentos y femeninos con óvulos.",
        fruto: "Semilla con cubierta carnosa amarilla y olor desagradable (solo en pies femeninos).",
      },
      confusion: [
        { id: "Adiantum (culantrillo)", diferencia: "Sus hojas recuerdan a las del helecho culantrillo, pero el ginkgo es un árbol." },
      ],
      curiosidades: [
        "Seis ginkgos sobrevivieron a la bomba atómica de Hiroshima en 1945 y siguen vivos.",
        "En ciudad se plantan casi siempre pies masculinos, porque las semillas de los femeninos huelen a mantequilla rancia.",
      ],
      usos: "Alineación, ejemplar aislado, parques; muy resistente a la contaminación.",
      calendario: { flor: [4], fruto: [10, 11], poda: [1, 2] },
      jardineria: {
        exposicion: "Pleno sol.", riego: "Moderado.", suelo: "Cualquiera bien drenado.",
        poda: "Casi innecesaria; en invierno si hace falta.", plagas: "Prácticamente ninguna: es uno de los árboles más resistentes.",
      },
    },
  ];

  // Autoría de las fotos de hoja (Wikimedia Commons): [autor, licencia, archivo]
  const CREDITOS_HOJAS = window.CREDITOS_HOJAS_ARBOLES || {};

  for (const a of ARBOLES) {
    a.grupo = "Árboles";
    a.fuente = "curso";
    a.fotos = { planta: `img/${a.id}-planta.jpg`, hoja: CREDITOS_HOJAS[a.id] ? `img/${a.id}-hoja.jpg` : "" };
    a.creditos = {};
    if (CREDITOS_HOJAS[a.id]) {
      const [autor, licencia, archivo] = CREDITOS_HOJAS[a.id];
      a.creditos.hoja = { autor, licencia, url: "https://commons.wikimedia.org/wiki/File:" + archivo };
    }
    window.ESPECIES_BASE.push(a);
  }
})();
