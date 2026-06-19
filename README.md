# 27thdeer

Portafolio personal de desarrollo web con SPA (Single Page Application) usando JavaScript tradicional para hosting estático.

## Estructura del Proyecto

```
27thdeer/
├── index.html              # Página principal de la SPA (layout + router)
├── 404.html                # Página de error 404
├── CNAME                   # Configuración de dominio para GitHub Pages
├── server.py               # Servidor HTTP local para desarrollo
├── favicon.ico             # Icono del sitio
├── css/                    # Hojas de estilo
│   ├── styles.css          # Estilos generales del sitio
│   └── todo_popcorn.css    # Estilos específicos para ToDo Popcorn
├── js/                     # Archivos JavaScript
│   ├── router.js           # Router SPA para navegación sin recarga
│   ├── todo_popcorn_traditional.js  # Aplicación ToDo Popcorn (JS tradicional)
│   └── config/             # Configuración centralizada
│       └── config.js       # Configuración de API TMDB y storage
├── pages/                  # Contenido de páginas para el router
│   ├── index.html          # Página de inicio (contenido)
│   ├── proyectos.html      # Página de proyectos (contenido)
│   └── todo_popcorn.html   # Página ToDo Popcorn (contenido)
├── img/                    # Imágenes generales del sitio
│   └── gif-logo.gif        # Logo animado principal
└── imgProyectos/           # Imágenes de proyectos
    ├── mindmatchProyecto.png
    ├── Chileproyectos.png
    └── enconstruccion.png
```

## Descripción de Archivos Principales

### Archivos HTML

- **index.html**: Archivo principal de la SPA. Contiene el layout completo (navbar, footer, main vacío) y carga el router.js. Es el punto de entrada de la aplicación.

- **pages/index.html**: Contenido de la página de inicio. Contiene el logo animado y el efecto typewriter con la cita de Ray Bradbury. El router inyecta este contenido en el `<main>` de index.html.

- **pages/proyectos.html**: Contenido de la página de proyectos. Muestra una grilla de proyectos con imágenes, descripciones y enlaces. El router inyecta este contenido en el `<main>` de index.html.

- **pages/todo_popcorn.html**: Contenido de la aplicación ToDo Popcorn. Es una herramienta para generar listas de películas/series con formato personalizado. El router inyecta este contenido en el `<main>` de index.html.

- **404.html**: Página de error 404 para rutas no encontradas.

### Archivos JavaScript

- **js/router.js**: Router SPA simple que maneja la navegación sin recarga de página. Usa hash-based routing (ej: `#/proyectos`). Carga dinámicamente el contenido de las páginas desde la carpeta `pages/` y lo inyecta en el `<main>` de index.html. También maneja la carga de scripts y previene duplicación.

- **js/todo_popcorn_traditional.js**: Aplicación ToDo Popcorn completa escrita en JavaScript tradicional (sin ES6 modules) para compatibilidad con hosting estático. Está envuelta en un IIFE para evitar conflictos de scope global. Expone `window.initTodoPopcorn` para que el router pueda reinicializarla cuando se navega a esa página.

### Archivos CSS

- **css/styles.css**: Estilos generales del sitio. Incluye estilos para el navbar, footer, efectos de animación, y diseño responsivo.

- **css/todo_popcorn.css**: Estilos específicos para la aplicación ToDo Popcorn. Incluye estilos para tarjetas de películas, modales, inputs, y la interfaz de la aplicación.

### Configuración

- **js/config/config.js**: Configuración centralizada para la aplicación ToDo Popcorn. Incluye la API key de TMDB, URLs base, y claves de localStorage.

## Cómo Funciona la SPA

1. El usuario accede a `index.html`
2. El router.js carga automáticamente la página según el hash de la URL (ej: `#/proyectos`)
3. El router hace fetch del archivo HTML correspondiente en `pages/`
4. Extrae el contenido del `<main>` y lo inyecta en el `<main>` de index.html
5. Ejecuta los scripts incluidos en el HTML cargado
6. Llama a funciones de inicialización expuestas globalmente (ej: `window.initTodoPopcorn`)

## Desarrollo

Para ejecutar el servidor local de desarrollo:

```bash
python3 -m http.server 8000
```

Luego accede a `http://localhost:8000`

## Tecnologías

- HTML5
- CSS3
- JavaScript (ES6+ pero sin modules para compatibilidad estática)
- Bootstrap 5.3.3 (CDN)
- Font Awesome 6.5.1 (CDN)
- TMDB API (para ToDo Popcorn)

## Hosting

El proyecto está diseñado para hosting estático (GitHub Pages, Netlify, etc.) sin necesidad de servidor backend.
