# Herbolario · Base de datos botánica

App para estudiar especies botánicas (Espais exteriors i jardineria). Se instala en el móvil como app y funciona sin conexión.

- **Inicio**: especie del día (tarjeta que se gira), progreso (especies que te sabes) y racha de días.
- **Herbario**: fichas con apartados desplegables (descripción, identificación, más fotos, no confundir con + comparador, calendario, jardinería, ficha técnica, curiosidades), pronunciación de los nombres y exportación a PDF.
- **Identifica**: reconoce plantas con la cámara (Pl@ntNet), indica si están en el herbario y guarda tus hallazgos con foto, fecha y lugar en un mapa.
- **Jugar**: Memory, Quiz, ¿Verdadero o falso? y Ordena.

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de la app |
| `css/estilos.css` | Estética |
| `js/datos.js` | **Especies base** (nombres, rasgos, fichas, fotos y créditos) |
| `js/app.js` | Lógica: inicio, herbario, juegos, formulario, sincronización |
| `js/config.js` | Conexión con la base de datos compartida (Supabase) |
| `sw.js` | Service worker (instalación y uso sin conexión) |
| `img/` | Fotos: `<id>-planta.jpg` y `<id>-hoja.jpg` |
| `supabase.sql` | Script para crear la base de datos compartida |

## Cómo se actualiza el móvil

- **Cambios en el código o en `datos.js`** → se suben a GitHub y GitHub Pages los publica. La app del móvil descarga la versión nueva la próxima vez que se abre con conexión.
- **Especies añadidas o editadas desde el formulario de la app** → se guardan en Supabase y aparecen en todos los dispositivos (hace falta la clave de edición).
- Si se añaden fotos nuevas a `img/`, hay que añadir el id de la especie a la lista `ESPECIES` de `sw.js` y subir `VERSION`.

## Configurar la base de datos compartida

1. Crear una cuenta y un proyecto gratis en <https://supabase.com>.
2. En **SQL Editor**, pegar `supabase.sql`, cambiar `CAMBIA-ESTA-CLAVE` por tu clave de edición y ejecutar.
3. En **Project Settings → API**, copiar la *Project URL* y la *anon public key* en `js/config.js`.

## Créditos de las fotos

Las fotos de las palmeras (planta entera) son del recull del curso. El resto son de Wikimedia Commons; el autor y la licencia de cada una aparecen en la ficha de la especie.
